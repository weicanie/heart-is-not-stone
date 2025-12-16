import {
	ConversationSummaryBufferMemory,
	ConversationSummaryBufferMemoryInput
} from 'langchain/memory';
import { DbService } from '../DB/db.service';

export interface PersistentConversationSummaryMemoryInput
	extends ConversationSummaryBufferMemoryInput {
	dbService: DbService;
	keyname: string;
}
/* 
渐进式压缩，像贪吃蛇一样，尾巴一点点被“吃”进摘要里
- 阶段 1 : [a, b, c, d, e] (对话列表中的总token数超标，system prompt和当前用户输入不计入在内)
- 阶段 2 : 摘要(a) + [b, c, d, e] (达标)
- 阶段 3 : 摘要(a) + [b, c, d, e, f] (超标)
- 阶段 4 : 摘要(a+b) + [c, d, e, f] (达标)
- 阶段 5 : 摘要(a+b) + [c, d, e, f, g] (超标)
- 阶段 6 : 摘要(a+b+c) + [d, e, f, g] (达标)
*/
export class PersistentConversationSummaryMemory extends ConversationSummaryBufferMemory {
	dbService: DbService;
	keyname: string;

	constructor(fields: PersistentConversationSummaryMemoryInput) {
		super(fields);
		this.dbService = fields.dbService;
		this.keyname = fields.keyname;
	}

	async loadMemoryVariables(values: Record<string, any>): Promise<Record<string, any>> {
		// 如果movingSummaryBuffer为空，尝试从数据库加载
		if (!this.movingSummaryBuffer) {
			try {
				const data = await this.dbService.ai_conversation.findUnique({
					where: {
						keyname: this.keyname
					},
					select: {
						summary: true
					}
				});
				if (data?.summary) {
					this.movingSummaryBuffer = data.summary;
				}
			} catch (error) {
				console.warn('Failed to load summary from DB:', error);
			}
		}
		return super.loadMemoryVariables(values);
	}

	async saveContext(
		inputValues: Record<string, any>,
		outputValues: Record<string, any>
	): Promise<void> {
		await super.saveContext(inputValues, outputValues);

		// 保存 summary 到数据库
		// 注意：super.saveContext 内部会调用 prune，prune 可能会更新 movingSummaryBuffer
		if (this.movingSummaryBuffer) {
			try {
				await this.dbService.ai_conversation.update({
					where: {
						keyname: this.keyname
					},
					data: {
						summary: this.movingSummaryBuffer as string
					}
				});
			} catch (error) {
				console.error('Failed to save summary to DB:', error);
			}
		}
	}
}
