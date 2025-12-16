import { LLMCanUse, MessageSendDto } from './api';

/**
 * 在游戏文件中保留的与mod服务器通信用的账号数据
 */
interface ModAccountData {
	modelConfig: MessageSendDto<LLMCanUse>['modelConfig'];
	archive: MessageSendDto<LLMCanUse>['archive'];
	token: string;
}

export { ModAccountData };
