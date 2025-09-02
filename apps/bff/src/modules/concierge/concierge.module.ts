import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConciergeController } from './concierge.controller';
import { ConciergeService } from './concierge.service';
import { TemplateService } from './template.service';
import { ConciergeEventHandler } from './handlers/concierge-event.handler';
import { DatabaseModule } from '../../shared/database/database.module';
import { TenantModule } from '../../shared/tenant/tenant.module';
import { DomainEventBus } from '../../shared/events/domain-event-bus.service';
import { ModuleRegistryModule } from '../module-registry/module-registry.module';

@Module({
  imports: [
    DatabaseModule,
    TenantModule,
    ModuleRegistryModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    ConciergeController,
  ],
  providers: [
    ConciergeService,
    TemplateService,
    ConciergeEventHandler,
    DomainEventBus,
  ],
  exports: [
    ConciergeService,
    TemplateService,
  ],
})
export class ConciergeModule {}
