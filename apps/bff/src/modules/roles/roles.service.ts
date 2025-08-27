import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import { 
  CustomRole, 
  UserCustomRole, 
  RolePermission, 
  User,
  Prisma 
} from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PermissionService } from '../permissions/permission.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleAssignmentDto,
  BulkRoleAssignmentDto,
  BulkRoleRemovalDto,
  RoleFilterDto,
  UserRoleFilterDto
} from './dto';

interface RoleWithPermissions extends CustomRole {
  permissions: (RolePermission & {
    permission: {
      id: string;
      resource: string;
      action: string;
      scope: string;
      name?: string;
      description?: string;
    };
  })[];
  userRoles?: UserCustomRole[];
  _count?: {
    userRoles: number;
  };
}

interface UserRoleWithRelations extends UserCustomRole {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto?: string;
  };
  role: RoleWithPermissions;
}

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Get all roles with filtering and pagination
   */
  async findAll(filterDto: RoleFilterDto, currentUser: User) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        organizationId,
        propertyId,
        isActive,
        includeSystemRoles = false,
        sortBy = 'name',
        sortDirection = 'asc'
      } = filterDto;

      // Build where clause based on user's permissions and tenant context
      const where: Prisma.CustomRoleWhereInput = {
        deletedAt: null,
        ...this.buildTenantFilters(currentUser, organizationId, propertyId),
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (!includeSystemRoles) {
        where.isSystemRole = false;
      }

      const orderBy: Prisma.CustomRoleOrderByWithRelationInput = {};
      if (sortBy === 'name') orderBy.name = sortDirection;
      else if (sortBy === 'priority') orderBy.priority = sortDirection;
      else if (sortBy === 'createdAt') orderBy.createdAt = sortDirection;
      else orderBy.name = 'asc';

      const [roles, total] = await Promise.all([
        this.prisma.customRole.findMany({
          where,
          include: {
            permissions: {
              include: {
                permission: {
                  select: {
                    id: true,
                    resource: true,
                    action: true,
                    scope: true,
                    name: true,
                    description: true,
                  },
                },
              },
              where: { granted: true },
            },
            _count: {
              select: { userRoles: { where: { isActive: true } } },
            },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.customRole.count({ where }),
      ]);

      // Transform to match frontend interface
      const transformedRoles = roles.map(role => this.transformRoleForFrontend(role));

      return {
        data: transformedRoles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error finding roles:', error);
      throw error;
    }
  }

  /**
   * Get single role by ID
   */
  async findOne(id: string, currentUser: User) {
    try {
      const role = await this.prisma.customRole.findFirst({
        where: {
          id,
          deletedAt: null,
          ...this.buildTenantFilters(currentUser),
        },
        include: {
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  resource: true,
                  action: true,
                  scope: true,
                  name: true,
                  description: true,
                },
              },
            },
            where: { granted: true },
          },
          userRoles: {
            where: { isActive: true },
          },
          _count: {
            select: { userRoles: { where: { isActive: true } } },
          },
        },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      return this.transformRoleForFrontend(role);
    } catch (error) {
      this.logger.error(`Error finding role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async create(createRoleDto: CreateRoleDto, currentUser: User) {
    try {
      const {
        name,
        description,
        priority = 100,
        permissions = [],
        organizationId,
        propertyId,
        metadata,
        isActive = true
      } = createRoleDto;

      // Apply tenant context
      const tenantContext = this.getTenantContext(currentUser, organizationId, propertyId);

      // Check if role name already exists in the same tenant context
      const existingRole = await this.prisma.customRole.findFirst({
        where: {
          name,
          organizationId: tenantContext.organizationId,
          propertyId: tenantContext.propertyId,
          deletedAt: null,
        },
      });

      if (existingRole) {
        throw new ConflictException('A role with this name already exists in this context');
      }

      // Validate permissions exist
      if (permissions.length > 0) {
        const validPermissions = await this.prisma.permission.findMany({
          where: { id: { in: permissions } },
          select: { id: true },
        });

        if (validPermissions.length !== permissions.length) {
          throw new BadRequestException('Some provided permissions are invalid');
        }
      }

      // Create role in transaction
      const role = await this.prisma.$transaction(async (tx) => {
        // Create the role
        const createdRole = await tx.customRole.create({
          data: {
            name,
            description,
            priority,
            organizationId: tenantContext.organizationId,
            propertyId: tenantContext.propertyId,
            isActive,
            metadata,
          },
        });

        // Assign permissions
        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map(permissionId => ({
              roleId: createdRole.id,
              permissionId,
              granted: true,
            })),
          });
        }

        return createdRole;
      });

      // Audit log
      await this.auditService.logCreate(
        currentUser.id,
        'CustomRole',
        role.id,
        role
      );

      this.logger.log(`Role created: ${role.name} (${role.id}) by user ${currentUser.id}`);

      // Return with full details
      return this.findOne(role.id, currentUser);
    } catch (error) {
      this.logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async update(id: string, updateRoleDto: UpdateRoleDto, currentUser: User) {
    try {
      const existingRole = await this.prisma.customRole.findFirst({
        where: {
          id,
          deletedAt: null,
          ...this.buildTenantFilters(currentUser),
        },
      });

      if (!existingRole) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      // Check if it's a system role and prevent certain changes
      if (existingRole.isSystemRole) {
        throw new BadRequestException('System roles cannot be modified');
      }

      const { name, permissions, ...otherUpdates } = updateRoleDto;

      // Check name uniqueness if changing name
      if (name && name !== existingRole.name) {
        const nameExists = await this.prisma.customRole.findFirst({
          where: {
            name,
            organizationId: existingRole.organizationId,
            propertyId: existingRole.propertyId,
            deletedAt: null,
            id: { not: id },
          },
        });

        if (nameExists) {
          throw new ConflictException('A role with this name already exists in this context');
        }
      }

      // Validate permissions if provided
      if (permissions && permissions.length > 0) {
        const validPermissions = await this.prisma.permission.findMany({
          where: { id: { in: permissions } },
          select: { id: true },
        });

        if (validPermissions.length !== permissions.length) {
          throw new BadRequestException('Some provided permissions are invalid');
        }
      }

      // Update role in transaction
      const updatedRole = await this.prisma.$transaction(async (tx) => {
        // Update role
        const role = await tx.customRole.update({
          where: { id },
          data: {
            ...otherUpdates,
            ...(name && { name }),
          },
        });

        // Update permissions if provided
        if (permissions !== undefined) {
          // Remove existing permissions
          await tx.rolePermission.deleteMany({
            where: { roleId: id },
          });

          // Add new permissions
          if (permissions.length > 0) {
            await tx.rolePermission.createMany({
              data: permissions.map(permissionId => ({
                roleId: id,
                permissionId,
                granted: true,
              })),
            });
          }
        }

        return role;
      });

      // Audit log
      await this.auditService.logUpdate(
        currentUser.id,
        'CustomRole',
        id,
        existingRole,
        updatedRole
      );

      this.logger.log(`Role updated: ${updatedRole.name} (${id}) by user ${currentUser.id}`);

      // Clear permission caches for users with this role
      await this.clearRolePermissionCaches(id);

      return this.findOne(id, currentUser);
    } catch (error) {
      this.logger.error(`Error updating role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a role (soft delete)
   */
  async remove(id: string, currentUser: User) {
    try {
      const role = await this.prisma.customRole.findFirst({
        where: {
          id,
          deletedAt: null,
          ...this.buildTenantFilters(currentUser),
        },
        include: {
          userRoles: { where: { isActive: true } },
        },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      if (role.isSystemRole) {
        throw new BadRequestException('System roles cannot be deleted');
      }

      if (role.userRoles.length > 0) {
        throw new BadRequestException('Cannot delete role that is assigned to users');
      }

      const deletedRole = await this.prisma.customRole.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      // Audit log
      await this.auditService.logDelete(
        currentUser.id,
        'CustomRole',
        id,
        role
      );

      this.logger.log(`Role deleted: ${role.name} (${id}) by user ${currentUser.id}`);

      return deletedRole;
    } catch (error) {
      this.logger.error(`Error deleting role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  async getStats(currentUser: User) {
    try {
      const tenantFilter = this.buildTenantFilters(currentUser);

      const [
        totalRoles,
        totalAssignments,
        roleAssignments,
        recentAssignments
      ] = await Promise.all([
        // Total roles
        this.prisma.customRole.count({
          where: {
            deletedAt: null,
            ...tenantFilter,
          },
        }),
        
        // Total active assignments
        this.prisma.userCustomRole.count({
          where: {
            isActive: true,
            role: {
              deletedAt: null,
              ...tenantFilter,
            },
          },
        }),

        // Assignments by role
        this.prisma.userCustomRole.groupBy({
          by: ['roleId'],
          where: {
            isActive: true,
            role: {
              deletedAt: null,
              ...tenantFilter,
            },
          },
          _count: { id: true },
        }),

        // Recent assignments (last 10)
        this.prisma.userCustomRole.findMany({
          where: {
            isActive: true,
            role: {
              deletedAt: null,
              ...tenantFilter,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                priority: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
          take: 10,
        })
      ]);

      // Transform role assignment counts
      const assignmentsByRole = roleAssignments.reduce((acc, assignment) => {
        acc[assignment.roleId] = assignment._count.id;
        return acc;
      }, {} as Record<string, number>);

      // Group by priority levels for level stats
      const roles = await this.prisma.customRole.findMany({
        where: {
          deletedAt: null,
          ...tenantFilter,
        },
        select: { id: true, priority: true },
      });

      const assignmentsByLevel = roles.reduce((acc, role) => {
        const level = this.getPriorityLevel(role.priority);
        acc[level] = (acc[level] || 0) + (assignmentsByRole[role.id] || 0);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRoles,
        totalAssignments,
        assignmentsByRole,
        assignmentsByLevel,
        recentAssignments: recentAssignments.map(assignment => ({
          id: assignment.id,
          userId: assignment.userId,
          roleId: assignment.roleId,
          user: assignment.user,
          role: {
            ...assignment.role,
            permissions: [],
            userCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          assignedAt: assignment.assignedAt,
          assignedBy: assignment.assignedBy || 'System',
        })),
      };
    } catch (error) {
      this.logger.error('Error getting role stats:', error);
      throw error;
    }
  }

  /**
   * Get user role assignments
   */
  async getUserRoles(filterDto: UserRoleFilterDto, currentUser: User) {
    try {
      const {
        userId,
        roleId,
        isActive,
        page = 1,
        limit = 10
      } = filterDto;

      const where: Prisma.UserCustomRoleWhereInput = {
        role: {
          deletedAt: null,
          ...this.buildTenantFilters(currentUser),
        },
      };

      if (userId) where.userId = userId;
      if (roleId) where.roleId = roleId;
      if (isActive !== undefined) where.isActive = isActive;

      const [assignments, total] = await Promise.all([
        this.prisma.userCustomRole.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
              },
            },
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      select: {
                        id: true,
                        resource: true,
                        action: true,
                        scope: true,
                        name: true,
                        description: true,
                      },
                    },
                  },
                  where: { granted: true },
                },
                _count: {
                  select: { userRoles: { where: { isActive: true } } },
                },
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.userCustomRole.count({ where }),
      ]);

      const transformedAssignments = assignments.map(assignment => ({
        id: assignment.id,
        userId: assignment.userId,
        roleId: assignment.roleId,
        user: {
          id: assignment.user.id,
          firstName: assignment.user.firstName,
          lastName: assignment.user.lastName,
          email: assignment.user.email,
          avatar: assignment.user.profilePhoto,
        },
        role: this.transformRoleForFrontend(assignment.role),
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy || 'System',
      }));

      return {
        data: transformedAssignments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error getting user roles:', error);
      throw error;
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRole(assignmentDto: RoleAssignmentDto, currentUser: User) {
    try {
      const { userId, roleId, expiresAt, conditions, metadata } = assignmentDto;

      // Validate user exists and is in the same tenant context
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
          ...this.buildUserTenantFilters(currentUser),
        },
      });

      if (!user) {
        throw new NotFoundException('User not found or not accessible');
      }

      // Validate role exists and is in the same tenant context
      const role = await this.prisma.customRole.findFirst({
        where: {
          id: roleId,
          deletedAt: null,
          isActive: true,
          ...this.buildTenantFilters(currentUser),
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found or not accessible');
      }

      // Check if assignment already exists
      const existingAssignment = await this.prisma.userCustomRole.findUnique({
        where: {
          userId_roleId: { userId, roleId },
        },
      });

      let assignment: UserCustomRole;

      if (existingAssignment) {
        // Update existing assignment
        assignment = await this.prisma.userCustomRole.update({
          where: { id: existingAssignment.id },
          data: {
            isActive: true,
            assignedBy: currentUser.id,
            assignedAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            conditions,
            metadata,
          },
        });
      } else {
        // Create new assignment
        assignment = await this.prisma.userCustomRole.create({
          data: {
            userId,
            roleId,
            assignedBy: currentUser.id,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            conditions,
            metadata,
          },
        });
      }

      // Clear user permission cache
      await this.permissionService.clearUserPermissionCache(userId);

      // Audit log
      await this.auditService.logCreate(
        currentUser.id,
        'UserCustomRole',
        assignment.id,
        assignment
      );

      this.logger.log(`Role ${roleId} assigned to user ${userId} by ${currentUser.id}`);

      // Return full assignment details
      return this.getUserRoleById(assignment.id, currentUser);
    } catch (error) {
      this.logger.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Remove role assignment
   */
  async removeUserRole(userRoleId: string, currentUser: User) {
    try {
      const assignment = await this.prisma.userCustomRole.findFirst({
        where: {
          id: userRoleId,
          role: {
            deletedAt: null,
            ...this.buildTenantFilters(currentUser),
          },
        },
        include: { role: true },
      });

      if (!assignment) {
        throw new NotFoundException('Role assignment not found');
      }

      if (assignment.role.isSystemRole) {
        throw new BadRequestException('Cannot remove system role assignments');
      }

      await this.prisma.userCustomRole.update({
        where: { id: userRoleId },
        data: {
          isActive: false,
          metadata: {
            ...(assignment.metadata as object || {}),
            removedBy: currentUser.id,
            removedAt: new Date(),
          },
        },
      });

      // Clear user permission cache
      await this.permissionService.clearUserPermissionCache(assignment.userId);

      // Audit log
      await this.auditService.logDelete(
        currentUser.id,
        'UserCustomRole',
        userRoleId,
        assignment
      );

      this.logger.log(`Role assignment ${userRoleId} removed by user ${currentUser.id}`);
    } catch (error) {
      this.logger.error(`Error removing role assignment ${userRoleId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk assign roles
   */
  async bulkAssignRoles(bulkDto: BulkRoleAssignmentDto, currentUser: User) {
    try {
      const { assignments } = bulkDto;
      const results = [];
      const errors = [];

      for (const assignment of assignments) {
        try {
          const result = await this.assignRole(assignment, currentUser);
          results.push(result);
        } catch (error) {
          errors.push({
            assignment,
            error: error.message,
          });
        }
      }

      return {
        successful: results,
        failed: errors,
        summary: {
          total: assignments.length,
          successful: results.length,
          failed: errors.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in bulk role assignment:', error);
      throw error;
    }
  }

  /**
   * Bulk remove role assignments
   */
  async bulkRemoveRoles(bulkDto: BulkRoleRemovalDto, currentUser: User) {
    try {
      const { userRoleIds } = bulkDto;
      const results = [];
      const errors = [];

      for (const userRoleId of userRoleIds) {
        try {
          await this.removeUserRole(userRoleId, currentUser);
          results.push(userRoleId);
        } catch (error) {
          errors.push({
            userRoleId,
            error: error.message,
          });
        }
      }

      return {
        successful: results,
        failed: errors,
        summary: {
          total: userRoleIds.length,
          successful: results.length,
          failed: errors.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in bulk role removal:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getUserRoleById(id: string, currentUser: User) {
    const assignment = await this.prisma.userCustomRole.findFirst({
      where: {
        id,
        role: {
          deletedAt: null,
          ...this.buildTenantFilters(currentUser),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true,
          },
        },
        role: {
          include: {
            permissions: {
              include: {
                permission: {
                  select: {
                    id: true,
                    resource: true,
                    action: true,
                    scope: true,
                    name: true,
                    description: true,
                  },
                },
              },
              where: { granted: true },
            },
            _count: {
              select: { userRoles: { where: { isActive: true } } },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Role assignment not found');
    }

    return {
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      user: {
        id: assignment.user.id,
        firstName: assignment.user.firstName,
        lastName: assignment.user.lastName,
        email: assignment.user.email,
        avatar: assignment.user.profilePhoto,
      },
      role: this.transformRoleForFrontend(assignment.role),
      assignedAt: assignment.assignedAt,
      assignedBy: assignment.assignedBy || 'System',
    };
  }

  private buildTenantFilters(currentUser: User, organizationId?: string, propertyId?: string) {
    const filters: Prisma.CustomRoleWhereInput = {};

    // If specific tenant IDs are provided, use those (for admin operations)
    if (organizationId || propertyId) {
      if (organizationId) filters.organizationId = organizationId;
      if (propertyId) filters.propertyId = propertyId;
      return filters;
    }

    // Otherwise, filter based on user's context
    if (currentUser.organizationId) {
      filters.organizationId = currentUser.organizationId;
    }

    if (currentUser.propertyId) {
      filters.propertyId = currentUser.propertyId;
    }

    return filters;
  }

  private buildUserTenantFilters(currentUser: User, organizationId?: string, propertyId?: string): Prisma.UserWhereInput {
    const filters: Prisma.UserWhereInput = {};

    // If specific tenant IDs are provided, use those (for admin operations)
    if (organizationId || propertyId) {
      if (organizationId) filters.organizationId = organizationId;
      if (propertyId) filters.propertyId = propertyId;
      return filters;
    }

    // Otherwise, filter based on user's context
    if (currentUser.organizationId) {
      filters.organizationId = currentUser.organizationId;
    }

    if (currentUser.propertyId) {
      filters.propertyId = currentUser.propertyId;
    }

    return filters;
  }

  private getTenantContext(currentUser: User, organizationId?: string, propertyId?: string) {
    return {
      organizationId: organizationId || currentUser.organizationId,
      propertyId: propertyId || currentUser.propertyId,
    };
  }

  private transformRoleForFrontend(role: RoleWithPermissions) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      level: role.priority, // Map priority to level for frontend compatibility
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
        scope: rp.permission.scope,
        description: rp.permission.description,
      })),
      userCount: role._count?.userRoles || role.userRoles?.length || 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  private getPriorityLevel(priority: number): string {
    if (priority >= 900) return 'Executive';
    if (priority >= 700) return 'Management';
    if (priority >= 500) return 'Supervisor';
    if (priority >= 300) return 'Senior Staff';
    return 'Staff';
  }

  private async clearRolePermissionCaches(roleId: string) {
    try {
      // Get all users with this role
      const usersWithRole = await this.prisma.userCustomRole.findMany({
        where: { roleId, isActive: true },
        select: { userId: true },
      });

      // Clear cache for each user
      for (const { userId } of usersWithRole) {
        await this.permissionService.clearUserPermissionCache(userId);
      }
    } catch (error) {
      this.logger.error(`Error clearing permission caches for role ${roleId}:`, error);
    }
  }
}