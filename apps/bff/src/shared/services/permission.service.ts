import { Injectable, Logger } from '@nestjs/common';
import { Role, PrismaClient } from '@prisma/client';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Permission, PermissionObject, normalizePermission, matchesPermissionPattern } from '../decorators/require-permission.decorator';

export interface PermissionContext {
  user: CurrentUser;
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
  resourceOwnerId?: string;
  [key: string]: any;
}

export interface PermissionEvaluationResult {
  granted: boolean;
  reason?: string;
  scopeFilters?: Record<string, any>;
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private readonly prisma = new PrismaClient();
  private permissionCache = new Map<string, string[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Core permission evaluation logic - NOW USES DATABASE CUSTOM ROLES
   */
  async evaluatePermission(
    permission: Permission,
    context: PermissionContext,
  ): Promise<PermissionEvaluationResult> {
    try {
      const normalizedPermission = normalizePermission(permission);
      const { user } = context;

      this.logger.debug(`Evaluating permission: ${JSON.stringify(normalizedPermission)} for user ${user.id} (${user.role})`);

      // Get user's effective permissions from database first
      const userPermissions = await this.getUserPermissionsFromDatabase(user);
      
      // Check if user has the required permission from database custom roles
      let hasPermission = this.checkUserPermission(normalizedPermission, userPermissions, context);

      // For PLATFORM_ADMIN, always check legacy permissions if database permissions fail
      // For other roles, only check legacy if no database permissions exist
      if (!hasPermission && (user.role === Role.PLATFORM_ADMIN || userPermissions.length === 0)) {
        const reason = user.role === Role.PLATFORM_ADMIN ? 'PLATFORM_ADMIN role' : 'no custom role permissions';
        this.logger.debug(`User ${user.id} has ${reason}, checking legacy role permissions`);
        const legacyPermissions = this.getLegacyRolePermissions(user.role);
        hasPermission = this.checkRolePermission(normalizedPermission, legacyPermissions, context);
        
        if (hasPermission) {
          this.logger.debug(`User ${user.id} granted access via legacy role permissions (${user.role}).`);
        }
      }

      if (!hasPermission) {
        return {
          granted: false,
          reason: `User ${user.id} (role: ${user.role}, custom roles: ${userPermissions.length > 0 ? 'assigned' : 'none'}) does not have permission ${JSON.stringify(normalizedPermission)}`,
        };
      }

      // Apply scope-based filtering
      const scopeFilters = this.generateScopeFilters(normalizedPermission, context);

      // Check additional conditions if present
      if (normalizedPermission.conditions) {
        const conditionsResult = await this.evaluateConditions(normalizedPermission.conditions, context);
        if (!conditionsResult.granted) {
          return conditionsResult;
        }
      }

      return {
        granted: true,
        scopeFilters,
      };
    } catch (error) {
      this.logger.error(`Error evaluating permission: ${error.message}`, error.stack);
      return {
        granted: false,
        reason: `Permission evaluation error: ${error.message}`,
      };
    }
  }

  /**
   * Evaluate multiple permissions (OR logic)
   */
  async evaluatePermissions(
    permissions: Permission[],
    context: PermissionContext,
  ): Promise<PermissionEvaluationResult> {
    for (const permission of permissions) {
      const result = await this.evaluatePermission(permission, context);
      if (result.granted) {
        return result;
      }
    }

    return {
      granted: false,
      reason: `None of the required permissions granted: ${permissions.map(p => JSON.stringify(p)).join(', ')}`,
    };
  }

  /**
   * Get user permissions from database (both custom roles and direct permissions)
   */
  private async getUserPermissionsFromDatabase(user: CurrentUser): Promise<string[]> {
    const cacheKey = `user_perms_${user.id}`;
    const now = Date.now();

    // Check cache first
    if (this.permissionCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.permissionCache.get(cacheKey)!;
    }

    try {
      const allPermissions: string[] = [];

      // Get user's active role assignments
      const userRoles = await this.prisma.userCustomRole.findMany({
        where: {
          userId: user.id,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          role: {
            include: {
              permissions: {
                where: { granted: true },
                include: { permission: true }
              }
            }
          }
        }
      });

      // Collect all permissions from custom roles
      userRoles.forEach(userRole => {
        userRole.role.permissions.forEach(rp => {
          allPermissions.push(`${rp.permission.resource}.${rp.permission.action}.${rp.permission.scope}`);
        });
      });

      // Get user's direct permissions
      const directPermissions = await this.prisma.userPermission.findMany({
        where: {
          userId: user.id,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          permission: true
        }
      });

      // Process direct permissions (granted permissions are added, denied permissions remove from the list)
      directPermissions.forEach(userPerm => {
        const permissionKey = `${userPerm.permission.resource}.${userPerm.permission.action}.${userPerm.permission.scope}`;
        if (userPerm.granted) {
          allPermissions.push(permissionKey);
        } else {
          // Remove denied permission from the list
          const index = allPermissions.indexOf(permissionKey);
          if (index > -1) {
            allPermissions.splice(index, 1);
          }
        }
      });

      const permissions = [...new Set(allPermissions)]; // Remove duplicates

      // Cache the result
      this.permissionCache.set(cacheKey, permissions);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

      this.logger.debug(`User ${user.id} has ${permissions.length} database permissions from ${userRoles.length} custom roles and ${directPermissions.length} direct permissions`);
      return permissions;
    } catch (error) {
      this.logger.error(`Error fetching user permissions from database: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if user has permission using database permissions
   */
  private checkUserPermission(
    permission: PermissionObject,
    userPermissions: string[],
    context: PermissionContext,
  ): boolean {
    const permissionString = `${permission.resource}.${permission.action}.${permission.scope}`;

    return userPermissions.some(userPermission => {
      const matches = this.matchesPermissionPattern(permissionString, userPermission);
      
      if (matches) {
        this.logger.debug(`Permission match: ${permissionString} matches ${userPermission}`);
        
        // Additional scope validation for certain roles
        if (context.user.role === Role.DEPARTMENT_ADMIN && permission.scope === 'property') {
          // Department admins can only access property-level reads, not writes
          return permission.action === 'read';
        }
      }

      return matches;
    });
  }

  /**
   * Enhanced permission pattern matching with scope hierarchy
   */
  private matchesPermissionPattern(required: string, granted: string): boolean {
    const [reqResource, reqAction, reqScope] = required.split('.');
    const [grantResource, grantAction, grantScope] = granted.split('.');

    // Check resource match (wildcard support)
    if (grantResource !== '*' && grantResource !== reqResource) {
      return false;
    }

    // Check action match (wildcard support)
    if (grantAction !== '*' && grantAction !== reqAction) {
      return false;
    }

    // Check scope hierarchy: all > organization > property > department > own
    const scopeHierarchy = ['own', 'department', 'property', 'organization', 'all'];
    const grantedLevel = scopeHierarchy.indexOf(grantScope);
    const requiredLevel = scopeHierarchy.indexOf(reqScope);

    // If granted scope is higher or equal in hierarchy, allow access
    return grantedLevel >= requiredLevel;
  }

  /**
   * Check if role has permission using pattern matching (legacy fallback)
   */
  private checkRolePermission(
    permission: PermissionObject,
    rolePermissions: string[],
    context: PermissionContext,
  ): boolean {
    const permissionString = `${permission.resource}.${permission.action}.${permission.scope}`;

    return rolePermissions.some(rolePermission => {
      const matches = this.matchesPermissionPattern(permissionString, rolePermission);
      
      if (matches) {
        this.logger.debug(`Legacy permission match: ${permissionString} matches ${rolePermission}`);
        
        // Additional scope validation for certain roles
        if (context.user.role === Role.DEPARTMENT_ADMIN && permission.scope === 'property') {
          // Department admins can only access property-level reads, not writes
          return permission.action === 'read';
        }
      }

      return matches;
    });
  }

  /**
   * Generate scope filters based on user context and permission scope
   */
  private generateScopeFilters(
    permission: PermissionObject,
    context: PermissionContext,
  ): Record<string, any> {
    const { user } = context;
    const filters: Record<string, any> = {};

    switch (permission.scope) {
      case 'platform':
        // No filters needed for platform scope
        break;

      case 'organization':
        if (user.organizationId) {
          filters.organizationId = user.organizationId;
        }
        break;

      case 'property':
        if (user.propertyId) {
          filters.propertyId = user.propertyId;
        }
        if (user.organizationId) {
          filters.organizationId = user.organizationId;
        }
        break;

      case 'department':
        if (user.departmentId) {
          filters.departmentId = user.departmentId;
        }
        if (user.propertyId) {
          filters.propertyId = user.propertyId;
        }
        if (user.organizationId) {
          filters.organizationId = user.organizationId;
        }
        break;

      case 'own':
        filters.userId = user.id;
        // For own scope, also include department/property/org filters
        if (user.departmentId) {
          filters.departmentId = user.departmentId;
        }
        if (user.propertyId) {
          filters.propertyId = user.propertyId;
        }
        if (user.organizationId) {
          filters.organizationId = user.organizationId;
        }
        break;
    }

    return filters;
  }

  /**
   * Evaluate custom conditions
   */
  private async evaluateConditions(
    conditions: Record<string, any>,
    context: PermissionContext,
  ): Promise<PermissionEvaluationResult> {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'sameDepartment':
          if (value && context.departmentId && context.user.departmentId !== context.departmentId) {
            return {
              granted: false,
              reason: 'User is not in the same department as the resource',
            };
          }
          break;

        case 'sameProperty':
          if (value && context.propertyId && context.user.propertyId !== context.propertyId) {
            return {
              granted: false,
              reason: 'User is not in the same property as the resource',
            };
          }
          break;

        case 'sameOrganization':
          if (value && context.organizationId && context.user.organizationId !== context.organizationId) {
            return {
              granted: false,
              reason: 'User is not in the same organization as the resource',
            };
          }
          break;

        case 'isOwner':
          if (value && context.resourceOwnerId && context.user.id !== context.resourceOwnerId) {
            return {
              granted: false,
              reason: 'User is not the owner of the resource',
            };
          }
          break;

        case 'customCondition':
          if (typeof value === 'function') {
            const result = await value(context);
            if (!result) {
              return {
                granted: false,
                reason: 'Custom condition failed',
              };
            }
          }
          break;

        default:
          this.logger.warn(`Unknown condition: ${key}`);
      }
    }

    return { granted: true };
  }

  /**
   * Helper method to create permission context from request
   */
  createPermissionContext(
    user: CurrentUser,
    params?: Record<string, any>,
    body?: Record<string, any>,
    query?: Record<string, any>,
  ): PermissionContext {
    return {
      user,
      organizationId: params?.organizationId || body?.organizationId || query?.organizationId,
      propertyId: params?.propertyId || body?.propertyId || query?.propertyId,
      departmentId: params?.departmentId || body?.departmentId || query?.departmentId,
      resourceOwnerId: params?.userId || body?.userId || query?.userId,
      params,
      body,
      query,
    };
  }

  /**
   * Check if user can access resource based on scope
   */
  async canAccessResource(
    user: CurrentUser,
    resource: any,
    requiredScope: string,
  ): Promise<boolean> {
    if (!resource) return false;

    switch (requiredScope) {
      case 'platform':
        return user.role === Role.PLATFORM_ADMIN;

      case 'organization':
        return user.organizationId === resource.organizationId ||
               user.role === Role.PLATFORM_ADMIN;

      case 'property':
        return user.propertyId === resource.propertyId ||
               user.organizationId === resource.organizationId ||
               ([Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN] as Role[]).includes(user.role);

      case 'department':
        return user.departmentId === resource.departmentId ||
               user.propertyId === resource.propertyId ||
               user.organizationId === resource.organizationId ||
               ([Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN, Role.PROPERTY_MANAGER] as Role[]).includes(user.role);

      case 'own':
        return resource.userId === user.id ||
               user.departmentId === resource.departmentId ||
               user.propertyId === resource.propertyId ||
               user.organizationId === resource.organizationId ||
               ([Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN, Role.PROPERTY_MANAGER, Role.DEPARTMENT_ADMIN] as Role[]).includes(user.role);

      default:
        return false;
    }
  }

  /**
   * Get user's effective permissions as string array
   */
  async getUserPermissions(user: CurrentUser): Promise<string[]> {
    const dbPermissions = await this.getUserPermissionsFromDatabase(user);
    if (dbPermissions.length > 0) {
      return dbPermissions;
    }
    // Fallback to legacy permissions
    return this.getLegacyRolePermissions(user.role);
  }

  /**
   * Legacy role permissions (fallback only) - Updated for Hotel Operations Hub
   */
  private getLegacyRolePermissions(role: Role): string[] {
    const rolePermissionMap: Record<Role, string[]> = {
      [Role.PLATFORM_ADMIN]: [
        // Full platform access
        '*.*.platform',
        '*.*.organization',
        '*.*.property',
        '*.*.department',
        '*.*.own',
        // Role management
        'role.*.platform',
        'role.assign.platform',
        // System administration
        'system.*.platform',
      ],
      [Role.ORGANIZATION_OWNER]: [
        // Organization and below
        '*.*.organization',
        '*.*.property', 
        '*.*.department',
        '*.*.own',
        // Role management within organization
        'role.create.organization',
        'role.assign.organization',
        'role.read.organization',
      ],
      [Role.ORGANIZATION_ADMIN]: [
        // Organization administration (limited creation/deletion)
        '*.read.organization',
        '*.update.organization',
        '*.create.property',
        '*.*.property',
        '*.*.department',
        '*.*.own',
        // Limited role management
        'role.read.organization',
        'role.assign.property',
      ],
      [Role.PROPERTY_MANAGER]: [
        // Property and below - INCLUDING user.read.property for stats
        '*.*.property',
        '*.*.department',
        '*.*.own',
        // Hotel operations
        'units.*.property',
        'guests.*.property',
        'reservations.*.property',
        'concierge.*.property',
        'vendors.*.property',
        // Role management within property
        'role.assign.department',
        'role.read.property',
      ],
      [Role.DEPARTMENT_ADMIN]: [
        // Department and own
        '*.read.property', // Can read property-level data
        'departments.read.property', // Can see all departments in property
        '*.*.department',
        '*.*.own',
        // Department-specific operations
        'user.*.department',
        'training.*.department',
        'documents.*.department',
      ],
      [Role.STAFF]: [
        // Own data only, plus some department reads
        'profile.read.department', // Can see department colleagues' basic profiles
        'documents.read.department', // Can read department documents
        'training.read.department', // Can see department training sessions
        'benefits.read.property', // Can see property benefits
        'vacation.read.department', // Can see department vacation calendar
        '*.*.own',
        // Limited hotel operations access
        'units.read.property',
        'guests.read.property',
        'reservations.read.property',
      ],
      [Role.CLIENT]: [
        // Very limited access for external clients
        'profile.read.own',
        'profile.update.own',
        'reservations.read.own',
        'documents.read.own',
        // Client portal access
        'portal.access.client',
      ],
      [Role.VENDOR]: [
        // Limited access for vendors
        'profile.read.own',
        'profile.update.own',
        'vendors.read.own',
        'vendors.update.own',
        // Vendor portal access
        'portal.access.vendor',
        'concierge.read.property', // Can see relevant concierge requests
        'concierge.update.property', // Can update their assigned items
      ],
    };

    return rolePermissionMap[role] || [];
  }

  /**
   * Map legacy roles to new permissions (for backwards compatibility)
   */
  mapRoleToPermissions(role: Role): string[] {
    return this.getLegacyRolePermissions(role);
  }

  /**
   * Get system role information including hierarchy level
   */
  getSystemRoleInfo(role: Role): { 
    name: string;
    description: string; 
    level: number;
    userType: 'INTERNAL' | 'CLIENT' | 'VENDOR';
    capabilities: string[];
  } {
    const roleInfo = {
      [Role.PLATFORM_ADMIN]: {
        name: 'Platform Admin',
        description: 'Full system access across all organizations and properties',
        level: 10,
        userType: 'INTERNAL' as const,
        capabilities: ['Manage all users', 'Manage all roles', 'System configuration', 'Cross-tenant access']
      },
      [Role.ORGANIZATION_OWNER]: {
        name: 'Organization Owner',
        description: 'Owns and manages entire hotel chains or groups',
        level: 9,
        userType: 'INTERNAL' as const,
        capabilities: ['Manage organization', 'Create properties', 'Manage org users', 'Assign org roles']
      },
      [Role.ORGANIZATION_ADMIN]: {
        name: 'Organization Admin',
        description: 'Administers organization settings and properties',
        level: 8,
        userType: 'INTERNAL' as const,
        capabilities: ['Update organization', 'Manage properties', 'Limited user management']
      },
      [Role.PROPERTY_MANAGER]: {
        name: 'Property Manager',
        description: 'Manages individual hotel properties and operations',
        level: 7,
        userType: 'INTERNAL' as const,
        capabilities: ['Hotel operations', 'Property staff', 'Guest management', 'Vendor coordination']
      },
      [Role.DEPARTMENT_ADMIN]: {
        name: 'Department Admin',
        description: 'Manages specific departments within properties',
        level: 6,
        userType: 'INTERNAL' as const,
        capabilities: ['Department management', 'Team coordination', 'Training oversight']
      },
      [Role.STAFF]: {
        name: 'Staff',
        description: 'Regular hotel staff with operational access',
        level: 5,
        userType: 'INTERNAL' as const,
        capabilities: ['Daily operations', 'Guest service', 'Basic reporting']
      },
      [Role.CLIENT]: {
        name: 'Client',
        description: 'External clients with limited access to their data',
        level: 2,
        userType: 'CLIENT' as const,
        capabilities: ['View own reservations', 'Update profile', 'Access client portal']
      },
      [Role.VENDOR]: {
        name: 'Vendor',
        description: 'External vendors and suppliers with work-related access',
        level: 3,
        userType: 'VENDOR' as const,
        capabilities: ['Vendor portal access', 'Update work status', 'Receive notifications']
      }
    };

    return roleInfo[role] || {
      name: 'Unknown Role',
      description: 'Role information not found',
      level: 0,
      userType: 'INTERNAL' as const,
      capabilities: []
    };
  }

  /**
   * Check if a user can assign a specific role (hierarchy validation)
   */
  canAssignRole(currentUserRole: Role, targetRole: Role): boolean {
    const currentLevel = this.getSystemRoleInfo(currentUserRole).level;
    const targetLevel = this.getSystemRoleInfo(targetRole).level;
    
    // Users can only assign roles at or below their level
    // Platform admins can assign any role
    return currentUserRole === Role.PLATFORM_ADMIN || currentLevel > targetLevel;
  }

  /**
   * Get all available system roles for a user to assign
   */
  getAssignableRoles(currentUserRole: Role): Role[] {
    const allRoles = Object.values(Role);
    return allRoles.filter(role => this.canAssignRole(currentUserRole, role));
  }

  /**
   * Clear user permissions cache when role changes
   */
  clearUserPermissionCache(userId: string): void {
    const cacheKey = `user_perms_${userId}`;
    this.permissionCache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
    this.logger.debug(`Cleared permission cache for user ${userId}`);
  }

  /**
   * Get all system roles with their information
   */
  getAllSystemRoles(): Array<{ role: Role; info: ReturnType<typeof this.getSystemRoleInfo> }> {
    return Object.values(Role).map(role => ({
      role,
      info: this.getSystemRoleInfo(role)
    }));
  }
}