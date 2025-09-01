import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { DomainEventBus } from '../../shared/events/domain-event-bus.service';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import { CreateConciergeObjectDto } from './dto/create-concierge-object.dto';
import { UpdateConciergeObjectDto } from './dto/update-concierge-object.dto';
import { ExecutePlaybookDto } from './dto/execute-playbook.dto';

@Injectable()
export class ConciergeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly eventBus: DomainEventBus,
    private readonly moduleRegistry: ModuleRegistryService,
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

  async getObjectTypes(req: any) {
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
        isActive: true 
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
      await this.validateAttributes(attributes, objectType);
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
        await this.validateAttributes(attributes, objectType);
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

}


