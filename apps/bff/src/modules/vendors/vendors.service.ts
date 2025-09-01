import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { DomainEventBus } from '../../shared/events/domain-event-bus.service';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly eventBus: DomainEventBus,
    private readonly moduleRegistry: ModuleRegistryService,
  ) {}

  async getVendors(req: any, filters?: { category?: string; isActive?: boolean }) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for vendor operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'vendors'))) {
      throw new ForbiddenException('Vendors module not enabled for this property');
    }

    const where: any = {
      organizationId: ctx.organizationId,
      propertyId: ctx.propertyId,
    };

    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.vendor.findMany({
      where,
      include: {
        links: {
          where: { status: { notIn: ['expired', 'cancelled'] } },
          orderBy: { id: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            links: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getVendor(id: string, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for vendor operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'vendors'))) {
      throw new ForbiddenException('Vendors module not enabled for this property');
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
      },
      include: {
        links: {
          orderBy: { id: 'desc' },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async createVendor(dto: any, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for vendor operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'vendors'))) {
      throw new ForbiddenException('Vendors module not enabled for this property');
    }

    const { name, email, phone, category, policies, performance } = dto;

    const created = await this.prisma.vendor.create({
      data: {
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        name,
        email,
        phone,
        category,
        policies,
        performance,
        isActive: true,
      },
    });

    await this.eventBus.emit({
      type: 'vendor.created',
      payload: {
        id: created.id,
        name: created.name,
        category: created.category,
      },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      correlationId: `vendor-create-${created.id}`,
      timestamp: new Date().toISOString(),
    });

    return created;
  }

  async updateVendor(id: string, dto: any, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for vendor operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'vendors'))) {
      throw new ForbiddenException('Vendors module not enabled for this property');
    }

    const existing = await this.prisma.vendor.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: dto,
    });

    await this.eventBus.emit({
      type: 'vendor.updated',
      payload: {
        id: updated.id,
        changes: dto,
      },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      correlationId: `vendor-update-${id}`,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async createVendorLink(dto: any, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for vendor operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'vendors'))) {
      throw new ForbiddenException('Vendors module not enabled for this property');
    }

    const { vendorId, objectId, objectType, policyRef, expiresAt } = dto;

    // Validate vendor exists and belongs to the same tenant
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id: vendorId,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        isActive: true,
      },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor not found or inactive');
    }

    const created = await this.prisma.vendorLink.create({
      data: {
        vendorId,
        objectId,
        objectType,
        policyRef,
        status: 'pending',
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
      },
    });

    await this.eventBus.emit({
      type: 'vendor.link.created',
      payload: {
        id: created.id,
        vendorId,
        objectId,
        objectType,
      },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      correlationId: `vendor-link-${created.id}`,
      timestamp: new Date().toISOString(),
    });

    return created;
  }

  async confirmLink(id: string, dto: any, req?: any) {
    // This method can be called from portal (no req) or internal (with req)
    const link = await this.prisma.vendorLink.findFirst({
      where: { id },
      include: { vendor: true },
    });
    
    if (!link) {
      throw new NotFoundException('Vendor link not found');
    }

    // Check if link is expired
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new BadRequestException('Vendor link has expired');
    }

    // Check if already confirmed/declined
    if (['confirmed', 'declined', 'cancelled'].includes(link.status)) {
      throw new BadRequestException(`Link is already ${link.status}`);
    }

    // Validate action
    const validActions = ['confirm', 'decline'];
    if (!validActions.includes(dto.action)) {
      throw new BadRequestException('Invalid action. Must be "confirm" or "decline"');
    }

    const status = dto.action === 'confirm' ? 'confirmed' : 'declined';
    const notes = dto.notes || null;
    const estimatedCompletion = dto.estimatedCompletion ? new Date(dto.estimatedCompletion) : null;

    const updated = await this.prisma.vendorLink.update({
      where: { id },
      data: {
        status,
        confirmationAt: new Date(),
      },
    });

    // Log the confirmation
    await this.prisma.auditLog.create({
      data: {
        userId: req?.user?.id || 'vendor-portal',
        action: status.toUpperCase(),
        entity: 'VendorLink',
        entityId: id,
        newData: {
          action: dto.action,
          notes,
          estimatedCompletion,
          vendorName: link.vendor.name,
        },
        propertyId: link.vendor.propertyId,
      },
    });

    await this.eventBus.emit({
      type: `vendor.link.${status}`,
      payload: {
        id: updated.id,
        vendorId: link.vendorId,
        objectId: link.objectId,
        objectType: link.objectType,
        action: dto.action,
        notes,
        estimatedCompletion,
        vendorName: link.vendor.name,
      },
      tenant: { organizationId: link.vendor.organizationId, propertyId: link.vendor.propertyId },
      correlationId: `vendor-confirm-${id}`,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async validatePortalToken(token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const now = new Date();
    
    // Find valid token record and verify
    const record = await this.prisma.vendorPortalToken.findFirst({
      where: {
        expiresAt: { gt: now },
        usedAt: null,
      },
    });

    if (!record) {
      throw new BadRequestException('Token not found or expired');
    }

    // Verify the token hash
    const isValid = await argon2.verify(record.tokenHash, token);
    if (!isValid) {
      throw new BadRequestException('Invalid token');
    }

    // Get vendor link and vendor details for portal session
    const vendorLink = await this.prisma.vendorLink.findFirst({
      where: { id: record.linkId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            category: true,
          },
        },
      },
    });

    if (!vendorLink) {
      throw new BadRequestException('Associated vendor link not found');
    }

    // Mark token as used (one-time use)
    await this.prisma.vendorPortalToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });

    // Log portal access
    await this.prisma.auditLog.create({
      data: {
        userId: 'vendor-portal-access',
        action: 'PORTAL_ACCESS',
        entity: 'VendorPortalToken',
        entityId: record.id,
        newData: {
          vendorId: record.vendorId,
          linkId: record.linkId,
          accessedAt: now.toISOString(),
        },
        propertyId: record.propertyId,
      },
    });

    // Return portal session data
    return {
      success: true,
      session: {
        tokenId: record.id,
        vendorId: record.vendorId,
        organizationId: record.organizationId,
        propertyId: record.propertyId,
        linkId: record.linkId,
        vendor: vendorLink.vendor,
        link: {
          id: vendorLink.id,
          objectId: vendorLink.objectId,
          objectType: vendorLink.objectType,
          policyRef: vendorLink.policyRef,
          status: vendorLink.status,
          expiresAt: vendorLink.expiresAt,
        },
        scopes: ['vendors.links.confirm.property'],
        expiresAt: record.expiresAt,
        sessionDuration: 24 * 60 * 60, // 24 hours in seconds
      },
    };
  }

  async createPortalToken(linkId: string, req: any, ttlHours = 48) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for vendor operations');
    }

    // Validate the vendor link exists and get vendor info
    const vendorLink = await this.prisma.vendorLink.findFirst({
      where: {
        id: linkId,
      },
      include: {
        vendor: true,
      },
    });

    if (!vendorLink) {
      throw new BadRequestException('Vendor link not found');
    }

    // Validate vendor belongs to tenant
    if (vendorLink.vendor.organizationId !== ctx.organizationId || vendorLink.vendor.propertyId !== ctx.propertyId || !vendorLink.vendor.isActive) {
      throw new BadRequestException('Vendor link not found or vendor inactive');
    }

    // Check if link is already expired or processed
    if (vendorLink.expiresAt && vendorLink.expiresAt < new Date()) {
      throw new BadRequestException('Vendor link has expired');
    }

    if (['confirmed', 'declined', 'cancelled'].includes(vendorLink.status)) {
      throw new BadRequestException(`Link is already ${vendorLink.status}`);
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(48).toString('base64url');
    const tokenHash = await argon2.hash(rawToken);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    // Clean up any existing unexpired tokens for this link
    await this.prisma.vendorPortalToken.deleteMany({
      where: {
        linkId,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    // Create new portal token
    const created = await this.prisma.vendorPortalToken.create({
      data: {
        vendorId: vendorLink.vendorId,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        linkId,
        tokenHash,
        expiresAt,
        metadata: {
          createdBy: ctx.userId,
          vendorName: vendorLink.vendor.name,
          objectType: vendorLink.objectType,
          objectId: vendorLink.objectId,
        },
      },
    });

    // Log token creation
    await this.prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        action: 'PORTAL_TOKEN_CREATED',
        entity: 'VendorPortalToken',
        entityId: created.id,
        newData: {
          vendorId: vendorLink.vendorId,
          linkId,
          expiresAt: expiresAt.toISOString(),
          vendorName: vendorLink.vendor.name,
        },
        propertyId: ctx.propertyId,
      },
    });

    await this.eventBus.emit({
      type: 'vendor.portal.token.created',
      payload: {
        tokenId: created.id,
        vendorId: vendorLink.vendorId,
        linkId,
        vendorName: vendorLink.vendor.name,
        vendorEmail: vendorLink.vendor.email,
        expiresAt: expiresAt.toISOString(),
      },
      tenant: { organizationId: ctx.organizationId, propertyId: ctx.propertyId },
      correlationId: `portal-token-${created.id}`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      token: rawToken,
      expiresAt,
      portalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/vendor-portal/${rawToken}`,
      vendor: {
        id: vendorLink.vendor.id,
        name: vendorLink.vendor.name,
        email: vendorLink.vendor.email,
      },
      link: {
        id: vendorLink.id,
        objectType: vendorLink.objectType,
        objectId: vendorLink.objectId,
      },
    };
  }

  async sendPortalNotification(linkId: string, channel: 'email' | 'sms' | 'whatsapp', req: any) {
    const portalData = await this.createPortalToken(linkId, req, 48);

    // Emit notification event for worker processing
    await this.eventBus.emit({
      type: 'vendor.portal.notification.requested',
      payload: {
        channel,
        vendorId: portalData.vendor.id,
        vendorName: portalData.vendor.name,
        vendorEmail: portalData.vendor.email,
        portalUrl: portalData.portalUrl,
        linkId,
        expiresAt: portalData.expiresAt.toISOString(),
      },
      tenant: { organizationId: req.user?.organizationId, propertyId: req.user?.propertyId },
      correlationId: `vendor-notification-${linkId}-${channel}`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `${channel.toUpperCase()} notification queued for ${portalData.vendor.name}`,
      portalUrl: portalData.portalUrl,
      expiresAt: portalData.expiresAt,
    };
  }

  async findExpiringLinks(): Promise<any[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.vendorLink.findMany({
      where: {
        status: 'pending',
        expiresAt: {
          lte: tomorrow,
          gte: new Date(),
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async getVendorLinks(req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for vendor operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'vendors'))) {
      throw new ForbiddenException('Vendors module not enabled for this property');
    }

    return this.prisma.vendorLink.findMany({
      where: {
        vendor: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId
        }
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            category: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { confirmationAt: 'desc' }
    });
  }
}

// DTOs for better type safety
export interface CreateVendorDto {
  name: string;
  email?: string;
  phone?: string;
  category: string;
  policies?: any;
  performance?: any;
}

export interface UpdateVendorDto {
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  policies?: any;
  performance?: any;
  isActive?: boolean;
}

export interface CreateVendorLinkDto {
  vendorId: string;
  objectId: string;
  objectType: string;
  policyRef?: string;
  expiresAt?: string;
}

export interface ConfirmLinkDto {
  action: 'confirm' | 'decline';
  notes?: string;
  estimatedCompletion?: string;
}

export interface SendPortalNotificationDto {
  channel: 'email' | 'sms' | 'whatsapp';
}
