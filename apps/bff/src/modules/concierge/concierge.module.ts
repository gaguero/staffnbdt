import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConciergeController } from './concierge.controller';
import { ConciergeService } from './concierge.service';
import { TemplateService } from './template.service';
import { ConciergeEventHandler } from './handlers/concierge-event.handler';
import { FieldValidationService } from './services/field-validation.service';
import { PlaybookExecutionService } from './services/playbook-execution.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { TenantModule } from '../../shared/tenant/tenant.module';
import { EventsModule } from '../../shared/events/events.module';
import { ModuleRegistryModule } from '../module-registry/module-registry.module';

@Module({
  imports: [
    DatabaseModule,
    TenantModule,
    EventsModule,
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
    FieldValidationService,
    PlaybookExecutionService,
  ],
  exports: [
    ConciergeService,
    TemplateService,
  ],
})
export class ConciergeModule {}
