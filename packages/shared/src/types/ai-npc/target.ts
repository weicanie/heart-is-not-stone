enum TargetList {
	向上社交 = 'Upward socializing'
}

/**
 * 游玩目标。
 * @description 可作为引导任务、简单任务。
 * @description 可以有奖励，可以影响游戏世界，可以有剧情
 */
interface TTarget {
	name: string; // 名称
	icon: string; // 图标
	done: boolean; // 是否完成
	descTxt: string; // 文字描述
	descMd?: string | null; // Markdown描述
}

export { TargetList, TTarget };
