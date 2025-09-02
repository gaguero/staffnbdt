import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { CreateReservationDto, UpdateReservationDto, ReservationFilterDto, CheckInDto, CheckOutDto } from './dto';
import { ReservationWithDetails, ReservationStats, ConflictCheckResult } from './interfaces';
import { User, Reservation, ReservationStatus, UnitStatus, PaymentStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private generateReservationNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `RES${timestamp}${random}`;
  }

  private generateConfirmationCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  async create(
    createReservationDto: CreateReservationDto,
    currentUser: User,
  ): Promise<ReservationWithDetails> {
    const { unitId, guestId, checkInDate, checkOutDate } = createReservationDto;

    // Required fields guards
    if (!unitId) {
      throw new BadRequestException('Unit is required');
    }
    if (!guestId) {
      throw new BadRequestException('Guest is required');
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    if (checkIn < new Date()) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Validate unit exists and belongs to property
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: unitId,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found or not available');
    }

    // Validate guest exists and belongs to property
    const guest = await this.prisma.guest.findFirst({
      where: {
        id: guestId,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    // Check for conflicting reservations
    const conflict = await this.checkReservationConflict(unitId, checkIn, checkOut, currentUser);
    if (conflict.hasConflict) {
      throw new BadRequestException('Unit is not available for the selected dates');
    }

    // Check if guest is blacklisted
    if (guest.blacklisted) {
      throw new BadRequestException('Cannot create reservation for blacklisted guest');
    }

    // Validate occupancy
    const totalGuests = createReservationDto.adults + (createReservationDto.children || 0);
    if (totalGuests > unit.maxOccupancy) {
      throw new BadRequestException(`Unit can accommodate maximum ${unit.maxOccupancy} guests`);
    }

    // Generate reservation number and confirmation code if not provided
    const reservationNumber = this.generateReservationNumber();
    const confirmationCode = createReservationDto.confirmationCode || this.generateConfirmationCode();

    // Coerce numeric/decimal fields
    const totalAmount = createReservationDto.totalAmount ?? 0;
    const paidAmount = createReservationDto.paidAmount ?? 0;

    const reservation = await this.prisma.reservation.create({
      data: {
        unitId,
        guestId,
        status: createReservationDto.status,
        paymentStatus: createReservationDto.paymentStatus,
        totalAmount: new Prisma.Decimal(totalAmount),
        paidAmount: new Prisma.Decimal(paidAmount),
        currency: createReservationDto.currency || 'USD',
        paymentMethod: createReservationDto.paymentMethod,
        source: createReservationDto.source,
        specialRequests: createReservationDto.specialRequests,
        notes: createReservationDto.notes,
        confirmationCode,
        propertyId: currentUser.propertyId!,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        children: createReservationDto.children || 0,
        reservationNumber,
      },
      include: {
        unit: true,
        guest: true,
      },
    });

    // Update unit status if reservation is confirmed
    if (createReservationDto.status === ReservationStatus.CONFIRMED) {
      await this.prisma.unit.update({
        where: { id: unitId },
        data: { status: UnitStatus.RESERVED },
      });
    }

    // Log reservation creation
    await this.auditService.logCreate(currentUser.id, 'Reservation', reservation.id, reservation);

    return reservation;
  }

  async findAll(
    filterDto: ReservationFilterDto,
    currentUser: User,
  ): Promise<PaginatedResponse<ReservationWithDetails>> {
    const {
      limit,
      offset,
      status,
      paymentStatus,
      checkInDateFrom,
      checkInDateTo,
      checkOutDateFrom,
      checkOutDateTo,
      unitId,
      guestId,
      guestName,
      unitNumber,
      confirmationCode,
      source,
      sortBy = 'checkInDate',
      sortOrder = 'asc'
    } = filterDto;

    // Build where clause with tenant isolation
    let whereClause: any = {
      propertyId: currentUser.propertyId!,
    };

    // Apply filters
    if (status) {
      whereClause.status = status;
    }

    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    if (checkInDateFrom || checkInDateTo) {
      whereClause.checkInDate = {};
      if (checkInDateFrom) {
        whereClause.checkInDate.gte = new Date(checkInDateFrom);
      }
      if (checkInDateTo) {
        whereClause.checkInDate.lte = new Date(checkInDateTo);
      }
    }

    if (checkOutDateFrom || checkOutDateTo) {
      whereClause.checkOutDate = {};
      if (checkOutDateFrom) {
        whereClause.checkOutDate.gte = new Date(checkOutDateFrom);
      }
      if (checkOutDateTo) {
        whereClause.checkOutDate.lte = new Date(checkOutDateTo);
      }
    }

    if (unitId) {
      whereClause.unitId = unitId;
    }

    if (guestId) {
      whereClause.guestId = guestId;
    }

    if (guestName) {
      whereClause.guest = {
        OR: [
          { firstName: { contains: guestName, mode: 'insensitive' } },
          { lastName: { contains: guestName, mode: 'insensitive' } },
        ],
      };
    }

    if (unitNumber) {
      whereClause.unit = {
        unitNumber: { contains: unitNumber, mode: 'insensitive' },
      };
    }

    if (confirmationCode) {
      whereClause.confirmationCode = { contains: confirmationCode, mode: 'insensitive' };
    }

    if (source) {
      whereClause.source = { contains: source, mode: 'insensitive' };
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'checkInDate') {
      orderBy.checkInDate = sortOrder;
    } else if (sortBy === 'checkOutDate') {
      orderBy.checkOutDate = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'totalAmount') {
      orderBy.totalAmount = sortOrder;
    }

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where: whereClause,
        include: {
          unit: true,
          guest: true,
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.reservation.count({ where: whereClause }),
    ]);

    return new PaginatedResponse(reservations, total, limit, offset);
  }

  async findOne(id: string, currentUser: User): Promise<ReservationWithDetails> {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
      },
      include: {
        unit: true,
        guest: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
    currentUser: User,
  ): Promise<ReservationWithDetails> {
    const existingReservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
      },
    });

    if (!existingReservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Validate date changes if provided
    if (updateReservationDto.checkInDate || updateReservationDto.checkOutDate) {
      const checkIn = updateReservationDto.checkInDate 
        ? new Date(updateReservationDto.checkInDate)
        : existingReservation.checkInDate;
      const checkOut = updateReservationDto.checkOutDate
        ? new Date(updateReservationDto.checkOutDate)
        : existingReservation.checkOutDate;

      if (checkIn >= checkOut) {
        throw new BadRequestException('Check-out date must be after check-in date');
      }

      // Check for conflicts if dates changed
      if (updateReservationDto.checkInDate || updateReservationDto.checkOutDate) {
        const conflict = await this.checkReservationConflict(
          existingReservation.unitId,
          checkIn,
          checkOut,
          currentUser,
          id // Exclude current reservation from conflict check
        );
        
        if (conflict.hasConflict) {
          throw new BadRequestException('Unit is not available for the new dates');
        }
      }
    }

    const reservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        ...updateReservationDto,
        checkInDate: updateReservationDto.checkInDate ? new Date(updateReservationDto.checkInDate) : undefined,
        checkOutDate: updateReservationDto.checkOutDate ? new Date(updateReservationDto.checkOutDate) : undefined,
      },
      include: {
        unit: true,
        guest: true,
      },
    });

    // Log reservation update
    await this.auditService.logUpdate(currentUser.id, 'Reservation', reservation.id, existingReservation, reservation);

    return reservation;
  }

  async cancel(id: string, reason: string, currentUser: User): Promise<ReservationWithDetails> {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
      },
      include: {
        unit: true,
        guest: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation is already cancelled');
    }

    if (reservation.status === ReservationStatus.CHECKED_OUT) {
      throw new BadRequestException('Cannot cancel completed reservation');
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.CANCELLED,
        notes: `${reservation.notes || ''}\nCancellation reason: ${reason}`.trim(),
      },
      include: {
        unit: true,
        guest: true,
      },
    });

    // Update unit status back to available if it was reserved
    if (reservation.unit.status === UnitStatus.RESERVED) {
      await this.prisma.unit.update({
        where: { id: reservation.unitId },
        data: { status: UnitStatus.AVAILABLE },
      });
    }

    // Log cancellation
    await this.auditService.logUpdate(
      currentUser.id,
      'Reservation',
      id,
      { status: reservation.status },
      { status: ReservationStatus.CANCELLED, cancellationReason: reason }
    );

    return updatedReservation;
  }

  async checkIn(id: string, checkInDto: CheckInDto, currentUser: User): Promise<ReservationWithDetails> {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
      },
      include: {
        unit: true,
        guest: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed reservations can be checked in');
    }

    if (reservation.checkedInAt) {
      throw new BadRequestException('Reservation is already checked in');
    }

    const checkedInAt = checkInDto.checkedInAt ? new Date(checkInDto.checkedInAt) : new Date();
    
    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.CHECKED_IN,
        checkedInAt,
        notes: checkInDto.notes ? `${reservation.notes || ''}\nCheck-in notes: ${checkInDto.notes}`.trim() : reservation.notes,
      },
      include: {
        unit: true,
        guest: true,
      },
    });

    // Update unit status to occupied
    await this.prisma.unit.update({
      where: { id: reservation.unitId },
      data: { status: UnitStatus.OCCUPIED },
    });

    // Log check-in
    await this.auditService.logUpdate(
      currentUser.id,
      'Reservation',
      id,
      { status: reservation.status },
      { status: ReservationStatus.CHECKED_IN, checkedInAt }
    );

    return updatedReservation;
  }

  async checkOut(id: string, checkOutDto: CheckOutDto, currentUser: User): Promise<ReservationWithDetails> {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
      },
      include: {
        unit: true,
        guest: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.CHECKED_IN) {
      throw new BadRequestException('Only checked-in reservations can be checked out');
    }

    if (reservation.checkedOutAt) {
      throw new BadRequestException('Reservation is already checked out');
    }

    const checkedOutAt = checkOutDto.checkedOutAt ? new Date(checkOutDto.checkedOutAt) : new Date();
    
    // Calculate additional charges
    let finalAmount = reservation.totalAmount.toNumber();
    if (checkOutDto.additionalCharges) {
      finalAmount += checkOutDto.additionalCharges;
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.CHECKED_OUT,
        checkedOutAt,
        totalAmount: finalAmount,
        notes: checkOutDto.notes ? `${reservation.notes || ''}\nCheck-out notes: ${checkOutDto.notes}`.trim() : reservation.notes,
      },
      include: {
        unit: true,
        guest: true,
      },
    });

    // Update unit status to available (assuming cleaning will be handled separately)
    await this.prisma.unit.update({
      where: { id: reservation.unitId },
      data: { status: UnitStatus.AVAILABLE },
    });

    // Log check-out
    await this.auditService.logUpdate(
      currentUser.id,
      'Reservation',
      id,
      { status: reservation.status, totalAmount: reservation.totalAmount },
      { status: ReservationStatus.CHECKED_OUT, checkedOutAt, totalAmount: finalAmount }
    );

    return updatedReservation;
  }

  async checkReservationConflict(
    unitId: string,
    checkInDate: Date,
    checkOutDate: Date,
    currentUser: User,
    excludeReservationId?: string,
  ): Promise<ConflictCheckResult> {
    let whereClause: any = {
      unitId,
      propertyId: currentUser.propertyId!,
      status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] },
      OR: [
        {
          checkInDate: { lt: checkOutDate },
          checkOutDate: { gt: checkInDate },
        },
      ],
    };

    if (excludeReservationId) {
      whereClause.id = { not: excludeReservationId };
    }

    const conflictingReservations = await this.prisma.reservation.findMany({
      where: whereClause,
    });

    const hasConflict = conflictingReservations.length > 0;

    // If there's a conflict, suggest alternative units
    let suggestedUnits: any[] = [];
    if (hasConflict) {
      suggestedUnits = await this.prisma.unit.findMany({
        where: {
          propertyId: currentUser.propertyId!,
          isActive: true,
          deletedAt: null,
          status: UnitStatus.AVAILABLE,
          id: { not: unitId },
          reservations: {
            none: {
              status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] },
              OR: [
                {
                  checkInDate: { lt: checkOutDate },
                  checkOutDate: { gt: checkInDate },
                },
              ],
            },
          },
        },
        take: 5,
      });
    }

    return {
      hasConflict,
      conflictingReservations,
      suggestedUnits,
    };
  }

  async getReservationStats(currentUser: User): Promise<ReservationStats> {
    const propertyId = currentUser.propertyId!;

    const [
      total,
      confirmed,
      checkedIn,
      checkedOut,
      cancelled,
      pending,
      revenueResult,
      avgRateResult,
      totalUnits,
      occupiedUnits,
      avgStayResult,
    ] = await Promise.all([
      this.prisma.reservation.count({ where: { propertyId } }),
      this.prisma.reservation.count({ where: { propertyId, status: ReservationStatus.CONFIRMED } }),
      this.prisma.reservation.count({ where: { propertyId, status: ReservationStatus.CHECKED_IN } }),
      this.prisma.reservation.count({ where: { propertyId, status: ReservationStatus.CHECKED_OUT } }),
      this.prisma.reservation.count({ where: { propertyId, status: ReservationStatus.CANCELLED } }),
      this.prisma.reservation.count({ where: { propertyId, paymentStatus: PaymentStatus.PENDING } }),
      this.prisma.reservation.aggregate({
        where: { propertyId, status: ReservationStatus.CHECKED_OUT },
        _sum: { totalAmount: true },
      }),
      this.prisma.reservation.aggregate({
        where: { propertyId, status: ReservationStatus.CHECKED_OUT },
        _avg: { totalAmount: true },
      }),
      this.prisma.unit.count({
        where: { propertyId, isActive: true, deletedAt: null },
      }),
      this.prisma.unit.count({
        where: { propertyId, isActive: true, deletedAt: null, status: UnitStatus.OCCUPIED },
      }),
      this.prisma.reservation.findMany({
        where: { propertyId, status: ReservationStatus.CHECKED_OUT },
        select: { checkInDate: true, checkOutDate: true },
      }),
    ]);

    // Calculate average stay duration
    const totalNights = avgStayResult.reduce((sum, res) => {
      const nights = Math.ceil(
        (new Date(res.checkOutDate).getTime() - new Date(res.checkInDate).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      return sum + nights;
    }, 0);

    const averageStayDuration = avgStayResult.length > 0 ? totalNights / avgStayResult.length : 0;

    return {
      total,
      confirmed,
      checkedIn,
      checkedOut,
      cancelled,
      pending,
      totalRevenue: revenueResult._sum.totalAmount?.toNumber() || 0,
      averageNightlyRate: avgRateResult._avg.totalAmount?.toNumber() || 0,
      occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
      averageStayDuration: Math.round(averageStayDuration * 100) / 100,
    };
  }
}