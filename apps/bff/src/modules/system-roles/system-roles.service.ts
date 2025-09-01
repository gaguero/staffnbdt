import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { PermissionService } from '../../shared/services/permission.service';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

export interface SystemRoleAssignmentDto {
  userId: string;
  role: Role;
  reason?: string;
}

export interface BulkSystemRoleAssignmentDto {
  assignments: SystemRoleAssignmentDto[];
  reason?: string;
}

export interface SystemRoleInfo {
  role: Role;
  name: string;
  description: string;
  level: number;
  userType: 'INTERNAL' | 'CLIENT' | 'VENDOR';
  capabilities: string[];
  userCount?: number;
  assignable?: boolean;
}

@Injectable()
export class SystemRolesService {
  private readonly logger = new Logger(SystemRolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Get all system roles with information and assignability
   */
  async getAllSystemRoles(currentUser: CurrentUser): Promise<SystemRoleInfo[]> {
    this.logger.debug(`Getting all system roles for user ${currentUser.id} (${currentUser.role})`);

    const roles = this.permissionService.getAllSystemRoles();
    const assignableRoles = this.permissionService.getAssignableRoles(currentUser.role);

    // Get user counts for each role
    const roleCounts = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      where: { deletedAt: null }
    });

    const countMap = roleCounts.reduce((map, count) => {
      map[count.role] = count._count.id;
      return map;
    }, {} as Record<string, number>);

