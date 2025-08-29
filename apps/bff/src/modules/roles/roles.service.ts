import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { 
  CustomRole, 
  UserCustomRole, 
  RolePermission, 
  User,
  Role,
  UserType,
  UIRestriction,
  Prisma 
} from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PermissionService } from '../permissions/permission.service';
import { RolesHistoryService } from './roles-history.service';
import { RoleHistoryAction, RoleHistorySource } from './dto/role-history.dto';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleAssignmentDto,
  BulkRoleAssignmentDto,
  BulkRoleRemovalDto,
  RoleFilterDto,
  UserRoleFilterDto,
  CloneRoleDto,
  BulkCloneRoleDto,
  ClonePreviewDto
} from './dto';
import {
  CustomRoleBuilderDto,
  RoleTemplateDto,
  CloneRoleOptionsDto,
  UIRestrictionDto
} from './dto/custom-role-builder.dto';

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
  uiRestrictions?: UIRestriction[];
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
    @Inject(forwardRef(() => RolesHistoryService))
    private readonly historyService: RolesHistoryService,
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

      // Create role history entry
      await this.historyService.createHistoryEntry({
        action: existingAssignment ? RoleHistoryAction.MODIFIED : RoleHistoryAction.ASSIGNED,
        userId,
        roleId,
        userRoleId: assignment.id,
        adminId: currentUser.id,
        reason: metadata?.assignmentReason as string,
        context: {
          source: RoleHistorySource.MANUAL,
          operationType: 'role_assignment',
        },
        auditTrail: {
          requestId: `assign-${assignment.id}`,
        },
      });

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

      // Create role history entry
      await this.historyService.createHistoryEntry({
        action: RoleHistoryAction.REMOVED,
        userId: assignment.userId,
        roleId: assignment.roleId,
        userRoleId: assignment.id,
        adminId: currentUser.id,
        reason: (assignment.metadata as any)?.removalReason,
        context: {
          source: RoleHistorySource.MANUAL,
          operationType: 'role_removal',
        },
        auditTrail: {
          requestId: `remove-${assignment.id}`,
        },
      });

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
      const batchId = `bulk-assign-${Date.now()}-${currentUser.id}`;

      // Create bulk history entries for all assignments
      for (const assignment of assignments) {
        try {
          // Create history entry for bulk operation
          await this.historyService.createHistoryEntry({
            action: RoleHistoryAction.BULK_ASSIGNED,
            userId: assignment.userId,
            roleId: assignment.roleId,
            adminId: currentUser.id,
            reason: assignment.metadata?.assignmentReason as string,
            context: {
              source: RoleHistorySource.BULK,
              batchId,
              operationType: 'bulk_assignment',
            },
            auditTrail: {
              requestId: `bulk-${batchId}`,
            },
          });

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
      const batchId = `bulk-remove-${Date.now()}-${currentUser.id}`;

      // Create bulk history entries for all removals
      for (const userRoleId of userRoleIds) {
        try {
          // Get assignment details for history
          const assignment = await this.prisma.userCustomRole.findUnique({
            where: { id: userRoleId },
            select: { userId: true, roleId: true },
          });

          if (assignment) {
            await this.historyService.createHistoryEntry({
              action: RoleHistoryAction.BULK_REMOVED,
              userId: assignment.userId,
              roleId: assignment.roleId,
              userRoleId,
              adminId: currentUser.id,
              context: {
                source: RoleHistorySource.BULK,
                batchId,
                operationType: 'bulk_removal',
              },
              auditTrail: {
                requestId: `bulk-${batchId}`,
              },
            });
          }

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

  /**
   * Clone a role
   */
  async cloneRole(cloneRoleDto: CloneRoleDto, currentUser: User) {
    try {
      const { sourceRoleId, cloneType, newMetadata, permissionFilters, preserveLineage } = cloneRoleDto;

      // Get source role
      const sourceRole = await this.prisma.customRole.findFirst({
        where: {
          id: sourceRoleId,
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
                },
              },
            },
            where: { granted: true },
          },
        },
      });

      if (!sourceRole) {
        throw new NotFoundException('Source role not found');
      }

      // Apply tenant context
      const tenantContext = this.getTenantContext(currentUser);

      // Filter permissions based on clone configuration
      let permissionsToClone = sourceRole.permissions;
      if (permissionFilters) {
        // Apply permission filters (simplified implementation)
        permissionsToClone = sourceRole.permissions.filter(rp => {
          const permission = rp.permission;
          
          // Include/exclude based on categories
          if (permissionFilters.includeCategories?.length > 0) {
            if (!permissionFilters.includeCategories.includes(permission.resource)) {
              return false;
            }
          }
          
          if (permissionFilters.excludeCategories?.length > 0) {
            if (permissionFilters.excludeCategories.includes(permission.resource)) {
              return false;
            }
          }

          // Include/exclude based on scopes
          if (permissionFilters.includeScopes?.length > 0) {
            if (!permissionFilters.includeScopes.includes(permission.scope)) {
              return false;
            }
          }

          if (permissionFilters.excludeScopes?.length > 0) {
            if (permissionFilters.excludeScopes.includes(permission.scope)) {
              return false;
            }
          }

          return true;
        });
      }

      // Create cloned role
      const clonedRole = await this.prisma.$transaction(async (tx) => {
        const createdRole = await tx.customRole.create({
          data: {
            name: newMetadata.name,
            description: newMetadata.description,
            priority: newMetadata.level,
            organizationId: tenantContext.organizationId,
            propertyId: tenantContext.propertyId,
            isActive: true,
            metadata: {
              clonedFrom: sourceRoleId,
              cloneType,
              preserveLineage,
              clonedAt: new Date(),
              clonedBy: currentUser.id,
            },
          },
        });

        // Assign filtered permissions
        if (permissionsToClone.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionsToClone.map(rp => ({
              roleId: createdRole.id,
              permissionId: rp.permission.id,
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
        clonedRole.id,
        { ...clonedRole, clonedFrom: sourceRoleId }
      );

      this.logger.log(`Role cloned: ${sourceRole.name} -> ${clonedRole.name} (${clonedRole.id}) by user ${currentUser.id}`);

      return this.findOne(clonedRole.id, currentUser);
    } catch (error) {
      this.logger.error('Error cloning role:', error);
      throw error;
    }
  }

  /**
   * Batch clone roles
   */
  async batchCloneRoles(bulkCloneDto: BulkCloneRoleDto, currentUser: User) {
    try {
      const { sourceRoles, batchType, namePattern, variations, globalAdjustments } = bulkCloneDto;
      const results = [];
      const errors = [];

      for (const sourceRoleId of sourceRoles) {
        for (const variation of variations) {
          try {
            // Create clone DTO for this variation
            const cloneDto: CloneRoleDto = {
              sourceRoleId,
              cloneType: 'full' as any, // CloneType.FULL
              newMetadata: {
                name: namePattern.replace('{variation}', variation.name),
                description: `Cloned from source role for ${variation.name}`,
                level: 100, // Default level
              },
              permissionFilters: {
                includeCategories: [],
                excludeCategories: [],
                includeScopes: [],
                excludeScopes: [],
                customSelections: [],
              },
              preserveLineage: true,
            };

            const clonedRole = await this.cloneRole(cloneDto, currentUser);
            results.push(clonedRole);
          } catch (error) {
            errors.push({
              sourceRoleId,
              variation: variation.name,
              error: error.message,
            });
          }
        }
      }

      return {
        successful: results,
        failed: errors,
        summary: {
          total: sourceRoles.length * variations.length,
          successful: results.length,
          failed: errors.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in batch clone roles:', error);
      throw error;
    }
  }

  /**
   * Generate clone preview
   */
  async generateClonePreview(previewDto: ClonePreviewDto, currentUser: User) {
    try {
      const { sourceRoleId, cloneType, newMetadata, permissionFilters } = previewDto;

      // Get source role with permissions
      const sourceRole = await this.prisma.customRole.findFirst({
        where: {
          id: sourceRoleId,
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
        },
      });

      if (!sourceRole) {
        throw new NotFoundException('Source role not found');
      }

      // Filter permissions based on preview configuration
      let filteredPermissions = sourceRole.permissions;
      if (permissionFilters) {
        filteredPermissions = sourceRole.permissions.filter(rp => {
          const permission = rp.permission;
          
          // Apply filters (same logic as cloneRole)
          if (permissionFilters.includeCategories?.length > 0) {
            if (!permissionFilters.includeCategories.includes(permission.resource)) {
              return false;
            }
          }
          
          if (permissionFilters.excludeCategories?.length > 0) {
            if (permissionFilters.excludeCategories.includes(permission.resource)) {
              return false;
            }
          }

          if (permissionFilters.includeScopes?.length > 0) {
            if (!permissionFilters.includeScopes.includes(permission.scope)) {
              return false;
            }
          }

          if (permissionFilters.excludeScopes?.length > 0) {
            if (permissionFilters.excludeScopes.includes(permission.scope)) {
              return false;
            }
          }

          return true;
        });
      }

      return {
        sourceRole: {
          id: sourceRole.id,
          name: sourceRole.name,
          description: sourceRole.description,
          level: sourceRole.priority,
          permissionCount: sourceRole.permissions.length,
        },
        previewRole: {
          name: newMetadata.name,
          description: newMetadata.description,
          level: newMetadata.level,
          permissionCount: filteredPermissions.length,
        },
        permissionChanges: {
          total: sourceRole.permissions.length,
          filtered: filteredPermissions.length,
          removed: sourceRole.permissions.length - filteredPermissions.length,
          permissions: filteredPermissions.map(rp => ({
            id: rp.permission.id,
            name: rp.permission.name,
            resource: rp.permission.resource,
            action: rp.permission.action,
            scope: rp.permission.scope,
            description: rp.permission.description,
          })),
        },
        conflicts: [], // TODO: Check for name conflicts
        recommendations: [], // TODO: Add recommendations
      };
    } catch (error) {
      this.logger.error('Error generating clone preview:', error);
      throw error;
    }
  }

  /**
   * Get role lineage
   */
  async getRoleLineage(id: string, currentUser: User) {
    try {
      const role = await this.prisma.customRole.findFirst({
        where: {
          id,
          deletedAt: null,
          ...this.buildTenantFilters(currentUser),
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Get cloned roles (children)
      const clonedRoles = await this.prisma.customRole.findMany({
        where: {
          deletedAt: null,
          metadata: {
            path: ['clonedFrom'],
            equals: id,
          },
          ...this.buildTenantFilters(currentUser),
        },
        select: {
          id: true,
          name: true,
          description: true,
          priority: true,
          createdAt: true,
          metadata: true,
        },
      });

      // Get source role (parent)
      let sourceRole = null;
      const metadata = role.metadata as any;
      if (metadata?.clonedFrom) {
        sourceRole = await this.prisma.customRole.findFirst({
          where: {
            id: metadata.clonedFrom,
            deletedAt: null,
            ...this.buildTenantFilters(currentUser),
          },
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            createdAt: true,
          },
        });
      }

      return {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          level: role.priority,
          createdAt: role.createdAt,
        },
        parent: sourceRole,
        children: clonedRoles.map(child => ({
          id: child.id,
          name: child.name,
          description: child.description,
          level: child.priority,
          createdAt: child.createdAt,
          cloneType: (child.metadata as any)?.cloneType || 'unknown',
        })),
        depth: sourceRole ? 2 : 1, // Simple depth calculation
        isRoot: !sourceRole,
        hasChildren: clonedRoles.length > 0,
      };
    } catch (error) {
      this.logger.error(`Error getting role lineage for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get clone templates
   */
  async getCloneTemplates(currentUser: User) {
    try {
      // For now, return common clone templates
      // In a real implementation, these would be stored in the database
      return {
        templates: [
          {
            id: 'department-manager',
            name: 'Department Manager Template',
            description: 'Template for department-level management roles',
            category: 'management',
            permissionFilters: {
              includeScopes: ['department'],
              includeCategories: ['user', 'schedule', 'report'],
              excludeCategories: ['system'],
              excludeScopes: ['organization'],
            },
            metadata: {
              recommendedLevel: 500,
              tags: ['management', 'department'],
            },
          },
          {
            id: 'staff-member',
            name: 'Staff Member Template',
            description: 'Template for basic staff roles',
            category: 'staff',
            permissionFilters: {
              includeScopes: ['self'],
              includeCategories: ['profile', 'schedule'],
              excludeCategories: ['admin', 'management'],
            },
            metadata: {
              recommendedLevel: 100,
              tags: ['staff', 'basic'],
            },
          },
        ],
        categories: ['management', 'staff', 'admin', 'custom'],
        totalTemplates: 2,
      };
    } catch (error) {
      this.logger.error('Error getting clone templates:', error);
      throw error;
    }
  }

  /**
   * Save clone template
   */
  async saveCloneTemplate(template: any, currentUser: User) {
    try {
      // For now, just return a mock response
      // In a real implementation, this would save to a templates table
      const savedTemplate = {
        id: `template-${Date.now()}`,
        ...template,
        createdBy: currentUser.id,
        createdAt: new Date(),
        organizationId: currentUser.organizationId,
        propertyId: currentUser.propertyId,
      };

      // Audit log
      await this.auditService.logCreate(
        currentUser.id,
        'CloneTemplate',
        savedTemplate.id,
        savedTemplate
      );

      this.logger.log(`Clone template saved: ${template.name} by user ${currentUser.id}`);

      return savedTemplate;
    } catch (error) {
      this.logger.error('Error saving clone template:', error);
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
    // PLATFORM_ADMIN sees all roles without tenant restrictions
    if (currentUser.role === Role.PLATFORM_ADMIN) {
      return {};
    }

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

  /**
   * Build a custom role using the role builder
   */
  async buildRole(roleData: CustomRoleBuilderDto, createdBy: string): Promise<CustomRole> {
    try {
      this.logger.log(`Building custom role: ${roleData.name}`);

      // Validate allowed modules exist
      if (roleData.allowedModules && roleData.allowedModules.length > 0) {
        const validModules = await this.validateModules(roleData.allowedModules);
        if (!validModules) {
          throw new BadRequestException('Some specified modules do not exist or are inactive');
        }
      }

      // Validate permissions exist
      if (roleData.permissions && roleData.permissions.length > 0) {
        const validPermissions = await this.validatePermissions(roleData.permissions);
        if (!validPermissions) {
          throw new BadRequestException('Some specified permissions do not exist');
        }
      }

      // Create the role using transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the custom role
        const role = await tx.customRole.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            userType: roleData.userType,
            allowedModules: roleData.allowedModules,
            organizationId: roleData.organizationId,
            propertyId: roleData.propertyId,
            priority: roleData.priority || 0,
            metadata: roleData.metadata,
            isActive: roleData.isActive ?? true,
          },
        });

        // Add permissions to the role
        if (roleData.permissions && roleData.permissions.length > 0) {
          await this.addPermissionsToRole(role.id, roleData.permissions, tx);
        }

        // Create UI restrictions if provided
        if (roleData.uiRestrictions) {
          await tx.uIRestriction.create({
            data: {
              roleId: role.id,
              hiddenModules: roleData.uiRestrictions.hiddenModules,
              hiddenFeatures: roleData.uiRestrictions.hiddenFeatures,
              readOnlyFields: roleData.uiRestrictions.readOnlyFields,
            },
          });
        }

        return role;
      });

      // Log the creation
      await this.auditService.logCreate(
        createdBy,
        'CustomRole',
        result.id,
        {
          name: roleData.name,
          userType: roleData.userType,
          allowedModules: roleData.allowedModules,
          permissions: roleData.permissions,
        }
      );

      this.logger.log(`Custom role built successfully: ${result.id}`);
      return result;

    } catch (error) {
      this.logger.error(`Error building custom role:`, error);
      throw error;
    }
  }

  /**
   * Get role templates by user type
   */
  async getRoleTemplates(userType: UserType): Promise<RoleTemplateDto[]> {
    // Define role templates based on user type
    const templates: Record<UserType, RoleTemplateDto[]> = {
      [UserType.INTERNAL]: [
        {
          name: 'Front Desk Manager',
          description: 'Manages front desk operations, guest check-ins/outs, and reservations',
          userType: UserType.INTERNAL,
          recommendedModules: ['front-desk', 'reservations', 'guest-services', 'units'],
          basePermissions: [
            'guest.create.property',
            'guest.read.property',
            'guest.update.property',
            'reservation.create.property',
            'reservation.read.property',
            'reservation.update.property',
            'unit.read.property',
            'unit.update.property',
          ],
          defaultPriority: 700,
        },
        {
          name: 'Housekeeping Supervisor',
          description: 'Supervises housekeeping staff and manages room cleaning tasks',
          userType: UserType.INTERNAL,
          recommendedModules: ['housekeeping', 'maintenance', 'units', 'tasks'],
          basePermissions: [
            'task.create.department',
            'task.read.department',
            'task.update.department',
            'unit.read.property',
            'unit.update.property',
            'user.read.department',
          ],
          defaultPriority: 600,
        },
      ],
      [UserType.CLIENT]: [
        {
          name: 'Guest Portal User',
          description: 'Standard guest access to view reservations and services',
          userType: UserType.CLIENT,
          recommendedModules: ['guest-portal', 'services'],
          basePermissions: [
            'reservation.read.own',
            'guest.read.own',
            'guest.update.own',
            'service.request.own',
          ],
          defaultPriority: 100,
          defaultRestrictions: {
            hiddenModules: ['admin', 'hr', 'finance'],
            readOnlyFields: ['guest.email', 'reservation.dates'],
          },
        },
      ],
      [UserType.VENDOR]: [
        {
          name: 'Maintenance Contractor',
          description: 'External maintenance contractor access',
          userType: UserType.VENDOR,
          recommendedModules: ['maintenance', 'tasks'],
          basePermissions: [
            'task.read.assigned',
            'task.update.assigned',
            'unit.read.property',
          ],
          defaultPriority: 200,
          defaultRestrictions: {
            hiddenModules: ['hr', 'finance', 'admin'],
            hiddenFeatures: ['user.personal-info', 'guest.personal-info'],
          },
        },
      ],
      [UserType.PARTNER]: [
        {
          name: 'Business Partner',
          description: 'External business partner with limited property access',
          userType: UserType.PARTNER,
          recommendedModules: ['reports', 'analytics'],
          basePermissions: [
            'reservation.read.property',
            'unit.read.property',
            'report.read.property',
          ],
          defaultPriority: 300,
          defaultRestrictions: {
            hiddenModules: ['hr', 'finance'],
            readOnlyFields: ['guest.personal-info', 'user.salary'],
          },
        },
      ],
    };

    return templates[userType] || [];
  }

  /**
   * Find a role by ID
   */
  async findRoleById(roleId: string): Promise<CustomRole | null> {
    try {
      return await this.prisma.customRole.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          uiRestrictions: true
        }
      });
    } catch (error) {
      this.logger.error(`Error finding role by ID ${roleId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Clone a role with modifications
   */
  async cloneRoleWithOptions(roleId: string, options: CloneRoleOptionsDto, clonedBy: string): Promise<CustomRole> {
    try {
      this.logger.log(`Cloning role: ${roleId}`);

      const originalRole = await this.findRoleById(roleId);
      if (!originalRole) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      // Create cloned role with modifications
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the cloned role
        const clonedRole = await tx.customRole.create({
          data: {
            name: options.newName,
            description: options.newDescription || originalRole.description,
            userType: originalRole.userType,
            allowedModules: this.mergeModules(
              (originalRole.allowedModules as string[]) || [],
              options.additionalModules,
              options.removeModules
            ),
            organizationId: options.targetOrganizationId || originalRole.organizationId,
            propertyId: options.targetPropertyId || originalRole.propertyId,
            priority: originalRole.priority,
            metadata: originalRole.metadata,
            isActive: true,
          },
        });

        // Clone permissions with modifications
        const originalPermissions = originalRole.permissions.map(rp => rp.permission.id);
        const finalPermissions = this.mergePermissions(
          originalPermissions,
          options.additionalPermissions,
          options.removePermissions
        );

        if (finalPermissions.length > 0) {
          await this.addPermissionsToRole(clonedRole.id, finalPermissions, tx);
        }

        // Clone UI restrictions if they exist
        if (originalRole.uiRestrictions && originalRole.uiRestrictions.length > 0) {
          const originalRestriction = originalRole.uiRestrictions[0];
          await tx.uIRestriction.create({
            data: {
              roleId: clonedRole.id,
              hiddenModules: originalRestriction.hiddenModules,
              hiddenFeatures: originalRestriction.hiddenFeatures,
              readOnlyFields: originalRestriction.readOnlyFields,
            },
          });
        }

        return clonedRole;
      });

      // Log the creation
      await this.auditService.logCreate(
        clonedBy,
        'CustomRole',
        result.id,
        {
          originalRoleId: roleId,
          originalRoleName: originalRole.name,
          newRoleName: options.newName,
          cloneOptions: options,
        }
      );

      this.logger.log(`Role cloned successfully: ${result.id}`);
      return result;

    } catch (error) {
      this.logger.error(`Error cloning role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Validate that modules exist and are active
   */
  private async validateModules(moduleIds: string[]): Promise<boolean> {
    try {
      const validModules = await this.prisma.moduleManifest.count({
        where: {
          moduleId: { in: moduleIds },
          isActive: true,
        },
      });
      return validModules === moduleIds.length;
    } catch (error) {
      this.logger.error('Error validating modules:', error);
      return false;
    }
  }

  /**
   * Validate that permissions exist
   */
  private async validatePermissions(permissionIds: string[]): Promise<boolean> {
    try {
      const validPermissions = await this.prisma.permission.count({
        where: {
          id: { in: permissionIds },
        },
      });
      return validPermissions === permissionIds.length;
    } catch (error) {
      this.logger.error('Error validating permissions:', error);
      return false;
    }
  }

  /**
   * Add permissions to a role within a transaction
   */
  private async addPermissionsToRole(roleId: string, permissionIds: string[], tx?: any): Promise<void> {
    const client = tx || this.prisma;
    
    const rolePermissions = permissionIds.map(permissionId => ({
      roleId,
      permissionId,
      granted: true,
    }));

    await client.rolePermission.createMany({
      data: rolePermissions,
      skipDuplicates: true,
    });
  }

  /**
   * Merge modules with additions and removals
   */
  private mergeModules(
    original: string[],
    additions?: string[],
    removals?: string[]
  ): string[] {
    let result = [...original];
    
    if (additions && additions.length > 0) {
      result = [...result, ...additions];
    }
    
    if (removals && removals.length > 0) {
      result = result.filter(module => !removals.includes(module));
    }
    
    // Remove duplicates
    return [...new Set(result)];
  }

  /**
   * Merge permissions with additions and removals
   */
  private mergePermissions(
    original: string[],
    additions?: string[],
    removals?: string[]
  ): string[] {
    let result = [...original];
    
    if (additions && additions.length > 0) {
      result = [...result, ...additions];
    }
    
    if (removals && removals.length > 0) {
      result = result.filter(permission => !removals.includes(permission));
    }
    
    // Remove duplicates
    return [...new Set(result)];
  }
}