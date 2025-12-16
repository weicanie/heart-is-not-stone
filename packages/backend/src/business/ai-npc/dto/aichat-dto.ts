import { LLMCanUse, UserRole } from '@not_stone/shared';
import { IsEnum, IsObject, IsString, MaxLength } from 'class-validator';

class UserModelConfigDto {
	@IsEnum(LLMCanUse)
	llm_type: LLMCanUse;

	@MaxLength(1000)
	@IsString()
	api_key: string;
}

class SlelectedArchive {
	@MaxLength(100)
	@IsString()
	name: string;

	@IsEnum(UserRole)
	role: UserRole;
}

export class MessageSendDto {
	@MaxLength(100000)
	@IsString()
	message: string;

	@MaxLength(100)
	@IsString()
	npcCall: string; // 当前对话npc的名称（游戏语言为中文则为其中文名）

	@IsObject()
	modelConfig: UserModelConfigDto;

	@IsObject()
	archive: SlelectedArchive;
}
