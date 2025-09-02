import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { DomainEventBus } from '../../shared/events/domain-event-bus.service';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import { CreateConciergeObjectDto } from './dto/create-concierge-object.dto';
import { UpdateConciergeObjectDto } from './dto/update-concierge-object.dto';
import { ExecutePlaybookDto } from './dto/execute-playbook.dto';
import { BulkCreateObjectsDto, ObjectTimelineDto } from './dto/relationship-search.dto';
import { FieldValidationService } from './services/field-validation.service';
import { PlaybookExecutionService } from './services/playbook-execution.service';

@Injectable()
export class ConciergeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly eventBus: DomainEventBus,
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly fieldValidation: FieldValidationService,
    private readonly playbookExecution: PlaybookExecutionService,
  ) {}

  async getStats(req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    const [totalObjects, activeObjects, completedObjects, overdueObjects] = await Promise.all([
      this.prisma.conciergeObject.count({
        where: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          deletedAt: null
        }
      }),
      this.prisma.conciergeObject.count({
        where: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          status: { in: ['open', 'in_progress'] },
          deletedAt: null
        }
      }),
      this.prisma.conciergeObject.count({
        where: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          status: 'completed',
          deletedAt: null
        }
      }),
      this.prisma.conciergeObject.count({
        where: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          status: { in: ['open', 'in_progress'] },
          dueAt: { lt: new Date() },
          deletedAt: null
        }
      })
    ]);

    return {
      totalObjects,
      activeObjects,
      completedObjects,
      overdueObjects,
      completionRate: totalObjects > 0 ? Math.round((completedObjects / totalObjects) * 100) : 0
    };
  }

  async getObjectTypes(req: any, includeTemplates: boolean = false) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }
    return this.prisma.objectType.findMany({
      where: { 
        organizationId: ctx.organizationId, 
        propertyId: ctx.propertyId,
        isActive: true,
        ...(includeTemplates ? {} : { isTemplate: false }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            isTemplate: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            isTemplate: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getConciergeObjects(req: any, filters?: { type?: string; status?: string; reservationId?: string; guestId?: string }) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    const where: any = {
      organizationId: ctx.organizationId,
      propertyId: ctx.propertyId,
      deletedAt: null,
    };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.reservationId) where.reservationId = filters.reservationId;
    if (filters?.guestId) where.guestId = filters.guestId;

    return this.prisma.conciergeObject.findMany({
      where,
      include: {
        attributes: true,
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getConciergeObject(id: string, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    const object = await this.prisma.conciergeObject.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        deletedAt: null,
      },
      include: {
        attributes: true,
      },
    });

    if (!object) {
      throw new NotFoundException('Concierge object not found');
    }

    return object;
  }

  async createObject(dto: CreateConciergeObjectDto, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    const { type, reservationId, guestId, status, dueAt, assignments, files, attributes } = dto;

    // Validate attributes using ObjectType.fieldsSchema when available
    const objectType = await this.prisma.objectType.findFirst({
      where: { organizationId: ctx.organizationId, propertyId: ctx.propertyId, name: type, isActive: true },
    });
    
    if (objectType && Array.isArray(attributes)) {
      const validationResult = await this.fieldValidation.validateObjectAttributes(
        attributes, 
        objectType, 
        { organizationId: ctx.organizationId, propertyId: ctx.propertyId, userId: ctx.userId }
      );
      
      if (!validationResult.isValid) {
        throw new BadRequestException(`Validation failed: ${validationResult.errors.join(', ')}`);
      }
    }

    // Use Prisma transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      const created = await tx.conciergeObject.create({
        data: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          type,
          reservationId,
          guestId,
          status: status || 'open',
          dueAt: dueAt ? new Date(dueAt) : null,
          assignments: assignments as any,
          files: files as any,
        },
      });

      if (Array.isArray(attributes) && attributes.length > 0) {
        await tx.conciergeAttribute.createMany({
          data: attributes.map((attr) => ({
            objectId: created.id,
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
            quantityUnit: attr.quantityUnit || null,
            moneyValue: attr.moneyValue || null,
            moneyCurrency: attr.moneyCurrency || 'USD',
          })),
        });
      }

      return created;
    });

    await this.eventBus.emit({
      type: 'concierge.object.created',
      payload: { 
        id: result.id,
        type: result.type,
        status: result.status,
        dueAt: result.dueAt,
        reservationId: result.reservationId,
        guestId: result.guestId
      },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      correlationId: `concierge-create-${result.id}`,
      timestamp: new Date().toISOString(),
    });

    return this.getConciergeObject(result.id, req);
  }

  async updateObject(id: string, dto: UpdateConciergeObjectDto, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    const existing = await this.prisma.conciergeObject.findFirst({
      where: { 
        id, 
        organizationId: ctx.organizationId, 
        propertyId: ctx.propertyId,
        deletedAt: null 
      },
      include: { attributes: true },
    });
    
    if (!existing) {
      throw new NotFoundException('Concierge object not found');
    }

    const { attributes, ...updateData } = dto;

    // Validate new attributes if provided
    if (attributes) {
      const objectType = await this.prisma.objectType.findFirst({
        where: { organizationId: ctx.organizationId, propertyId: ctx.propertyId, name: existing.type, isActive: true },
      });
      
      if (objectType) {
        const validationResult = await this.fieldValidation.validateObjectAttributes(
          attributes, 
          objectType, 
          { organizationId: ctx.organizationId, propertyId: ctx.propertyId, userId: ctx.userId }
        );
        
        if (!validationResult.isValid) {
          throw new BadRequestException(`Validation failed: ${validationResult.errors.join(', ')}`);
        }
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update the main object
      const updated = await tx.conciergeObject.update({
        where: { id },
        data: {
          ...updateData,
          dueAt: updateData.dueAt ? new Date(updateData.dueAt) : undefined,
          assignments: updateData.assignments as any,
          files: updateData.files as any,
        },
      });

      // Update attributes if provided
      if (attributes) {
        // Delete existing attributes
        await tx.conciergeAttribute.deleteMany({
          where: { objectId: id },
        });

        // Create new attributes
        if (attributes.length > 0) {
          await tx.conciergeAttribute.createMany({
            data: attributes.map((attr) => ({
              objectId: id,
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
              quantityUnit: attr.quantityUnit || null,
              moneyValue: attr.moneyValue || null,
              moneyCurrency: attr.moneyCurrency || 'USD',
            })),
          });
        }
      }

      return updated;
    });

    await this.eventBus.emit({
      type: 'concierge.object.updated',
      payload: { 
        id,
        changes: updateData,
        attributesUpdated: !!attributes
      },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      correlationId: `concierge-update-${id}`,
      timestamp: new Date().toISOString(),
    });

    return this.getConciergeObject(id, req);
  }

  async completeObject(id: string, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    
    const existing = await this.prisma.conciergeObject.findFirst({
      where: { 
        id, 
        organizationId: ctx.organizationId, 
        propertyId: ctx.propertyId,
        deletedAt: null
      },
    });
    
    if (!existing) {
      throw new NotFoundException('Concierge object not found');
    }

    if (existing.status === 'completed') {
      throw new BadRequestException('Object is already completed');
    }

    const completed = await this.prisma.conciergeObject.update({
      where: { id },
      data: { 
        status: 'completed',
        updatedAt: new Date()
      },
    });

    await this.eventBus.emit({
      type: 'concierge.object.completed',
      payload: { 
        id,
        type: existing.type,
        reservationId: existing.reservationId,
        guestId: existing.guestId,
        completedAt: new Date().toISOString()
      },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      correlationId: `concierge-complete-${id}`,
      timestamp: new Date().toISOString(),
    });

    // Trigger any dependent playbooks
    await this.triggerCompletionPlaybooks(existing, ctx);

    return completed;
  }

  async executePlaybook(dto: ExecutePlaybookDto, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    // Validate playbook exists and is active
    const playbook = await this.prisma.playbook.findFirst({
      where: {
        id: dto.playbookId,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        isActive: true,
      },
    });

    if (!playbook) {
      throw new NotFoundException('Playbook not found or inactive');
    }

    // Validate trigger matches
    if (playbook.trigger !== dto.trigger) {
      throw new BadRequestException(`Playbook trigger mismatch. Expected: ${playbook.trigger}, Got: ${dto.trigger}`);
    }

    // Log the execution request
    await this.prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        action: 'PLAYBOOK_EXECUTE_REQUEST',
        entity: 'Playbook',
        entityId: dto.playbookId,
        newData: {
          trigger: dto.trigger,
          triggerData: dto.triggerData ? JSON.parse(JSON.stringify(dto.triggerData)) : null,
          playbookName: playbook.name,
        },
        propertyId: ctx.propertyId,
      },
    });

    // Emit event for worker processing
    await this.eventBus.emit({
      type: 'concierge.playbook.execution.requested',
      payload: {
        playbookId: dto.playbookId,
        playbookName: playbook.name,
        trigger: dto.trigger,
        triggerData: dto.triggerData,
        actions: playbook.actions,
        conditions: playbook.conditions,
        enforcements: playbook.enforcements,
      },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      correlationId: `playbook-exec-${dto.playbookId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      playbookId: dto.playbookId,
      playbookName: playbook.name,
      message: 'Playbook execution request queued successfully',
    };
  }

  /**
   * Get object type by ID with hierarchy information
   */
  async getObjectTypeById(req: any, id: string) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }

    const objectType = await this.prisma.objectType.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            isTemplate: true,
            fieldsSchema: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            isTemplate: true,
          },
        },
      },
    });

    if (!objectType) {
      throw new NotFoundException('Object type not found');
    }

    return objectType;
  }

  private async validateAttributes(attributes: any[], objectType: any): Promise<void> {
    const schema: any = objectType.fieldsSchema || {};
    const schemaFields = schema.fields || [];
    const allowedKeys = new Set(schemaFields.map((f: any) => f.key));
    const requiredKeys = new Set(schemaFields.filter((f: any) => f.required).map((f: any) => f.key));
    const fieldTypeMap = new Map(schemaFields.map((f: any) => [f.key, f.type]));

    // Check for unknown keys
    for (const attr of attributes) {
      if (!allowedKeys.has(attr.fieldKey)) {
        throw new BadRequestException(`Unknown attribute key: ${attr.fieldKey}`);
      }

      // Validate field type consistency
      const expectedType = fieldTypeMap.get(attr.fieldKey);
      if (expectedType && expectedType !== attr.fieldType) {
        throw new BadRequestException(
          `Attribute '${attr.fieldKey}' type mismatch. Expected: ${expectedType}, Got: ${attr.fieldType}`
        );
      }

      // Validate that exactly one value field is set
      const valueFields = [attr.stringValue, attr.numberValue, attr.booleanValue, attr.dateValue, attr.jsonValue];
      const setValues = valueFields.filter(v => v !== null && v !== undefined);
      if (setValues.length !== 1) {
        throw new BadRequestException(
          `Attribute '${attr.fieldKey}' must have exactly one value field set`
        );
      }
    }

    // Check for missing required keys
    const providedKeys = new Set(attributes.map(a => a.fieldKey));
    const requiredKeysList = Array.from(requiredKeys);
    for (const requiredKey of requiredKeysList) {
      if (!providedKeys.has(requiredKey)) {
        throw new BadRequestException(`Required attribute '${requiredKey}' is missing`);
      }
    }
  }

  private async triggerCompletionPlaybooks(completedObject: any, ctx: any): Promise<void> {
    // Find playbooks that trigger on object completion
    const playbooks = await this.prisma.playbook.findMany({
      where: {
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        trigger: 'concierge.object.completed',
        isActive: true,
      },
    });

    for (const playbook of playbooks) {
      // Emit playbook execution event
      await this.eventBus.emit({
        type: 'concierge.playbook.execution.requested',
        payload: {
          playbookId: playbook.id,
          playbookName: playbook.name,
          trigger: 'concierge.object.completed',
          triggerData: {
            completedObjectId: completedObject.id,
            completedObjectType: completedObject.type,
            reservationId: completedObject.reservationId,
            guestId: completedObject.guestId,
          },
          actions: playbook.actions,
          conditions: playbook.conditions,
          enforcements: playbook.enforcements,
        },
        tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
        correlationId: `auto-playbook-${playbook.id}-${completedObject.id}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async findOverdueObjects(): Promise<any[]> {
    const now = new Date();
    return this.prisma.conciergeObject.findMany({
      where: {
        dueAt: {
          lte: now,
        },
        status: {
          notIn: ['completed', 'cancelled'],
        },
        deletedAt: null,
      },
      include: {
        attributes: true,
      },
      orderBy: {
        dueAt: 'asc',
      },
    });
  }

  /**
   * Bulk create multiple concierge objects from a template
   */
  async bulkCreateObjects(dto: BulkCreateObjectsDto, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    if (dto.count > 50) {
      throw new BadRequestException('Cannot create more than 50 objects at once');
    }

    // Get template if provided
    let template;
    if (dto.templateId) {
      template = await this.prisma.objectType.findFirst({
        where: {
          id: dto.templateId,
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          isTemplate: true,
          isActive: true,
        },
      });

      if (!template) {
        throw new NotFoundException('Template not found');
      }
    }

    const createdObjects = [];
    
    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < dto.count; i++) {
        // Create base object
        const objectData = {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          type: dto.objectType,
          status: 'open',
          reservationId: dto.reservationId,
          guestId: dto.guestId,
          assignments: dto.assignments as any,
        };

        const createdObject = await tx.conciergeObject.create({
          data: objectData,
        });

        // Add default attributes from template or provided defaults
        if (template && template.fieldsSchema) {
          const schema = template.fieldsSchema as any;
          const templateFields = schema.fields || [];
          
          const attributeData = templateFields.map((field: any) => {
            const defaultValue = dto.defaultAttributes?.[field.key] || field.defaultValue;
            
            return {
              objectId: createdObject.id,
              fieldKey: field.key,
              fieldType: field.type,
              stringValue: field.type === 'string' ? defaultValue : null,
              numberValue: field.type === 'number' ? defaultValue : null,
              booleanValue: field.type === 'boolean' ? defaultValue : null,
              dateValue: field.type === 'date' ? (defaultValue ? new Date(defaultValue) : null) : null,
              relationshipValue: field.type === 'relationship' ? defaultValue : null,
              selectValue: field.type === 'select' ? defaultValue : null,
              fileValue: field.type === 'file' ? defaultValue : null,
              moneyValue: field.type === 'money' ? defaultValue : null,
              moneyCurrency: field.type === 'money' ? (dto.defaultAttributes?.[`${field.key}_currency`] || 'USD') : null,
            };
          }).filter((attr: any) => 
            attr.stringValue !== null || attr.numberValue !== null || 
            attr.booleanValue !== null || attr.dateValue !== null ||
            attr.relationshipValue !== null || attr.selectValue !== null ||
            attr.fileValue !== null || attr.moneyValue !== null
          );

          if (attributeData.length > 0) {
            await tx.conciergeAttribute.createMany({
              data: attributeData,
            });
          }
        }

        createdObjects.push({
          id: createdObject.id,
          type: createdObject.type,
          index: i + 1,
        });
      }
    });

    // Emit bulk creation event
    await this.eventBus.emit({
      type: 'concierge.objects.bulk.created',
      payload: {
        count: dto.count,
        objectType: dto.objectType,
        templateId: dto.templateId,
        reservationId: dto.reservationId,
        guestId: dto.guestId,
        objectIds: createdObjects.map(obj => obj.id),
      },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      correlationId: `bulk-create-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      created: createdObjects.length,
      objects: createdObjects,
    };
  }

  /**
   * Get timeline of events for a specific object
   */
  async getObjectTimeline(id: string, timelineDto: ObjectTimelineDto, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }

    // Verify object exists and is accessible
    const object = await this.getConciergeObject(id, req);

    const limit = Math.min(timelineDto.limit || 50, 100);
    const offset = timelineDto.offset || 0;

    // Build timeline from multiple sources
    const timelineEvents = [];

    // 1. Audit logs for this object
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entity: 'ConciergeObject',
        entityId: id,
        propertyId: ctx.propertyId,
        ...(timelineDto.startDate && { createdAt: { gte: new Date(timelineDto.startDate) } }),
        ...(timelineDto.endDate && { createdAt: { lte: new Date(timelineDto.endDate) } }),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    timelineEvents.push(...auditLogs.map(log => ({
      id: log.id,
      type: 'audit',
      action: log.action,
      timestamp: log.createdAt,
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      data: {
        oldData: log.oldData,
        newData: log.newData,
      },
      metadata: {
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      },
    })));

    // 2. Playbook executions
    const executions = await this.prisma.playbookExecution.findMany({
      where: {
        objectId: id,
        object: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
        },
        ...(timelineDto.startDate && { startedAt: { gte: new Date(timelineDto.startDate) } }),
        ...(timelineDto.endDate && { startedAt: { lte: new Date(timelineDto.endDate) } }),
      },
      include: {
        playbook: {
          select: {
            name: true,
            trigger: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    timelineEvents.push(...executions.map(exec => ({
      id: exec.id,
      type: 'playbook_execution',
      action: `Playbook: ${exec.playbook.name}`,
      timestamp: exec.startedAt,
      user: 'System',
      data: {
        status: exec.status,
        trigger: exec.playbook.trigger,
        results: exec.results,
        errors: exec.errors,
        retryCount: exec.retryCount,
      },
      metadata: {
        playbookId: exec.playbookId,
        completedAt: exec.completedAt,
      },
    })));

    // 3. Related tasks if object is linked to tasks
    const relatedTasks = await this.prisma.task.findMany({
      where: {
        relatedEntity: 'ConciergeObject',
        relatedId: id,
        propertyId: ctx.propertyId,
        ...(timelineDto.startDate && { createdAt: { gte: new Date(timelineDto.startDate) } }),
        ...(timelineDto.endDate && { createdAt: { lte: new Date(timelineDto.endDate) } }),
      },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    timelineEvents.push(...relatedTasks.map(task => ({
      id: task.id,
      type: 'task',
      action: `Task ${task.status}: ${task.title}`,
      timestamp: task.createdAt,
      user: task.createdByUser ? `${task.createdByUser.firstName} ${task.createdByUser.lastName}` : 'System',
      data: {
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : null,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
      },
      metadata: {
        taskId: task.id,
      },
    })));

    // Sort all events by timestamp
    timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by event type if specified
    const filteredEvents = timelineDto.eventType 
      ? timelineEvents.filter(event => event.type === timelineDto.eventType)
      : timelineEvents;

    // Apply pagination
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return {
      object: {
        id: object.id,
        type: object.type,
        status: object.status,
        dueAt: object.dueAt,
        createdAt: object.createdAt,
        updatedAt: object.updatedAt,
      },
      timeline: paginatedEvents,
      pagination: {
        total: filteredEvents.length,
        limit,
        offset,
        hasMore: offset + limit < filteredEvents.length,
      },
    };
  }

  /**
   * Create a new object type (can be template or regular)
   */
  async createObjectType(req: any, data: {
    name: string;
    fieldsSchema: any;
    validations?: any;
    uiHints?: any;
    isTemplate?: boolean;
    parentId?: string;
    templateMetadata?: any;
  }) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    // Check for name uniqueness
    const existing = await this.prisma.objectType.findFirst({
      where: {
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        name: data.name,
      },
    });

    if (existing) {
      throw new BadRequestException(`Object type with name '${data.name}' already exists`);
    }

    // Validate parent hierarchy if parentId provided
    if (data.parentId) {
      const parent = await this.prisma.objectType.findFirst({
        where: {
          id: data.parentId,
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          isActive: true,
        },
      });

      if (!parent) {
        throw new BadRequestException('Parent object type not found');
      }
    }

    return this.prisma.objectType.create({
      data: {
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        name: data.name,
        fieldsSchema: data.fieldsSchema,
        validations: data.validations,
        uiHints: data.uiHints,
        isActive: true,
        isTemplate: data.isTemplate || false,
        parentId: data.parentId,
        templateMetadata: data.templateMetadata,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            isTemplate: true,
          },
        },
      },
    });
  }

  /**
   * Update an object type
   */
  async updateObjectType(req: any, id: string, data: {
    name?: string;
    fieldsSchema?: any;
    validations?: any;
    uiHints?: any;
    isActive?: boolean;
    templateMetadata?: any;
  }) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }

    const existing = await this.prisma.objectType.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Object type not found');
    }

    // Check name uniqueness if name is being updated
    if (data.name && data.name !== existing.name) {
      const nameConflict = await this.prisma.objectType.findFirst({
        where: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          name: data.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new BadRequestException(`Object type with name '${data.name}' already exists`);
      }
    }

    return this.prisma.objectType.update({
      where: { id },
      data,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            isTemplate: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            isTemplate: true,
          },
        },
      },
    });
  }

  /**
   * Delete an object type (soft delete)
   */
  async deleteObjectType(req: any, id: string) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for concierge operations');
    }

    const existing = await this.prisma.objectType.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
      },
      include: {
        children: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Object type not found');
    }

    // Check if there are any concierge objects using this type
    const objectsUsing = await this.prisma.conciergeObject.count({
      where: {
        type: existing.name,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        deletedAt: null,
      },
    });

    if (objectsUsing > 0) {
      throw new BadRequestException(
        `Cannot delete object type '${existing.name}' because it is being used by ${objectsUsing} concierge objects`
      );
    }

    // Check if there are child object types
    if (existing.children.length > 0) {
      throw new BadRequestException(
        `Cannot delete object type '${existing.name}' because it has ${existing.children.length} child object types`
      );
    }

    return this.prisma.objectType.update({
      where: { id },
      data: {
        isActive: false,
        // Add timestamp for soft delete tracking
        templateMetadata: {
          ...(existing.templateMetadata as any),
          deletedAt: new Date().toISOString(),
        },
      },
    });
  }

}


