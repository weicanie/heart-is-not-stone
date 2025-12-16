import { Injectable } from '@nestjs/common';
import {
	ActionCode,
	GameAction,
	Middleware,
	MWInput,
	MWPipeline,
	MWService,
	npc_existence_meta_data,
	NpcName,
	PersonalityType,
	RelationshipTier,
	TAINpc,
	TargetList
} from '@not_stone/shared';
import { DbService } from '../../DB/db.service';
import { AichatChainService } from '../../chain/aichat-chain.service';
import { AiNpcService } from './ai-npc.service';
import { RelationshipThresholds, type_giftPoll } from './constants';
@Injectable()
export class AiNpcMiddlewareService implements MWService {
	constructor(
		public dbService: DbService,
		public aichatChainService: AichatChainService,
		public aiNpcService: AiNpcService
	) {}

	/**
	 * 普通聊天管道
	 * @return 与npc交谈使用的管道
	 */
	getNormalChatPipeline() {
		return this.createPipeline([
			this.applyActionMW.bind(this),
			this.applyRelationshipChangeMW.bind(this),
			this.shouldAttackPlayerMW.bind(this),
			this.giftToPlayerMW.bind(this),
			this.checkTargetDoneMW.bind(this)
		]);
	}

	createPipeline(middlewares: Middleware[]): MWPipeline {
		return {
			middlewares,
			run: async input => {
				for (const middleware of middlewares) {
					input = await middleware(input);
				}
				return input;
			}
		};
	}

	/** 中间件
	 * 应用LLM返回的服务器数据更改，并组织游戏端数据更改
	 */
	async applyActionMW(input: MWInput) {
		const aiOutput = input.npcAIOutput;
		const aiNpc = input.aiNpc;

		let relationshipChange = 0;
		const prevRelationship = aiNpc.relationship;
		let mod_action_msg = '';
		const game_action: GameAction[] = [];

		// 解析出acions
		if (aiOutput.actions && aiOutput.actions.length > 0) {
			for (const action of aiOutput.actions) {
				const code = +action.code;

				switch (code) {
					case ActionCode.ChangeRelationshipValue:
						{
							const rawChange = action.cnt || 0;
							// 使得绝对值越高的好感度变化幅度越小
							// 阻尼系数：(150 - |当前好感度|) / 150。当好感度为0时系数为1，为100时系数为0.33
							const dampingFactor = Math.max(0.2, (150 - Math.abs(aiNpc.relationshipValue)) / 150);
							let change = Math.ceil(rawChange * dampingFactor);
							change = change > 0 ? Math.min(change, 5) : change;

							// 人格魅力影响：负值容易与小人交好，正值容易与普通人、君子交好（物以类聚人以群分）
							if (aiNpc.metadata.personality_type === PersonalityType.vile && change !== 0) {
								if (aiNpc.personality_trend < 0) {
									change = change + 1;
								} else {
									change = change - 1;
								}
							}
							if (aiNpc.metadata.personality_type === PersonalityType.noble && change !== 0) {
								if (aiNpc.personality_trend >= 0) {
									change = change + 1;
								} else {
									change = change - 1;
								}
							}

							aiNpc.relationshipValue += change;
							relationshipChange += change;

							if (aiNpc.relationshipValue > 100) {
								aiNpc.relationshipValue = 100;
								relationshipChange = 0;
							}
							if (aiNpc.relationshipValue < -100) {
								aiNpc.relationshipValue = -100;
								relationshipChange = 0;
							}

							// 更新好感度等级
							if (aiNpc.relationshipValue >= RelationshipThresholds.friend.min) {
								aiNpc.relationship = RelationshipTier.friend;
							} else if (aiNpc.relationshipValue >= RelationshipThresholds.friendly.min) {
								aiNpc.relationship = RelationshipTier.friendly;
							} else if (aiNpc.relationshipValue >= RelationshipThresholds.strange.min) {
								aiNpc.relationship = RelationshipTier.strange;
							} else if (aiNpc.relationshipValue >= RelationshipThresholds.hate.min) {
								aiNpc.relationship = RelationshipTier.hate;
							} else if (aiNpc.relationshipValue >= RelationshipThresholds.hostile.min) {
								aiNpc.relationship = RelationshipTier.hostile;
							} else {
								aiNpc.relationship = RelationshipTier.enemy;
							}

							mod_action_msg += `好感度${change > 0 ? '+' : '-'} ${Math.abs(change)}（${aiNpc.relationshipValue}，${aiNpc.relationship}）\n`;
						}
						break;
					case ActionCode.addSpecialRelationship:
						{
							if (action.rels) {
								for (const rel of action.rels) {
									if (!aiNpc.specialRelationship.includes(rel)) {
										aiNpc.specialRelationship.push(rel);
										mod_action_msg += `关系建立: ${action.rels.join(', ')}\n`;
									}
								}
							}
						}
						break;
					case ActionCode.deleteSpecialRelationship:
						{
							if (action.rels) {
								aiNpc.specialRelationship = aiNpc.specialRelationship.filter(
									rel => !action.rels?.includes(rel)
								);

								mod_action_msg += `关系解除: ${action.rels.join(', ')}\n`;
							}
						}
						break;
					default:
						game_action.push(action);
				}
			}
			// 将数据更新到数据库
			await aiNpc.saveNpcToDB();
		}

		// 检查好感度等级是否提高
		input.relationshipLevelUp = aiNpc.relationship !== prevRelationship && relationshipChange > 0;

		input.relationshipChange = relationshipChange;
		input.mod_action_msg = mod_action_msg;
		input.action = game_action;

		return input;
	}

