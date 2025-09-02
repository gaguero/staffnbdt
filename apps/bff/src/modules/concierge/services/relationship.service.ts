import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { TenantContextService } from '../../../shared/tenant/tenant-context.service';

export interface SearchFilters {
  query?: string;
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
  additionalFilters?: Record<string, any>;
}

export interface EntitySearchResult<T = any> {
  id: string;
  label: string;
  description?: string;
  metadata?: T;
  isActive?: boolean;
}

export interface PaginatedSearchResult<T = any> {
  results: EntitySearchResult<T>[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

@Injectable()
export class RelationshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Generic entity search with tenant scoping
   */
  async searchEntities(
    entityType: string,
    filters: SearchFilters,
    context: { organizationId: string; propertyId: string },
  ): Promise<PaginatedSearchResult> {
    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;

    switch (entityType) {
      case 'guest':
        return this.searchGuests(filters, context, limit, offset);
      case 'reservation':
        return this.searchReservations(filters, context, limit, offset);
      case 'unit':
        return this.searchUnits(filters, context, limit, offset);
      case 'vendor':
        return this.searchVendors(filters, context, limit, offset);
      case 'concierge_object':
        return this.searchConciergeObjects(filters, context, limit, offset);
      case 'user':
        return this.searchUsers(filters, context, limit, offset);
      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }
  }

  private async searchGuests(
    filters: SearchFilters,
    context: { organizationId: string; propertyId: string },
    limit: number,
    offset: number,
  ): Promise<PaginatedSearchResult> {
    const where: any = {
      propertyId: context.propertyId,
      deletedAt: null,
    };

    if (filters.query) {
      where.OR = [
        { firstName: { contains: filters.query, mode: 'insensitive' } },
        { lastName: { contains: filters.query, mode: 'insensitive' } },
        { email: { contains: filters.query, mode: 'insensitive' } },
        { phoneNumber: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (!filters.includeInactive) {
      where.blacklisted = false;
    }

    const [guests, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          vipStatus: true,
          blacklisted: true,
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prisma.guest.count({ where }),
    ]);

    return {
      results: guests.map(guest => ({
        id: guest.id,
        label: `${guest.firstName} ${guest.lastName}`,
        description: guest.email || guest.phoneNumber || 'No contact info',
        metadata: {
          email: guest.email,
          phoneNumber: guest.phoneNumber,
          vipStatus: guest.vipStatus,
        },
        isActive: !guest.blacklisted,
      })),
      total,
      hasMore: offset + limit < total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  private async searchReservations(
    filters: SearchFilters,
    context: { organizationId: string; propertyId: string },
    limit: number,
    offset: number,
  ): Promise<PaginatedSearchResult> {
    const where: any = {
      propertyId: context.propertyId,
    };

    if (filters.query) {
      where.OR = [
        { reservationNumber: { contains: filters.query, mode: 'insensitive' } },
        { confirmationCode: { contains: filters.query, mode: 'insensitive' } },
        { guest: {
          OR: [
            { firstName: { contains: filters.query, mode: 'insensitive' } },
            { lastName: { contains: filters.query, mode: 'insensitive' } },
          ],
        }},
      ];
    }

    // Default to active reservations unless specified
    if (!filters.includeInactive) {
      where.status = { in: ['CONFIRMED', 'CHECKED_IN'] };
    }

    // Additional filters for date range, unit type, etc.
    if (filters.additionalFilters?.dateRange) {
      const { start, end } = filters.additionalFilters.dateRange;
      where.AND = [
        { checkInDate: { lte: new Date(end) } },
        { checkOutDate: { gte: new Date(start) } },
      ];
    }

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        select: {
          id: true,
          reservationNumber: true,
          checkInDate: true,
          checkOutDate: true,
          status: true,
          guest: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          unit: {
            select: {
              unitNumber: true,
              unitType: true,
            },
          },
        },
        orderBy: [
          { checkInDate: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      results: reservations.map(res => ({
        id: res.id,
        label: `${res.reservationNumber} - ${res.guest.firstName} ${res.guest.lastName}`,
        description: `${res.unit.unitNumber} | ${res.checkInDate.toDateString()} - ${res.checkOutDate.toDateString()}`,
        metadata: {
          reservationNumber: res.reservationNumber,
          status: res.status,
          checkInDate: res.checkInDate,
          checkOutDate: res.checkOutDate,
          unitNumber: res.unit.unitNumber,
          unitType: res.unit.unitType,
          guestName: `${res.guest.firstName} ${res.guest.lastName}`,
        },
        isActive: ['CONFIRMED', 'CHECKED_IN'].includes(res.status),
      })),
      total,
      hasMore: offset + limit < total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  private async searchUnits(
    filters: SearchFilters,
    context: { organizationId: string; propertyId: string },
    limit: number,
    offset: number,
  ): Promise<PaginatedSearchResult> {
    const where: any = {
      propertyId: context.propertyId,
      deletedAt: null,
    };

    if (filters.query) {
      where.OR = [
        { unitNumber: { contains: filters.query, mode: 'insensitive' } },
        { building: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (!filters.includeInactive) {
      where.isActive = true;
      where.status = { notIn: ['OUT_OF_ORDER'] };
    }

    // Additional filters for availability check
    if (filters.additionalFilters?.availableFor) {
      const { start, end } = filters.additionalFilters.availableFor;
      where.reservations = {
        none: {
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          AND: [
            { checkInDate: { lte: new Date(end) } },
            { checkOutDate: { gte: new Date(start) } },
          ],
        },
      };
    }

    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        select: {
          id: true,
          unitNumber: true,
          unitType: true,
          building: true,
          floor: true,
          maxOccupancy: true,
          status: true,
          isActive: true,
          dailyRate: true,
        },
        orderBy: [
          { building: 'asc' },
          { floor: 'asc' },
          { unitNumber: 'asc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prisma.unit.count({ where }),
    ]);

    return {
      results: units.map(unit => ({
        id: unit.id,
        label: unit.unitNumber,
        description: `${unit.unitType} | ${unit.building || 'N/A'} Floor ${unit.floor || 'N/A'} | Max ${unit.maxOccupancy}`,
        metadata: {
          unitNumber: unit.unitNumber,
          unitType: unit.unitType,
          building: unit.building,
          floor: unit.floor,
          maxOccupancy: unit.maxOccupancy,
          status: unit.status,
          dailyRate: unit.dailyRate,
        },
        isActive: unit.isActive && unit.status !== 'OUT_OF_ORDER',
      })),
      total,
      hasMore: offset + limit < total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  private async searchVendors(
    filters: SearchFilters,
    context: { organizationId: string; propertyId: string },
    limit: number,
    offset: number,
  ): Promise<PaginatedSearchResult> {
    const where: any = {
      organizationId: context.organizationId,
      propertyId: context.propertyId,
    };

    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { category: { contains: filters.query, mode: 'insensitive' } },
        { email: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (!filters.includeInactive) {
      where.isActive = true;
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          email: true,
          phone: true,
          isActive: true,
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      results: vendors.map(vendor => ({
        id: vendor.id,
        label: vendor.name,
        description: `${vendor.category} | ${vendor.email || vendor.phone || 'No contact'}`,
        metadata: {
          name: vendor.name,
          category: vendor.category,
          email: vendor.email,
          phone: vendor.phone,
        },
        isActive: vendor.isActive,
      })),
      total,
      hasMore: offset + limit < total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  private async searchConciergeObjects(
    filters: SearchFilters,
    context: { organizationId: string; propertyId: string },
    limit: number,
    offset: number,
  ): Promise<PaginatedSearchResult> {
    const where: any = {
      organizationId: context.organizationId,
      propertyId: context.propertyId,
      deletedAt: null,
    };

    if (filters.query) {
      // Search in object type and attributes
      where.OR = [
        { type: { contains: filters.query, mode: 'insensitive' } },
        { attributes: {
          some: {
            OR: [
              { stringValue: { contains: filters.query, mode: 'insensitive' } },
              { selectValue: { contains: filters.query, mode: 'insensitive' } },
            ],
          },
        }},
      ];
    }

    if (!filters.includeInactive) {
      where.status = { notIn: ['cancelled', 'deleted'] };
    }

    const [objects, total] = await Promise.all([
      this.prisma.conciergeObject.findMany({
        where,
        select: {
          id: true,
          type: true,
          status: true,
          dueAt: true,
          createdAt: true,
          attributes: {
            select: {
              fieldKey: true,
              stringValue: true,
              selectValue: true,
            },
            take: 3, // Just show first few attributes as preview
          },
        },
        orderBy: [
          { dueAt: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prisma.conciergeObject.count({ where }),
    ]);

    return {
      results: objects.map(obj => {
        const primaryAttribute = obj.attributes.find(attr => 
          attr.fieldKey === 'title' || attr.fieldKey === 'name'
        ) || obj.attributes[0];
        
        const primaryValue = primaryAttribute ? 
          (primaryAttribute.stringValue || primaryAttribute.selectValue) : '';

        return {
          id: obj.id,
          label: primaryValue || `${obj.type} Object`,
          description: `${obj.type} | ${obj.status} | ${obj.dueAt ? 'Due: ' + obj.dueAt.toDateString() : 'No due date'}`,
          metadata: {
            type: obj.type,
            status: obj.status,
            dueAt: obj.dueAt,
            createdAt: obj.createdAt,
            attributesCount: obj.attributes.length,
          },
          isActive: !['cancelled', 'deleted'].includes(obj.status),
        };
      }),
      total,
      hasMore: offset + limit < total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  private async searchUsers(
    filters: SearchFilters,
    context: { organizationId: string; propertyId: string },
    limit: number,
    offset: number,
  ): Promise<PaginatedSearchResult> {
    const where: any = {
      organizationId: context.organizationId,
      deletedAt: null,
    };

    // For property-specific searches, filter by property
    if (context.propertyId) {
      where.propertyId = context.propertyId;
    }

    if (filters.query) {
      where.OR = [
        { firstName: { contains: filters.query, mode: 'insensitive' } },
        { lastName: { contains: filters.query, mode: 'insensitive' } },
        { email: { contains: filters.query, mode: 'insensitive' } },
        { position: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          role: true,
          department: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      results: users.map(user => ({
        id: user.id,
        label: `${user.firstName} ${user.lastName}`,
        description: `${user.position || user.role} | ${user.department?.name || 'No department'} | ${user.email}`,
        metadata: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          position: user.position,
          role: user.role,
          department: user.department?.name,
        },
        isActive: true,
      })),
      total,
      hasMore: offset + limit < total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  /**
   * Get detailed information about a specific entity
   */
  async getEntityDetails(
    entityType: string,
    entityId: string,
    context: { organizationId: string; propertyId: string },
  ): Promise<any> {
    switch (entityType) {
      case 'guest':
        return this.prisma.guest.findFirst({
          where: {
            id: entityId,
            propertyId: context.propertyId,
            deletedAt: null,
          },
          include: {
            reservations: {
              where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
              select: {
                id: true,
                reservationNumber: true,
                checkInDate: true,
                checkOutDate: true,
                status: true,
              },
            },
          },
        });

      case 'reservation':
        return this.prisma.reservation.findFirst({
          where: {
            id: entityId,
            propertyId: context.propertyId,
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
                building: true,
              },
            },
          },
        });

      case 'unit':
        return this.prisma.unit.findFirst({
          where: {
            id: entityId,
            propertyId: context.propertyId,
            deletedAt: null,
          },
          include: {
            reservations: {
              where: {
                status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                checkOutDate: { gte: new Date() },
              },
              select: {
                id: true,
                reservationNumber: true,
                checkInDate: true,
                checkOutDate: true,
                guest: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });

      default:
        throw new BadRequestException(`Entity details not supported for: ${entityType}`);
    }
  }

  /**
   * Check availability for units within a date range
   */
  async checkUnitAvailability(
    unitIds: string[],
    checkInDate: Date,
    checkOutDate: Date,
    context: { organizationId: string; propertyId: string },
  ): Promise<{ unitId: string; isAvailable: boolean; conflictingReservations?: any[] }[]> {
    const results = [];

    for (const unitId of unitIds) {
      const conflictingReservations = await this.prisma.reservation.findMany({
        where: {
          unitId,
          propertyId: context.propertyId,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          AND: [
            { checkInDate: { lte: checkOutDate } },
            { checkOutDate: { gte: checkInDate } },
          ],
        },
        select: {
          id: true,
          reservationNumber: true,
          checkInDate: true,
          checkOutDate: true,
          guest: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      results.push({
        unitId,
        isAvailable: conflictingReservations.length === 0,
        conflictingReservations: conflictingReservations.length > 0 ? conflictingReservations : undefined,
      });
    }

    return results;
  }
}