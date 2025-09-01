import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import permissionService from '../services/permissionService';
import {
  PermissionEvaluationResult,
  PermissionSpec,
  Permission,
  UserPermissionSummary,
  PermissionContext,
  BulkPermissionResult,
} from '../types/permission';

// Query keys for permission caching with normalization
export const PERMISSION_QUERY_KEYS = {
  all: ['permissions'] as const,
  summary: () => [...PERMISSION_QUERY_KEYS.all, 'summary'] as const,
  check: (resource: string, action: string, scope: string, context?: PermissionContext) => 
    [...PERMISSION_QUERY_KEYS.all, 'check', { resource, action, scope, context }] as const,
  bulk: (permissions: PermissionSpec[], globalContext?: PermissionContext) => 
    [...PERMISSION_QUERY_KEYS.all, 'bulk', { permissions, globalContext }] as const,
};


interface UsePermissionsState {
  permissions: Permission[];
  userPermissionSummary: UserPermissionSummary | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePermissionsReturn extends UsePermissionsState {
  // Optimized permission checking methods with caching
  hasPermission: (resource: string, action: string, scope?: string, context?: PermissionContext) => boolean;
  hasAnyPermission: (permissions: PermissionSpec[]) => boolean;
  hasAllPermissions: (permissions: PermissionSpec[]) => boolean;
  checkPermission: (resource: string, action: string, scope?: string, context?: PermissionContext) => PermissionEvaluationResult | undefined;
  
  // Async methods for when fresh data is needed
  checkPermissionAsync: (resource: string, action: string, scope?: string, context?: PermissionContext) => Promise<PermissionEvaluationResult>;
  checkBulkPermissionsAsync: (permissions: PermissionSpec[], globalContext?: PermissionContext) => Promise<BulkPermissionResult>;
  
  // Data management methods
  getUserPermissions: () => Permission[];
  refreshPermissions: () => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Utility methods
  getCacheStats: () => { totalEntries: number; validEntries: number; expiredEntries: number };
}

/**
 * Optimized custom hook for permission management and checking
 * 
 * Features:
 * - React Query integration for optimal caching and deduplication
 * - Synchronous permission checking from cached data
 * - Automatic request deduplication
 * - Background refetching and cache invalidation
 * - Performance optimization with minimal re-renders
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Main permissions query with React Query - OPTIMIZED
  const {
    data: userPermissionSummary,
    isLoading,
    error,
    refetch: refreshPermissions,
  } = useQuery({
    queryKey: PERMISSION_QUERY_KEYS.summary(),
    queryFn: () => permissionService.getMyPermissions(),
    enabled: isAuthenticated && !!user,
    staleTime: 15 * 60 * 1000, // Extended to 15 minutes
    gcTime: 30 * 60 * 1000, // Extended to 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    // Background refetch for fresh data
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes in background
  });

  // Extract permissions from summary with memoization
  const permissions = useMemo(() => 
    userPermissionSummary?.permissions || [], 
    [userPermissionSummary?.permissions]
  );

  /**
   * Synchronous permission check using cached data (HEAVILY OPTIMIZED)
   * Uses normalized cache keys and aggressive caching strategies
   */
  const hasPermission = useCallback((
    resource: string,
    action: string,
    scope: string = 'own',
    context?: PermissionContext
  ): boolean => {
    if (!isAuthenticated || !userPermissionSummary) {
      return false;
    }

    // Platform Admin bypass - if user has any platform-level permission, grant all permissions
    const hasPlatformAccess = permissions.some(permission => permission.scope === 'platform');
    if (hasPlatformAccess) {
      return true;
    }

    // Create normalized cache key for better cache hits
    const queryKey = PERMISSION_QUERY_KEYS.check(resource, action, scope, context);
    
    // Check React Query cache first for instant response
    const cachedResult = queryClient.getQueryData<PermissionEvaluationResult>(queryKey);
    if (cachedResult) {
      return cachedResult.allowed;
    }

    // Enhanced fallback: Check user permissions summary with scope hierarchy
    const hasDirectPermission = permissions.some(permission => 
      permission.resource === resource &&
      permission.action === action &&
      (permission.scope === scope || permission.scope === 'all')
    );

    if (hasDirectPermission) {
      return true;
    }

    // Check scope hierarchy (department -> property -> organization)
    const scopeHierarchy = ['department', 'property', 'organization', 'all'];
    const currentScopeIndex = scopeHierarchy.indexOf(scope);
    
    if (currentScopeIndex !== -1) {
      const higherScopes = scopeHierarchy.slice(currentScopeIndex + 1);
      return permissions.some(permission => 
        permission.resource === resource &&
        permission.action === action &&
        higherScopes.includes(permission.scope)
      );
    }

    return false;
  }, [isAuthenticated, userPermissionSummary, queryClient, permissions]);

  /**
   * Check if user has any of the specified permissions (OPTIMIZED)
   */
  const hasAnyPermission = useCallback((permissionsToCheck: PermissionSpec[]): boolean => {
    if (!isAuthenticated || permissionsToCheck.length === 0) {
      return false;
    }

    return permissionsToCheck.some(permission => 
      hasPermission(
        permission.resource,
        permission.action,
        permission.scope || 'own',
        permission.context
      )
    );
  }, [isAuthenticated, hasPermission]);

