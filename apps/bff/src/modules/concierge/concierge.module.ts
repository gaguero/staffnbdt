import { Module } from '@nestjs/common';
import { ConciergeController } from './concierge.controller';
import { ConciergeService } from './concierge.service';
import { TemplateService } from './template.service';
import { SLAEnforcementProcessor } from './processors/sla-enforcement.processor';
import { ConciergeEventHandler } from './handlers/concierge-event.handler';
import { DatabaseModule } from '../../shared/database/database.module';
import { TenantModule } from '../../shared/tenant/tenant.module';
import { DomainEventBus } from '../../shared/events/domain-event-bus.service';
import { ModuleRegistryModule } from '../module-registry/module-registry.module';

@Module({
  imports: [DatabaseModule, TenantModule, ModuleRegistryModule],
  controllers: [ConciergeController],
  providers: [
    ConciergeService,
    TemplateService,
    SLAEnforcementProcessor,
    ConciergeEventHandler,
    DomainEventBus,
  ],
  exports: [ConciergeService, TemplateService, SLAEnforcementProcessor],
})
export class ConciergeModule {}


