import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from '../../../shared/events/domain-event-bus.service';
import { SLAEnforcementProcessor, PlaybookExecutionData } from '../processors/sla-enforcement.processor';

@Injectable()
export class ConciergeEventHandler {
  private readonly logger = new Logger(ConciergeEventHandler.name);

  constructor(
    private readonly slaProcessor: SLAEnforcementProcessor,
  ) {}

  async handleEvent(event: DomainEvent<any>): Promise<void> {
    try {
      switch (event.type) {
        case 'concierge.playbook.execution.requested':
          await this.handlePlaybookExecution(event);
          break;
        case 'concierge.sla.check.scheduled':
          await this.handleSLACheck(event);
          break;
        default:
          this.logger.debug(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling event ${event.type}:`, error);
      // Don't rethrow to prevent event processing failures
    }
  }

  private async handlePlaybookExecution(event: DomainEvent): Promise<void> {
    const data: PlaybookExecutionData = {
      playbookId: event.payload.playbookId,
      playbookName: event.payload.playbookName,
      trigger: event.payload.trigger,
      triggerData: event.payload.triggerData,
      actions: event.payload.actions || [],
      conditions: event.payload.conditions,
      enforcements: event.payload.enforcements,
      tenant: { 
        organizationId: event.tenant.organizationId,
        propertyId: event.tenant.propertyId || ''
      },
    };

    await this.slaProcessor.executePlaybook(data);
  }

  private async handleSLACheck(event: DomainEvent): Promise<void> {
    await this.slaProcessor.checkOverdueObjects();
  }
}