  /**
   * Check if user has all of the specified permissions (OPTIMIZED)
   */
  const hasAllPermissions = useCallback((permissionsToCheck: PermissionSpec[]): boolean => {
    if (!isAuthenticated || permissionsToCheck.length === 0) {
      return false;
    }

    return permissionsToCheck.every(permission => 
      hasPermission(
        permission.resource,
        permission.action,
        permission.scope || 'own',
        permission.context
      )
    );
  }, [isAuthenticated, hasPermission]);

  /**
   * Synchronous permission check returning detailed result from cache
   */
  const checkPermission = useCallback((
    resource: string,
    action: string,
    scope: string = 'own',
    context?: PermissionContext
  ): PermissionEvaluationResult | undefined => {
    if (!isAuthenticated) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        source: 'default',
      };
    }

    const queryKey = PERMISSION_QUERY_KEYS.check(resource, action, scope, context);
    return queryClient.getQueryData<PermissionEvaluationResult>(queryKey);
  }, [isAuthenticated, queryClient]);

  /**
   * Async permission check for when fresh data is needed
   */
  const checkPermissionAsync = useCallback(async (
    resource: string,
    action: string,
    scope: string = 'own',
    context?: PermissionContext
  ): Promise<PermissionEvaluationResult> => {
    if (!isAuthenticated) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        source: 'default',
      };
    }

    try {
      const queryKey = PERMISSION_QUERY_KEYS.check(resource, action, scope, context);
      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => permissionService.checkPermission(resource, action, scope, context),
        staleTime: 15 * 60 * 1000, // Extended to 15 minutes for stability
      });
      return result;
    } catch (error) {
      console.error('Permission check failed:', error);
      return {
        allowed: false,
        reason: 'Permission check failed',
        source: 'default',
      };
    }
  }, [isAuthenticated, queryClient]);

  /**
   * Async bulk permission check with React Query optimization
   */
  const checkBulkPermissionsAsync = useCallback(async (
    permissionsToCheck: PermissionSpec[],
    globalContext?: PermissionContext
  ): Promise<BulkPermissionResult> => {
    if (!isAuthenticated) {
      const defaultPermissions: Record<string, PermissionEvaluationResult> = {};
      permissionsToCheck.forEach(permission => {
        const key = `${permission.resource}_${permission.action}_${permission.scope || 'own'}`;
        defaultPermissions[key] = {
          allowed: false,
          reason: 'User not authenticated',
          source: 'default',
        };
      });

      return {
        permissions: defaultPermissions,
        cached: 0,
        evaluated: permissionsToCheck.length,
        errors: ['User not authenticated'],
      };
    }

    try {
      const permissionsWithScope = permissionsToCheck.map(p => ({
        ...p,
        scope: p.scope || 'own'
      }));
      
      const queryKey = PERMISSION_QUERY_KEYS.bulk(permissionsWithScope, globalContext);
      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => permissionService.checkBulkPermissions(permissionsWithScope, globalContext),
        staleTime: 15 * 60 * 1000, // Extended to 15 minutes for stability
      });
      
      return result;
    } catch (error) {
      console.error('Bulk permission check failed:', error);
      const defaultPermissions: Record<string, PermissionEvaluationResult> = {};
      permissionsToCheck.forEach(permission => {
        const key = `${permission.resource}_${permission.action}_${permission.scope || 'own'}`;
        defaultPermissions[key] = {
          allowed: false,
          reason: 'Permission check failed',
          source: 'default',
        };
      });

      return {
        permissions: defaultPermissions,
        cached: 0,
        evaluated: permissionsToCheck.length,
        errors: ['Bulk permission check failed'],
      };
    }
  }, [isAuthenticated, queryClient]);

  /**
   * Get current user permissions from cache
   */
  const getUserPermissions = useCallback((): Permission[] => {
    return permissions;
  }, [permissions]);

  // Refresh permissions is provided by the query
  const refreshPermissionsCallback = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    // Clear React Query cache
    await queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.all });
    
    // Clear service cache
    permissionService.clearLocalCache();
    
    // Refetch fresh data
    await refreshPermissions();
  }, [isAuthenticated, queryClient, refreshPermissions]);

  /**
   * Clear permission cache (both React Query and service)
   */
  const clearCache = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    try {
      // Clear React Query cache
      await queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.all });
      
      // Clear service cache
      await permissionService.clearMyCache();
      
      // Refetch fresh data
      await refreshPermissions();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }, [isAuthenticated, queryClient, refreshPermissions]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return permissionService.getCacheStats();
  }, []);

  return {
    // State
    permissions,
    userPermissionSummary: userPermissionSummary || null,
    isLoading,
    error: error?.message || null,

    // Optimized permission checking methods (synchronous)
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,

    // Async methods for fresh data when needed
    checkPermissionAsync,
    checkBulkPermissionsAsync,

    // Data management methods
    getUserPermissions,
    refreshPermissions: refreshPermissionsCallback,
    clearCache,

    // Utility methods
    getCacheStats,
  };
}

export default usePermissions;