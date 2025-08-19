import { useState, useEffect, useCallback, useRef } from 'react';
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

interface UsePermissionsState {
  permissions: Permission[];
  userPermissionSummary: UserPermissionSummary | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePermissionsReturn extends UsePermissionsState {
  // Permission checking methods
  hasPermission: (resource: string, action: string, scope?: string, context?: PermissionContext) => Promise<boolean>;
  hasAnyPermission: (permissions: PermissionSpec[]) => Promise<boolean>;
  hasAllPermissions: (permissions: PermissionSpec[]) => Promise<boolean>;
  checkPermission: (resource: string, action: string, scope?: string, context?: PermissionContext) => Promise<PermissionEvaluationResult>;
  checkBulkPermissions: (permissions: PermissionSpec[], globalContext?: PermissionContext) => Promise<BulkPermissionResult>;
  
  // Data management methods
  getUserPermissions: () => Promise<Permission[]>;
  refreshPermissions: () => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Utility methods
  getCacheStats: () => { totalEntries: number; validEntries: number; expiredEntries: number };
}

/**
 * Custom hook for permission management and checking
 * 
 * Features:
 * - Automatic permission loading based on auth state
 * - Caching with TTL support
 * - Bulk permission checking
 * - Error handling with graceful fallbacks
 * - Performance optimization
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<UsePermissionsState>({
    permissions: [],
    userPermissionSummary: null,
    isLoading: false,
    error: null,
  });

  // Use ref to prevent infinite re-renders
  const isLoadingRef = useRef(false);

  /**
   * Load user permissions on mount or auth change
   */
  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated || !user || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const summary = await permissionService.getMyPermissions();
      setState(prev => ({
        ...prev,
        permissions: summary.permissions,
        userPermissionSummary: summary,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load permissions',
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [isAuthenticated, user]);

  // Load permissions when auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadPermissions();
    } else {
      // Clear permissions when user logs out
      setState({
        permissions: [],
        userPermissionSummary: null,
        isLoading: false,
        error: null,
      });
    }
  }, [isAuthenticated, user, loadPermissions]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(async (
    resource: string,
    action: string,
    scope: string = 'own',
    context?: PermissionContext
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      return await permissionService.hasPermission(resource, action, scope, context);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false; // Fail closed for security
    }
  }, [isAuthenticated]);

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(async (permissions: PermissionSpec[]): Promise<boolean> => {
    if (!isAuthenticated || permissions.length === 0) {
      return false;
    }

    try {
      const permissionsWithScope = permissions.map(p => ({
        ...p,
        scope: p.scope || 'own'
      }));
      return await permissionService.hasAnyPermission(permissionsWithScope);
    } catch (error) {
      console.error('Any permission check failed:', error);
      return false;
    }
  }, [isAuthenticated]);

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(async (permissions: PermissionSpec[]): Promise<boolean> => {
    if (!isAuthenticated || permissions.length === 0) {
      return false;
    }

    try {
      const permissionsWithScope = permissions.map(p => ({
        ...p,
        scope: p.scope || 'own'
      }));
      return await permissionService.hasAllPermissions(permissionsWithScope);
    } catch (error) {
      console.error('All permissions check failed:', error);
      return false;
    }
  }, [isAuthenticated]);

  /**
   * Check a specific permission and get detailed result
   */
  const checkPermission = useCallback(async (
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
      return await permissionService.checkPermission(resource, action, scope, context);
    } catch (error) {
      console.error('Permission check failed:', error);
      return {
        allowed: false,
        reason: 'Permission check failed',
        source: 'default',
      };
    }
  }, [isAuthenticated]);

  /**
   * Check multiple permissions at once
   */
  const checkBulkPermissions = useCallback(async (
    permissions: PermissionSpec[],
    globalContext?: PermissionContext
  ): Promise<BulkPermissionResult> => {
    if (!isAuthenticated) {
      const defaultPermissions: Record<string, PermissionEvaluationResult> = {};
      permissions.forEach(permission => {
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
        evaluated: permissions.length,
        errors: ['User not authenticated'],
      };
    }

    try {
      const permissionsWithScope = permissions.map(p => ({
        ...p,
        scope: p.scope || 'own'
      }));
      return await permissionService.checkBulkPermissions(permissionsWithScope, globalContext);
    } catch (error) {
      console.error('Bulk permission check failed:', error);
      const defaultPermissions: Record<string, PermissionEvaluationResult> = {};
      permissions.forEach(permission => {
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
        evaluated: permissions.length,
        errors: ['Bulk permission check failed'],
      };
    }
  }, [isAuthenticated]);

  /**
   * Get current user permissions
   */
  const getUserPermissions = useCallback(async (): Promise<Permission[]> => {
    if (!isAuthenticated) {
      return [];
    }

    try {
      const summary = await permissionService.getMyPermissions();
      return summary.permissions;
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }, [isAuthenticated]);

  /**
   * Refresh permissions from the server
   */
  const refreshPermissions = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    // Clear cache first
    permissionService.clearLocalCache();
    
    // Reload permissions
    await loadPermissions();
  }, [isAuthenticated, loadPermissions]);

  /**
   * Clear permission cache
   */
  const clearCache = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await permissionService.clearMyCache();
      // Reload permissions after clearing cache
      await loadPermissions();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }, [isAuthenticated, loadPermissions]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return permissionService.getCacheStats();
  }, []);

  return {
    // State
    permissions: state.permissions,
    userPermissionSummary: state.userPermissionSummary,
    isLoading: state.isLoading,
    error: state.error,

    // Permission checking methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    checkBulkPermissions,

    // Data management methods
    getUserPermissions,
    refreshPermissions,
    clearCache,

    // Utility methods
    getCacheStats,
  };
}

export default usePermissions;