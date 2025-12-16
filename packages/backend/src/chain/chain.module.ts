import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { CacheModule } from '../cache/cache.module';
import { ClientModule } from '../mcp-client/mcp-client.module';
import { ModelModule } from '../model/model.module';
import { PromptModule } from '../prompt/prompt.module';
import { WithFormfixChain } from '../utils/abstract';
import { AichatChainService } from './aichat-chain.service';
import { ChainService } from './chain.service';

@Module({
	controllers: [],
	providers: [
		ChainService,
		AichatChainService,

		{
			provide: WithFormfixChain,
			useExisting: ChainService
		}
	],
	imports: [AgentModule, ModelModule, PromptModule, ClientModule, CacheModule],
	exports: [ChainService, AichatChainService, WithFormfixChain]
})
export class ChainModule {}
