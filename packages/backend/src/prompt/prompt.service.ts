//从文件中读取prompt
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export enum role {
	SYSTEM = 'system',
	ASSISTANT = 'assistant',
	HUMAN = 'human',
	PLACEHOLDER = 'placeholder'
}

@Injectable()
export class PromptService implements OnModuleInit {
	private aiNpcSystemT: string;
	private readonly fewShotMap: Record<string, string> = {};

	constructor() {}

	async onModuleInit() {
		try {
			const promises = [
				this._readPromptFile(path.join(process.cwd(), 'data/prompt/ai-npc/system.md'))
			];
			const [aiNpcSystemT] = await Promise.all(promises);

			this.aiNpcSystemT = aiNpcSystemT as string;
		} catch (error) {
			console.error('Failed to read prompt files', error);
		}
	}

	private async _readPromptFile(filePath: string) {
		return new Promise((resolve, reject) => {
			fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
				if (err) reject(err);
				else resolve(data);
			});
		});
	}

	/**
	 * 部分填充promptT字符串的插槽
	 * @description 由于langchain的partial方法不支持PromptTemplate部分填充后作为ChatPromptTemplate的组成部分,因此使用带插槽的string传入ChatPromptTemplate
	 * @description 这些插槽最终都生效,因为chain中的Runnable prompt中所有的{..}都会成为待填充的变量
	 * @param stringT
	 * @param param1
	 * @returns 填充后的promptT字符串
	 */
	public partialT(stringT: string, [slotName, contentP]: [string, string]) {
		if (!stringT.includes(slotName)) {
			console.error(`所要填充的prompt模板字符串不具有插槽:${slotName},将不填充直接输出`);
			return stringT;
		}
		stringT = stringT.replace(slotName, contentP);
		return stringT;
	}

	/**
	 * ai npc prompt
	 * @slot npc_role_info 你扮演的角色的设定信息
	 * @slot user_role_info 玩家扮演的角色的设定信息
	 * @slot format_instruction 输出格式的json schema
	 * @slot history 对话历史
	 * @slot input 用户本次输入
	 */
	async aiNpcSystemPrompt() {
		return ChatPromptTemplate.fromTemplate(this.aiNpcSystemT);
	}
}
