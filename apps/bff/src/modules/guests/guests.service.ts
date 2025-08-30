import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { applySoftDelete } from '../../shared/utils/soft-delete';
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from './dto';
import { GuestWithReservations, GuestStats, GuestHistory } from './interfaces';
import { User, Guest } from '@prisma/client';

@Injectable()
export class GuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createGuestDto: CreateGuestDto,
    currentUser: User,
  ): Promise<Guest> {
    // Check for duplicate guest by email if provided
    if (createGuestDto.email) {
      const existingGuest = await this.prisma.guest.findFirst({
        where: {
          email: createGuestDto.email,
          propertyId: currentUser.propertyId!,
          deletedAt: null,
        },
      });

      if (existingGuest) {
        throw new BadRequestException('Guest with this email already exists');
      }
    }

    // Check for duplicate guest by phone if provided
    if (createGuestDto.phoneNumber) {
      const existingGuest = await this.prisma.guest.findFirst({
        where: {
          phoneNumber: createGuestDto.phoneNumber,
          propertyId: currentUser.propertyId!,
          deletedAt: null,
        },
      });

      if (existingGuest) {
        throw new BadRequestException('Guest with this phone number already exists');
      }
    }

    const guest = await this.prisma.guest.create({
      data: {
        ...createGuestDto,
        propertyId: currentUser.propertyId!,
        dateOfBirth: createGuestDto.dateOfBirth ? new Date(createGuestDto.dateOfBirth) : null,
        blacklisted: createGuestDto.blacklisted || false,
      },
    });

    // Log guest creation
    await this.auditService.logCreate(currentUser.id, 'Guest', guest.id, guest);

    return guest;
  }

  async findAll(
    filterDto: GuestFilterDto,
    currentUser: User,
  ): Promise<PaginatedResponse<Guest>> {
    const { 
      limit, 
      offset, 
      vipStatus, 
      search, 
      nationality, 
      blacklisted, 
      includeInactive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filterDto;

    // Build where clause with tenant isolation
    let whereClause: any = {
      propertyId: currentUser.propertyId!,
    };

    // Apply soft delete filtering
    const includeDeleted = includeInactive === true;
    const queryWithSoftDelete = applySoftDelete({ where: whereClause }, includeDeleted);
    whereClause = queryWithSoftDelete.where || {};

    // Apply filters
    if (vipStatus) {
      whereClause.vipStatus = vipStatus;
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { passportNumber: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (nationality) {
      whereClause.nationality = { contains: nationality, mode: 'insensitive' };
    }

    if (blacklisted !== undefined) {
      whereClause.blacklisted = blacklisted;
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'firstName') {
      orderBy.firstName = sortOrder;
    } else if (sortBy === 'lastName') {
      orderBy.lastName = sortOrder;
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else if (sortBy === 'vipStatus') {
      orderBy.vipStatus = sortOrder;
    }

    const [guests, total] = await Promise.all([
      this.prisma.guest.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.guest.count({ where: whereClause }),
    ]);

    return new PaginatedResponse(guests, total, limit, offset);
  }

  async findOne(id: string, currentUser: User): Promise<GuestWithReservations> {
    const guest = await this.prisma.guest.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
      include: {
        reservations: {
          include: {
            unit: true,
          },
          orderBy: { checkInDate: 'desc' },
        },
      },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    return guest;
  }

  async update(
    id: string,
    updateGuestDto: UpdateGuestDto,
    currentUser: User,
  ): Promise<Guest> {
    const existingGuest = await this.prisma.guest.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
    });

    if (!existingGuest) {
      throw new NotFoundException('Guest not found');
    }

    // Check for duplicate email if updating email
    if (updateGuestDto.email && updateGuestDto.email !== existingGuest.email) {
      const duplicateGuest = await this.prisma.guest.findFirst({
        where: {
          email: updateGuestDto.email,
          propertyId: currentUser.propertyId!,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicateGuest) {
        throw new BadRequestException('Guest with this email already exists');
      }
    }

    // Check for duplicate phone if updating phone
    if (updateGuestDto.phoneNumber && updateGuestDto.phoneNumber !== existingGuest.phoneNumber) {
      const duplicateGuest = await this.prisma.guest.findFirst({
        where: {
          phoneNumber: updateGuestDto.phoneNumber,
          propertyId: currentUser.propertyId!,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicateGuest) {
        throw new BadRequestException('Guest with this phone number already exists');
      }
    }

    const guest = await this.prisma.guest.update({
      where: { id },
      data: {
        ...updateGuestDto,
        dateOfBirth: updateGuestDto.dateOfBirth ? new Date(updateGuestDto.dateOfBirth) : undefined,
      },
    });

    // Log guest update
    await this.auditService.logUpdate(currentUser.id, 'Guest', guest.id, existingGuest, guest);

    return guest;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const guest = await this.prisma.guest.findFirst({
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

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    // Check if guest has active reservations
    if (guest.reservations.length > 0) {
      throw new BadRequestException('Cannot delete guest with active reservations');
    }

    await this.prisma.guest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log guest deletion
    await this.auditService.logDelete(currentUser.id, 'Guest', id, guest);
  }

  async restore(id: string, currentUser: User): Promise<Guest> {
    const guest = await this.prisma.guest.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: { not: null },
      },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found or not deleted');
    }

    const restoredGuest = await this.prisma.guest.update({
      where: { id },
      data: { deletedAt: null },
    });

    // Log guest restoration
    await this.auditService.logUpdate(currentUser.id, 'Guest', id, guest, restoredGuest);

    return restoredGuest;
  }

  async blacklistGuest(
    id: string,
    reason: string,
    currentUser: User,
  ): Promise<Guest> {
    const existingGuest = await this.prisma.guest.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
    });

    if (!existingGuest) {
      throw new NotFoundException('Guest not found');
    }

    const guest = await this.prisma.guest.update({
      where: { id },
      data: { 
        blacklisted: true,
        blacklistReason: reason,
      },
    });

    // Log blacklist action
    await this.auditService.logUpdate(
      currentUser.id,
      'Guest',
      guest.id,
      { blacklisted: existingGuest.blacklisted, blacklistReason: existingGuest.blacklistReason },
      { blacklisted: true, blacklistReason: reason }
    );

    return guest;
  }

  async removeFromBlacklist(
    id: string,
    currentUser: User,
  ): Promise<Guest> {
    const existingGuest = await this.prisma.guest.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
    });

    if (!existingGuest) {
      throw new NotFoundException('Guest not found');
    }

    const guest = await this.prisma.guest.update({
      where: { id },
      data: { 
        blacklisted: false,
        blacklistReason: null,
      },
    });

    // Log blacklist removal
    await this.auditService.logUpdate(
      currentUser.id,
      'Guest',
      guest.id,
      { blacklisted: existingGuest.blacklisted, blacklistReason: existingGuest.blacklistReason },
      { blacklisted: false, blacklistReason: null }
    );

    return guest;
  }

  async getGuestStats(currentUser: User): Promise<GuestStats> {
    const propertyId = currentUser.propertyId!;
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      vipGuests,
      blacklistedGuests,
      newGuestsThisMonth,
      returningGuestsResult,
      avgStayResult,
      nationalitiesResult,
    ] = await Promise.all([
      this.prisma.guest.count({
        where: { propertyId, deletedAt: null },
      }),
      this.prisma.guest.count({
        where: { propertyId, deletedAt: null, vipStatus: { not: 'STANDARD' } },
      }),
      this.prisma.guest.count({
        where: { propertyId, deletedAt: null, blacklisted: true },
      }),
      this.prisma.guest.count({
        where: { propertyId, deletedAt: null, createdAt: { gte: firstOfMonth } },
      }),
      this.prisma.guest.findMany({
        where: { 
          propertyId, 
          deletedAt: null,
          reservations: { some: {} }
        },
        select: { id: true },
      }),
      this.prisma.reservation.aggregate({
        where: { 
          propertyId,
          status: 'CHECKED_OUT',
          guest: { deletedAt: null }
        },
        _avg: { 
          totalAmount: true,
          adults: true,
          children: true
        },
      }),
      this.prisma.guest.groupBy({
        by: ['nationality'],
        where: { propertyId, deletedAt: null, nationality: { not: null } },
        _count: { nationality: true },
        orderBy: { _count: { nationality: 'desc' } },
        take: 5,
      }),
    ]);

    const returningGuests = returningGuestsResult.length;

    return {
      total,
      vipGuests,
      blacklistedGuests,
      newGuestsThisMonth,
      returningGuests,
      averageStayDuration: 0, // Would need more complex calculation
      topNationalities: nationalitiesResult.map(item => ({
        nationality: item.nationality || 'Unknown',
        count: item._count.nationality,
      })),
    };
  }

  async getGuestHistory(id: string, currentUser: User): Promise<GuestHistory> {
    const guest = await this.prisma.guest.findFirst({
      where: {
        id,
        propertyId: currentUser.propertyId!,
        deletedAt: null,
      },
      include: {
        reservations: {
          where: { status: 'CHECKED_OUT' },
          select: {
            checkInDate: true,
            checkOutDate: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    const reservations = guest.reservations;
    const totalReservations = reservations.length;
    
    const totalNights = reservations.reduce((sum, res) => {
      const nights = Math.ceil(
        (new Date(res.checkOutDate).getTime() - new Date(res.checkInDate).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      return sum + nights;
    }, 0);

    const totalSpent = reservations.reduce((sum, res) => {
      return sum + res.totalAmount.toNumber();
    }, 0);

    const sortedDates = reservations
      .map(res => new Date(res.checkInDate))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      guestId: id,
      totalReservations,
      totalNights,
      totalSpent,
      averageRating: 0, // Would need rating system
      lastVisit: sortedDates[sortedDates.length - 1] || guest.createdAt,
      firstVisit: sortedDates[0] || guest.createdAt,
      loyaltyPoints: Math.floor(totalSpent / 10), // Simple points system
    };
  }
}