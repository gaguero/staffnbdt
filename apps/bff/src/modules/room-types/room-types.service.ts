import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class RoomTypesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: any, currentUser: User) {
    // Basic validation
    if (!dto.name) {
      throw new BadRequestException('Room type name is required');
    }
    const organizationId = (currentUser as any).organizationId;
    const propertyId = (currentUser as any).propertyId;
    if (!organizationId || !propertyId) {
      throw new ForbiddenException('Tenant context missing. Select a property and try again.');
    }

    const dataWithTenant: any = {
      name: dto.name,
      code: dto.code || dto.name.toLowerCase().replace(/\s+/g, '-'),
      baseRate: dto.baseRate ?? 0,
      maxCapacity: dto.maxCapacity ?? 2,
      amenities: Array.isArray(dto.amenities) ? dto.amenities : [],
      isActive: dto.isActive ?? true,
      organizationId,
      propertyId,
    };

    // Unique per property
    const exists = await this.prisma.roomType.findFirst({
      where: {
        propertyId,
        code: dataWithTenant.code,
      },
    });
    if (exists) {
      throw new BadRequestException('Room type code already exists for this property');
    }

    return this.prisma.roomType.create({
      data: dataWithTenant,
    });
  }

  async findAll(currentUser: User) {
    const propertyId = (currentUser as any).propertyId;
    const organizationId = (currentUser as any).organizationId;
    if (!organizationId || !propertyId) {
      throw new ForbiddenException('Tenant context missing. Select a property and try again.');
    }
    return this.prisma.roomType.findMany({
      where: { organizationId, propertyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: any, currentUser: User) {
    // Ensure belongs to tenant
    const rt = await this.prisma.roomType.findUnique({ where: { id } });
    if (!rt) throw new NotFoundException('Room type not found');
    if ((currentUser as any).propertyId !== (rt as any).propertyId) {
      throw new ForbiddenException('Cannot modify room type outside current property');
    }

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
    if ((currentUser as any).propertyId !== (rt as any).propertyId) {
      throw new ForbiddenException('Cannot modify room type outside current property');
    }
    return this.prisma.roomType.update({ where: { id }, data: { isActive: false } });
  }
}


