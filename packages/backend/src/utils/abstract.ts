import { RunnableSequence } from '@langchain/core/runnables';
import z from 'zod';

/**
 * 提供格式修复chain的service
 */
export abstract class WithFormfixChain {
	abstract fomartFixChain<T = any>(
		schema: z.Schema,
		errMsg: string
	): Promise<
		RunnableSequence<
			{
				input: string;
			},
			Exclude<T, Error>
		>
	>;
}
