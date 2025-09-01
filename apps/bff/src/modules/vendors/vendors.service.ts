import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import * as crypto from 'crypto';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async confirmLink(id: string, dto: any, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    const link = await this.prisma.vendorLink.findFirst({
      where: { id },
      include: { vendor: true },
    });
    if (!link) throw new BadRequestException('Vendor link not found');

    // Update status based on dto.action (confirm/decline)
    const status = dto?.action === 'confirm' ? 'confirmed' : dto?.action === 'decline' ? 'declined' : null;
    if (!status) throw new BadRequestException('Invalid action');

    return this.prisma.vendorLink.update({
      where: { id },
      data: {
        status,
        confirmationAt: new Date(),
      },
    });
  }

  async validatePortalToken(token: string) {
    if (!token) throw new BadRequestException('Invalid token');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const record = await this.prisma.vendorPortalToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
    });
    if (!record) throw new BadRequestException('Token invalid or expired');

    // Mark as used (one-time)
    await this.prisma.vendorPortalToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });

    // Return a lightweight session payload (JWT issuance to be implemented)
    return {
      session: {
        vendorId: record.vendorId,
        organizationId: record.organizationId,
        propertyId: record.propertyId,
        scopes: ['vendors.links.confirm.property'],
        expiresIn: 15 * 60,
      },
    };
  }

  async createPortalLink(linkId: string, vendorId: string, organizationId: string, propertyId: string, ttlMinutes = 1440) {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.vendorPortalToken.create({
      data: { vendorId, organizationId, propertyId, linkId, tokenHash, expiresAt },
    });

    return { token: rawToken, expiresAt };
  }
}


