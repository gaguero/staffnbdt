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
          propertyId: createGuestDto.propertyId,
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

  async findAll(filters?: GuestFilterDto) {
    const where: any = {
      deletedAt: null,
    };

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
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
        { phoneNumber: { contains: filters.search, mode: 'insensitive' } },
        { loyaltyNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.guest.findMany({
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
        property: {
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
          propertyId: updateGuestDto.propertyId,
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

  async searchGuests(query: string, propertyId?: string) {
    const where: any = {
      deletedAt: null,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phoneNumber: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    return this.prisma.guest.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
      take: 20,
    });
  }
}