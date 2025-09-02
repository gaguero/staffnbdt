import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConciergeController } from './concierge.controller';
import { ConciergeService } from './concierge.service';
import { TemplateService } from './template.service';
import { SLAEnforcementProcessor } from './processors/sla-enforcement.processor';
import { ConciergeEventHandler } from './handlers/concierge-event.handler';
import { DatabaseModule } from '../../shared/database/database.module';
import { TenantModule } from '../../shared/tenant/tenant.module';
import { DomainEventBus } from '../../shared/events/domain-event-bus.service';
import { ModuleRegistryModule } from '../module-registry/module-registry.module';

// AI and Intelligence Services
import { IntelligentAutomationController } from './intelligent-automation.controller';
import { IntelligentPlaybookEngine } from './processors/intelligent-playbook-engine';
import { SmartNotificationEngine } from './processors/smart-notification-engine';
import { MLPredictionService } from './processors/ml-prediction-service';
import { NLPService } from './processors/nlp-service';
import { AnalyticsIntelligenceService } from './processors/analytics-intelligence-service';
import { SelfHealingService } from './processors/self-healing-service';

@Module({
  imports: [
    DatabaseModule,
    TenantModule,
    ModuleRegistryModule,
    ScheduleModule.forRoot(), // Required for cron jobs in AI services
  ],
  controllers: [
    ConciergeController,
    IntelligentAutomationController, // AI endpoints
  ],
  providers: [
    // Core services
    ConciergeService,
    TemplateService,
    SLAEnforcementProcessor,
    ConciergeEventHandler,
    DomainEventBus,
    
    // AI and Intelligence services
    IntelligentPlaybookEngine,
    SmartNotificationEngine,
    MLPredictionService,
    NLPService,
    AnalyticsIntelligenceService,
    SelfHealingService,
  ],
  exports: [
    // Core exports
    ConciergeService,
    TemplateService,
    SLAEnforcementProcessor,
    
    // AI service exports (for use in other modules)
    IntelligentPlaybookEngine,
    SmartNotificationEngine,
    MLPredictionService,
    NLPService,
    AnalyticsIntelligenceService,
    SelfHealingService,
  ],
})
export class ConciergeModule {}
