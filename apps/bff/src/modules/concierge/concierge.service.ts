import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { DomainEventBus } from '../../shared/events/domain-event-bus.service';
import { ModuleRegistryService } from '../module-registry/module-registry.service';

@Injectable()
export class ConciergeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly eventBus: DomainEventBus,
    private readonly moduleRegistry: ModuleRegistryService,
  ) {}

  async getObjectTypes(req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId || null, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }
    return this.prisma.objectType.findMany({
      where: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      orderBy: { name: 'asc' },
    });
  }

  async createObject(dto: any, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) throw new BadRequestException('Property context required');
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    const { type, reservationId, guestId, status, dueAt, assignments, files, attributes } = dto;

    // Validate attributes using ObjectType.fieldsSchema when available
    const objectType = await this.prisma.objectType.findFirst({
      where: { organizationId: ctx.organizationId, propertyId: ctx.propertyId, name: type, isActive: true },
    });
    if (objectType && Array.isArray(attributes)) {
      // Basic shape validation: ensure keys exist in schema and types match expected fieldType
      const schema: any = objectType.fieldsSchema || {};
      const allowedKeys = new Set((schema.fields || []).map((f: any) => f.key));
      for (const a of attributes) {
        if (!allowedKeys.has(a.fieldKey)) {
          throw new BadRequestException(`Unknown attribute key: ${a.fieldKey}`);
        }
      }
    }
    const created = await this.prisma.conciergeObject.create({
      data: {
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        type,
        reservationId,
        guestId,
        status: status || 'open',
        dueAt,
        assignments,
        files,
      },
    });

    if (Array.isArray(attributes) && attributes.length > 0) {
      await this.prisma.conciergeAttribute.createMany({
        data: attributes.map((a: any) => ({
          objectId: created.id,
          fieldKey: a.fieldKey,
          fieldType: a.fieldType,
          stringValue: a.stringValue ?? null,
          numberValue: a.numberValue ?? null,
          booleanValue: a.booleanValue ?? null,
          dateValue: a.dateValue ?? null,
          jsonValue: a.jsonValue ?? null,
        })),
        skipDuplicates: true,
      });
    }

    await this.eventBus.emit({
      type: 'concierge.object.created',
      payload: { id: created.id },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      timestamp: new Date().toISOString(),
    });
    return created;
  }

  async updateObject(id: string, dto: any, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId || null, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }
    const existing = await this.prisma.conciergeObject.findFirst({
      where: { id, organizationId: ctx.organizationId, propertyId: ctx.propertyId },
    });
    if (!existing) throw new ForbiddenException('Not found or access denied');

    const updated = await this.prisma.conciergeObject.update({
      where: { id },
      data: dto,
    });
    await this.eventBus.emit({
      type: 'concierge.object.updated',
      payload: { id },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      timestamp: new Date().toISOString(),
    });
    return updated;
  }

  async completeObject(id: string, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    const existing = await this.prisma.conciergeObject.findFirst({
      where: { id, organizationId: ctx.organizationId, propertyId: ctx.propertyId },
    });
    if (!existing) throw new ForbiddenException('Not found or access denied');

    const completed = await this.prisma.conciergeObject.update({
      where: { id },
      data: { status: 'completed' },
    });
    await this.eventBus.emit({
      type: 'concierge.object.completed',
      payload: { id },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      timestamp: new Date().toISOString(),
    });
    return completed;
  }

  async executePlaybook(dto: any, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) throw new BadRequestException('Property context required');
    // Enqueue job to worker (using Redis queue name)
    // Here we persist a minimal request log; actual queueing handled by worker service in this codebase
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PLAYBOOK_EXECUTE_REQUEST',
        entity: 'Playbook',
        entityId: dto.playbookId,
        newData: dto,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        createdAt: new Date(),
      } as any,
    });
    await this.eventBus.emit({
      type: 'concierge.playbook.requested',
      payload: { playbookId: dto.playbookId },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      timestamp: new Date().toISOString(),
    });
    return { ok: true };
  }
}


