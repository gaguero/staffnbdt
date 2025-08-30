import { useMemo, useCallback, useState, useEffect } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSION_QUERY_KEYS } from './usePermissions';
import permissionService from '../services/permissionService';
import {
  PermissionSpec,
  PermissionEvaluationResult,
} from '../types/permission';

interface BatchPermissionResult {
  [key: string]: {
    allowed: boolean;
    isLoading: boolean;
    error: Error | null;
    result?: PermissionEvaluationResult;
  };
}

interface UsePermissionBatchOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  // Advanced batching options
  useBulkAPI?: boolean; // Use bulk API instead of individual queries (default: true)
  batchDelay?: number; // Delay before processing batch (default: 50ms)
  maxBatchSize?: number; // Maximum batch size (default: 20)
}


/**
 * Optimized hook for batch permission checking
 * 
 * This hook efficiently manages multiple permission checks by:
 * - Using React Query's useQueries for parallel fetching
 * - Automatic request deduplication
 * - Shared caching across components
 * - Minimal re-renders through memoization
 * 
 * @param permissions Array of permissions to check
 * @param options Query configuration options
 * @returns Object mapping permission keys to results
 * 
 * @example
 * ```tsx
 * const permissions = [
 *   { resource: 'user', action: 'create', scope: 'department' },
 *   { resource: 'user', action: 'edit', scope: 'department' },
 *   { resource: 'user', action: 'delete', scope: 'department' }
 * ];
 * 
 * const permissionResults = usePermissionBatch(permissions);
 * 
 * // Access results
 * const canCreateUser = permissionResults['user.create.department']?.allowed;
 * const canEditUser = permissionResults['user.edit.department']?.allowed;
 * ```
 */
