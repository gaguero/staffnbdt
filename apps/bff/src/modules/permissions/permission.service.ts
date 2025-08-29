import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Removed @nestjs/schedule import due to crypto module unavailability in Railway
import { 
  Permission, 
  CustomRole, 
  UserCustomRole, 
  RolePermission, 
  UserPermission,
  PermissionCondition,
  PermissionCache,
  Role,
  UserType,
  ModuleManifest,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import {
  PermissionEvaluationContext,
  PermissionEvaluationResult,
  CachedPermission,
  PermissionConditionEvaluator,
  BulkPermissionCheck,
  BulkPermissionResult,
  UserPermissionSummary,
  PermissionGrantRequest,
  PermissionRevokeRequest,
  RoleAssignmentRequest,
} from './interfaces/permission.interface';

interface PermissionWithRelations extends Permission {
  rolePermissions: RolePermission[];
  conditions: PermissionCondition[];
}

interface UserWithRoles {
  id: string;
  role: Role;
  userType: UserType;
  externalOrganization: string | null;
  accessPortal: string | null;
  organizationId: string | null;
  propertyId: string | null;
  departmentId: string | null;
  userCustomRoles: (UserCustomRole & {
    role: CustomRole & {
      permissions: (RolePermission & {
        permission: PermissionWithRelations;
      })[];
    };
  })[];
  userPermissions: (UserPermission & {
    permission: PermissionWithRelations;
  })[];
}

@Injectable()
export class PermissionService implements OnModuleInit {
  private readonly logger = new Logger(PermissionService.name);
  private readonly cacheDefaultTtl: number;
  private readonly maxCacheSize: number;
  private readonly conditionEvaluators = new Map<string, PermissionConditionEvaluator>();
  private permissionTablesExist = false;
  private skipPermissionInit = false;
  private forcePermissionSystem = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {
    this.cacheDefaultTtl = this.configService.get<number>('PERMISSION_CACHE_TTL', 3600); // 1 hour
    this.maxCacheSize = this.configService.get<number>('PERMISSION_MAX_CACHE_SIZE', 10000);
    this.skipPermissionInit = this.configService.get<boolean>('SKIP_PERMISSION_INIT', false);
    this.forcePermissionSystem = this.configService.get<boolean>('FORCE_PERMISSION_SYSTEM', false);
    this.initializeConditionEvaluators();
    this.initializeCronJobs();
  }

  async onModuleInit() {
    if (this.skipPermissionInit) {
      this.logger.warn('Permission system initialization skipped due to SKIP_PERMISSION_INIT=true');
      return;
    }

    try {
      // Check force override first
      if (this.forcePermissionSystem) {
        this.logger.warn('FORCE_PERMISSION_SYSTEM=true - bypassing table existence check');
        this.permissionTablesExist = true;
      } else {
        // Check if permission tables exist before attempting initialization with retry
        this.permissionTablesExist = await this.hasPermissionTablesWithRetry();
      }
      
      if (!this.permissionTablesExist) {
        this.logger.warn('Permission tables do not exist, running in legacy mode with @Roles decorators only');
        
        // Extra verification - try a direct count query to double-check
        try {
          const permissionCount = await this.prisma.permission.count();
          if (permissionCount > 0) {
            this.logger.warn(`Found ${permissionCount} permissions in database - tables DO exist! Enabling permission system.`);
            this.permissionTablesExist = true;
          }
        } catch (countError) {
          this.logger.debug('Direct permission count failed, tables likely do not exist:', countError.message);
        }
        
        if (!this.permissionTablesExist) {
          return;
        }
      }

      // Only initialize if tables exist
      await this.ensureSystemPermissions();
      await this.ensureSystemRoles();
      this.logger.log('Permission service initialized with system permissions and roles');
    } catch (error) {
      this.logger.error('Failed to initialize permission system, falling back to legacy mode:', error);
      this.permissionTablesExist = false;
      // Don't throw - allow app to start with legacy @Roles system
    }
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    scope: string,
    context?: Partial<PermissionEvaluationContext>,
  ): Promise<boolean> {
    const result = await this.evaluatePermission(userId, resource, action, scope, context);
    return result.allowed;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string, context?: Partial<PermissionEvaluationContext>): Promise<Permission[]> {
    // Return empty array if permission tables don't exist
    if (!this.permissionTablesExist) {
      this.logger.debug('Permission tables not available, returning empty permissions array');
      return [];
    }

    try {
      // Check cache first
      const cacheKey = this.generateUserPermissionsCacheKey(userId, context);
      const cached = await this.getCachedUserPermissions(cacheKey);
      if (cached) {
        return cached;
      }

      const user = await this.getUserWithRoles(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const permissions = new Map<string, Permission>();

      // Get permissions from legacy role
      const legacyRolePermissions = await this.getLegacyRolePermissions(user.role, user.userType);
      this.logger.log(`User ${userId} with legacy role ${user.role} gets ${legacyRolePermissions.length} permissions from legacy system`);
      
      legacyRolePermissions.forEach(permission => {
        permissions.set(permission.id, permission);
      });
      
      this.logger.debug(`After legacy role permissions: user has ${permissions.size} total permissions`);
      
      // Get permissions from enabled modules for this user type
      if (user.organizationId) {
        const enabledModules = await this.getEnabledModulesForOrganization(user.organizationId);
        const modulePermissions = await this.getUserTypePermissions(
          user.userType, 
          enabledModules.map(m => m.moduleId)
        );
        
        modulePermissions.forEach(permission => {
          permissions.set(permission.id, permission);
        });
        
        this.logger.debug(`After module permissions: user has ${permissions.size} total permissions`);
      }

      // Get permissions from custom roles
      for (const userRole of user.userCustomRoles) {
        if (!userRole.isActive || (userRole.expiresAt && userRole.expiresAt < new Date())) {
          this.logger.debug(`Skipping inactive/expired custom role: ${userRole.role.name}`);
          continue;
        }

        this.logger.debug(`Processing custom role: ${userRole.role.name} with ${userRole.role.permissions.length} role permissions`);
        
        for (const rolePermission of userRole.role.permissions) {
          if (rolePermission.granted && rolePermission.permission) {
            permissions.set(rolePermission.permission.id, rolePermission.permission);
          }
        }
      }
      
      this.logger.debug(`After custom role permissions: user has ${permissions.size} total permissions`);

      // Apply direct user permission overrides
      for (const userPermission of user.userPermissions) {
        if (!userPermission.isActive || (userPermission.expiresAt && userPermission.expiresAt < new Date())) {
          continue;
        }

        if (userPermission.granted) {
          permissions.set(userPermission.permission.id, userPermission.permission);
        } else {
          // Explicit deny - remove permission
          permissions.delete(userPermission.permission.id);
        }
      }

      const result = Array.from(permissions.values());
      
      // Log final result for debugging
      const rolePermissions = result.filter(p => p.resource === 'role');
      this.logger.log(`User ${userId} final permissions: ${result.length} total, ${rolePermissions.length} role-related permissions`);
      this.logger.debug(`Role permissions: ${rolePermissions.map(p => `${p.resource}.${p.action}.${p.scope}`).join(', ')}`);

      // Cache the result
      await this.cacheUserPermissions(cacheKey, result);

      return result;
    } catch (error) {
      this.logger.error(`Error getting user permissions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Evaluate a specific permission with context
   */
  async evaluatePermission(
    userId: string,
    resource: string,
    action: string,
    scope: string,
    context?: Partial<PermissionEvaluationContext>,
  ): Promise<PermissionEvaluationResult> {
    // Return default deny if permission tables don't exist
    if (!this.permissionTablesExist) {
      this.logger.debug('Permission tables not available, defaulting to deny');
      return { allowed: false, reason: 'Permission system not available - use legacy @Roles', source: 'legacy' };
    }

    try {
      const evaluationContext: PermissionEvaluationContext = {
        userId,
        currentTime: new Date(),
        ...context,
      };

      // Get user with roles and permissions first to check for PLATFORM_ADMIN
      const user = await this.getUserWithRoles(userId);
      if (!user) {
        return { allowed: false, reason: 'User not found', source: 'default' };
      }

      // PLATFORM_ADMIN has unrestricted access - bypass all permission checks
      if (user.role === 'PLATFORM_ADMIN') {
        this.logger.debug(`PLATFORM_ADMIN user ${userId} granted unrestricted access to ${resource}.${action}.${scope}`);
        const result: PermissionEvaluationResult = {
          allowed: true,
          reason: 'PLATFORM_ADMIN has unrestricted access',
          source: 'role',
        };
        // Cache the result for performance
        await this.cachePermissionResult(this.generatePermissionCacheKey(userId, resource, action, scope, context), result, evaluationContext, resource, action, scope);
        return result;
      }
      
      // For external users, validate cross-organization access
      if (user.userType !== UserType.INTERNAL && evaluationContext.organizationId && 
          evaluationContext.organizationId !== user.organizationId) {
        const crossOrgAllowed = await this.validateCrossOrganizationAccess(userId, evaluationContext.organizationId);
        if (!crossOrgAllowed) {
          return { 
            allowed: false, 
            reason: 'Cross-organization access denied for external user', 
            source: 'validation' 
          };
        }
      }

      // Check cache first
      const cacheKey = this.generatePermissionCacheKey(userId, resource, action, scope, context);
      const cached = await this.getCachedPermission(cacheKey);
      if (cached && cached.expiresAt > new Date()) {
        return {
          allowed: cached.allowed,
          conditions: cached.conditions,
          source: 'cached',
          ttl: Math.floor((cached.expiresAt.getTime() - Date.now()) / 1000),
        };
      }

      // Find the specific permission
      const permission = await this.findPermission(resource, action, scope);
      if (!permission) {
        return { allowed: false, reason: 'Permission not found', source: 'default' };
      }

      // Check legacy role permissions first
      const hasLegacyPermission = await this.checkLegacyRolePermission(user.role, permission.id);
      if (hasLegacyPermission) {
        const result = await this.evaluatePermissionConditions(permission, evaluationContext);
        if (result.allowed) {
          await this.cachePermissionResult(cacheKey, result, evaluationContext, resource, action, scope);
          return { ...result, source: 'role' };
        }
      }

      // Check custom role permissions
      for (const userRole of user.userCustomRoles) {
        if (!userRole.isActive || (userRole.expiresAt && userRole.expiresAt < new Date())) {
          continue;
        }

        const rolePermission = userRole.role.permissions.find(
          rp => rp.permissionId === permission.id && rp.granted
        );
        
        if (rolePermission) {
          const result = await this.evaluatePermissionConditions(
            permission,
            evaluationContext,
            rolePermission.conditions
          );
          if (result.allowed) {
            await this.cachePermissionResult(cacheKey, result, evaluationContext, resource, action, scope);
            return { ...result, source: 'role' };
          }
        }
      }

      // Check direct user permissions (these override role permissions)
      const userPermission = user.userPermissions.find(
        up => up.permissionId === permission.id && up.isActive &&
        (!up.expiresAt || up.expiresAt > new Date())
      );

      if (userPermission) {
        if (!userPermission.granted) {
          // Explicit deny
          const result: PermissionEvaluationResult = {
            allowed: false,
            reason: 'Explicitly denied by user permission',
            source: 'user',
          };
          await this.cachePermissionResult(cacheKey, result, evaluationContext, resource, action, scope);
          return result;
        }

        const result = await this.evaluatePermissionConditions(
          permission,
          evaluationContext,
          userPermission.conditions
        );
        await this.cachePermissionResult(cacheKey, result, evaluationContext, resource, action, scope);
        return { ...result, source: 'user' };
      }

      // Default deny
      const result: PermissionEvaluationResult = {
        allowed: false,
        reason: 'No matching permission found',
        source: 'default',
      };
      await this.cachePermissionResult(cacheKey, result, evaluationContext, resource, action, scope);
      return result;

    } catch (error) {
      this.logger.error(`Error evaluating permission for user ${userId}:`, {
        message: error.message,
        stack: error.stack,
        resource,
        action,
        scope,
        permissionTablesExist: this.permissionTablesExist,
      });
      return { allowed: false, reason: `Evaluation error: ${error.message}`, source: 'default' };
    }
  }

  /**
   * Bulk permission check for performance
   */
  async checkBulkPermissions(
    userId: string,
    checks: BulkPermissionCheck[],
    globalContext?: Partial<PermissionEvaluationContext>,
  ): Promise<BulkPermissionResult> {
    const results: Record<string, PermissionEvaluationResult> = {};
    let cached = 0;
    let evaluated = 0;
    const errors: string[] = [];

    await Promise.all(
      checks.map(async (check) => {
        try {
          const context = { ...globalContext, ...check.context };
          const key = `${check.resource}.${check.action}.${check.scope}`;
          
          const result = await this.evaluatePermission(
            userId,
            check.resource,
            check.action,
            check.scope,
            context
          );

          results[key] = result;
          
          if (result.source === 'cached') {
            cached++;
          } else {
            evaluated++;
          }
        } catch (error) {
          const key = `${check.resource}.${check.action}.${check.scope}`;
          errors.push(`${key}: ${error.message}`);
          results[key] = { allowed: false, reason: error.message, source: 'default' };
        }
      })
    );

    return { permissions: results, cached, evaluated, errors };
  }

  /**
   * Grant a permission to a user
   */
  async grantPermission(request: PermissionGrantRequest): Promise<void> {
    if (!this.permissionTablesExist) {
      throw new ForbiddenException('Permission system not available - permission tables do not exist');
    }

    try {
      // Validate permission exists
      const permission = await this.prisma.permission.findUnique({
        where: { id: request.permissionId },
      });

      if (!permission) {
        throw new NotFoundException(`Permission with ID ${request.permissionId} not found`);
      }

      // Check if user permission already exists
      const existing = await this.prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId: request.userId,
            permissionId: request.permissionId,
          },
        },
      });

      if (existing) {
        // Update existing permission
        await this.prisma.userPermission.update({
          where: { id: existing.id },
          data: {
            granted: true,
            conditions: request.conditions,
            expiresAt: request.expiresAt,
            grantedBy: request.grantedBy,
            isActive: true,
            metadata: request.metadata,
          },
        });
      } else {
        // Create new permission
        await this.prisma.userPermission.create({
          data: {
            userId: request.userId,
            permissionId: request.permissionId,
            granted: true,
            conditions: request.conditions,
            expiresAt: request.expiresAt,
            grantedBy: request.grantedBy,
            metadata: request.metadata,
          },
        });
      }

      // Clear relevant caches
      await this.clearUserPermissionCache(request.userId);

      // Log the action
      await this.auditService.logCreate(
        request.grantedBy,
        'UserPermission',
        request.permissionId,
        {
          userId: request.userId,
          permissionId: request.permissionId,
          granted: true,
          conditions: request.conditions,
          expiresAt: request.expiresAt,
          metadata: request.metadata,
        }
      );

      this.logger.log(`Permission ${request.permissionId} granted to user ${request.userId} by ${request.grantedBy}`);
    } catch (error) {
      this.logger.error(`Error granting permission:`, error);
      throw error;
    }
  }

  /**
   * Revoke a permission from a user
   */
  async revokePermission(request: PermissionRevokeRequest): Promise<void> {
    if (!this.permissionTablesExist) {
      throw new ForbiddenException('Permission system not available - permission tables do not exist');
    }

    try {
      const userPermission = await this.prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId: request.userId,
            permissionId: request.permissionId,
          },
        },
      });

      if (!userPermission) {
        throw new NotFoundException(`User permission not found`);
      }

      // Update to revoke (set granted to false instead of deleting for audit trail)
      await this.prisma.userPermission.update({
        where: { id: userPermission.id },
        data: {
          granted: false,
          isActive: false,
          metadata: {
            ...(userPermission.metadata as object || {}),
            revokedBy: request.revokedBy,
            revokedAt: new Date(),
            revocationReason: request.reason,
            ...request.metadata,
          },
        },
      });

      // Clear relevant caches
      await this.clearUserPermissionCache(request.userId);

      // Log the action
      await this.auditService.logUpdate(
        request.revokedBy,
        'UserPermission',
        userPermission.id,
        userPermission,
        { granted: false, isActive: false }
      );

      this.logger.log(`Permission ${request.permissionId} revoked from user ${request.userId} by ${request.revokedBy}`);
    } catch (error) {
      this.logger.error(`Error revoking permission:`, error);
      throw error;
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRole(request: RoleAssignmentRequest): Promise<void> {
    if (!this.permissionTablesExist) {
      throw new ForbiddenException('Permission system not available - permission tables do not exist');
    }

    try {
      // Validate role exists
      const role = await this.prisma.customRole.findUnique({
        where: { id: request.roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${request.roleId} not found`);
      }

      // Check if user role assignment already exists
      const existing = await this.prisma.userCustomRole.findUnique({
        where: {
          userId_roleId: {
            userId: request.userId,
            roleId: request.roleId,
          },
        },
      });

      if (existing) {
        // Update existing assignment
        await this.prisma.userCustomRole.update({
          where: { id: existing.id },
          data: {
            assignedBy: request.assignedBy,
            expiresAt: request.expiresAt,
            conditions: request.conditions,
            isActive: true,
            metadata: request.metadata,
          },
        });
      } else {
        // Create new assignment
        await this.prisma.userCustomRole.create({
          data: {
            userId: request.userId,
            roleId: request.roleId,
            assignedBy: request.assignedBy,
            expiresAt: request.expiresAt,
            conditions: request.conditions,
            metadata: request.metadata,
          },
        });
      }

      // Clear relevant caches
      await this.clearUserPermissionCache(request.userId);

      // Log the action
      await this.auditService.logCreate(
        request.assignedBy,
        'UserCustomRole',
        request.roleId,
        {
          userId: request.userId,
          roleId: request.roleId,
          assignedBy: request.assignedBy,
          expiresAt: request.expiresAt,
          conditions: request.conditions,
          metadata: request.metadata,
        }
      );

      this.logger.log(`Role ${request.roleId} assigned to user ${request.userId} by ${request.assignedBy}`);
    } catch (error) {
      this.logger.error(`Error assigning role:`, error);
      throw error;
    }
  }

  /**
   * Get user permission summary
   */
  async getUserPermissionSummary(userId: string): Promise<UserPermissionSummary> {
    if (!this.permissionTablesExist) {
      this.logger.debug('Permission tables not available, returning legacy mode summary');
      
      // Return a basic summary for legacy mode
      const user = await this.getUserWithRoles(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return {
        userId,
        roles: [], // No custom roles in legacy mode
        permissions: [], // No advanced permissions in legacy mode
        inheritedPermissions: [],
        directPermissions: [],
        deniedPermissions: [],
        cacheStats: {
          totalCached: 0,
          expiredCached: 0,
          validCached: 0,
        },
      };
    }

    const user = await this.getUserWithRoles(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const allPermissions = await this.getUserPermissions(userId);
    const roles = user.userCustomRoles.map(ur => ur.role);
    
    // Categorize permissions
    const inheritedPermissions: Permission[] = [];
    const directPermissions: Permission[] = [];
    const deniedPermissions: Permission[] = [];

    for (const userPerm of user.userPermissions) {
      if (userPerm.isActive && (!userPerm.expiresAt || userPerm.expiresAt > new Date())) {
        if (userPerm.granted) {
          directPermissions.push(userPerm.permission);
        } else {
          deniedPermissions.push(userPerm.permission);
        }
      }
    }

    // Get cache stats
    const cacheStats = await this.getUserCacheStats(userId);

    return {
      userId,
      roles,
      permissions: allPermissions,
      inheritedPermissions,
      directPermissions,
      deniedPermissions,
      cacheStats,
    };
  }

  /**
   * Clean up expired cache entries
   * Only run in environments where crypto module is available
   */
  async cleanupExpiredCache(): Promise<void> {
    if (!this.permissionTablesExist) {
      this.logger.debug('Skipping cache cleanup - permission tables not available');
      return;
    }

    try {
      const deleted = await this.prisma.permissionCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      this.logger.log(`Cleaned up ${deleted.count} expired permission cache entries`);
    } catch (error) {
      this.logger.error('Error cleaning up expired cache:', error);
    }
  }

  /**
   * Initialize cron job if crypto module is available
   */
  private initializeCronJobs(): void {
    try {
      // Check if crypto module is available
      require('crypto');
      
      // If crypto is available, schedule the cleanup job
      if (this.configService.get('NODE_ENV') !== 'test') {
        this.logger.log('Crypto module available - enabling scheduled cache cleanup');
        // Manual scheduling using setTimeout for now
        this.scheduleCleanupJob();
      }
    } catch (error) {
      this.logger.warn('Crypto module not available - disabling scheduled cache cleanup:', error.message);
    }
  }

  private scheduleCleanupJob(): void {
    // Run cleanup every hour (3600000 ms)
    setInterval(async () => {
      try {
        await this.cleanupExpiredCache();
      } catch (error) {
        this.logger.error('Scheduled cleanup failed:', error);
      }
    }, 3600000);
  }

  /**
   * Clear all cache for a user
   */
  async clearUserPermissionCache(userId: string): Promise<void> {
    if (!this.permissionTablesExist) {
      this.logger.debug('Skipping cache clear - permission tables not available');
      return;
    }

    try {
      await this.prisma.permissionCache.deleteMany({
        where: { userId },
      });
      this.logger.debug(`Cleared permission cache for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error clearing cache for user ${userId}:`, error);
    }
  }

  /**
   * Force re-initialization of the permission system
   * Useful for debugging and manual system recovery
   */
  async forceReinitialize(): Promise<{
    success: boolean;
    tablesExist: boolean;
    error?: string;
    systemStatus?: any;
  }> {
    this.logger.warn('Force reinitializing permission system...');
    
    try {
      // Reset state
      this.permissionTablesExist = false;
      
      // Check tables again
      this.permissionTablesExist = await this.hasPermissionTablesWithRetry();
      
      if (!this.permissionTablesExist) {
        return {
          success: false,
          tablesExist: false,
          error: 'Permission tables still not detected after reinitialization',
        };
      }
      
      // Try to initialize
      await this.ensureSystemPermissions();
      await this.ensureSystemRoles();
      
      const systemStatus = await this.getSystemStatus();
      
      this.logger.log('Permission system force reinitialization completed successfully');
      return {
        success: true,
        tablesExist: true,
        systemStatus,
      };
      
    } catch (error) {
      this.logger.error('Force reinitialization failed:', error);
      return {
        success: false,
        tablesExist: this.permissionTablesExist,
        error: error.message,
      };
    }
  }

  // Private helper methods

  /**
   * Check if permission tables exist with retry logic
   */
  private async hasPermissionTablesWithRetry(maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Checking permission tables existence (attempt ${attempt}/${maxRetries})...`);
        const result = await this.hasPermissionTables();
        if (result) {
          this.logger.log('Permission tables detected successfully');
        }
        return result;
      } catch (error) {
        this.logger.warn(`Permission table check attempt ${attempt} failed:`, error.message);
        if (attempt === maxRetries) {
          this.logger.error('All permission table check attempts failed');
          return false;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return false;
  }

  /**
   * Check if permission tables exist in the database using PostgreSQL-specific queries
   */
  private async hasPermissionTables(): Promise<boolean> {
    try {
      // Get database connection details for logging
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      const dbName = databaseUrl ? new URL(databaseUrl).pathname.slice(1) : 'unknown';
      this.logger.log(`Checking permission tables in database: ${dbName}`);

      // Check for required permission tables using PostgreSQL information_schema
      const requiredTables = ['Permission', 'CustomRole', 'RolePermission', 'UserPermission', 'PermissionCache'];
      const schema = 'public'; // Default PostgreSQL schema
      
      this.logger.log(`Checking for tables: ${requiredTables.join(', ')} in schema: ${schema}`);

      for (const tableName of requiredTables) {
        const query = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_name = $2
          ) as table_exists
        `;
        
        this.logger.debug(`Executing query for table ${tableName}: ${query}`);
        const result = await this.prisma.$queryRaw<[{table_exists: boolean}]>`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = ${schema}
            AND table_name = ${tableName}
          ) as table_exists
        `;
        
        const tableExists = result[0]?.table_exists || false;
        this.logger.log(`Table ${tableName} exists: ${tableExists}`);
        
        if (!tableExists) {
          this.logger.warn(`Required permission table '${tableName}' does not exist in schema '${schema}'`);
          return false;
        }
      }

      this.logger.log('All required permission tables found in database');
      
      // Additional verification: try to count records in Permission table
      try {
        const count = await this.prisma.permission.count();
        this.logger.log(`Permission table accessible with ${count} records`);
        return true;
      } catch (accessError) {
        this.logger.error('Permission tables exist but are not accessible:', accessError);
        return false;
      }
      
    } catch (error) {
      this.logger.error('Error checking permission tables existence:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Check for specific PostgreSQL error types
      if (error.message?.includes('relation') || 
          error.message?.includes('table') || 
          error.message?.includes('does not exist') ||
          error.code === '42P01') { // PostgreSQL "relation does not exist" error
        this.logger.debug('Permission tables do not exist in database (PostgreSQL error detected)');
        return false;
      }
      
      // For connection or other errors, assume tables don't exist to be safe
      this.logger.warn('Assuming permission tables do not exist due to database error');
      return false;
    }
  }

  private async getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
    if (!this.permissionTablesExist) {
      // Return a basic user object without custom roles/permissions when tables don't exist
      // In legacy mode, we simplify the query to avoid complex where clauses
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            role: true,
            organizationId: true,
            propertyId: true,
            departmentId: true,
          },
        });
        
        if (!user) return null;
        
        return {
          ...user,
          userCustomRoles: [],
          userPermissions: [],
        } as UserWithRoles;
      } catch (error) {
        this.logger.error(`Error fetching user in legacy mode: ${error.message}`);
        return null;
      }
    }
    try {
      return await this.prisma.user.findUnique({
        where: { 
          id: userId,
          deletedAt: null 
        },
      select: {
        id: true,
        role: true,
        organizationId: true,
        propertyId: true,
        departmentId: true,
        userCustomRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      include: {
                        rolePermissions: true,
                        conditions: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        userPermissions: {
          where: { isActive: true },
          include: {
            permission: {
              include: {
                rolePermissions: true,
                conditions: true,
              },
            },
          },
        },
      },
      });
    } catch (error) {
      this.logger.error(`Error fetching user with roles: ${error.message}`);
      // Fall back to basic user query if full query fails
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            role: true,
            organizationId: true,
            propertyId: true,
            departmentId: true,
          },
        });
        
        if (!user) return null;
        
        return {
          ...user,
          userCustomRoles: [],
          userPermissions: [],
        } as UserWithRoles;
      } catch (fallbackError) {
        this.logger.error(`Error in fallback user query: ${fallbackError.message}`);
        return null;
      }
    }
  }

  /**
   * Get permissions for user based on their type and enabled modules
   */
  async getUserTypePermissions(userType: UserType, moduleIds: string[]): Promise<Permission[]> {
    if (!this.permissionTablesExist) {
      this.logger.debug('Permission tables not available, returning empty permissions array');
      return [];
    }

    try {
      const permissions: Permission[] = [];
      
      // Get permissions from enabled module manifests
      for (const moduleId of moduleIds) {
        const manifest = await this.getModuleManifest(moduleId);
        if (!manifest) continue;
        
        const modulePermissions = userType === UserType.INTERNAL 
          ? manifest.internalPermissions as Permission[]
          : manifest.externalPermissions as Permission[];
          
        if (Array.isArray(modulePermissions)) {
          permissions.push(...modulePermissions);
        }
      }
      
      this.logger.debug(`Retrieved ${permissions.length} permissions for userType ${userType} with modules: ${moduleIds.join(', ')}`);
      return permissions;
    } catch (error) {
      this.logger.error(`Error getting permissions for userType ${userType}:`, error);
      return [];
    }
  }

  /**
   * Validate cross-organization access for external users
   */
  async validateCrossOrganizationAccess(userId: string, targetOrgId: string): Promise<boolean> {
    try {
      const user = await this.getUserWithRoles(userId);
      if (!user) return false;
      
      // Internal users can access based on their role hierarchy
      if (user.userType === UserType.INTERNAL) {
        return user.organizationId === targetOrgId || user.role === Role.PLATFORM_ADMIN;
      }
      
      // External users can only access their own organization's data by default
      // unless they have specific cross-org permissions
      if (user.organizationId !== targetOrgId) {
        // Check for explicit cross-org permissions
        const crossOrgPermission = await this.hasPermission(
          userId, 
          'organization', 
          'access', 
          'external',
          { targetOrganizationId: targetOrgId }
        );
        return crossOrgPermission;
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error validating cross-org access for user ${userId} to org ${targetOrgId}:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a specific module
   */
  async getModulePermissions(moduleId: string, userType: UserType): Promise<Permission[]> {
    if (!this.permissionTablesExist) {
      return [];
    }
    
    try {
      const manifest = await this.getModuleManifest(moduleId);
      if (!manifest) {
        this.logger.warn(`Module manifest not found for moduleId: ${moduleId}`);
        return [];
      }
      
      const permissions = userType === UserType.INTERNAL
        ? manifest.internalPermissions as Permission[]
        : manifest.externalPermissions as Permission[];
        
      return Array.isArray(permissions) ? permissions : [];
    } catch (error) {
      this.logger.error(`Error getting module permissions for ${moduleId}, userType ${userType}:`, error);
      return [];
    }
  }

  /**
   * Get module manifest by ID
   */
  async getModuleManifest(moduleId: string): Promise<ModuleManifest | null> {
    if (!this.permissionTablesExist) {
      return null;
    }
    
    try {
      return await this.prisma.moduleManifest.findUnique({
        where: { moduleId }
      });
    } catch (error) {
      this.logger.error(`Error getting module manifest for ${moduleId}:`, error);
      return null;
    }
  }

  /**
   * Get enabled modules for an organization
   */
  private async getEnabledModulesForOrganization(organizationId: string): Promise<{ moduleId: string }[]> {
    if (!this.permissionTablesExist) {
      return [];
    }
    
    try {
      const moduleSubscriptions = await this.prisma.moduleSubscription.findMany({
        where: {
          organizationId,
          isEnabled: true
        },
        select: {
          moduleName: true
        }
      });
      
      return moduleSubscriptions.map(sub => ({ moduleId: sub.moduleName }));
    } catch (error) {
      this.logger.error(`Error getting enabled modules for organization ${organizationId}:`, error);
      return [];
    }
  }

  private async findPermission(resource: string, action: string, scope: string): Promise<PermissionWithRelations | null> {
    if (!this.permissionTablesExist) {
      return null;
    }
    
    return this.prisma.permission.findUnique({
      where: {
        resource_action_scope: { resource, action, scope },
      },
      include: {
        rolePermissions: true,
        conditions: true,
      },
    });
  }

  private async getLegacyRolePermissions(role: Role, userType: UserType = UserType.INTERNAL): Promise<Permission[]> {
    // Return empty array when permission tables don't exist
    if (!this.permissionTablesExist) {
      return [];
    }
    
    this.logger.debug(`Getting legacy role permissions for role: ${role}, userType: ${userType}`);
    
    // External users have different permission patterns
    if (userType !== UserType.INTERNAL) {
      return await this.getExternalUserLegacyPermissions(role, userType);
    }
    
    // This would map legacy roles to permissions
    // Implementation depends on how you want to handle backwards compatibility
    const rolePermissionMapping: Record<Role, string[]> = {
      [Role.PLATFORM_ADMIN]: ['*.*.*'], // All permissions
      [Role.ORGANIZATION_OWNER]: ['*.*.organization', '*.*.property'],
      [Role.ORGANIZATION_ADMIN]: ['*.*.organization'],
      [Role.PROPERTY_MANAGER]: ['*.*.property', '*.*.department'],
      [Role.DEPARTMENT_ADMIN]: ['*.*.department', '*.*.own'],
      [Role.STAFF]: ['*.*.own'],
    };

    const permissionPatterns = rolePermissionMapping[role] || [];
    if (permissionPatterns.includes('*.*.*')) {
      try {
        // FIXED: Return ALL permissions for PLATFORM_ADMIN, not just isSystem=true
        const allPermissions = await this.prisma.permission.findMany();
        this.logger.log(`PLATFORM_ADMIN: Retrieved ${allPermissions.length} permissions (all permissions in system)`);
        
        // Also log what permissions we're returning for debugging
        const rolePermissions = allPermissions.filter(p => p.resource === 'role');
        this.logger.debug(`PLATFORM_ADMIN role permissions: ${rolePermissions.map(p => `${p.resource}.${p.action}.${p.scope}`).join(', ')}`);
        
        return allPermissions;
      } catch (error) {
        this.logger.error('Error fetching permissions for PLATFORM_ADMIN:', error);
        return [];
      }
    }

    // For internal users, implement pattern matching based on scope
    try {
      const scopePermissions: Permission[] = [];
      
      for (const pattern of permissionPatterns) {
        const [resource, action, scope] = pattern.split('.');
        
        let whereClause: any = {};
        
        // Handle wildcard patterns
        if (resource !== '*') whereClause.resource = resource;
        if (action !== '*') whereClause.action = action;
        if (scope !== '*') whereClause.scope = scope;
        
        const permissions = await this.prisma.permission.findMany({ where: whereClause });
        scopePermissions.push(...permissions);
      }
      
      // Remove duplicates
      const uniquePermissions = Array.from(new Map(scopePermissions.map(p => [p.id, p])).values());
      this.logger.debug(`Role ${role}: Retrieved ${uniquePermissions.length} permissions`);
      
      return uniquePermissions;
    } catch (error) {
      this.logger.error(`Error fetching permissions for role ${role}:`, error);
      return [];
    }
  }

  /**
   * Get legacy permissions for external users
   */
  private async getExternalUserLegacyPermissions(role: Role, userType: UserType): Promise<Permission[]> {
    try {
      // External users typically have more restricted permissions
      const externalPermissionPatterns: Record<UserType, string[]> = {
        [UserType.INTERNAL]: [], // Not used here
        [UserType.CLIENT]: ['reservation.read.own', 'guest.read.own', 'document.read.own'],
        [UserType.VENDOR]: ['task.read.assigned', 'document.read.department', 'unit.read.property'],
        [UserType.PARTNER]: ['property.read.organization', 'reservation.read.property', 'user.read.property'],
      };
      
      const patterns = externalPermissionPatterns[userType] || [];
      const permissions: Permission[] = [];
      
      for (const pattern of patterns) {
        const [resource, action, scope] = pattern.split('.');
        const matchingPermissions = await this.prisma.permission.findMany({
          where: { resource, action, scope }
        });
        permissions.push(...matchingPermissions);
      }
      
      this.logger.debug(`External user ${userType}: Retrieved ${permissions.length} permissions`);
      return permissions;
    } catch (error) {
      this.logger.error(`Error getting external user permissions for ${userType}:`, error);
      return [];
    }
  }

  private async checkLegacyRolePermission(role: Role, permissionId: string): Promise<boolean> {
    this.logger.debug(`Checking legacy role permission: role=${role}, permissionId=${permissionId}`);
    
    // PLATFORM_ADMIN gets access to ALL permissions
    if (role === Role.PLATFORM_ADMIN) {
      this.logger.debug(`PLATFORM_ADMIN granted access to permission ${permissionId}`);
      return true;
    }
    
    // For other roles, check if they have the specific permission based on scope
    try {
      const permission = await this.prisma.permission.findUnique({
        where: { id: permissionId }
      });
      
      if (!permission) {
        this.logger.debug(`Permission ${permissionId} not found`);
        return false;
      }
      
      const rolePermissionMapping: Record<Role, string[]> = {
        [Role.PLATFORM_ADMIN]: ['*.*.*'], // All permissions
        [Role.ORGANIZATION_OWNER]: ['*.*.organization', '*.*.property'],
        [Role.ORGANIZATION_ADMIN]: ['*.*.organization'],
        [Role.PROPERTY_MANAGER]: ['*.*.property', '*.*.department'],
        [Role.DEPARTMENT_ADMIN]: ['*.*.department', '*.*.own'],
        [Role.STAFF]: ['*.*.own'],
      };
      
      const permissionPatterns = rolePermissionMapping[role] || [];
      
      // Check if permission matches any of the role's patterns
      for (const pattern of permissionPatterns) {
        const [resourcePattern, actionPattern, scopePattern] = pattern.split('.');
        
        const resourceMatch = resourcePattern === '*' || resourcePattern === permission.resource;
        const actionMatch = actionPattern === '*' || actionPattern === permission.action;
        const scopeMatch = scopePattern === '*' || scopePattern === permission.scope;
        
        if (resourceMatch && actionMatch && scopeMatch) {
          this.logger.debug(`Role ${role} granted access to ${permission.resource}.${permission.action}.${permission.scope} via pattern ${pattern}`);
          return true;
        }
      }
      
      this.logger.debug(`Role ${role} denied access to ${permission.resource}.${permission.action}.${permission.scope}`);
      return false;
    } catch (error) {
      this.logger.error(`Error checking legacy role permission:`, error);
      return false;
    }
  }

  private async evaluatePermissionConditions(
    permission: PermissionWithRelations,
    context: PermissionEvaluationContext,
    overrideConditions?: any,
  ): Promise<PermissionEvaluationResult> {
    try {
      const conditions = overrideConditions || permission.conditions || [];
      
      for (const condition of conditions) {
        const evaluator = this.conditionEvaluators.get(condition.conditionType);
        if (evaluator && !evaluator.evaluate(condition, context)) {
          return {
            allowed: false,
            reason: `Condition failed: ${condition.description || condition.conditionType}`,
            conditions: condition.value,
            source: 'role',
          };
        }
      }

      return { allowed: true, source: 'role' };
    } catch (error) {
      this.logger.error('Error evaluating permission conditions:', error);
      return { allowed: false, reason: 'Condition evaluation error', source: 'role' };
    }
  }

  private generatePermissionCacheKey(
    userId: string,
    resource: string,
    action: string,
    scope: string,
    context?: Partial<PermissionEvaluationContext>,
  ): string {
    const contextStr = context ? JSON.stringify(context) : '';
    // Include enabled modules in cache key to invalidate when modules change
    const moduleContext = context?.enabledModules ? `modules:${context.enabledModules.join(',')}` : '';
    return `perm:${userId}:${resource}:${action}:${scope}:${moduleContext}:${Buffer.from(contextStr).toString('base64')}`;
  }

  private generateUserPermissionsCacheKey(
    userId: string,
    context?: Partial<PermissionEvaluationContext>,
  ): string {
    const contextStr = context ? JSON.stringify(context) : '';
    const moduleContext = context?.enabledModules ? `modules:${context.enabledModules.join(',')}` : '';
    return `user_perms:${userId}:${moduleContext}:${Buffer.from(contextStr).toString('base64')}`;
  }

  private async getCachedPermission(cacheKey: string): Promise<CachedPermission | null> {
    if (!this.permissionTablesExist) {
      return null;
    }
    
    try {
      const cached = await this.prisma.permissionCache.findUnique({
        where: { cacheKey },
      });

      if (!cached || cached.expiresAt < new Date()) {
        return null;
      }

      return {
        userId: cached.userId,
        organizationId: cached.organizationId,
        propertyId: cached.propertyId,
        resource: cached.resource,
        action: cached.action,
        scope: cached.scope,
        allowed: cached.allowed,
        conditions: cached.conditions,
        expiresAt: cached.expiresAt,
      };
    } catch (error) {
      this.logger.error('Error getting cached permission:', error);
      return null;
    }
  }

  private async getCachedUserPermissions(cacheKey: string): Promise<Permission[] | null> {
    // Implement user permissions caching if needed
    // This is a simplified placeholder
    return null;
  }

  private async cachePermissionResult(
    cacheKey: string,
    result: PermissionEvaluationResult,
    context: PermissionEvaluationContext,
    resource: string,
    action: string,
    scope: string,
  ): Promise<void> {
    if (!this.permissionTablesExist) {
      return;
    }
    
    try {
      const expiresAt = new Date(Date.now() + this.cacheDefaultTtl * 1000);
      
      await this.prisma.permissionCache.upsert({
        where: { cacheKey },
        create: {
          userId: context.userId,
          organizationId: context.organizationId,
          propertyId: context.propertyId,
          resource: resource || '',
          action: action || '',
          scope: scope || '',
          allowed: result.allowed,
          conditions: result.conditions,
          cacheKey,
          expiresAt,
          metadata: context.metadata,
        },
        update: {
          allowed: result.allowed,
          conditions: result.conditions,
          expiresAt,
          metadata: context.metadata,
        },
      });
    } catch (error) {
      this.logger.error('Error caching permission result:', error);
      // Don't throw - permission should still work even if caching fails
    }
  }

  private async cacheUserPermissions(cacheKey: string, permissions: Permission[]): Promise<void> {
    // Implement user permissions caching if needed
    // This is a placeholder
  }

  private async getUserCacheStats(userId: string) {
    if (!this.permissionTablesExist) {
      return {
        totalCached: 0,
        expiredCached: 0,
        validCached: 0,
      };
    }
    
    const stats = await this.prisma.permissionCache.groupBy({
      by: ['userId'],
      where: { userId },
      _count: { id: true },
    });

    const expired = await this.prisma.permissionCache.count({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });

    const total = stats[0]?._count.id || 0;
    return {
      totalCached: total,
      expiredCached: expired,
      validCached: total - expired,
    };
  }

  private initializeConditionEvaluators(): void {
    // Time-based condition evaluator
    this.conditionEvaluators.set('time', {
      conditionType: 'time',
      evaluate: (condition, context) => {
        const { startTime, endTime } = condition.value as { startTime: string; endTime: string };
        const currentTime = context.currentTime || new Date();
        const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
        
        const start = this.parseTimeString(startTime);
        const end = this.parseTimeString(endTime);
        
        return currentHour >= start && currentHour <= end;
      },
    });

    // Department-based condition evaluator
    this.conditionEvaluators.set('department', {
      conditionType: 'department',
      evaluate: (condition, context) => {
        const allowedDepartments = (condition.value as { departments?: string[] }).departments || [];
        return allowedDepartments.includes(context.departmentId);
      },
    });

    // Resource ownership condition evaluator
    this.conditionEvaluators.set('resource_owner', {
      conditionType: 'resource_owner',
      evaluate: (condition, context) => {
        // Check if user owns the resource
        return context.resourceId === context.userId;
      },
    });
  }

  private parseTimeString(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const permissions = await this.prisma.permission.findMany({
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' },
          { scope: 'asc' },
        ],
      });

      return permissions;
    } catch (error) {
      this.logger.error('Error getting all permissions:', error);
      throw error;
    }
  }

  /**
   * Get permissions grouped by resource
   */
  async getPermissionsByResource(): Promise<Record<string, Permission[]>> {
    try {
      const permissions = await this.getAllPermissions();
      
      // Group permissions by resource
      const permissionsByResource = permissions.reduce((acc, permission) => {
        const resource = permission.resource;
        if (!acc[resource]) {
          acc[resource] = [];
        }
        acc[resource].push(permission);
        return acc;
      }, {} as Record<string, Permission[]>);

      return permissionsByResource;
    } catch (error) {
      this.logger.error('Error getting permissions by resource:', error);
      throw error;
    }
  }

  /**
   * Get permission system status for debugging
   */
  async getSystemStatus(): Promise<{
    permissionTablesExist: boolean;
    tablesChecked: string[];
    databaseUrl: string;
    forceEnabled: boolean;
    skipInit: boolean;
    tableStats?: Record<string, number>;
    lastError?: string;
  }> {
    const databaseUrl = this.configService.get<string>('DATABASE_URL', 'Not configured');
    const maskedUrl = databaseUrl.replace(/\/\/[^@]+@/, '//***:***@'); // Mask credentials
    
    const status = {
      permissionTablesExist: this.permissionTablesExist,
      tablesChecked: ['Permission', 'CustomRole', 'RolePermission', 'UserPermission', 'PermissionCache'],
      databaseUrl: maskedUrl,
      forceEnabled: this.forcePermissionSystem,
      skipInit: this.skipPermissionInit,
    };

    // If tables exist, get table stats
    if (this.permissionTablesExist) {
      try {
        const tableStats = {
          permissions: await this.prisma.permission.count(),
          userCustomRoles: await this.prisma.customRole.count(),
          rolePermissions: await this.prisma.rolePermission.count(),
          userPermissions: await this.prisma.userPermission.count(),
          permissionCache: await this.prisma.permissionCache.count(),
        };
        return { ...status, tableStats };
      } catch (error) {
        return { ...status, lastError: error.message };
      }
    }

    // If tables don't exist, try to check why
    try {
      await this.hasPermissionTables();
    } catch (error) {
      return { ...status, lastError: error.message };
    }

    return status;
  }

  private async ensureSystemPermissions(): Promise<void> {
    if (!this.permissionTablesExist) {
      this.logger.warn('Skipping system permissions creation - tables do not exist');
      return;
    }
    
    try {
      this.logger.log('Starting system permissions initialization...');
      
      // Create default system permissions if they don't exist
      const systemPermissions = [
        { resource: 'user', action: 'create', scope: 'department', name: 'Create Department Users', category: 'HR' },
        { resource: 'user', action: 'read', scope: 'own', name: 'View Own Profile', category: 'HR' },
        { resource: 'user', action: 'update', scope: 'own', name: 'Update Own Profile', category: 'HR' },
        { resource: 'payslip', action: 'read', scope: 'own', name: 'View Own Payslips', category: 'HR' },
        { resource: 'vacation', action: 'create', scope: 'own', name: 'Create Vacation Request', category: 'HR' },
        { resource: 'training', action: 'read', scope: 'department', name: 'View Department Training', category: 'Training' },
        { resource: 'document', action: 'read', scope: 'department', name: 'View Department Documents', category: 'Documents' },
        // Add more system permissions as needed
      ];

      this.logger.log(`Creating/updating ${systemPermissions.length} system permissions...`);
      
      for (const perm of systemPermissions) {
        try {
          await this.prisma.permission.upsert({
            where: { resource_action_scope: { resource: perm.resource, action: perm.action, scope: perm.scope } },
            create: {
              resource: perm.resource,
              action: perm.action,
              scope: perm.scope,
              name: perm.name,
              category: perm.category,
              isSystem: true,
            },
            update: {
              name: perm.name,
              category: perm.category,
            },
          });
          this.logger.debug(`✓ Permission created/updated: ${perm.resource}.${perm.action}.${perm.scope}`);
        } catch (permError) {
          this.logger.error(`Failed to create permission ${perm.resource}.${perm.action}.${perm.scope}:`, permError);
          throw permError;
        }
      }
      
      this.logger.log('System permissions initialization completed successfully');
    } catch (error) {
      this.logger.error('Error ensuring system permissions:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  private async ensureSystemRoles(): Promise<void> {
    if (!this.permissionTablesExist) {
      this.logger.warn('Skipping system roles creation - tables do not exist');
      return;
    }
    
    try {
      this.logger.log('Starting system roles initialization...');
      
      // Create default system roles if they don't exist
      // This would map to the legacy Role enum for backwards compatibility
      const systemRoles = [
        { name: 'Platform Administrator', description: 'Full platform access', isSystemRole: true, priority: 1000 },
        { name: 'Organization Owner', description: 'Organization-wide access', isSystemRole: true, priority: 900 },
        { name: 'Property Manager', description: 'Property-wide access', isSystemRole: true, priority: 800 },
        { name: 'Department Admin', description: 'Department-specific access', isSystemRole: true, priority: 700 },
        { name: 'Staff Member', description: 'Basic staff access', isSystemRole: true, priority: 100 },
      ];

      this.logger.log(`Creating/updating ${systemRoles.length} system roles...`);
      
      // Get or create default organization for system roles
      let defaultOrg = await this.prisma.organization.findFirst({
        where: { slug: 'nayara-group' }
      });

      if (!defaultOrg) {
        this.logger.log('Creating default organization for system roles...');
        defaultOrg = await this.prisma.organization.create({
          data: {
            name: 'Nayara Group',
            slug: 'nayara-group',
            description: 'Default organization for Hotel Operations Hub',
            timezone: 'America/Costa_Rica',
            settings: {
              defaultLanguage: 'en',
              supportedLanguages: ['en', 'es'],
              theme: 'nayara'
            },
            branding: {
              primaryColor: '#AA8E67',
              secondaryColor: '#F5EBD7',
              accentColor: '#4A4A4A',
              logoUrl: null
            },
            isActive: true
          }
        });
      }
      
      for (const role of systemRoles) {
        try {
          // Use findFirst + create/update pattern instead of upsert
          let existingRole = await this.prisma.customRole.findFirst({
            where: {
              organizationId: defaultOrg.id,
              propertyId: null,
              name: role.name
            }
          });

          if (existingRole) {
            await this.prisma.customRole.update({
              where: { id: existingRole.id },
              data: {
                description: role.description,
                priority: role.priority,
              }
            });
            this.logger.debug(`✓ System role updated: ${role.name}`);
          } else {
            await this.prisma.customRole.create({
              data: {
                name: role.name,
                description: role.description,
                organizationId: defaultOrg.id,
                propertyId: null,
                isSystemRole: role.isSystemRole,
                priority: role.priority,
                isActive: true,
              }
            });
            this.logger.debug(`✓ System role created: ${role.name}`);
          }
        } catch (roleError) {
          this.logger.error(`Failed to create role ${role.name}:`, roleError);
          throw roleError;
        }
      }
      
      this.logger.log('System roles initialization completed successfully');
    } catch (error) {
      this.logger.error('Error ensuring system roles:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }
}