import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateReservationDto, UpdateReservationDto, ReservationFilterDto } from './dto';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async create(createReservationDto: CreateReservationDto) {
    const checkInDate = new Date(createReservationDto.checkInDate);
    const checkOutDate = new Date(createReservationDto.checkOutDate);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    if (checkInDate < new Date()) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Check if unit is available for the requested dates
    const overlappingReservations = await this.prisma.reservation.findMany({
      where: {
        unitId: createReservationDto.unitId,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN'],
        },
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
    });

    if (overlappingReservations.length > 0) {
      throw new BadRequestException('Unit is not available for the selected dates');
    }

    // Generate reservation number if not provided
    const reservationNumber = createReservationDto.reservationNumber || 
      `RES-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return this.prisma.reservation.create({
      data: {
        ...createReservationDto,
        reservationNumber,
        checkInDate,
        checkOutDate,
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
            maxOccupancy: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(filters?: ReservationFilterDto) {
    const where: any = {};

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters?.guestId) {
      where.guestId = filters.guestId;
    }

    if (filters?.unitId) {
      where.unitId = filters.unitId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.checkInDateFrom) {
      where.checkInDate = {
        gte: new Date(filters.checkInDateFrom),
      };
    }

    if (filters?.checkInDateTo) {
      where.checkInDate = {
        ...where.checkInDate,
        lte: new Date(filters.checkInDateTo),
      };
    }

    if (filters?.checkOutDateFrom) {
      where.checkOutDate = {
        gte: new Date(filters.checkOutDateFrom),
      };
    }

    if (filters?.checkOutDateTo) {
      where.checkOutDate = {
        ...where.checkOutDate,
        lte: new Date(filters.checkOutDateTo),
      };
    }

    if (filters?.search) {
      where.OR = [
        {
          guest: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
        {
          unit: {
            unitNumber: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    return this.prisma.reservation.findMany({
      where,
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
            maxOccupancy: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id },
      include: {
        guest: true,
        unit: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    await this.findOne(id); // Check if reservation exists

    const updateData: any = { ...updateReservationDto };

    // Convert date strings to Date objects if provided
    if (updateReservationDto.checkInDate) {
      updateData.checkInDate = new Date(updateReservationDto.checkInDate);
    }

    if (updateReservationDto.checkOutDate) {
      updateData.checkOutDate = new Date(updateReservationDto.checkOutDate);
    }

    // Validate dates if both are provided
    if (updateData.checkInDate && updateData.checkOutDate) {
      if (updateData.checkInDate >= updateData.checkOutDate) {
        throw new BadRequestException('Check-out date must be after check-in date');
      }
    }

    return this.prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
            maxOccupancy: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id); // Check if reservation exists

    return this.prisma.reservation.update({
      where: { id },
      data: { status: status as any },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
          },
        },
      },
    });
  }

  async checkIn(id: string, checkedInBy: string) {
    const reservation = await this.findOne(id);

    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException('Only confirmed reservations can be checked in');
    }

    const today = new Date();
    const checkInDate = new Date(reservation.checkInDate);

    // Allow check-in from the day before to the day after the scheduled check-in
    const allowedStart = new Date(checkInDate);
    allowedStart.setDate(allowedStart.getDate() - 1);
    const allowedEnd = new Date(checkInDate);
    allowedEnd.setDate(allowedEnd.getDate() + 1);

    if (today < allowedStart || today > allowedEnd) {
      throw new BadRequestException('Check-in is only allowed within one day of the scheduled date');
    }

    // Update unit status to occupied
    await this.prisma.unit.update({
      where: { id: reservation.unitId },
      data: { status: 'OCCUPIED' },
    });

    return this.prisma.reservation.update({
      where: { id },
      data: { 
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        checkedInBy,
      },
      include: {
        guest: true,
        unit: true,
        property: true,
      },
    });
  }

  async checkOut(id: string, checkedOutBy: string) {
    const reservation = await this.findOne(id);

    if (reservation.status !== 'CHECKED_IN') {
      throw new BadRequestException('Only checked-in reservations can be checked out');
    }

    // Update unit status to cleaning
    await this.prisma.unit.update({
      where: { id: reservation.unitId },
      data: { status: 'CLEANING' },
    });

    return this.prisma.reservation.update({
      where: { id },
      data: { 
        status: 'CHECKED_OUT',
        checkedOutAt: new Date(),
        checkedOutBy,
      },
      include: {
        guest: true,
        unit: true,
        property: true,
      },
    });
  }

  async remove(id: string) {
    const reservation = await this.findOne(id);

    if (['CHECKED_IN', 'CHECKED_OUT'].includes(reservation.status)) {
      throw new BadRequestException(
        'Cannot cancel reservations that have already been checked in or out',
      );
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getTodaysArrivals(propertyId: string) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.reservation.findMany({
      where: {
        propertyId,
        checkInDate: {
          gte: today,
          lt: tomorrow,
        },
        status: 'CONFIRMED',
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'asc',
      },
    });
  }

  async getTodaysDepartures(propertyId: string) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.reservation.findMany({
      where: {
        propertyId,
        checkOutDate: {
          gte: today,
          lt: tomorrow,
        },
        status: 'CHECKED_IN',
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
          },
        },
      },
      orderBy: {
        checkOutDate: 'asc',
      },
    });
  }
}