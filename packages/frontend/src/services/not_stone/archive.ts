import {
	cnNameToEnglish,
	LLMCanUse,
	type GameArchive,
	type ModAccountData,
	type ServerDataFormat as SDF
} from '@not_stone/shared';
import { instance_not_stone as instance } from './config';

// 获取所有档案
async function getArchives() {
	const res = await instance.get<SDF<GameArchive[]>>('/ai-npc/archives');
	return res.data;
}

// 创建档案
async function createArchive(params: {
	archiveName: string;
	roleName: keyof typeof cnNameToEnglish;
	llm_type: LLMCanUse;
}) {
	const res = await instance.post<any, SDF<ModAccountData>>('/ai-npc/create_archive', null, {
		params
	});
	return res.data;
}

// 设置当前档案
async function setCurArchive(archiveId: number) {
	const res = await instance.post<any, SDF<string>>('/ai-npc/set_cur_archive', null, {
		params: { archiveId }
	});
	return res.data;
}

// 获取当前档案
async function getCurArchive() {
	const res = await instance.get<SDF<GameArchive>>('/ai-npc/get_cur_archive');
	return res.data;
}

export { createArchive, getArchives, getCurArchive, setCurArchive };
