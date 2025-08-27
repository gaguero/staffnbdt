import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { applySoftDelete } from '../../shared/utils/soft-delete';
import { CreateUnitDto, UpdateUnitDto, UnitFilterDto, UnitAvailabilityDto } from './dto';
import { UnitWithReservations, UnitAvailability, UnitStats } from './interfaces';
import { User, Unit, UnitStatus } from '@prisma/client';

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createUnitDto: CreateUnitDto,
    currentUser: User,
  ): Promise<Unit> {
    // Validate that the unit number doesn't already exist in the property
    const existingUnit = await this.prisma.unit.findFirst({
      where: {
        unitNumber: createUnitDto.unitNumber,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
    });

    if (existingUnit) {
      throw new BadRequestException('Unit number already exists in this property');
    }

    const unit = await this.prisma.unit.create({
      data: {
        ...createUnitDto,
        propertyId: currentUser.propertyId!,
        amenities: createUnitDto.amenities || [],
        isActive: createUnitDto.isActive ?? true,
      },
    });

    // Log unit creation
    await this.auditService.logCreate(currentUser.id, 'Unit', unit.id, unit);

    return unit;
  }

  async findAll(
    filterDto: UnitFilterDto,
    currentUser: User,
  ): Promise<PaginatedResponse<Unit>> {
    const { limit, offset, unitType, status, search, building, floor, minOccupancy, maxOccupancy, isActive, includeInactive } = filterDto;

    // Build where clause with tenant isolation
    let whereClause: any = {
      propertyId: currentUser.propertyId!,
    };

    // Apply soft delete filtering
    const includeDeleted = includeInactive === true;
    const queryWithSoftDelete = applySoftDelete({ where: whereClause }, includeDeleted);
    whereClause = queryWithSoftDelete.where || {};

    // Apply filters
    if (unitType) {
      whereClause.unitType = unitType;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { unitNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (building) {
      whereClause.building = { contains: building, mode: 'insensitive' };
    }

    if (floor !== undefined) {
      whereClause.floor = floor;
    }

    if (minOccupancy !== undefined) {
      whereClause.maxOccupancy = { gte: minOccupancy };
    }

    if (maxOccupancy !== undefined) {
      whereClause.maxOccupancy = { lte: maxOccupancy };
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: [
          { building: 'asc' },
          { floor: 'asc' },
          { unitNumber: 'asc' },
        ],
      }),
      this.prisma.unit.count({ where: whereClause }),
    ]);

    return new PaginatedResponse(units, total, limit, offset);
  }

  async findOne(id: string, currentUser: User): Promise<UnitWithReservations> {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
      include: {
        reservations: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
            checkOutDate: { gte: new Date() },
          },
          include: {
            guest: true,
          },
          orderBy: { checkInDate: 'asc' },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  async update(
    id: string,
    updateUnitDto: UpdateUnitDto,
    currentUser: User,
  ): Promise<Unit> {
    const existingUnit = await this.prisma.unit.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
    });

    if (!existingUnit) {
      throw new NotFoundException('Unit not found');
    }

    const unit = await this.prisma.unit.update({
      where: { id },
      data: updateUnitDto,
    });

    // Log unit update
    await this.auditService.logUpdate(currentUser.id, 'Unit', unit.id, existingUnit, unit);

    return unit;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
      include: {
        reservations: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Check if unit has active reservations
    if (unit.reservations.length > 0) {
      throw new BadRequestException('Cannot delete unit with active reservations');
    }

    await this.prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log unit deletion
    await this.auditService.logDelete(currentUser.id, 'Unit', id, unit);
  }

  async restore(id: string, currentUser: User): Promise<Unit> {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: { not: null },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found or not deleted');
    }

    const restoredUnit = await this.prisma.unit.update({
      where: { id },
      data: { deletedAt: null },
    });

    // Log unit restoration
    await this.auditService.logUpdate(currentUser.id, 'Unit', id, unit, restoredUnit);

    return restoredUnit;
  }

  async updateStatus(
    id: string,
    status: UnitStatus,
    currentUser: User,
  ): Promise<Unit> {
    const existingUnit = await this.prisma.unit.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
    });

    if (!existingUnit) {
      throw new NotFoundException('Unit not found');
    }

    const unit = await this.prisma.unit.update({
      where: { id },
      data: { status },
    });

    // Log status update
    await this.auditService.logUpdate(currentUser.id, 'Unit', unit.id, { status: existingUnit.status }, { status });

    return unit;
  }

  async checkAvailability(
    availabilityDto: UnitAvailabilityDto,
    currentUser: User,
  ): Promise<UnitAvailability[]> {
    const { checkInDate, checkOutDate, adults = 1, children = 0 } = availabilityDto;
    const totalGuests = adults + children;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // Get all active units in the property
    const units = await this.prisma.unit.findMany({
      where: {
        propertyId: currentUser.propertyId!,
        isActive: true,
        deletedAt: null,
        maxOccupancy: { gte: totalGuests },
      },
      include: {
        reservations: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
            OR: [
              {
                checkInDate: { lt: checkOut },
                checkOutDate: { gt: checkIn },
              },
            ],
          },
        },
      },
    });

    return units.map(unit => ({
      unitId: unit.id,
      unit,
      isAvailable: unit.reservations.length === 0 && unit.status === 'AVAILABLE',
      conflictingReservations: unit.reservations.length > 0 ? unit.reservations : undefined,
    }));
  }

  async getAvailableUnits(
    availabilityDto: UnitAvailabilityDto,
    currentUser: User,
  ): Promise<Unit[]> {
    const availability = await this.checkAvailability(availabilityDto, currentUser);
    return availability.filter(item => item.isAvailable).map(item => item.unit);
  }

  async getUnitStats(currentUser: User): Promise<UnitStats> {
    const propertyId = currentUser.propertyId!;

    const [
      total,
      available,
      occupied,
      maintenance,
      outOfOrder,
      reserved,
      avgRateResult,
    ] = await Promise.all([
      this.prisma.unit.count({
        where: { propertyId, deletedAt: null, isActive: true },
      }),
      this.prisma.unit.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'AVAILABLE' },
      }),
      this.prisma.unit.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'OCCUPIED' },
      }),
      this.prisma.unit.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'MAINTENANCE' },
      }),
      this.prisma.unit.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'OUT_OF_ORDER' },
      }),
      this.prisma.unit.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'RESERVED' },
      }),
      this.prisma.unit.aggregate({
        where: { propertyId, deletedAt: null, isActive: true, dailyRate: { not: null } },
        _avg: { dailyRate: true },
      }),
    ]);

    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
    const averageDailyRate = avgRateResult._avg.dailyRate?.toNumber() || 0;

    return {
      total,
      available,
      occupied,
      maintenance,
      outOfOrder,
      reserved,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      averageDailyRate: Math.round(averageDailyRate * 100) / 100,
    };
  }
}