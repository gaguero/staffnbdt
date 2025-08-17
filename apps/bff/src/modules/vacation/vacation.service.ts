import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { User, Vacation, VacationType, VacationStatus, Role } from '@prisma/client';

interface CreateVacationDto {
  type: VacationType;
  startDate: string;
  endDate: string;
  reason?: string;
  attachments?: string[];
}

interface VacationFilterDto {
  limit?: number;
  offset?: number;
  status?: VacationStatus;
  type?: VacationType;
  userId?: string;
}

@Injectable()
export class VacationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(createVacationDto: CreateVacationDto, currentUser: User): Promise<Vacation> {
    const startDate = new Date(createVacationDto.startDate);
    const endDate = new Date(createVacationDto.endDate);

    // Validate dates
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Check for overlapping vacation requests
    const overlapping = await this.prisma.vacation.findFirst({
      where: {
        userId: currentUser.id,
        status: { in: [VacationStatus.PENDING, VacationStatus.APPROVED] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('You have an overlapping vacation request');
    }

    const vacation = await this.prisma.vacation.create({
      data: {
        userId: currentUser.id,
        propertyId: currentUser.propertyId!, // Use user's property
        type: createVacationDto.type,
        startDate,
        endDate,
        reason: createVacationDto.reason,
        attachments: createVacationDto.attachments || [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
      },
    });

    // Log vacation request
    await this.auditService.logCreate(currentUser.id, 'Vacation', vacation.id, vacation);

    return vacation;
  }

  async findAll(filterDto: VacationFilterDto, currentUser: User): Promise<PaginatedResponse<Vacation>> {
    const { limit = 10, offset = 0, status, type, userId } = filterDto;

    let whereClause: any = {};

    // Apply role-based filtering
    if (currentUser.role === Role.STAFF) {
      whereClause.userId = currentUser.id;
    } else if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      if (userId) {
        // Verify the user belongs to the same department
        const targetUser = await this.prisma.user.findUnique({
          where: { id: userId, deletedAt: null },
        });
        
        if (!targetUser || targetUser.departmentId !== currentUser.departmentId) {
          throw new ForbiddenException('Cannot access vacation requests from other departments');
        }
        whereClause.userId = userId;
      } else {
        whereClause.user = { departmentId: currentUser.departmentId, deletedAt: null };
      }
    } else if (userId) {
      whereClause.userId = userId;
    }

    // Apply additional filters
    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    const [vacations, total] = await Promise.all([
      this.prisma.vacation.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              departmentId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.vacation.count({ where: whereClause }),
    ]);

    return new PaginatedResponse(vacations, total, limit, offset);
  }

  async findOne(id: string, currentUser: User): Promise<Vacation> {
    const vacation = await this.prisma.vacation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
      },
    });

    if (!vacation) {
      throw new NotFoundException('Vacation request not found');
    }

    // Check access permissions
    if (currentUser.role === Role.STAFF && vacation.userId !== currentUser.id) {
      throw new ForbiddenException('Can only access your own vacation requests');
    }

    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      vacation.user.departmentId !== currentUser.departmentId
    ) {
      throw new ForbiddenException('Cannot access vacation requests from other departments');
    }

    return vacation;
  }

  async approve(id: string, currentUser: User): Promise<Vacation> {
    // Only admins can approve vacation requests
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Only admins can approve vacation requests');
    }

    const vacation = await this.findOne(id, currentUser);

    if (vacation.status !== VacationStatus.PENDING) {
      throw new BadRequestException('Can only approve pending vacation requests');
    }

    // Department admins cannot approve their own requests
    if (currentUser.role === Role.DEPARTMENT_ADMIN && vacation.userId === currentUser.id) {
      throw new ForbiddenException('Cannot approve your own vacation request');
    }

    const updatedVacation = await this.prisma.vacation.update({
      where: { id },
      data: {
        status: VacationStatus.APPROVED,
        approvedBy: currentUser.id,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
      },
    });

    // Log vacation approval
    await this.auditService.logUpdate(
      currentUser.id,
      'Vacation',
      id,
      vacation,
      updatedVacation,
    );

    return updatedVacation;
  }

  async reject(id: string, reason: string, currentUser: User): Promise<Vacation> {
    // Only admins can reject vacation requests
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Only admins can reject vacation requests');
    }

    const vacation = await this.findOne(id, currentUser);

    if (vacation.status !== VacationStatus.PENDING) {
      throw new BadRequestException('Can only reject pending vacation requests');
    }

    const updatedVacation = await this.prisma.vacation.update({
      where: { id },
      data: {
        status: VacationStatus.REJECTED,
        rejectedReason: reason,
        approvedBy: currentUser.id,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
      },
    });

    // Log vacation rejection
    await this.auditService.logUpdate(
      currentUser.id,
      'Vacation',
      id,
      vacation,
      updatedVacation,
    );

    return updatedVacation;
  }

  async cancel(id: string, currentUser: User): Promise<Vacation> {
    const vacation = await this.findOne(id, currentUser);

    // Only the user who created the request can cancel it
    if (vacation.userId !== currentUser.id) {
      throw new ForbiddenException('Can only cancel your own vacation requests');
    }

    if (vacation.status === VacationStatus.CANCELLED) {
      throw new BadRequestException('Vacation request is already cancelled');
    }

    const updatedVacation = await this.prisma.vacation.update({
      where: { id },
      data: {
        status: VacationStatus.CANCELLED,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
      },
    });

    // Log vacation cancellation
    await this.auditService.logUpdate(
      currentUser.id,
      'Vacation',
      id,
      vacation,
      updatedVacation,
    );

    return updatedVacation;
  }
}