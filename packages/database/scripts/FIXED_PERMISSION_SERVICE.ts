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

      // If no custom role permissions, fall back to legacy role permissions
      if (!hasPermission && userPermissions.length === 0) {
        this.logger.debug(`User ${user.id} has no custom role permissions, checking legacy role permissions`);
        const legacyPermissions = this.getLegacyRolePermissions(user.role);
        hasPermission = this.checkRolePermission(normalizedPermission, legacyPermissions, context);
        
        if (hasPermission) {
          this.logger.warn(`User ${user.id} granted access via legacy role permissions. Consider assigning custom roles.`);
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
   * Get user permissions from database custom roles
   */
  private async getUserPermissionsFromDatabase(user: CurrentUser): Promise<string[]> {
    const cacheKey = `user_perms_${user.id}`;
    const now = Date.now();

    // Check cache first
    if (this.permissionCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.permissionCache.get(cacheKey)!;
    }

    try {
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

      if (userRoles.length === 0) {
        this.logger.debug(`User ${user.id} has no active custom roles assigned`);
        return [];
      }

      // Collect all permissions from all active roles
      const allPermissions: string[] = [];
      userRoles.forEach(userRole => {
        userRole.role.permissions.forEach(rp => {
          allPermissions.push(`${rp.permission.resource}.${rp.permission.action}.${rp.permission.scope}`);
        });
      });

      const permissions = [...new Set(allPermissions)]; // Remove duplicates

      // Cache the result
      this.permissionCache.set(cacheKey, permissions);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

      this.logger.debug(`User ${user.id} has ${permissions.length} database permissions from ${userRoles.length} custom roles`);
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
      const matches = matchesPermissionPattern(permissionString, rolePermission);
      
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
   * Legacy role permissions (fallback only)
   */
  private getLegacyRolePermissions(role: Role): string[] {
    const rolePermissionMap: Record<Role, string[]> = {
      [Role.PLATFORM_ADMIN]: [
        // Full platform access
        '*.*.all',
        '*.*.platform',
        '*.*.organization',
        '*.*.property',
        '*.*.department',
        '*.*.own',
      ],
      [Role.ORGANIZATION_OWNER]: [
        // Organization and below
        '*.*.organization',
        '*.*.property', 
        '*.*.department',
        '*.*.own',
      ],
      [Role.ORGANIZATION_ADMIN]: [
        // Organization administration (limited creation/deletion)
        '*.read.organization',
        '*.update.organization',
        '*.create.property',
        '*.*.property',
        '*.*.department',
        '*.*.own',
      ],
      [Role.PROPERTY_MANAGER]: [
        // Property and below - INCLUDING user.read.property for stats
        '*.*.property',
        '*.*.department',
        '*.*.own',
      ],
      [Role.DEPARTMENT_ADMIN]: [
        // Department and own
        '*.read.property', // Can read property-level data
        'departments.read.property', // Can see all departments in property
        '*.*.department',
        '*.*.own',
      ],
      [Role.STAFF]: [
        // Own data only, plus some department reads
        'profile.read.department', // Can see department colleagues' basic profiles
        'documents.read.department', // Can read department documents
        'training.read.department', // Can see department training sessions
        'benefits.read.property', // Can see property benefits
        'vacation.read.department', // Can see department vacation calendar
        '*.*.own',
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
}

// Copy this entire file to: apps/bff/src/shared/services/permission.service.ts