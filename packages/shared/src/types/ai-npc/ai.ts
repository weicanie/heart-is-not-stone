import z from 'zod';
import { ActionCode } from './api';

interface NpcAIInput {
	userInput: string;
	/* 由于好感度、关系会变化，因此需要每次重申 */
	relationship: string;
}

interface NpcAIOutput {
	reply: string;
	actions: {
		code: ActionCode;
		cnt?: number;
		rels?: string[];
	}[];
}

const npcAIOutputSchema = z.object({
	reply: z.string().describe('回复'),
	actions: z
		.array(
			z
				.object({
					code: z.string().describe('操作代号').default('-1'),
					cnt: z.number().describe('操作数量').default(0),
					rels: z.array(z.string()).describe('操作的社会关系').default([])
				})
				.describe('操作')
		)
		.describe('操作序列')
});

export { NpcAIInput, NpcAIOutput, npcAIOutputSchema };
