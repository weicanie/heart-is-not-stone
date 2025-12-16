import {
	APIReturn,
	MessageSendDto,
	NpcAIInput,
	NpcAIOutput,
	NpcExistenceMetaData,
	NpcName,
	NpcStaus,
	RelationshipTier,
	TAINpc,
	TraitList,
	UserInfoFromToken
} from '@not_stone/shared';
import { AiNpcMiddlewareService } from './ai-npc-middleware.service';
import { AiNpcService } from './ai-npc.service';

class AINpc implements TAINpc {
	game_archive_id: number;
	npcName: NpcName;
	userRoleName: string;

	status: NpcStaus;
	traits: TraitList[];
	relationshipValue: number;
	relationship: RelationshipTier;
	specialRelationship: string[];
	personality_trend: number;
	gift_given: boolean;
	metadata: NpcExistenceMetaData;

	aiNpcService: AiNpcService;
	aiNpcMiddlewareService: AiNpcMiddlewareService;

	constructor(
		aiNpcService: AiNpcService,
		aiNpcMiddlewareService: AiNpcMiddlewareService,
		game_archive_id: number,
		npcName: NpcName,
		userRoleName: string,
		relationshipValue: number,
		relationship: RelationshipTier,
		specialRelationship: string[],
		personality_trend: number,
		metadata: NpcExistenceMetaData,
		gift_given: boolean,
		status: NpcStaus = NpcStaus.normal,
		traits: TraitList[] = []
	) {
		this.aiNpcService = aiNpcService;
		this.aiNpcMiddlewareService = aiNpcMiddlewareService;
		this.game_archive_id = game_archive_id;
		this.npcName = npcName;
		this.userRoleName = userRoleName;
		this.status = status;
		this.traits = traits;
		this.relationshipValue = relationshipValue;
		this.relationship = relationship;
		this.specialRelationship = specialRelationship;
		this.personality_trend = personality_trend;
		this.metadata = metadata;
		this.gift_given = gift_given;
	}

	/**
	 * 保存NPC数据到数据库
	 */
	async saveNpcToDB() {
		// 将数据更新到数据库
		await this.aiNpcService.dbService.ai_npc.updateMany({
			where: {
				game_archive_id: this.game_archive_id,
				name: this.npcName
			},
			data: {
				relationshipValue: this.relationshipValue,
				relationshipTier: this.relationship,
				specialRelationship: JSON.stringify(this.specialRelationship)
			}
		});
	}

	/**
	 * 保存用户角色数据到数据库
	 */
	async saveUserRoleToDB() {
		await this.aiNpcService.dbService.game_archive.updateMany({
			where: {
				id: this.game_archive_id
			},
			data: {
				personality_trend: this.personality_trend
			}
		});
	}

	/**
	 * 与AI NPC对话
	 * @returns AI NPC的回复
	 */
	async talk(messageDto: MessageSendDto, userInfo: UserInfoFromToken) {
		const aiInput: NpcAIInput = {
			userInput: messageDto.message,
			relationship: `人际关系：${this.relationship}，社会关系：${this.specialRelationship.join('、')}`
		};
		messageDto.message = JSON.stringify(aiInput);

		const aiOutput = await this.aiNpcService.sendMessageToAI(messageDto, userInfo, this.npcName);
		return aiOutput;
	}

	/**
	 * 将流水线输出转为返回给游戏程序的格式
	 */
	async returnToGameProgram(aiOutput: NpcAIOutput, messageDto: MessageSendDto): Promise<APIReturn> {
		const normalChatPipeline = this.aiNpcMiddlewareService.getNormalChatPipeline();
		const pipelineOutput = await normalChatPipeline.run({
			aiNpc: this,
			messageSendDto: messageDto,
			npcAIOutput: aiOutput,
			mod_action_msg: '',
			relationshipChange: 0,
			relationshipLevelUp: false,
			action: []
		});
		// 返回回复和需要在游戏程序中进行的数据操作
		return {
			msg: aiOutput.reply,
			speaker: this.npcName,
			mod_action_msg: pipelineOutput.mod_action_msg,
			action: pipelineOutput.action
		};
	}
}

export default AINpc;
