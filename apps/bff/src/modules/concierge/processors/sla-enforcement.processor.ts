import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { DomainEventBus } from '../../../shared/events/domain-event-bus.service';
import { ConciergeService } from '../concierge.service';

@Injectable()
export class SLAEnforcementProcessor {
  private readonly logger = new Logger(SLAEnforcementProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
    private readonly conciergeService: ConciergeService,
  ) {}

  /**
   * Check for overdue concierge objects and emit events
   * This should be called periodically (e.g., every 15 minutes)
   */
  async checkOverdueObjects(): Promise<void> {
    try {
      const overdueObjects = await this.conciergeService.findOverdueObjects();
      
      this.logger.log(`Found ${overdueObjects.length} overdue concierge objects`);

      for (const object of overdueObjects) {
        await this.eventBus.emit({
          type: 'concierge.sla.overdue',
          payload: {
            objectId: object.id,
            type: object.type,
            status: object.status,
            dueAt: object.dueAt?.toISOString(),
            reservationId: object.reservationId,
            guestId: object.guestId,
            overdueBy: object.dueAt ? Date.now() - object.dueAt.getTime() : null,
          },
          tenant: {
            organizationId: object.organizationId,
            propertyId: object.propertyId,
          },
          correlationId: `sla-overdue-${object.id}`,
          timestamp: new Date().toISOString(),
        });

        // Update object status to indicate it's overdue
        await this.prisma.conciergeObject.update({
          where: { id: object.id },
          data: { 
            status: 'overdue',
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.error('Error checking overdue objects:', error);
      throw error;
    }
  }

  /**
   * Execute a playbook based on trigger event
   */
  async executePlaybook(data: PlaybookExecutionData): Promise<void> {
    try {
      const { playbookId, playbookName, trigger, triggerData, actions, conditions, enforcements } = data;

      this.logger.log(`Executing playbook: ${playbookName} (${playbookId})`);

      // Validate conditions first
      if (conditions && !this.evaluateConditions(conditions, triggerData)) {
        this.logger.log(`Playbook ${playbookName} conditions not met, skipping execution`);
        return;
      }

      // Execute each action
      for (const action of actions || []) {
        await this.executeAction(action, triggerData, data.tenant);
      }

      // Apply enforcements (SLAs, notifications, etc.)
      if (enforcements) {
        await this.applyEnforcements(enforcements, triggerData, data.tenant);
      }

      this.logger.log(`Playbook ${playbookName} executed successfully`);

    } catch (error) {
      this.logger.error(`Error executing playbook ${data.playbookName}:`, error);
      throw error;
    }
  }

  private evaluateConditions(conditions: any, triggerData: any): boolean {
    // Simple condition evaluation logic
    // In a real implementation, this would be more sophisticated
    try {
      if (conditions.type === 'and') {
        return conditions.rules.every((rule: any) => this.evaluateRule(rule, triggerData));
      }
      if (conditions.type === 'or') {
        return conditions.rules.some((rule: any) => this.evaluateRule(rule, triggerData));
      }
      return this.evaluateRule(conditions, triggerData);
    } catch (error) {
      this.logger.warn('Error evaluating conditions, defaulting to true:', error);
      return true; // Default to true if evaluation fails
    }
  }

  private evaluateRule(rule: any, triggerData: any): boolean {
    const { field, operator, value } = rule;
    const fieldValue = this.getNestedValue(triggerData, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return fieldValue && fieldValue.includes(value);
      case 'gt':
        return fieldValue > value;
      case 'lt':
        return fieldValue < value;
      case 'gte':
        return fieldValue >= value;
      case 'lte':
        return fieldValue <= value;
      default:
        return true;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executeAction(action: any, triggerData: any, tenant: any): Promise<void> {
    try {
      switch (action.type) {
        case 'create_object':
          await this.createConciergeObject(action, triggerData, tenant);
          break;
        case 'update_object':
          await this.updateConciergeObject(action, triggerData, tenant);
          break;
        case 'send_notification':
          await this.sendNotification(action, triggerData, tenant);
          break;
        case 'assign_task':
          await this.assignTask(action, triggerData, tenant);
          break;
        default:
          this.logger.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      this.logger.error(`Error executing action ${action.type}:`, error);
      // Continue with other actions even if one fails
    }
  }

  private async createConciergeObject(action: any, triggerData: any, tenant: any): Promise<void> {
    const objectData = {
      organizationId: tenant.organizationId,
      propertyId: tenant.propertyId,
      type: action.objectType || 'task',
      status: action.status || 'pending',
      dueAt: action.dueAt ? new Date(action.dueAt) : null,
      reservationId: triggerData.reservationId || null,
      guestId: triggerData.guestId || null,
      assignments: action.assignments || null,
      files: action.files || null,
    };

    await this.prisma.conciergeObject.create({ data: objectData });
    this.logger.log(`Created concierge object of type: ${objectData.type}`);
  }

  private async updateConciergeObject(action: any, triggerData: any, tenant: any): Promise<void> {
    const objectId = action.objectId || triggerData.completedObjectId;
    if (!objectId) {
      this.logger.warn('No object ID provided for update action');
      return;
    }

    const updateData: any = {};
    if (action.status) updateData.status = action.status;
    if (action.assignments) updateData.assignments = action.assignments;
    if (action.dueAt) updateData.dueAt = new Date(action.dueAt);

    await this.prisma.conciergeObject.updateMany({
      where: {
        id: objectId,
        organizationId: tenant.organizationId,
        propertyId: tenant.propertyId,
      },
      data: updateData,
    });

    this.logger.log(`Updated concierge object: ${objectId}`);
  }

  private async sendNotification(action: any, triggerData: any, tenant: any): Promise<void> {
    await this.eventBus.emit({
      type: 'notification.send.requested',
      payload: {
        type: action.notificationType || 'info',
        title: action.title || 'Concierge Notification',
        message: action.message || 'A concierge task requires your attention',
        recipients: action.recipients || [],
        data: {
          ...triggerData,
          playbookGenerated: true,
        },
      },
      tenant,
      correlationId: `playbook-notification-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Notification sent: ${action.title}`);
  }

  private async assignTask(action: any, triggerData: any, tenant: any): Promise<void> {
    // Create a task assignment (this would integrate with your task system)
    await this.eventBus.emit({
      type: 'task.assignment.requested',
      payload: {
        title: action.title || 'Concierge Task',
        description: action.description || 'Task generated by playbook',
        assignedTo: action.assignedTo,
        dueDate: action.dueDate || null,
        priority: action.priority || 'medium',
        relatedObjectId: triggerData.objectId || triggerData.completedObjectId,
        relatedObjectType: 'concierge_object',
      },
      tenant,
      correlationId: `playbook-task-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Task assigned: ${action.title}`);
  }

  private async applyEnforcements(enforcements: any, triggerData: any, tenant: any): Promise<void> {
    if (enforcements.sla) {
      // Set up SLA monitoring
      const slaData = {
        objectId: triggerData.objectId || triggerData.completedObjectId,
        slaMinutes: enforcements.sla.minutes || 60,
        escalationRules: enforcements.sla.escalation || [],
      };

      await this.eventBus.emit({
        type: 'sla.monitoring.started',
        payload: slaData,
        tenant,
        correlationId: `sla-setup-${Date.now()}`,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`SLA enforcement applied: ${slaData.slaMinutes} minutes`);
    }

    if (enforcements.notifications) {
      // Schedule future notifications
      for (const notification of enforcements.notifications) {
        await this.eventBus.emit({
          type: 'notification.schedule.requested',
          payload: {
            ...notification,
            scheduledAt: new Date(Date.now() + (notification.delayMinutes || 0) * 60 * 1000),
          },
          tenant,
          correlationId: `scheduled-notification-${Date.now()}`,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.log(`Scheduled ${enforcements.notifications.length} notifications`);
    }
  }
}

export interface PlaybookExecutionData {
  playbookId: string;
  playbookName: string;
  trigger: string;
  triggerData: any;
  actions: any[];
  conditions?: any;
  enforcements?: any;
  tenant: {
    organizationId: string;
    propertyId: string;
  };
}