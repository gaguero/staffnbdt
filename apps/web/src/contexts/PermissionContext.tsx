import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { PERMISSION_QUERY_KEYS } from '../hooks/usePermissions';
import permissionService from '../services/permissionService';
import {
  Permission,
  UserPermissionSummary,
  PermissionSpec,
} from '../types/permission';

interface PermissionProviderProps {
  children: ReactNode;
}

interface PermissionContextValue {
  permissions: Permission[];
  userPermissionSummary: UserPermissionSummary | null;
  isLoading: boolean;
  error: Error | null;
  
  // Optimized bulk permission checker for multiple components
  checkMultiplePermissions: (permissions: PermissionSpec[]) => Record<string, boolean>;
  
  // Advanced bulk operations
  bulkCheckPermissions: (permissions: PermissionSpec[]) => Promise<Record<string, boolean>>;
  
  // Preload common permissions to reduce API calls
  preloadCommonPermissions: (permissions: PermissionSpec[]) => Promise<void>;
  
  // Batch preload with background processing
  batchPreloadPermissions: (permissionBatches: PermissionSpec[][]) => Promise<void>;
  
  // Invalidate permissions cache
  invalidatePermissions: () => Promise<void>;
  
  // Cache statistics for debugging
  getCacheStats: () => { totalEntries: number; validEntries: number; expiredEntries: number };
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

/**
 * Optimized Permission Context Provider
 * 
 * Features:
 * - Central permission management with React Query
 * - Bulk permission checking to reduce individual API calls
 * - Preloading of common permissions
 * - Automatic cache invalidation
 * - Request deduplication across components
 */
export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Main permissions query
  const {
    data: userPermissionSummary,
    isLoading,
    error,
  } = useQuery({
    queryKey: PERMISSION_QUERY_KEYS.summary(),
    queryFn: () => permissionService.getMyPermissions(),
    enabled: isAuthenticated && !!user,
    staleTime: 15 * 60 * 1000, // Extended to 15 minutes for better performance
    gcTime: 30 * 60 * 1000, // Extended to 30 minutes
    // Background refetch for fresh data
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes in background
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const permissions = userPermissionSummary?.permissions || [];

  // Optimized bulk permission checker
  const checkMultiplePermissions = React.useCallback((permissionsToCheck: PermissionSpec[]): Record<string, boolean> => {
    if (!isAuthenticated || !userPermissionSummary) {
      return permissionsToCheck.reduce((acc, permission) => {
        const key = `${permission.resource}.${permission.action}.${permission.scope || 'own'}`;
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>);
    }

    return permissionsToCheck.reduce((acc, permission) => {
      const key = `${permission.resource}.${permission.action}.${permission.scope || 'own'}`;
      
      // Check if permission exists in user permissions
      const hasPermission = permissions.some(p => 
        p.resource === permission.resource &&
        p.action === permission.action &&
        (p.scope === (permission.scope || 'own') || p.scope === 'all')
      );
      
      acc[key] = hasPermission;
      return acc;
    }, {} as Record<string, boolean>);
  }, [isAuthenticated, userPermissionSummary, permissions]);

  // Advanced bulk permission checking with caching
  const bulkCheckPermissions = useCallback(async (permissionsToCheck: PermissionSpec[]): Promise<Record<string, boolean>> => {
    if (!isAuthenticated || !permissionsToCheck.length) {
      return {};
    }

    try {
      const result = await permissionService.checkBulkPermissions(permissionsToCheck.map(p => ({
        resource: p.resource,
        action: p.action,
        scope: p.scope || 'own',
        context: p.context,
      })));

      // Cache individual results for future queries
      const mappedResults: Record<string, boolean> = {};
      
      permissionsToCheck.forEach((permission) => {
        const permissionKey = `${permission.resource}_${permission.action}_${permission.scope || 'own'}`;
        const permissionResult = result.permissions[permissionKey];
        
        if (permissionResult) {
          const queryKey = PERMISSION_QUERY_KEYS.check(
            permission.resource,
            permission.action,
            permission.scope || 'own',
            permission.context
          );
          
          // Cache the result in React Query with extended stale time
          queryClient.setQueryData(queryKey, permissionResult, {
            updatedAt: Date.now(),
          });
          
          const displayKey = `${permission.resource}.${permission.action}.${permission.scope || 'own'}`;
          mappedResults[displayKey] = permissionResult.allowed;
        }
      });

      console.debug(`Bulk checked ${permissionsToCheck.length} permissions, cached results`);
      return mappedResults;
    } catch (error) {
      console.error('Bulk permission check failed:', error);
      return {};
    }
  }, [isAuthenticated, queryClient]);

  // Optimized preloading using bulk API
  const preloadCommonPermissions = useCallback(async (permissionsToPreload: PermissionSpec[]): Promise<void> => {
    if (!isAuthenticated || !permissionsToPreload.length) {
      return;
    }

    // Check which permissions are not already cached
    const uncachedPermissions = permissionsToPreload.filter(permission => {
      const queryKey = PERMISSION_QUERY_KEYS.check(
        permission.resource,
        permission.action,
        permission.scope || 'own',
        permission.context
      );
      return !queryClient.getQueryData(queryKey);
    });

    if (uncachedPermissions.length === 0) {
      console.debug('All permissions already cached, skipping preload');
      return;
    }

    console.debug(`Preloading ${uncachedPermissions.length} uncached permissions`);
    await bulkCheckPermissions(uncachedPermissions);
  }, [isAuthenticated, queryClient, bulkCheckPermissions]);

  // Batch preload permissions in chunks
  const batchPreloadPermissions = useCallback(async (permissionBatches: PermissionSpec[][]): Promise<void> => {
    for (const batch of permissionBatches) {
      await preloadCommonPermissions(batch);
      // Small delay between batches to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    console.debug(`Completed batch preloading of ${permissionBatches.length} batches`);
  }, [preloadCommonPermissions]);

  // Invalidate permissions cache
  const invalidatePermissions = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.all });
  }, [queryClient]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return permissionService.getCacheStats();
  }, []);

  // Auto-preload common permissions on authentication
  useEffect(() => {
    if (isAuthenticated && userPermissionSummary) {
      const commonPermissions: PermissionSpec[] = [
        { resource: 'user', action: 'read', scope: 'own' },
        { resource: 'user', action: 'update', scope: 'own' },
        { resource: 'user', action: 'read', scope: 'department' },
        { resource: 'document', action: 'read', scope: 'department' },
        { resource: 'training', action: 'read', scope: 'department' },
      ];
      
      // Delay to avoid interfering with initial page load
      const timer = setTimeout(() => {
        preloadCommonPermissions(commonPermissions);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAuthenticated, userPermissionSummary, preloadCommonPermissions]);

  const value: PermissionContextValue = {
    permissions,
    userPermissionSummary: userPermissionSummary || null,
    isLoading,
    error: error || null,
    checkMultiplePermissions,
    bulkCheckPermissions,
    preloadCommonPermissions,
    batchPreloadPermissions,
    invalidatePermissions,
    getCacheStats,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * Hook to access permission context
 */
export const usePermissionContext = (): PermissionContextValue => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
};

export default PermissionProvider;