import { Module } from '@nestjs/common';
import { DomainEventBus } from './domain-event-bus.service';

@Module({
  providers: [DomainEventBus],
  exports: [DomainEventBus],
})
export class EventsModule {}