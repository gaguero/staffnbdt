import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { User, CommercialBenefit, Role } from '@prisma/client';

@Injectable()
export class BenefitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(limit = 10, offset = 0, category?: string): Promise<PaginatedResponse<CommercialBenefit>> {
    let whereClause: any = { isActive: true };
    
    if (category) {
      whereClause.category = category;
    }

    const [benefits, total] = await Promise.all([
      this.prisma.commercialBenefit.findMany({
        where: whereClause,
        orderBy: { partnerName: 'asc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.commercialBenefit.count({ where: whereClause }),
    ]);

    return new PaginatedResponse(benefits, total, limit, offset);
  }

  async findOne(id: string): Promise<CommercialBenefit> {
    const benefit = await this.prisma.commercialBenefit.findFirst({
      where: { id, isActive: true },
    });

    if (!benefit) {
      throw new NotFoundException('Benefit not found');
    }

    return benefit;
  }

  async create(data: any, currentUser: User): Promise<CommercialBenefit> {
    if (currentUser.role !== Role.PLATFORM_ADMIN) {
      throw new ForbiddenException('Only superadmins can create benefits');
    }

    const benefit = await this.prisma.commercialBenefit.create({ data });
    await this.auditService.logCreate(currentUser.id, 'CommercialBenefit', benefit.id, benefit);
    return benefit;
  }

  async update(id: string, data: any, currentUser: User): Promise<CommercialBenefit> {
    if (currentUser.role !== Role.PLATFORM_ADMIN) {
      throw new ForbiddenException('Only superadmins can update benefits');
    }

    const existing = await this.findOne(id);
    const updated = await this.prisma.commercialBenefit.update({ where: { id }, data });
    await this.auditService.logUpdate(currentUser.id, 'CommercialBenefit', id, existing, updated);
    return updated;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    if (currentUser.role !== Role.PLATFORM_ADMIN) {
      throw new ForbiddenException('Only superadmins can delete benefits');
    }

    const existing = await this.findOne(id);
    await this.prisma.commercialBenefit.update({ where: { id }, data: { isActive: false } });
    await this.auditService.logDelete(currentUser.id, 'CommercialBenefit', id, existing);
  }
}