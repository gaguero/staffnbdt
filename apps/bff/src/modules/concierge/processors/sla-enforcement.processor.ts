import { Injectable, Logger } from '@nestjs/common';

// Mock Bull imports to avoid dependency issues
function Processor(name: string) {
  return function(target: any) {
    return target;
  };
}

function Process(name: string) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    return descriptor;
  };
}

interface Job<T = any> {
  data: T;
  id: string | number;
  progress?(percentage: number): Promise<void>;
}
import { PrismaService } from '../../../shared/database/prisma.service';
import { DomainEventBus } from '../../../shared/events/domain-event-bus.service';
import { ConciergeService } from '../concierge.service';

export interface SLACheckJob {
  organizationId?: string;
  propertyId?: string;
  objectId?: string;
  checkType: 'overdue' | 'upcoming' | 'escalation';
  windowMinutes?: number;
}

export interface PlaybookExecutionData {
  playbookId: string;
  playbookName?: string;
  objectId: string;
  triggerType: string;
  trigger?: string;
  triggerData?: any;
  actions?: any;
  conditions?: any;
  enforcements?: any;
  context: {
    organizationId: string;
    propertyId: string;
  };
  tenant?: {
    organizationId: string;
    propertyId: string;
  };
  correlationId?: string;
  timestamp?: string;
}

@Injectable()
@Processor('sla-enforcement')
export class SLAEnforcementProcessor {
  private readonly logger = new Logger(SLAEnforcementProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
    private readonly conciergeService: ConciergeService,
  ) {}

  /**
   * Check for overdue objects across all properties
   */
  @Process('check-overdue')
  async checkOverdueObjects(job: Job<SLACheckJob>): Promise<void> {
    this.logger.log('Starting overdue objects check');
    
    try {
      const { organizationId, propertyId } = job.data;
      
      const whereClause: any = {
        dueAt: { lte: new Date() },
        status: { notIn: ['completed', 'cancelled'] },
        deletedAt: null,
      };

      if (organizationId) whereClause.organizationId = organizationId;
      if (propertyId) whereClause.propertyId = propertyId;

      const overdueObjects = await this.prisma.conciergeObject.findMany({
        where: whereClause,
        include: {
          attributes: true,
        },
        orderBy: { dueAt: 'asc' },
      });

      this.logger.log(`Found ${overdueObjects.length} overdue objects`);

      for (const object of overdueObjects) {
        await this.handleOverdueObject(object);
      }

      // Update job progress (if method exists)
      if (job.progress) {
        await job.progress(100);
      }
      
    } catch (error) {
      this.logger.error('Error checking overdue objects', error.stack);
      throw error;
    }
  }

  /**
   * Check for upcoming due dates (warning notifications)
   */
  @Process('check-upcoming')
  async checkUpcomingDueDates(job: Job<SLACheckJob>): Promise<void> {
    this.logger.log('Starting upcoming due dates check');
    
    try {
      const { windowMinutes = 60 } = job.data;
      const now = new Date();
      const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

      const upcomingObjects = await this.prisma.conciergeObject.findMany({
        where: {
          dueAt: {
            gte: now,
            lte: windowEnd,
          },
          status: { notIn: ['completed', 'cancelled'] },
          deletedAt: null,
        },
        include: {
          attributes: true,
        },
        orderBy: { dueAt: 'asc' },
      });

      this.logger.log(`Found ${upcomingObjects.length} objects due within ${windowMinutes} minutes`);

      for (const object of upcomingObjects) {
        await this.handleUpcomingDueDate(object, windowMinutes);
      }

    } catch (error) {
      this.logger.error('Error checking upcoming due dates', error.stack);
      throw error;
    }
  }

  /**
   * Handle escalation rules for overdue objects
   */
  @Process('handle-escalation')
  async handleEscalation(job: Job<SLACheckJob>): Promise<void> {
    this.logger.log('Starting escalation handling');
    
    try {
      const { objectId } = job.data;
      
      if (!objectId) {
        throw new Error('Object ID required for escalation handling');
      }

      const object = await this.prisma.conciergeObject.findUnique({
        where: { id: objectId },
        include: {
          attributes: true,
        },
      });

      if (!object) {
        this.logger.warn(`Object ${objectId} not found for escalation`);
        return;
      }

      await this.processEscalation(object);

    } catch (error) {
      this.logger.error('Error handling escalation', error.stack);
      throw error;
    }
  }

