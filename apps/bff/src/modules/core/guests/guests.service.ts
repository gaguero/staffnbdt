import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from './dto';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  async create(createGuestDto: CreateGuestDto) {
    // Check for duplicate email within organization
    if (createGuestDto.email) {
      const existingGuest = await this.prisma.guest.findFirst({
        where: {
          organizationId: createGuestDto.organizationId,
          email: createGuestDto.email,
        },
      });

      if (existingGuest) {
        throw new BadRequestException(
          `Guest with email ${createGuestDto.email} already exists`,
        );
      }
    }

    return this.prisma.guest.create({
      data: {
        ...createGuestDto,
        dateOfBirth: createGuestDto.dateOfBirth 
          ? new Date(createGuestDto.dateOfBirth) 
          : null,
      },
      include: {
        organization: {
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

  async findAll(filters?: GuestFilterDto) {
    const where: any = {
      deletedAt: null,
    };

    if (filters?.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters?.documentType) {
      where.documentType = filters.documentType;
    }

    if (filters?.nationality) {
      where.nationality = filters.nationality;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { loyaltyNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.guest.findMany({
      where,
      include: {
        organization: {
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
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const guest = await this.prisma.guest.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        reservations: {
          include: {
            unit: {
              select: {
                id: true,
                unitNumber: true,
                unitType: true,
              },
            },
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            checkInDate: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }

    return guest;
  }

  async update(id: string, updateGuestDto: UpdateGuestDto) {
    await this.findOne(id); // Check if guest exists

    // Check for duplicate email within organization (if email is being updated)
    if (updateGuestDto.email) {
      const existingGuest = await this.prisma.guest.findFirst({
        where: {
          organizationId: updateGuestDto.organizationId,
          email: updateGuestDto.email,
          id: { not: id },
        },
      });

      if (existingGuest) {
        throw new BadRequestException(
          `Guest with email ${updateGuestDto.email} already exists`,
        );
      }
    }

    return this.prisma.guest.update({
      where: { id },
      data: {
        ...updateGuestDto,
        dateOfBirth: updateGuestDto.dateOfBirth 
          ? new Date(updateGuestDto.dateOfBirth) 
          : undefined,
      },
      include: {
        organization: {
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

  async remove(id: string) {
    await this.findOne(id); // Check if guest exists

    // Check if guest has active reservations
    const activeReservations = await this.prisma.reservation.count({
      where: {
        guestId: id,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN'],
        },
      },
    });

    if (activeReservations > 0) {
      throw new BadRequestException(
        'Cannot delete guest with active reservations',
      );
    }

    return this.prisma.guest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getGuestHistory(id: string) {
    const guest = await this.findOne(id);

    return this.prisma.reservation.findMany({
      where: {
        guestId: id,
      },
      include: {
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'desc',
      },
    });
  }

  async searchGuests(query: string, organizationId?: string) {
    const where: any = {
      deletedAt: null,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { loyaltyNumber: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return this.prisma.guest.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        loyaltyNumber: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
      take: 20,
    });
  }
}