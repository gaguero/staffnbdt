import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { applySoftDelete } from '../../shared/utils/soft-delete';
import { 
  CreateInvitationDto, 
  AcceptInvitationDto, 
  InvitationFilterDto 
} from './dto';
import { 
  InvitationWithRelations, 
  InvitationStats, 
  InvitationEmailData 
} from './interfaces';
import { InvitationEmailService } from './email/invitation-email.service';
import { User, Role } from '@prisma/client';

// Local enum until Prisma generates the types
enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: InvitationEmailService,
    private readonly configService: ConfigService,
  ) {}

  // Helper method to access invitation model safely
  private get invitationModel() {
    return (this.prisma as any).invitation;
  }

  async create(
    createInvitationDto: CreateInvitationDto,
    currentUser: User,
  ): Promise<InvitationWithRelations> {
    // Permission checks
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Staff users cannot send invitations');
    }

    // Department admin validation
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      if (!createInvitationDto.departmentId) {
        throw new BadRequestException('Department admins must specify a department');
      }
      
      if (createInvitationDto.departmentId !== currentUser.departmentId) {
        throw new ForbiddenException('Department admins can only invite to their own department');
      }

      if (createInvitationDto.role === Role.PLATFORM_ADMIN) {
        throw new ForbiddenException('Department admins cannot invite superadmins');
      }
    }

    // Validate role and department assignment
    this.validateRoleDepartmentAssignment(createInvitationDto.role, createInvitationDto.departmentId);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createInvitationDto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check for existing pending invitation
    const existingInvitation = await this.invitationModel.findFirst({
      where: {
        email: createInvitationDto.email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    // Validate department exists if specified
    let department = null;
    if (createInvitationDto.departmentId) {
      department = await this.prisma.department.findUnique({
        where: { id: createInvitationDto.departmentId },
      });

      if (!department) {
        throw new BadRequestException('Department not found');
      }
    }

    // Generate unique token
    const token = this.generateInvitationToken();
    const expiryDays = parseInt(this.configService.get('INVITATION_EXPIRY_DAYS', '7'));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create invitation
    const invitation = await this.invitationModel.create({
      data: {
        email: createInvitationDto.email,
        token,
        role: createInvitationDto.role,
        departmentId: createInvitationDto.departmentId,
        invitedBy: currentUser.id,
        expiresAt,
      },
      include: {
        department: true,
        invitedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send invitation email
    try {
      const emailData: InvitationEmailData = {
        email: invitation.email,
        inviterName: `${invitation.invitedByUser.firstName} ${invitation.invitedByUser.lastName}`,
        departmentName: invitation.department?.name,
        role: invitation.role,
        invitationUrl: this.generateInvitationUrl(token),
        expiryDays,
        message: createInvitationDto.message,
      };

      await this.emailService.sendInvitation(emailData);
    } catch (error) {
      // Log email error but don't fail the invitation creation
      console.error('Failed to send invitation email:', error);
    }

    // Log invitation creation
    await this.auditService.logCreate(currentUser.id, 'Invitation', invitation.id, {
      email: invitation.email,
      role: invitation.role,
      departmentId: invitation.departmentId,
    });

    return invitation;
  }

  async findAll(
    filterDto: InvitationFilterDto,
    currentUser: User,
  ): Promise<PaginatedResponse<InvitationWithRelations>> {
    // Permission checks
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Staff users cannot view invitations');
    }

    const { limit, offset, status, role, departmentId, search } = filterDto;

    // Build where clause
    let whereClause: any = {};

    // Apply role-based filtering
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      whereClause.departmentId = currentUser.departmentId;
    }

    // Apply filters
    if (status) {
      whereClause.status = status;
    }

    if (role) {
      whereClause.role = role;
    }

    if (departmentId) {
      // Ensure department admin can't access other departments
      if (currentUser.role === Role.DEPARTMENT_ADMIN && currentUser.departmentId !== departmentId) {
        throw new ForbiddenException('Cannot access invitations from other departments');
      }
      whereClause.departmentId = departmentId;
    }

    if (search) {
      whereClause.email = { contains: search, mode: 'insensitive' };
    }

    const [invitations, total] = await Promise.all([
      this.invitationModel.findMany({
        where: whereClause,
        include: {
          department: true,
          invitedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          acceptedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.invitationModel.count({ where: whereClause }),
    ]);

    return new PaginatedResponse(invitations, total, limit, offset);
  }

  async findByToken(token: string): Promise<InvitationWithRelations> {
    const invitation = await this.invitationModel.findFirst({
      where: {
        token,
        status: InvitationStatus.PENDING,
      },
      include: {
        department: true,
        invitedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await this.invitationModel.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  async acceptInvitation(
    token: string,
    acceptDto: AcceptInvitationDto,
  ): Promise<{ user: User; invitation: InvitationWithRelations }> {
    const invitation = await this.findByToken(token);

    // Check if user already exists (race condition protection)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new ConflictException('User account already exists for this email');
    }

    // Create user and update invitation in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Get inviter's tenant context to assign the new user to the same tenant
      const inviter = await tx.user.findUnique({
        where: { id: invitation.invitedBy },
        select: { organizationId: true, propertyId: true }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          firstName: acceptDto.firstName,
          lastName: acceptDto.lastName,
          role: invitation.role,
          departmentId: invitation.departmentId,
          organizationId: inviter?.organizationId,
          propertyId: inviter?.propertyId,
          position: acceptDto.position,
          phoneNumber: acceptDto.phoneNumber,
          emergencyContact: acceptDto.emergencyContact,
          hireDate: new Date(),
        },
        include: {
          department: true,
        },
      });

      // Update invitation status
      const updatedInvitation = await (tx as any).invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedBy: user.id,
        },
        include: {
          department: true,
          invitedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          acceptedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return { user, invitation: updatedInvitation };
    });

    // Log user creation
    await this.auditService.logCreate(result.user.id, 'User', result.user.id, result.user);
    
    // Log invitation acceptance
    await this.auditService.logUpdate(
      result.user.id,
      'Invitation',
      invitation.id,
      { status: InvitationStatus.PENDING },
      { status: InvitationStatus.ACCEPTED, acceptedBy: result.user.id },
    );

    return result;
  }

  async resendInvitation(
    id: string,
    currentUser: User,
  ): Promise<InvitationWithRelations> {
    // Permission checks
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Staff users cannot resend invitations');
    }

    const invitation = await this.invitationModel.findUnique({
      where: { id },
      include: {
        department: true,
        invitedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Department admin validation
    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      invitation.departmentId !== currentUser.departmentId
    ) {
      throw new ForbiddenException('Cannot resend invitations from other departments');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only resend pending invitations');
    }

    // Generate new token and extend expiry
    const newToken = this.generateInvitationToken();
    const expiryDays = parseInt(this.configService.get('INVITATION_EXPIRY_DAYS', '7'));
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + expiryDays);

    // Update invitation
    const updatedInvitation = await this.invitationModel.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
      include: {
        department: true,
        invitedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send new invitation email
    try {
      const emailData: InvitationEmailData = {
        email: updatedInvitation.email,
        inviterName: `${updatedInvitation.invitedByUser.firstName} ${updatedInvitation.invitedByUser.lastName}`,
        departmentName: updatedInvitation.department?.name,
        role: updatedInvitation.role,
        invitationUrl: this.generateInvitationUrl(newToken),
        expiryDays,
      };

      await this.emailService.sendInvitationReminder(emailData);
    } catch (error) {
      console.error('Failed to send invitation reminder:', error);
    }

    // Log resend action
    await this.auditService.log({
      userId: currentUser.id,
      action: 'RESEND',
      entity: 'Invitation',
      entityId: id,
      newData: { token: newToken, expiresAt: newExpiresAt },
    });

    return updatedInvitation;
  }

  async cancelInvitation(id: string, currentUser: User): Promise<void> {
    // Permission checks
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Staff users cannot cancel invitations');
    }

    const invitation = await this.invitationModel.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Department admin validation
    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      invitation.departmentId !== currentUser.departmentId
    ) {
      throw new ForbiddenException('Cannot cancel invitations from other departments');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending invitations');
    }

    // Update invitation status
    await this.invitationModel.update({
      where: { id },
      data: {
        status: InvitationStatus.CANCELLED,
      },
    });

    // Log cancellation
    await this.auditService.logUpdate(
      currentUser.id,
      'Invitation',
      id,
      { status: InvitationStatus.PENDING },
      { status: InvitationStatus.CANCELLED },
    );
  }

  async getInvitationStats(currentUser: User): Promise<InvitationStats> {
    // Permission checks
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Staff users cannot access invitation statistics');
    }

    let whereClause: any = {};

    // Department admin sees only their department
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      whereClause.departmentId = currentUser.departmentId;
    }

    const [total, byStatus, byRole, byDepartment] = await Promise.all([
      this.invitationModel.count({ where: whereClause }),
      this.invitationModel.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),
      this.invitationModel.groupBy({
        by: ['role'],
        where: whereClause,
        _count: true,
      }),
      this.invitationModel.groupBy({
        by: ['departmentId'],
        where: whereClause,
        _count: true,
      }),
    ]);

    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count;
      return acc;
    }, {});

    return {
      total,
      pending: statusCounts.pending || 0,
      accepted: statusCounts.accepted || 0,
      expired: statusCounts.expired || 0,
      cancelled: statusCounts.cancelled || 0,
      byRole: byRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {} as Record<Role, number>),
      byDepartment: byDepartment.reduce((acc, item) => {
        if (item.departmentId) {
          acc[item.departmentId] = item._count;
        }
        return acc;
      }, {}),
    };
  }

  /**
   * Cleanup expired invitations (can be called by a cron job)
   */
  async cleanupExpiredInvitations(): Promise<number> {
    const result = await this.invitationModel.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: {
        status: InvitationStatus.EXPIRED,
      },
    });

    return result.count;
  }

  private generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private generateInvitationUrl(token: string): string {
    const baseUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    return `${baseUrl}/invite/${token}`;
  }

  private validateRoleDepartmentAssignment(role: Role, departmentId?: string): void {
    if (role === Role.DEPARTMENT_ADMIN && !departmentId) {
      throw new BadRequestException('Department Admins must be assigned to a department');
    }

    if (role === Role.PLATFORM_ADMIN && departmentId) {
      throw new BadRequestException('Superadmins cannot be assigned to a specific department');
    }
  }
}