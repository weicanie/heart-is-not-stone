import { Module } from '@nestjs/common';
import { EventBusModule } from '../EventBus/event-bus.module';
import { VectorStoreService } from './vector-store.service';
@Module({
	controllers: [],
	providers: [VectorStoreService],
	imports: [EventBusModule],
	exports: [VectorStoreService]
})
export class VectorStoreModule {}
