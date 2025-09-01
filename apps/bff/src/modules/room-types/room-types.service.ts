import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { TenantQueryHelper } from '../../shared/tenant/tenant-query.helper';
import { User, Role } from '@prisma/client';

@Injectable()
export class RoomTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: any, currentUser: User) {
    // Basic validation
    if (!dto.name) {
      throw new BadRequestException('Room type name is required');
    }

    const dataWithTenant = TenantQueryHelper.ensureTenantContext(
      {
        name: dto.name,
        code: dto.code || dto.name.toLowerCase().replace(/\s+/g, '-'),
        baseRate: dto.baseRate ?? 0,
        maxCapacity: dto.maxCapacity ?? 2,
        amenities: Array.isArray(dto.amenities) ? dto.amenities : [],
        isActive: dto.isActive ?? true,
      },
      this.tenantContext,
      { scope: 'property' },
    );

    // Unique per property
    const exists = await this.prisma.roomType.findFirst({
      where: {
        propertyId: (this.tenantContext.getTenantContext() as any).propertyId,
        code: dataWithTenant.code,
      },
    });
    if (exists) {
      throw new BadRequestException('Room type code already exists for this property');
    }

    return this.prisma.roomType.create({ data: dataWithTenant });
  }

  async findAll(currentUser: User) {
    const query = TenantQueryHelper.createSafeQuery(
      { where: { isActive: true }, orderBy: { name: 'asc' } },
      this.tenantContext,
      { scope: 'property', resourceType: 'generic' },
    );
    return this.prisma.roomType.findMany(query);
  }

  async update(id: string, dto: any, currentUser: User) {
    // Ensure belongs to tenant
    const rt = await this.prisma.roomType.findUnique({ where: { id } });
    if (!rt) throw new NotFoundException('Room type not found');
    TenantQueryHelper.validateTenantOwnership(rt, this.tenantContext);

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.baseRate !== undefined) data.baseRate = dto.baseRate;
    if (dto.maxCapacity !== undefined) data.maxCapacity = dto.maxCapacity;
    if (dto.amenities !== undefined) data.amenities = Array.isArray(dto.amenities) ? dto.amenities : [];
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.roomType.update({ where: { id }, data });
  }

  async remove(id: string, currentUser: User) {
    const rt = await this.prisma.roomType.findUnique({ where: { id } });
    if (!rt) throw new NotFoundException('Room type not found');
    TenantQueryHelper.validateTenantOwnership(rt, this.tenantContext);
    return this.prisma.roomType.update({ where: { id }, data: { isActive: false } });
  }
}


