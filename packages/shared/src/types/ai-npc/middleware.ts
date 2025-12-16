import { NpcAIOutput } from './ai';
import { TAINpc } from './ai-npc';
import { GameAction, MessageSendDto } from './api';

interface Middleware {
	/**
	 * 中间件函数
	 */
	(input: MWInput): Promise<MWInput>;
}

interface MWInput {
	aiNpc: TAINpc; // npc与玩家角色数据
	messageSendDto: MessageSendDto; // 玩家端发送的消息
	npcAIOutput: NpcAIOutput; // ai响应

	relationshipChange: number; // 好感度变化
	relationshipLevelUp: boolean; // 好感度等级提高

	/* 用于返回给游戏程序 */
	/* 在mod服务器端发生的数据操作的汇报 */
	mod_action_msg?: string;
	/* 需要在游戏程序中进行的对游戏数据的操作 */
	action: GameAction[];
}

// interface MWOutPut extends MWInput {}

/**
 * 在游戏端消息发送（玩家输入）、服务器端响应（npc回应）之间的中间件流水线
 * 当前输入输出、玩家和npc状态经过MWPipeline流水线
 * 应用服务器数据更改、组织游戏端数据更改、进行任务检定...
 */
interface MWPipeline {
	middlewares: Middleware[];
	run(input: MWInput): Promise<MWInput>;
}

interface MWService {
	createPipeline(middlewares: Middleware[]): MWPipeline;
}

export { Middleware, MWInput, MWPipeline, MWService };