	/**
	 * 中间件
	 * 若好感度过低，npc概率攻击玩家
	 */
	async shouldAttackPlayerMW(input: MWInput) {
		const relationshipValue = input.aiNpc.relationshipValue || 0;
		const aiNpc = input.aiNpc;

		// 若好感度<-85，npc概率攻击玩家
		if (relationshipValue < -85) {
			const attackProb = 1 - (100 + relationshipValue) / 100 - 0.7; //-85:15%、-100:30%
			if (Math.random() < attackProb) {
				input.action.push({
					code: ActionCode.AttackPlayer,
					cnt: 0,
					msg: `${aiNpc.npcName}忍无可忍，攻击了你。\n`
				});
			}
		}
		return input;
	}

	/** 中间件
	 * 当好感度等级变高时，npc向玩家赠礼
	 */
	async giftToPlayerMW(input: MWInput) {
		const relationshipLevelUp = input.relationshipLevelUp || false;
		const value = input.aiNpc.relationshipValue;
		const aiNpc = input.aiNpc;
		const type = aiNpc.metadata.gift_type;

		// 初次成为好友时，npc向玩家赠礼
		if (relationshipLevelUp && value >= 50 && !aiNpc.gift_given) {
			const giftPool = type_giftPoll[type];
			input.action.push({
				code: ActionCode.AddPlayerItem,
				itemKey: giftPool[Math.floor(Math.random() * giftPool.length)],
				msg: `${aiNpc.npcName}送了你一个礼物（类型：${type}）。\n`
			});

			aiNpc.gift_given = true;
			await aiNpc.saveNpcToDB();
		}
		return input;
	}

	/** 中间件
	 * 应用好感度变化带来的影响
	 */
	async applyRelationshipChangeMW(input: MWInput) {
		const relationshipChange = input.relationshipChange || 0;
		const aiNpc = input.aiNpc;

		// 应用好感度变化带来的额外影响
		if (relationshipChange !== 0) {
			const game_actions = await this._applyRelationshipChangeToGame(aiNpc, relationshipChange);
			input.action.push(...game_actions);
		}

		// 应用好感度变化到玩家角色人格魅力
		if (relationshipChange !== 0) {
			input.mod_action_msg = await this._applyRelationshipChangeToDB(
				aiNpc,
				relationshipChange,
				input.mod_action_msg || ''
			);
		}

		return input;
	}

