/* 游戏中玩家调用的接口的返回值
  调用接口 = 调用ai npc进行 普通对话 / 推进任务
*/
interface APIReturn {
	/* 消息（AI回复、NPC提问、系统提示等） */
	msg: string;
	speaker: string; // 用于在游戏日志中显示消息来源
	/* 在mod服务器端发生的数据操作的汇报 */
	mod_action_msg?: string;
	/* 需要在游戏程序中进行的对游戏数据的操作 */
	action: GameAction[];
}

interface GameAction {
	code: ActionCode;
	msg?: string; // 数据变更的日志提示
	cnt?: number; // 需要在游戏程序中进行修改的数据的操作数量
	itemKey?: string; // 物品key，用于npc赠礼
	// 操作某一npc的车队认可度
	// npcKey?: CaravanNpcKey;
}

enum ActionCode {
	//-----游戏端-----
	/* 增加金币 */
	AddGold = 1,
	/* 增加经验 */
	AddExp = 2,
	/* 修改声望 */
	ChangeReputation = 3,
	/* 当前对话npc与玩家交恶：攻击玩家 */
	AttackPlayer = 8,
	/* 赠礼：增加物品到玩家背包 */
	AddPlayerItem = 9,
	/* 增加车队认可度 */
	// AddLoyalty = 4,
	// -----mod端-----
	/* 修改好感度 */
	ChangeRelationshipValue = 5,
	/* 修改关系 */
	deleteSpecialRelationship = 6,
	addSpecialRelationship = 7
}

// 玩家可能扮演的角色
enum UserRole {
	Velmir = 'Velmir',
	Jorgrim = 'Jorgrim',
	Arna = 'Arna',
	Dirwin = 'Dirwin',
	Jonna = 'Jonna',
	Mahir = 'Mahir',
	Leosthenes = 'Leosthenes',
	Hilda = 'Hilda',
	Geralt = 'Geralt'
}

//中文名称到英文的转换
const cnNameToEnglish = {
	韦尔米尔: UserRole.Velmir,
	约戈里姆: UserRole.Jorgrim,
	阿娜: UserRole.Arna,
	德温: UserRole.Dirwin,
	约娜: UserRole.Jonna,
	玛息尔: UserRole.Mahir,
	琉斯典纳斯: UserRole.Leosthenes,
	希尔达: UserRole.Hilda,
	杰洛特: UserRole.Geralt
};

/**
 * 对话可用的模型
 */
enum LLMCanUse {
	// google
	// gemini_2_5_pro = 'gemini-2.5-pro',
	// gemini_2_5_pro_proxy = 'gemini-2.5-pro-proxy',
	gemini_2_5_flash = 'gemini-2.5-flash',
	// deepseek
	v3 = 'deepseek-chat',
	// r1 = 'deepseek-reasoner',
	//zhipu
	glm_4_6 = 'glm-4.6'
}

interface UserModelConfig<T = LLMCanUse> {
	llm_type: T;
	api_key: string;
}

/**
 * 用于在第一次对话时初始化档案，以及在猴戏对话时确定使用的档案
 */
interface SlelectedArchive {
	name: string;

	role: UserRole;
}

interface MessageSendDto<T = LLMCanUse> {
	message: string;
	npcCall: string; // 当前对话npc的名称（游戏语言为中文则为其中文名）
	modelConfig: UserModelConfig<T>;
	archive: SlelectedArchive;
}

interface GameArchive {
	id: number;
	name: string;
	role_name: string;
	user_id: number;
	create_at: Date | null;
	update_at: Date | null;
}

export {
	ActionCode,
	APIReturn,
	cnNameToEnglish,
	GameAction,
	GameArchive,
	LLMCanUse,
	MessageSendDto,
	SlelectedArchive,
	UserModelConfig,
	UserRole
};
