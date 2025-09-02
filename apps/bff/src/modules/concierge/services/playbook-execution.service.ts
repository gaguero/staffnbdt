import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { DomainEventBus } from '../../../shared/events/domain-event-bus.service';
import { TenantContextService } from '../../../shared/tenant/tenant-context.service';
import { ModuleRegistryService } from '../../module-registry/module-registry.service';
import { FieldValidationService } from './field-validation.service';

export interface PlaybookExecutionContext {
  organizationId: string;
  propertyId: string;
  userId?: string;
  triggerData?: any;
  correlationId: string;
}

export interface PlaybookAction {
  type: string;
  config: any;
  condition?: any;
}

export interface ExecutionResult {
  success: boolean;
  results?: any;
  errors?: string[];
  warnings?: string[];
}

@Injectable()
export class PlaybookExecutionService {
  private readonly logger = new Logger(PlaybookExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
    private readonly tenantContext: TenantContextService,
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly fieldValidation: FieldValidationService,
  ) {}

  /**
   * Execute a playbook with retry mechanism and detailed logging
   */
  async executePlaybook(
    playbookId: string,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<ExecutionResult> {
    const executionId = await this.createExecution(playbookId, objectId);
    
    try {
      this.logger.log(`Starting playbook execution: ${executionId}`);

      // Get playbook details
      const playbook = await this.prisma.playbook.findFirst({
        where: {
          id: playbookId,
          organizationId: context.organizationId,
          propertyId: context.propertyId,
          isActive: true,
        },
      });

      if (!playbook) {
        throw new Error(`Playbook ${playbookId} not found or inactive`);
      }

      // Evaluate conditions
      const conditionsMet = await this.evaluateConditions(
        playbook.conditions,
        objectId,
        context,
      );

      if (!conditionsMet) {
        await this.completeExecution(executionId, {
          success: true,
          results: { conditionsMet: false, message: 'Conditions not met, skipping execution' },
        });
        return { success: true, results: { skipped: true } };
      }

      // Execute actions sequentially
      const actionResults = [];
      const actions = playbook.actions as PlaybookAction[];

      for (const action of actions) {
        try {
          const actionResult = await this.executeAction(action, objectId, context);
          actionResults.push({
            action: action.type,
            result: actionResult,
          });
        } catch (error) {
          this.logger.error(`Action failed: ${action.type}`, error.stack);
          actionResults.push({
            action: action.type,
            error: error.message,
          });
        }
      }

      // Handle SLA enforcement
      await this.handleSLAEnforcement(playbook.enforcements, objectId, context);

      const result = {
        success: true,
        results: {
          playbook: playbook.name,
          actionsExecuted: actionResults.length,
          actionResults,
        },
      };

      await this.completeExecution(executionId, result);
      
      this.logger.log(`Completed playbook execution: ${executionId}`);
      return result;

    } catch (error) {
      this.logger.error(`Playbook execution failed: ${executionId}`, error.stack);
      
      const result = {
        success: false,
        errors: [error.message],
      };

      await this.completeExecution(executionId, result, error);
      return result;
    }
  }

  private async createExecution(playbookId: string, objectId: string): Promise<string> {
    const execution = await this.prisma.playbookExecution.create({
      data: {
        playbookId,
        objectId,
        status: 'running',
      },
    });
    return execution.id;
  }

  private async completeExecution(
    executionId: string,
    result: ExecutionResult,
    error?: Error,
  ): Promise<void> {
    await this.prisma.playbookExecution.update({
      where: { id: executionId },
      data: {
        status: result.success ? 'completed' : 'failed',
        completedAt: new Date(),
        results: result.results ? JSON.parse(JSON.stringify(result.results)) : null,
        errors: error ? { message: error.message, stack: error.stack } : result.errors,
      },
    });
  }

  private async evaluateConditions(
    conditions: any,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<boolean> {
    if (!conditions || !conditions.rules) {
      return true; // No conditions means always execute
    }

    const object = await this.prisma.conciergeObject.findFirst({
      where: {
        id: objectId,
        organizationId: context.organizationId,
        propertyId: context.propertyId,
      },
      include: {
        attributes: true,
      },
    });

    if (!object) {
      return false;
    }

    // Evaluate each condition rule
    for (const rule of conditions.rules) {
      const ruleResult = await this.evaluateConditionRule(rule, object, context);
      
      // Handle logical operators
      if (conditions.operator === 'AND' && !ruleResult) {
        return false;
      } else if (conditions.operator === 'OR' && ruleResult) {
        return true;
      }
    }

    return conditions.operator === 'AND';
  }

  private async evaluateConditionRule(
    rule: any,
    object: any,
    context: PlaybookExecutionContext,
  ): Promise<boolean> {
    switch (rule.type) {
      case 'object_status':
        return this.evaluateStatusCondition(rule, object);
        
      case 'object_attribute':
        return this.evaluateAttributeCondition(rule, object);
        
      case 'time_condition':
        return this.evaluateTimeCondition(rule);
        
      case 'reservation_status':
        return await this.evaluateReservationCondition(rule, object, context);
        
      default:
        this.logger.warn(`Unknown condition type: ${rule.type}`);
        return true;
    }
  }

  private evaluateStatusCondition(rule: any, object: any): boolean {
    switch (rule.operator) {
      case 'equals':
        return object.status === rule.value;
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(object.status);
      case 'not_equals':
        return object.status !== rule.value;
      default:
        return false;
    }
  }

  private evaluateAttributeCondition(rule: any, object: any): boolean {
    const attribute = object.attributes.find((attr: any) => attr.fieldKey === rule.fieldKey);
    
    if (!attribute) {
      return rule.operator === 'is_empty';
    }

    const value = this.getAttributeValue(attribute);
    
    switch (rule.operator) {
      case 'equals':
        return value === rule.value;
      case 'contains':
        return typeof value === 'string' && value.includes(rule.value);
      case 'greater_than':
        return typeof value === 'number' && value > rule.value;
      case 'less_than':
        return typeof value === 'number' && value < rule.value;
      case 'is_empty':
        return value === null || value === undefined || value === '';
      default:
        return false;
    }
  }

  private evaluateTimeCondition(rule: any): boolean {
    const now = new Date();
    const timeValue = new Date(rule.value);
    
    switch (rule.operator) {
      case 'before':
        return now < timeValue;
      case 'after':
        return now > timeValue;
      case 'between':
        const start = new Date(rule.value.start);
        const end = new Date(rule.value.end);
        return now >= start && now <= end;
      default:
        return false;
    }
  }

  private async evaluateReservationCondition(
    rule: any,
    object: any,
    context: PlaybookExecutionContext,
  ): Promise<boolean> {
    if (!object.reservationId) {
      return false;
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: object.reservationId,
        propertyId: context.propertyId,
      },
    });

    if (!reservation) {
      return false;
    }

    switch (rule.operator) {
      case 'status_equals':
        return reservation.status === rule.value;
      case 'checkin_within':
        const hours = rule.value;
        const checkinTime = reservation.checkInDate.getTime();
        const now = new Date().getTime();
        return Math.abs(checkinTime - now) <= (hours * 60 * 60 * 1000);
      default:
        return false;
    }
  }