	/** 中间件
	 * 检查未完成的目标是否完成，若完成则设置为已完成、显示消息、奖励&结果
	 */
	async checkTargetDoneMW(input: MWInput) {
		const aiNpc = input.aiNpc;
		const archiveId = aiNpc.game_archive_id;
		// 获取所有未完成的目标
		const targets = await this.dbService.play_target.findMany({
			where: {
				game_archive_id: archiveId,
				done: false
			}
		});
		// 目标完成条件和检查、后续操作
		for (const target of targets) {
			switch (target.name) {
				case TargetList.向上社交:
					if (aiNpc.npcName === NpcName.rickerd && Math.abs(aiNpc.relationshipValue) >= 30) {
						input.mod_action_msg += `目标达成：向上社交\n`;
						if (aiNpc.relationshipValue >= 30) {
							input.mod_action_msg += `${aiNpc.npcName}赞助了你一个鼓鼓的腰包\n`;
							input.mod_action_msg += `当地人则对你不满\n`;

							input.action.push({
								code: ActionCode.AddGold,
								cnt: 700,
								msg: ``
							});
							input.action.push({
								code: ActionCode.ChangeReputation,
								cnt: -200,
								msg: `当地声望-200\n`
							});
							input.action.push({
								code: ActionCode.AddPlayerItem,
								itemKey: `o_inv_bag_belt01`,
								msg: ``
							});
						} else {
							input.mod_action_msg += `当地人出了口气，送了你一个棕色的背包\n`;

							input.action.push({
								code: ActionCode.ChangeReputation,
								cnt: 300,
								msg: `当地声望+300\n`
							});
							input.action.push({
								code: ActionCode.AddPlayerItem,
								itemKey: `o_inv_backpack_treasure`,
								msg: ``
							});
						}
						target.done = true;
						await this.aiNpcService.saveTargetToDB(archiveId, target);
					}
			}
		}
		return input;
	}

	/** 工具
	 * 好感度变化时，根据存在感应用到玩家的声望、金币、经验值。
	 * 数值 = (好感度变化值 * npc该值的存在感数值) / 100，向下取整
	 */
	async _applyRelationshipChangeToGame(aiNpc: TAINpc, relationshipChange: number) {
		const metaData = npc_existence_meta_data[aiNpc.npcName];
		if (!metaData) {
			return [];
		}

		// 数值 = (好感度变化值 * npc该值的存在感数值) / 100，向下取整
		const wealthChange = Math.floor((relationshipChange * metaData.wealth * 8) / 100);
		const influenceChange = Math.floor((relationshipChange * metaData.influence * 5) / 100);
		// 禁用好感度产生的经验值变化，太破坏游戏体验
		// const expChange = Math.floor((relationshipChange * metaData.exp * 10) / 100) ;

		const game_actions: GameAction[] = [];

		// 好感度达到50以上时，才会资助玩家
		if (wealthChange > 0 && aiNpc.relationshipValue > 50) {
			game_actions.push({
				code: ActionCode.AddGold,
				cnt: wealthChange,
				msg: `${aiNpc.npcName}被你打动，资助了你${wealthChange}冠。\n`
			});
		}

		// 人格倾向应用于变化
		if (influenceChange !== 0) {
			game_actions.push({
				code: ActionCode.ChangeReputation,
				cnt: influenceChange > 0 ? influenceChange + aiNpc.personality_trend : 0,
				msg: `${influenceChange > 0 ? `这获得了认可，${aiNpc.personality_trend > 0 ? '蒸蒸日上啊，' : ''}当地声望+${influenceChange}。\n` : `这不受待见，${aiNpc.personality_trend > 0 ? '' : '去他的吧，'}当地声望-${-influenceChange}。\n`}`
			});
		}

		// if (expChange > 0) {
		// 	game_actions.push({
		// 		code: ActionCode.AddExp,
		// 		cnt: expChange,
		// 		msg: `${aiNpc.npcName}和你分享了经历和见解，经验值+${expChange}。\n`
		// 	});
		// }

		return game_actions;
	}

	/** 工具
	 * 好感度变化时，应用到玩家角色的人格倾向
	 */
	async _applyRelationshipChangeToDB(
		aiNpc: TAINpc,
		relationshipChange: number,
		mod_action_msg: string
	) {
		if (
			relationshipChange === 0 ||
			aiNpc.metadata.personality_type === PersonalityType.normal ||
			aiNpc.metadata.personality_trend === 0
		) {
			return mod_action_msg;
		} else {
			// 更新玩家角色的人格倾向
			let change =
				(relationshipChange *
					aiNpc.metadata.personality_trend *
					(aiNpc.metadata.personality_type === PersonalityType.vile ? -1 : 1)) /
				100;
			change = change > 0 ? Math.min(change, 3) : Math.max(change, -3);
			aiNpc.personality_trend = aiNpc.personality_trend + change;
			aiNpc.personality_trend =
				aiNpc.personality_trend > 0
					? Math.min(aiNpc.personality_trend, 100)
					: Math.max(aiNpc.personality_trend, -100);

			await aiNpc.saveUserRoleToDB();

			// mod_action_msg += `人格倾向 ${change > 0 ? '+' : '-'} ${Math.abs(change)}（${aiNpc.personality_trend}）\n`;
			return mod_action_msg;
		}
	}
}