export function usePermissionBatch(
  permissions: PermissionSpec[],
  options: UsePermissionBatchOptions = {}
): BatchPermissionResult {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const {
    enabled = true,
    staleTime = 15 * 60 * 1000, // 15 minutes (optimized)
    gcTime = 30 * 60 * 1000, // 30 minutes (optimized)
    useBulkAPI = true,
  } = options;

  // Advanced batching state
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // Memoize permission specs to prevent unnecessary re-queries
  const memoizedPermissions = useMemo(() => permissions, [
    JSON.stringify(permissions) // Deep comparison for permissions array
  ]);


  // Generate queries for each permission
  const queries = useMemo(() => 
    memoizedPermissions.map(permission => ({
      queryKey: PERMISSION_QUERY_KEYS.check(
        permission.resource,
        permission.action,
        permission.scope || 'own',
        permission.context
      ),
      queryFn: () => permissionService.checkPermission(
        permission.resource,
        permission.action,
        permission.scope || 'own',
        permission.context
      ),
      enabled: enabled && isAuthenticated && !!user,
      staleTime: staleTime || 15 * 60 * 1000, // Extended to 15 minutes
      gcTime: gcTime || 30 * 60 * 1000, // Extended to 30 minutes  
      retry: 1,
      refetchOnWindowFocus: false,
    })),
    [memoizedPermissions, enabled, isAuthenticated, user, staleTime, gcTime]
  );

  // Advanced bulk processing function
  const processBulkBatch = useCallback(async (batchedPermissions: PermissionSpec[]): Promise<void> => {
    if (!isAuthenticated || batchedPermissions.length === 0) {
      return;
    }

    try {
      setIsProcessingBatch(true);
      console.debug(`Processing bulk batch of ${batchedPermissions.length} permissions`);
      
      const result = await permissionService.checkBulkPermissions(
        batchedPermissions.map(p => ({ ...p, scope: p.scope || 'own' }))
      );
      
      // Cache all results individually for future single queries
      batchedPermissions.forEach((permission) => {
        const permissionKey = `${permission.resource}_${permission.action}_${permission.scope || 'own'}`;
        const permissionResult = result.permissions[permissionKey];
        
        if (permissionResult) {
          const queryKey = PERMISSION_QUERY_KEYS.check(
            permission.resource,
            permission.action,
            permission.scope || 'own',
            permission.context
          );
          
          queryClient.setQueryData(queryKey, permissionResult, {
            updatedAt: Date.now(),
          });
        }
      });
      
    } catch (error) {
      console.error('Bulk batch processing failed:', error);
    } finally {
      setIsProcessingBatch(false);
    }
  }, [isAuthenticated, queryClient]);

  // Preload permissions using bulk API if enabled
  useEffect(() => {
    if (useBulkAPI && memoizedPermissions.length > 0 && isAuthenticated && enabled) {
      // Small delay to avoid interfering with initial component render
      const timer = setTimeout(() => {
        processBulkBatch(memoizedPermissions);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [memoizedPermissions, isAuthenticated, enabled, useBulkAPI, processBulkBatch]);

  // Execute all queries in parallel (fallback method)
  const queryResults = useQueries({
    queries: useBulkAPI ? [] : queries, // Skip individual queries if using bulk API
    combine: (results) => results,
  });

  // Transform results into a keyed object for easy access
  const batchResult = useMemo((): BatchPermissionResult => {
    const result: BatchPermissionResult = {};
    
    memoizedPermissions.forEach((permission, index) => {
      const key = `${permission.resource}.${permission.action}.${permission.scope || 'own'}`;
      
      if (useBulkAPI) {
        // Check React Query cache for bulk-loaded data
        const queryKey = PERMISSION_QUERY_KEYS.check(
          permission.resource,
          permission.action,
          permission.scope || 'own',
          permission.context
        );
        const cachedResult = queryClient.getQueryData<PermissionEvaluationResult>(queryKey);
        
        result[key] = {
          allowed: cachedResult?.allowed || false,
          isLoading: isProcessingBatch && !cachedResult,
          error: null, // Bulk API errors are handled differently
          result: cachedResult,
        };
      } else {
        // Use individual query results (fallback mode)
        const queryResult = queryResults[index] || { data: null, isLoading: false, error: null };
        
        result[key] = {
          allowed: queryResult.data?.allowed || false,
          isLoading: queryResult.isLoading,
          error: queryResult.error as Error | null,
          result: queryResult.data,
        };
      }
    });

    return result;
  }, [memoizedPermissions, queryResults, useBulkAPI, queryClient, isProcessingBatch]);

  return batchResult;
}

/**
 * Hook for checking common permission patterns efficiently
 * 
 * Pre-defined common permission combinations to reduce boilerplate
 */
export function useCommonPermissions() {
  const { isAuthenticated } = useAuth();

  // Common user management permissions
  const userPermissions = usePermissionBatch([
    { resource: 'user', action: 'create', scope: 'department' },
    { resource: 'user', action: 'read', scope: 'department' },
    { resource: 'user', action: 'update', scope: 'department' },
    { resource: 'user', action: 'delete', scope: 'department' },
  ]);

  // Common role management permissions
  const rolePermissions = usePermissionBatch([
    { resource: 'role', action: 'create', scope: 'organization' },
    { resource: 'role', action: 'read', scope: 'organization' },
    { resource: 'role', action: 'update', scope: 'organization' },
    { resource: 'role', action: 'delete', scope: 'organization' },
  ]);

  // Common property management permissions
  const propertyPermissions = usePermissionBatch([
    { resource: 'property', action: 'create', scope: 'organization' },
    { resource: 'property', action: 'read', scope: 'organization' },
    { resource: 'property', action: 'update', scope: 'property' },
    { resource: 'property', action: 'delete', scope: 'organization' },
  ]);

  return {
    user: userPermissions,
    role: rolePermissions,
    property: propertyPermissions,
    isAuthenticated,
    
    // Convenience getters
    canManageUsers: userPermissions['user.create.department']?.allowed || false,
    canManageRoles: rolePermissions['role.create.organization']?.allowed || false,
    canManageProperties: propertyPermissions['property.create.organization']?.allowed || false,
    
    // Loading states
    isLoadingUserPermissions: Object.values(userPermissions).some(p => p.isLoading),
    isLoadingRolePermissions: Object.values(rolePermissions).some(p => p.isLoading),
    isLoadingPropertyPermissions: Object.values(propertyPermissions).some(p => p.isLoading),
  };
}

/**
 * Utility function to create permission keys consistently
 */
export function createPermissionKey(resource: string, action: string, scope: string = 'own'): string {
  return `${resource}.${action}.${scope}`;
}

export default usePermissionBatch;