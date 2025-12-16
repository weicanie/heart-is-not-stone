import { NpcName } from './ai-npc';
import { ActionCode } from './api';

enum TaskStatus {
	notStart = 'notStart', // 未开始
	inProgress = 'inProgress', // 进行中
	completed = 'completed' // 已完成
}

interface TaskDialog {
	npcName: NpcName; // 对话的npc
	dialog: string; // 对话内容
}
// 完成任务步骤所需条件
enum TaskCondition {
	dialog_listen = 'dialog_listen', // 听完npc的讲述
	dialog_check = 'dialog_check' // 检查玩家的回答
}

interface TaskStep {
	stepName: string; // 步骤名称
	npcName: NpcName; // 步骤中涉及的npc
	dialog: TaskDialog; // 步骤中的对话
	condition: TaskCondition; // 完成步骤的条件
	endAction: ActionCode; // 步骤结束后触发的操作
}

/* 任务系统
  任务都是对话和检定驱动的。
  当触发某一任务后，相关的npc全变为任务中状态，不再接受一般的对话，直到任务完成。
*/
enum TaskList {}

interface TTask {
	taskName: TaskList;
	status: TaskStatus;
	npcs: NpcName[]; // 任务中涉及的npc
	steps: TaskStep[]; // 任务的步骤
	currentStep: number; // 当前进行到的步骤
}

export { TaskCondition, TaskDialog, TaskStatus, TaskStep, TTask };