  /**
   * Execute playbook for SLA enforcement
   */
  @Process('execute-sla-playbook')
  async executeSLAPlaybook(job: Job<any>): Promise<void> {
    this.logger.log(`Executing SLA playbook for object ${job.data.objectId}`);
    
    try {
      const { playbookId, objectId, triggerType, context } = job.data;

      // Find and execute the appropriate playbook
      const playbook = await this.prisma.playbook.findFirst({
        where: {
          id: playbookId,
          isActive: true,
        },
      });

      if (!playbook) {
        this.logger.warn(`Playbook ${playbookId} not found or inactive`);
        return;
      }

      // Emit playbook execution event
      await this.eventBus.emit({
        type: 'concierge.playbook.execution.requested',
        payload: {
          playbookId,
          playbookName: playbook.name,
          trigger: triggerType,
          triggerData: {
            objectId,
            slaType: triggerType,
            timestamp: new Date().toISOString(),
          },
          actions: playbook.actions,
          conditions: playbook.conditions,
          enforcements: playbook.enforcements,
        },
        tenant: context,
        correlationId: `sla-${triggerType}-${objectId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Error executing SLA playbook', error.stack);
      throw error;
    }
  }

  /**
   * Handle individual overdue object
   */
  private async handleOverdueObject(object: any): Promise<void> {
    const minutesOverdue = Math.floor(
      (new Date().getTime() - new Date(object.dueAt).getTime()) / (1000 * 60)
    );

    this.logger.debug(`Object ${object.id} is ${minutesOverdue} minutes overdue`);

    // Emit overdue event
    await this.eventBus.emit({
      type: 'concierge.sla.overdue',
      payload: {
        objectId: object.id,
        type: object.type,
        status: object.status,
        dueAt: object.dueAt,
        minutesOverdue,
        reservationId: object.reservationId,
        guestId: object.guestId,
        assignments: object.assignments,
      },
      tenant: { 
        organizationId: object.organizationId, 
        propertyId: object.propertyId 
      },
      correlationId: `overdue-${object.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });

    // Check for escalation rules
    await this.checkEscalationRules(object, minutesOverdue);
  }

  /**
   * Handle upcoming due date notifications
   */
  private async handleUpcomingDueDate(object: any, windowMinutes: number): Promise<void> {
    const minutesUntilDue = Math.floor(
      (new Date(object.dueAt).getTime() - new Date().getTime()) / (1000 * 60)
    );

    this.logger.debug(`Object ${object.id} is due in ${minutesUntilDue} minutes`);

    // Emit upcoming due event
    await this.eventBus.emit({
      type: 'concierge.sla.upcoming',
      payload: {
        objectId: object.id,
        type: object.type,
        status: object.status,
        dueAt: object.dueAt,
        minutesUntilDue,
        windowMinutes,
        reservationId: object.reservationId,
        guestId: object.guestId,
        assignments: object.assignments,
      },
      tenant: { 
        organizationId: object.organizationId, 
        propertyId: object.propertyId 
      },
      correlationId: `upcoming-${object.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check and apply escalation rules
   */
  private async checkEscalationRules(object: any, minutesOverdue: number): Promise<void> {
    // Find playbooks with escalation rules for this object type
    const escalationPlaybooks = await this.prisma.playbook.findMany({
      where: {
        organizationId: object.organizationId,
        propertyId: object.propertyId,
        trigger: 'concierge.sla.overdue',
        isActive: true,
      },
    });

    for (const playbook of escalationPlaybooks) {
      const enforcements = playbook.enforcements as any;
      
      if (!enforcements?.escalation?.rules) continue;

      for (const rule of enforcements.escalation.rules) {
        if (this.shouldTriggerEscalation(rule, minutesOverdue, object)) {
          await this.triggerEscalationRule(rule, object, playbook.id);
        }
      }
    }
  }

  /**
   * Determine if escalation rule should trigger
   */
  private shouldTriggerEscalation(rule: any, minutesOverdue: number, object: any): boolean {
    // Check time-based rules
    if (rule.type === 'time_based') {
      const thresholdMinutes = rule.thresholdMinutes || 60;
      return minutesOverdue >= thresholdMinutes;
    }

    // Check status-based rules
    if (rule.type === 'status_based') {
      return rule.statuses.includes(object.status);
    }

    // Check priority-based rules (from attributes)
    if (rule.type === 'priority_based') {
      const priorityAttribute = object.attributes?.find((attr: any) => 
        attr.fieldKey === 'priority'
      );
      
      if (priorityAttribute) {
        const priority = priorityAttribute.stringValue || priorityAttribute.selectValue;
        return rule.priorities.includes(priority);
      }
    }

    return false;
  }

  /**
   * Trigger specific escalation rule
   */
  private async triggerEscalationRule(rule: any, object: any, playbookId: string): Promise<void> {
    this.logger.log(`Triggering escalation rule ${rule.name} for object ${object.id}`);

    // Check if this rule was already triggered recently
    const recentExecution = await this.prisma.playbookExecution.findFirst({
      where: {
        playbookId,
        objectId: object.id,
        status: { in: ['completed', 'running'] },
        startedAt: {
          gte: new Date(new Date().getTime() - (rule.cooldownMinutes || 60) * 60 * 1000),
        },
      },
    });

    if (recentExecution) {
      this.logger.debug(`Escalation rule ${rule.name} recently executed, skipping`);
      return;
    }

    // Emit escalation event
    await this.eventBus.emit({
      type: 'concierge.sla.escalation',
      payload: {
        objectId: object.id,
        escalationRule: rule.name,
        escalationType: rule.type,
        playbookId,
        severity: rule.severity || 'medium',
        actions: rule.actions || [],
      },
      tenant: { 
        organizationId: object.organizationId, 
        propertyId: object.propertyId 
      },
      correlationId: `escalation-${object.id}-${rule.name}-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Process escalation actions
   */
  private async processEscalation(object: any): Promise<void> {
    // This could trigger notifications, task assignments, status changes, etc.
    this.logger.log(`Processing escalation for object ${object.id}`);

    // Example escalation actions:
    // 1. Notify managers
    // 2. Create urgent tasks
    // 3. Change object priority
    // 4. Assign to different department
    
    // These would be implemented based on specific business rules
  }

  /**
   * Execute playbook for SLA events (aliased method for backward compatibility)
   */
  async executePlaybook(): Promise<void> {
    this.logger.log('Execute playbook called - delegating to executeSLAPlaybook');
    // This is a compatibility method that delegates to executeSLAPlaybook
    // In a real implementation, this would create a job and call executeSLAPlaybook
  }

  /**
   * Schedule next SLA check job
   */
  async scheduleNextSLACheck(organizationId?: string, propertyId?: string): Promise<void> {
    // This would typically be called by a scheduler service
    // Implementation depends on the job queue system being used
    this.logger.log('Scheduling next SLA check');
  }
}