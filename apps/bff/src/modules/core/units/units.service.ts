import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto, UnitFilterDto } from './dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(createUnitDto: CreateUnitDto) {
    // Check if unit number already exists for this property
    const existingUnit = await this.prisma.unit.findFirst({
      where: {
        propertyId: createUnitDto.propertyId,
        unitNumber: createUnitDto.unitNumber,
      },
    });

    if (existingUnit) {
      throw new BadRequestException(
        `Unit ${createUnitDto.unitNumber} already exists in this property`,
      );
    }

    return this.prisma.unit.create({
      data: createUnitDto,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });
  }

  async findAll(filters?: UnitFilterDto) {
    const where: any = {
      deletedAt: null,
    };

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters?.unitType) {
      where.unitType = filters.unitType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.floor) {
      where.floor = filters.floor;
    }

    if (filters?.building) {
      where.building = filters.building;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { unitNumber: { contains: filters.search, mode: 'insensitive' } },
        { building: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.unit.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { unitNumber: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        reservations: {
          where: {
            status: {
              in: ['CONFIRMED', 'CHECKED_IN'],
            },
          },
          include: {
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            checkInDate: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }

    return unit;
  }

  async update(id: string, updateUnitDto: UpdateUnitDto) {
    await this.findOne(id); // Check if unit exists

    // If updating unit number, check for duplicates
    if (updateUnitDto.unitNumber) {
      const existingUnit = await this.prisma.unit.findFirst({
        where: {
          propertyId: updateUnitDto.propertyId,
          unitNumber: updateUnitDto.unitNumber,
          id: { not: id },
        },
      });

      if (existingUnit) {
        throw new BadRequestException(
          `Unit ${updateUnitDto.unitNumber} already exists in this property`,
        );
      }
    }

    return this.prisma.unit.update({
      where: { id },
      data: updateUnitDto,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id); // Check if unit exists

    return this.prisma.unit.update({
      where: { id },
      data: { status },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if unit exists

    // Check if unit has active reservations
    const activeReservations = await this.prisma.reservation.count({
      where: {
        unitId: id,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN'],
        },
      },
    });

    if (activeReservations > 0) {
      throw new BadRequestException(
        'Cannot delete unit with active reservations',
      );
    }

    return this.prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getUnitsByProperty(propertyId: string) {
    return this.prisma.unit.findMany({
      where: {
        propertyId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { unitNumber: 'asc' },
      ],
    });
  }

  async getAvailableUnits(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
  ) {
    // Get units that don't have overlapping reservations
    return this.prisma.unit.findMany({
      where: {
        propertyId,
        deletedAt: null,
        isActive: true,
        status: 'AVAILABLE',
        reservations: {
          none: {
            AND: [
              {
                status: {
                  in: ['CONFIRMED', 'CHECKED_IN'],
                },
              },
              {
                OR: [
                  {
                    AND: [
                      { checkInDate: { lte: checkInDate } },
                      { checkOutDate: { gt: checkInDate } },
                    ],
                  },
                  {
                    AND: [
                      { checkInDate: { lt: checkOutDate } },
                      { checkOutDate: { gte: checkOutDate } },
                    ],
                  },
                  {
                    AND: [
                      { checkInDate: { gte: checkInDate } },
                      { checkOutDate: { lte: checkOutDate } },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { unitNumber: 'asc' },
      ],
    });
  }
}