    return roles.map(({ role, info }) => ({
      role,
      ...info,
      userCount: countMap[role] || 0,
      assignable: assignableRoles.includes(role)
    }));
  }

  /**
   * Get system role information for a specific role
   */
  async getSystemRoleInfo(role: Role, currentUser: CurrentUser): Promise<SystemRoleInfo> {
    this.logger.debug(`Getting role info for ${role}`);

    const roleInfo = this.permissionService.getSystemRoleInfo(role);
    const assignableRoles = this.permissionService.getAssignableRoles(currentUser.role);

    // Get user count for this role
    const userCount = await this.prisma.user.count({
      where: {
        role,
        deletedAt: null
      }
    });

    return {
      role,
      ...roleInfo,
      userCount,
      assignable: assignableRoles.includes(role)
    };
  }

  /**
   * Assign system role to user
   */
  async assignSystemRole(
    assignment: SystemRoleAssignmentDto,
    currentUser: CurrentUser,
  ): Promise<User> {
    this.logger.debug(`Assigning role ${assignment.role} to user ${assignment.userId} by ${currentUser.id}`);

    // Validate that current user can assign this role
    if (!this.permissionService.canAssignRole(currentUser.role, assignment.role)) {
      throw new ForbiddenException(
        `You cannot assign role ${assignment.role}. Your role ${currentUser.role} does not have sufficient privileges.`
      );
    }

    // Find the target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: assignment.userId }
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${assignment.userId} not found`);
    }

    // Prevent users from elevating their own role beyond their level
    if (targetUser.id === currentUser.id) {
      const currentLevel = this.permissionService.getSystemRoleInfo(currentUser.role).level;
      const targetLevel = this.permissionService.getSystemRoleInfo(assignment.role).level;
      
      if (targetLevel > currentLevel) {
        throw new BadRequestException('You cannot assign yourself a role higher than your current role');
      }
    }

    // Validate role compatibility with user type
    const roleInfo = this.permissionService.getSystemRoleInfo(assignment.role);
    if (!this.isRoleCompatibleWithUser(targetUser, assignment.role)) {
      throw new BadRequestException(
        `Role ${assignment.role} is not compatible with user's current configuration`
      );
    }

    // Clear the user's permission cache before changing role
    this.permissionService.clearUserPermissionCache(targetUser.id);

    // Update the user's role
    const updatedUser = await this.prisma.user.update({
      where: { id: assignment.userId },
      data: {
        role: assignment.role,
        userType: roleInfo.userType === 'INTERNAL' ? 'INTERNAL' : 
                  roleInfo.userType === 'CLIENT' ? 'CLIENT' : 'VENDOR'
      },
      include: {
        organization: true,
        property: true,
        department: true,
        userCustomRoles: {
          include: { role: true }
        }
      }
    });

    // Log the role change
    await this.prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'ROLE_ASSIGNMENT',
        entity: 'User',
        entityId: targetUser.id,
        oldData: { role: targetUser.role },
        newData: { role: assignment.role, reason: assignment.reason },
        propertyId: currentUser.propertyId,
      }
    });

    this.logger.log(`Role ${assignment.role} assigned to user ${assignment.userId} by ${currentUser.id}`);
    return updatedUser;
  }

  /**
   * Bulk assign system roles
   */
  async bulkAssignSystemRoles(
    bulkAssignment: BulkSystemRoleAssignmentDto,
    currentUser: CurrentUser,
  ): Promise<{ successful: User[]; failed: Array<{ userId: string; error: string }> }> {
    this.logger.debug(`Bulk assigning roles for ${bulkAssignment.assignments.length} users`);

    const successful: User[] = [];
    const failed: Array<{ userId: string; error: string }> = [];

    for (const assignment of bulkAssignment.assignments) {
      try {
        const updatedUser = await this.assignSystemRole(
          { ...assignment, reason: assignment.reason || bulkAssignment.reason },
          currentUser
        );
        successful.push(updatedUser);
      } catch (error) {
        this.logger.error(`Failed to assign role to user ${assignment.userId}: ${error.message}`);
        failed.push({
          userId: assignment.userId,
          error: error.message
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Get users by system role
   */
  async getUsersByRole(role: Role, currentUser: CurrentUser): Promise<User[]> {
    this.logger.debug(`Getting users with role ${role}`);

    // Apply tenant filtering based on current user's permissions
    const whereClause: any = {
      role,
      deletedAt: null
    };

    // Apply tenant scope based on current user role
    if (currentUser.role !== Role.PLATFORM_ADMIN) {
      if (currentUser.organizationId) {
        whereClause.organizationId = currentUser.organizationId;
      }
      
      if ((currentUser.role === Role.PROPERTY_MANAGER || currentUser.role === Role.DEPARTMENT_ADMIN) && currentUser.propertyId) {
        whereClause.propertyId = currentUser.propertyId;
      }
    }

    return this.prisma.user.findMany({
      where: whereClause,
      include: {
        organization: true,
        property: true,
        department: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
  }

  /**
   * Get role assignment history for a user
   */
  async getUserRoleHistory(userId: string, currentUser: CurrentUser): Promise<any[]> {
    // Verify current user can access this user's data
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Apply access control
    if (currentUser.role !== Role.PLATFORM_ADMIN) {
      if (targetUser.organizationId !== currentUser.organizationId) {
        throw new ForbiddenException('Access denied to user from different organization');
      }
    }

    return this.prisma.auditLog.findMany({
      where: {
        entityId: userId,
        action: 'ROLE_ASSIGNMENT',
        entity: 'User'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  /**
   * Get role statistics
   */
  async getRoleStatistics(currentUser: CurrentUser): Promise<{
    totalUsers: number;
    roleDistribution: Array<{ role: Role; count: number; percentage: number }>;
    recentRoleChanges: number;
  }> {
    // Apply tenant filtering
    const whereClause: any = { deletedAt: null };
    
    if (currentUser.role !== Role.PLATFORM_ADMIN) {
      if (currentUser.organizationId) {
        whereClause.organizationId = currentUser.organizationId;
      }
    }

    // Get total users
    const totalUsers = await this.prisma.user.count({ where: whereClause });

    // Get role distribution
    const roleDistribution = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      where: whereClause
    });

    const distribution = roleDistribution.map(item => ({
      role: item.role,
      count: item._count.id,
      percentage: totalUsers > 0 ? Math.round((item._count.id / totalUsers) * 100) : 0
    }));

    // Get recent role changes (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRoleChanges = await this.prisma.auditLog.count({
      where: {
        action: 'ROLE_ASSIGNMENT',
        entity: 'User',
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    return {
      totalUsers,
      roleDistribution: distribution,
      recentRoleChanges
    };
  }

  /**
   * Validate if role is compatible with user configuration
   */
  private isRoleCompatibleWithUser(user: User, role: Role): boolean {
    const roleInfo = this.permissionService.getSystemRoleInfo(role);
    
    // External roles (CLIENT, VENDOR) should have appropriate user types
    if (roleInfo.userType === 'CLIENT' && user.userType !== 'CLIENT') {
      return false;
    }
    
    if (roleInfo.userType === 'VENDOR' && user.userType !== 'VENDOR') {
      return false;
    }

    // Internal roles should be INTERNAL user type
    if (roleInfo.userType === 'INTERNAL' && !['INTERNAL', 'PARTNER'].includes(user.userType)) {
      return false;
    }

    // Department-level roles need department assignment
    if ((role === Role.DEPARTMENT_ADMIN || role === Role.STAFF) && !user.departmentId) {
      // Allow this for now, can be assigned later
    }

    return true;
  }

  /**
   * Get effective permissions for a user after role assignment (preview)
   */
  async previewRolePermissions(role: Role): Promise<{
    role: Role;
    roleInfo: ReturnType<typeof this.permissionService.getSystemRoleInfo>;
    permissions: string[];
  }> {
    const roleInfo = this.permissionService.getSystemRoleInfo(role);
    const permissions = this.permissionService.mapRoleToPermissions(role);

    return {
      role,
      roleInfo,
      permissions
    };
  }
}