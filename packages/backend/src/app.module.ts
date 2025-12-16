import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { ManageModule } from './business/manage/manage.module';

import { AiNpcModule } from './business/ai-npc/ai-npc.module';
import { UserModule } from './business/user/user.module';
import { CacheModule } from './cache/cache.module';
import { ChainModule } from './chain/chain.module';
import { GlobalInterceptor } from './dataFormat.interceptor';
import { DbModule } from './DB/db.module';
import { GlobalFilter } from './errorHandle.filter';
import { EventBusModule } from './EventBus/event-bus.module';
import { IsLoginGuard } from './isLogin.guard';
import { SseSessionManagerModule } from './manager/sse-session-manager/sse-session-manager.module';
@Module({
	imports: [
		/* 业务模块 */
		AiNpcModule,
		UserModule,
		ManageModule,
		/* 基础设施模块 */
		DbModule,
		ChainModule,
		CacheModule,
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [
				//本地开发时不传入环境变量NODE_ENV也行
				'.env',
				process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
			]
		}),
		// mongodb数据库
		// MongooseModule.forRoot(
		// 	`mongodb://${process.env.MONGO_HOST ?? 'localhost'}:${process.env.MONGO_PORT ?? '27017'}/not_stone`
		// ),
		EventBusModule,
		SseSessionManagerModule
	],
	providers: [
		{
			provide: APP_FILTER,
			useClass: GlobalFilter
		},
		{
			provide: APP_GUARD,
			useClass: IsLoginGuard
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: GlobalInterceptor
		}
	]
})
export class AppModule {}
