import api from './api';
import { 
  PermissionEvaluationResult, 
  BulkPermissionResult, 
  UserPermissionSummary,
  PermissionCheckDto,
  BulkPermissionCheckDto
} from '../types/permission';

interface PermissionCache {
  permissions: Record<string, PermissionEvaluationResult>;
  timestamp: number;
  expiresAt: number;
}

class PermissionService {
  private cache: Map<string, PermissionCache> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly CACHE_KEY_PREFIX = 'permission_cache_';

  /**
   * Generate a unique cache key for permission checks
   */
  private getCacheKey(resource: string, action: string, scope: string, context?: Record<string, any>): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${this.CACHE_KEY_PREFIX}${resource}_${action}_${scope}_${btoa(contextStr)}`;
  }

  /**
   * Check if cached permission is still valid
   */
  private isCacheValid(cached: PermissionCache): boolean {
    return Date.now() < cached.expiresAt;
  }

  /**
   * Get permission from cache if valid
   */
  private getCachedPermission(cacheKey: string): PermissionEvaluationResult | null {
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.permissions[cacheKey];
    }
    return null;
  }

  /**
   * Cache permission result
   */
  private cachePermission(cacheKey: string, result: PermissionEvaluationResult): void {
    const ttl = result.ttl ? result.ttl * 1000 : this.CACHE_TTL;
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(cacheKey, {
      permissions: { [cacheKey]: result },
      timestamp: Date.now(),
      expiresAt,
    });
  }

  /**
   * Check a single permission for the current user
   */
  async checkPermission(
    resource: string,
    action: string,
    scope: string,
    context?: Record<string, any>
  ): Promise<PermissionEvaluationResult> {
    const cacheKey = this.getCacheKey(resource, action, scope, context);
    
    // Check cache first
    const cached = this.getCachedPermission(cacheKey);
    if (cached) {
      return { ...cached, source: 'cached' };
    }

    try {
      const checkDto: PermissionCheckDto = {
        resource,
        action,
        scope,
        context,
      };

      const response = await api.post<PermissionEvaluationResult>('/permissions/check', checkDto);
      const result = response.data;

      // Cache the result
      this.cachePermission(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Permission check failed:', error);
      // Return a safe default (deny access)
      return {
        allowed: false,
        reason: 'Permission check failed',
        source: 'default',
      };
    }
  }

  /**
   * Check multiple permissions at once
   */
  async checkBulkPermissions(
    permissions: Array<{
      resource: string;
      action: string;
      scope: string;
      context?: Record<string, any>;
    }>,
    globalContext?: Record<string, any>
  ): Promise<BulkPermissionResult> {
    try {
      const bulkCheckDto: BulkPermissionCheckDto = {
        permissions: permissions.map(p => ({
          resource: p.resource,
          action: p.action,
          scope: p.scope,
          context: p.context,
        })),
        globalContext,
      };

      const response = await api.post<BulkPermissionResult>('/permissions/check/bulk', bulkCheckDto);
      const result = response.data;

      // Cache all results
      permissions.forEach((permission) => {
        const cacheKey = this.getCacheKey(
          permission.resource,
          permission.action,
          permission.scope,
          permission.context
        );
        const permissionKey = `${permission.resource}_${permission.action}_${permission.scope}`;
        const permissionResult = result.permissions[permissionKey];
        
        if (permissionResult) {
          this.cachePermission(cacheKey, permissionResult);
        }
      });

      return result;
    } catch (error) {
      console.error('Bulk permission check failed:', error);
      // Return safe defaults
      const defaultPermissions: Record<string, PermissionEvaluationResult> = {};
      permissions.forEach(permission => {
        const key = `${permission.resource}_${permission.action}_${permission.scope}`;
        defaultPermissions[key] = {
          allowed: false,
          reason: 'Permission check failed',
          source: 'default',
        };
      });

      return {
        permissions: defaultPermissions,
        cached: 0,
        evaluated: permissions.length,
        errors: ['Bulk permission check failed'],
      };
    }
  }

  /**
   * Get all permissions for the current user
   */
  async getMyPermissions(): Promise<UserPermissionSummary> {
    try {
      const response = await api.get<UserPermissionSummary>('/permissions/my/summary');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      throw new Error('Failed to fetch user permissions');
    }
  }

  /**
   * Get all permissions for a specific user (admin only)
   */
  async getUserPermissions(userId: string): Promise<UserPermissionSummary> {
    try {
      const response = await api.get<UserPermissionSummary>(`/permissions/user/${userId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      throw new Error('Failed to fetch user permissions');
    }
  }

  /**
   * Clear permission cache for the current user
   */
  async clearMyCache(): Promise<void> {
    try {
      await api.delete('/permissions/my/cache');
      this.cache.clear();
    } catch (error) {
      console.error('Failed to clear permission cache:', error);
      throw new Error('Failed to clear permission cache');
    }
  }

  /**
   * Clear local cache (client-side only)
   */
  clearLocalCache(): void {
    this.cache.clear();
  }

  /**
   * Grant permission to a user (admin only)
   */
  async grantPermission(
    userId: string,
    permissionId: string,
    conditions?: Record<string, any>,
    expiresAt?: Date,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await api.post('/permissions/grant', {
        userId,
        permissionId,
        conditions,
        expiresAt,
        metadata,
      });
      
      // Clear cache as permissions have changed
      this.clearLocalCache();
    } catch (error) {
      console.error('Failed to grant permission:', error);
      throw new Error('Failed to grant permission');
    }
  }

  /**
   * Revoke permission from a user (admin only)
   */
  async revokePermission(
    userId: string,
    permissionId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await api.post('/permissions/revoke', {
        userId,
        permissionId,
        reason,
        metadata,
      });
      
      // Clear cache as permissions have changed
      this.clearLocalCache();
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      throw new Error('Failed to revoke permission');
    }
  }

  /**
   * Check if user has a specific permission (convenience method)
   */
  async hasPermission(
    resource: string,
    action: string,
    scope: string = 'own',
    context?: Record<string, any>
  ): Promise<boolean> {
    const result = await this.checkPermission(resource, action, scope, context);
    return result.allowed;
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    permissions: Array<{
      resource: string;
      action: string;
      scope?: string;
      context?: Record<string, any>;
    }>
  ): Promise<boolean> {
    const permissionsWithDefaults = permissions.map(p => ({
      ...p,
      scope: p.scope || 'own',
    }));

    const result = await this.checkBulkPermissions(permissionsWithDefaults);
    
    return Object.values(result.permissions).some(permission => permission.allowed);
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(
    permissions: Array<{
      resource: string;
      action: string;
      scope?: string;
      context?: Record<string, any>;
    }>
  ): Promise<boolean> {
    const permissionsWithDefaults = permissions.map(p => ({
      ...p,
      scope: p.scope || 'own',
    }));

    const result = await this.checkBulkPermissions(permissionsWithDefaults);
    
    return Object.values(result.permissions).every(permission => permission.allowed);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
  } {
    let validEntries = 0;
    let expiredEntries = 0;
    
    this.cache.forEach(cached => {
      if (this.isCacheValid(cached)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
export default permissionService;