  private async executeAction(
    action: PlaybookAction,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<any> {
    this.logger.debug(`Executing action: ${action.type}`);

    switch (action.type) {
      case 'create_object':
        return await this.executeCreateObjectAction(action.config, context);
        
      case 'update_object_status':
        return await this.executeUpdateStatusAction(action.config, objectId, context);
        
      case 'set_due_date':
        return await this.executeSetDueDateAction(action.config, objectId, context);
        
      case 'assign_to_user':
        return await this.executeAssignUserAction(action.config, objectId, context);
        
      case 'create_task':
        return await this.executeCreateTaskAction(action.config, objectId, context);
        
      case 'send_notification':
        return await this.executeSendNotificationAction(action.config, objectId, context);
        
      case 'trigger_webhook':
        return await this.executeTriggerWebhookAction(action.config, objectId, context);
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeCreateObjectAction(config: any, context: PlaybookExecutionContext): Promise<any> {
    const objectData = {
      organizationId: context.organizationId,
      propertyId: context.propertyId,
      type: config.objectType,
      status: config.status || 'open',
      dueAt: config.dueAt ? new Date(config.dueAt) : null,
      reservationId: context.triggerData?.reservationId,
      guestId: context.triggerData?.guestId,
    };

    const createdObject = await this.prisma.conciergeObject.create({
      data: objectData,
    });

    // Create attributes if specified
    if (config.attributes && Array.isArray(config.attributes)) {
      const attributeData = config.attributes.map((attr: any) => ({
        objectId: createdObject.id,
        fieldKey: attr.fieldKey,
        fieldType: attr.fieldType,
        stringValue: attr.stringValue || null,
        numberValue: attr.numberValue || null,
        booleanValue: attr.booleanValue || null,
        dateValue: attr.dateValue ? new Date(attr.dateValue) : null,
        jsonValue: attr.jsonValue ? JSON.parse(JSON.stringify(attr.jsonValue)) : null,
        relationshipValue: attr.relationshipValue || null,
        selectValue: attr.selectValue || null,
        fileValue: attr.fileValue || null,
        moneyValue: attr.moneyValue || null,
        moneyCurrency: attr.moneyCurrency || null,
      }));

      await this.prisma.conciergeAttribute.createMany({
        data: attributeData,
      });
    }

    return { objectId: createdObject.id, type: createdObject.type };
  }

  private async executeUpdateStatusAction(
    config: any,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<any> {
    await this.prisma.conciergeObject.update({
      where: { id: objectId },
      data: { status: config.newStatus },
    });

    return { status: config.newStatus };
  }

  private async executeSetDueDateAction(
    config: any,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<any> {
    let dueDate: Date;

    if (config.relativeTime) {
      dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + config.relativeTime.hours || 0);
      dueDate.setMinutes(dueDate.getMinutes() + config.relativeTime.minutes || 0);
    } else {
      dueDate = new Date(config.absoluteTime);
    }

    await this.prisma.conciergeObject.update({
      where: { id: objectId },
      data: { dueAt: dueDate },
    });

    return { dueAt: dueDate };
  }

  private async executeAssignUserAction(
    config: any,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<any> {
    const assignments = {
      assignedUsers: Array.isArray(config.userIds) ? config.userIds : [config.userId],
      assignedAt: new Date().toISOString(),
      assignedBy: context.userId || 'system',
    };

    await this.prisma.conciergeObject.update({
      where: { id: objectId },
      data: { assignments: JSON.parse(JSON.stringify(assignments)) },
    });

    return { assignedUsers: assignments.assignedUsers };
  }

  private async executeCreateTaskAction(
    config: any,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<any> {
    const taskData = {
      propertyId: context.propertyId,
      title: config.title,
      description: config.description,
      taskType: config.taskType || 'OTHER',
      priority: config.priority || 'MEDIUM',
      assignedToId: config.assignedToId,
      departmentId: config.departmentId,
      relatedEntity: 'ConciergeObject',
      relatedId: objectId,
      dueDate: config.dueDate ? new Date(config.dueDate) : null,
      createdBy: context.userId || 'system',
    };

    const task = await this.prisma.task.create({
      data: taskData,
    });

    return { taskId: task.id, title: task.title };
  }

  private async executeSendNotificationAction(
    config: any,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<any> {
    // Emit notification event for external processing
    await this.eventBus.emit({
      type: 'concierge.notification.send',
      payload: {
        objectId,
        notificationType: config.type,
        recipients: config.recipients,
        title: config.title,
        message: config.message,
        data: config.data,
      },
      tenant: { organizationId: context.organizationId, propertyId: context.propertyId },
      correlationId: context.correlationId,
      timestamp: new Date().toISOString(),
    });

    return { notificationSent: true, recipients: config.recipients };
  }

  private async executeTriggerWebhookAction(
    config: any,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<any> {
    // Emit webhook event for external processing
    await this.eventBus.emit({
      type: 'concierge.webhook.trigger',
      payload: {
        objectId,
        webhookUrl: config.url,
        method: config.method || 'POST',
        headers: config.headers,
        payload: config.payload,
      },
      tenant: { organizationId: context.organizationId, propertyId: context.propertyId },
      correlationId: context.correlationId,
      timestamp: new Date().toISOString(),
    });

    return { webhookTriggered: true, url: config.url };
  }

  private async handleSLAEnforcement(
    enforcements: any,
    objectId: string,
    context: PlaybookExecutionContext,
  ): Promise<void> {
    if (!enforcements || !enforcements.sla) {
      return;
    }

    const sla = enforcements.sla;
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + sla.dueInHours || 24);

    // Update object with SLA due date if not already set
    await this.prisma.conciergeObject.updateMany({
      where: {
        id: objectId,
        dueAt: null,
      },
      data: {
        dueAt: dueDate,
      },
    });

    // Emit SLA tracking event
    await this.eventBus.emit({
      type: 'concierge.sla.started',
      payload: {
        objectId,
        dueAt: dueDate,
        escalationRules: sla.escalationRules,
      },
      tenant: { organizationId: context.organizationId, propertyId: context.propertyId },
      correlationId: context.correlationId,
      timestamp: new Date().toISOString(),
    });
  }

  private getAttributeValue(attribute: any): any {
    return (
      attribute.stringValue ||
      attribute.numberValue ||
      attribute.booleanValue ||
      attribute.dateValue ||
      attribute.relationshipValue ||
      attribute.selectValue ||
      attribute.fileValue ||
      attribute.moneyValue ||
      attribute.jsonValue
    );
  }

  /**
   * Retry failed playbook executions
   */
  async retryFailedExecution(
    executionId: string,
    maxRetries: number = 3,
  ): Promise<ExecutionResult> {
    const execution = await this.prisma.playbookExecution.findUnique({
      where: { id: executionId },
      include: {
        playbook: true,
        object: true,
      },
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts reached for execution ${executionId}`);
    }

    // Increment retry count
    await this.prisma.playbookExecution.update({
      where: { id: executionId },
      data: {
        retryCount: execution.retryCount + 1,
        status: 'pending',
      },
    });

    const context: PlaybookExecutionContext = {
      organizationId: execution.object.organizationId,
      propertyId: execution.object.propertyId,
      correlationId: `retry-${executionId}-${execution.retryCount + 1}`,
    };

    return await this.executePlaybook(execution.playbookId, execution.objectId, context);
  }

  /**
   * Get execution history for an object
   */
  async getExecutionHistory(
    objectId: string,
    context: { organizationId: string; propertyId: string },
  ): Promise<any[]> {
    return await this.prisma.playbookExecution.findMany({
      where: {
        objectId,
        object: {
          organizationId: context.organizationId,
          propertyId: context.propertyId,
        },
      },
      include: {
        playbook: {
          select: {
            id: true,
            name: true,
            trigger: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  /**
   * Test playbook execution with mock data (dry run)
   */
  async testPlaybook(
    testDto: any,
    context: PlaybookExecutionContext,
  ): Promise<ExecutionResult> {
    this.logger.log(`Testing playbook: ${testDto.playbookId}`);

    // Get playbook details
    const playbook = await this.prisma.playbook.findFirst({
      where: {
        id: testDto.playbookId,
        organizationId: context.organizationId,
        propertyId: context.propertyId,
        isActive: true,
      },
    });

    if (!playbook) {
      throw new Error(`Playbook ${testDto.playbookId} not found or inactive`);
    }

    // Create a mock execution record for testing (if not dry run)
    let executionId: string | null = null;
    if (!testDto.dryRun) {
      const execution = await this.prisma.playbookExecution.create({
        data: {
          playbookId: testDto.playbookId,
          objectId: 'test-object-' + Date.now(),
          status: 'running',
        },
      });
      executionId = execution.id;
    }

    try {
      const testResults = {
        playbook: {
          id: playbook.id,
          name: playbook.name,
          trigger: playbook.trigger,
          isActive: playbook.isActive,
        },
        testData: testDto.testData,
        dryRun: testDto.dryRun,
        validationResults: {},
        conditionEvaluation: null,
        actionSimulations: [],
      };

      // Validate conditions structure
      if (playbook.conditions) {
        testResults.validationResults = await this.validatePlaybookConditions(
          playbook.conditions,
          testDto.testData,
        );
      }

      // Evaluate conditions with test data
      if (playbook.conditions && testDto.testData) {
        testResults.conditionEvaluation = await this.simulateConditionEvaluation(
          playbook.conditions,
          testDto.testData,
          context,
        );
      }

      // Simulate actions execution
      if (playbook.actions) {
        const actions = playbook.actions as PlaybookAction[];
        for (const action of actions) {
          const simulation = await this.simulateActionExecution(
            action,
            testDto.testData,
            context,
          );
          testResults.actionSimulations.push({
            action: action.type,
            config: action.config,
            simulation,
          });
        }
      }

      // Complete test execution if not dry run
      if (executionId) {
        await this.prisma.playbookExecution.update({
          where: { id: executionId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            results: testResults,
          },
        });
      }

      return {
        success: true,
        results: testResults,
      };

    } catch (error) {
      this.logger.error(`Playbook test failed: ${testDto.playbookId}`, error.stack);
      
      // Update test execution if not dry run
      if (executionId) {
        await this.prisma.playbookExecution.update({
          where: { id: executionId },
          data: {
            status: 'failed',
            completedAt: new Date(),
            errors: { message: error.message, stack: error.stack },
          },
        });
      }

      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  private async validatePlaybookConditions(
    conditions: any,
    testData: any,
  ): Promise<any> {
    const validation = {
      structure: 'valid',
      issues: [] as string[],
      warnings: [] as string[],
    };

    if (!conditions.rules || !Array.isArray(conditions.rules)) {
      validation.issues.push('Conditions must have a rules array');
      validation.structure = 'invalid';
      return validation;
    }

    if (!conditions.operator || !['AND', 'OR'].includes(conditions.operator)) {
      validation.issues.push('Conditions must have operator AND or OR');
      validation.structure = 'invalid';
    }

    for (const rule of conditions.rules) {
      if (!rule.type) {
        validation.issues.push('Each rule must have a type');
      }
      
      if (!rule.operator) {
        validation.issues.push(`Rule of type ${rule.type} must have an operator`);
      }

      // Validate rule-specific requirements
      switch (rule.type) {
        case 'object_attribute':
          if (!rule.fieldKey) {
            validation.issues.push('object_attribute rule must have fieldKey');
          }
          break;
        case 'time_condition':
          if (!rule.value) {
            validation.issues.push('time_condition rule must have value');
          }
          break;
        case 'reservation_status':
          if (!testData?.reservationId) {
            validation.warnings.push('reservation_status rule requires reservationId in test data');
          }
          break;
      }
    }

    return validation;
  }

  private async simulateConditionEvaluation(
    conditions: any,
    testData: any,
    context: PlaybookExecutionContext,
  ): Promise<any> {
    const evaluation = {
      overallResult: false,
      operator: conditions.operator,
      ruleResults: [] as any[],
    };

    if (!conditions.rules || !Array.isArray(conditions.rules)) {
      return evaluation;
    }

    // Mock object for testing
    const mockObject = {
      id: 'test-object-' + Date.now(),
      type: testData.objectType || 'test',
      status: testData.status || 'open',
      organizationId: context.organizationId,
      propertyId: context.propertyId,
      attributes: testData.attributes || [],
      reservationId: testData.reservationId,
      guestId: testData.guestId,
    };

    for (const rule of conditions.rules) {
      try {
        const ruleResult = await this.evaluateConditionRule(rule, mockObject, context);
        evaluation.ruleResults.push({
          rule: rule.type,
          operator: rule.operator,
          expected: rule.value,
          result: ruleResult,
        });

        // Apply logical operator
        if (conditions.operator === 'AND') {
          evaluation.overallResult = evaluation.ruleResults.every(r => r.result);
        } else if (conditions.operator === 'OR') {
          evaluation.overallResult = evaluation.ruleResults.some(r => r.result);
        }
      } catch (error) {
        evaluation.ruleResults.push({
          rule: rule.type,
          operator: rule.operator,
          expected: rule.value,
          result: false,
          error: error.message,
        });
      }
    }

    return evaluation;
  }

  private async simulateActionExecution(
    action: PlaybookAction,
    testData: any,
    context: PlaybookExecutionContext,
  ): Promise<any> {
    const simulation = {
      actionType: action.type,
      wouldExecute: true,
      expectedResult: null as any,
      validation: [] as string[],
    };

    try {
      switch (action.type) {
        case 'create_object':
          simulation.expectedResult = {
            objectType: action.config.objectType,
            status: action.config.status || 'open',
            attributes: action.config.attributes?.length || 0,
          };
          if (!action.config.objectType) {
            simulation.validation.push('Missing objectType in configuration');
            simulation.wouldExecute = false;
          }
          break;

        case 'update_object_status':
          simulation.expectedResult = {
            newStatus: action.config.newStatus,
          };
          if (!action.config.newStatus) {
            simulation.validation.push('Missing newStatus in configuration');
            simulation.wouldExecute = false;
          }
          break;

        case 'assign_to_user':
          simulation.expectedResult = {
            assignedUsers: action.config.userIds || [action.config.userId],
          };
          if (!action.config.userId && !action.config.userIds) {
            simulation.validation.push('Missing userId or userIds in configuration');
            simulation.wouldExecute = false;
          }
          break;

        case 'create_task':
          simulation.expectedResult = {
            title: action.config.title,
            taskType: action.config.taskType || 'OTHER',
            priority: action.config.priority || 'MEDIUM',
          };
          if (!action.config.title) {
            simulation.validation.push('Missing title in task configuration');
            simulation.wouldExecute = false;
          }
          break;

        case 'send_notification':
          simulation.expectedResult = {
            recipients: action.config.recipients,
            type: action.config.type,
            title: action.config.title,
          };
          if (!action.config.recipients || !action.config.title) {
            simulation.validation.push('Missing recipients or title in notification configuration');
            simulation.wouldExecute = false;
          }
          break;

        default:
          simulation.validation.push(`Unknown action type: ${action.type}`);
          simulation.wouldExecute = false;
      }
    } catch (error) {
      simulation.validation.push(`Simulation error: ${error.message}`);
      simulation.wouldExecute = false;
    }

    return simulation;
  }
}