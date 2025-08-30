import React, { useMemo, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissionBatch } from '../hooks/usePermissionBatch';
import {
  PermissionSpec,
  PermissionContext,
  CommonPermission,
} from '../types/permission';
import LoadingSpinner from './LoadingSpinner';

interface OptimizedPermissionGateProps {
  children: ReactNode;
  
  // Single permission check
  resource?: string;
  action?: string;
  scope?: string;
  context?: PermissionContext;
  
  // Multiple permissions
  permissions?: PermissionSpec[];
  
  // Common permissions (predefined)
  commonPermission?: CommonPermission;
  commonPermissions?: CommonPermission[];
  
  // Logic for multiple permissions
  requireAll?: boolean; // true = AND logic, false = OR logic (default)
  
  // Fallback components
  fallback?: ReactNode;
  unauthorized?: ReactNode;
  loading?: ReactNode;
  
  // Behavior options
  hideOnDenied?: boolean; // true = hide, false = show fallback (default)
  showLoading?: boolean; // Show loading state during permission check
  
  // Debugging
  debug?: boolean;
  
  // Performance options
  preload?: boolean; // Pre-fetch permissions to reduce latency
}

/**
 * Optimized PermissionGate component with batch permission checking
 * 
 * Key optimizations:
 * - Uses React Query for caching and deduplication
 * - Batch permission checking to reduce API calls
 * - Memoized permission specs to prevent unnecessary re-queries
 * - Synchronous permission checks from cache when possible
 * - Intelligent loading states
 * 
 * Usage examples:
 * 
 * // Single permission with preloading
 * <OptimizedPermissionGate 
 *   resource="user" 
 *   action="create" 
 *   scope="department"
 *   preload={true}
 * >
 *   <CreateUserButton />
 * </OptimizedPermissionGate>
 * 
 * // Multiple permissions with batch checking
 * <OptimizedPermissionGate 
 *   permissions={[
 *     { resource: "user", action: "create" },
 *     { resource: "user", action: "update" }
 *   ]}
 *   requireAll={false}
 *   showLoading={false}
 * >
 *   <UserManagementPanel />
 * </OptimizedPermissionGate>
 */
const OptimizedPermissionGate: React.FC<OptimizedPermissionGateProps> = ({
  children,
  resource,
  action,
  scope = 'own',
  context,
  permissions,
  commonPermission,
  commonPermissions,
  requireAll = false,
  fallback,
  unauthorized,
  loading,
  hideOnDenied = false,
  showLoading = true,
  debug = false,
  preload = false,
}) => {
  const { isAuthenticated, user } = useAuth();

  // Memoize permissions to check for optimization
  const permissionsToCheck = useMemo((): PermissionSpec[] => {
    const specs: PermissionSpec[] = [];

    // Single permission
    if (resource && action) {
      specs.push({ resource, action, scope, context });
    }

    // Multiple permissions
    if (permissions) {
      specs.push(...permissions);
    }

    // Common permission
    if (commonPermission) {
      specs.push(commonPermission);
    }

    // Multiple common permissions
    if (commonPermissions) {
      specs.push(...commonPermissions);
    }

    return specs;
  }, [resource, action, scope, context, permissions, commonPermission, commonPermissions]);

  // Use batch permission checking for optimal performance
  const permissionResults = usePermissionBatch(permissionsToCheck, {
    enabled: isAuthenticated && !!user && permissionsToCheck.length > 0,
    staleTime: preload ? 5 * 60 * 1000 : 2 * 60 * 1000, // 5 min if preload, 2 min otherwise
  });

  // Calculate permission state
  const permissionState = useMemo(() => {
    if (!isAuthenticated || !user) {
      return { allowed: false, isLoading: false, hasErrors: false };
    }

    if (permissionsToCheck.length === 0) {
      // No permissions specified, allow by default
      return { allowed: true, isLoading: false, hasErrors: false };
    }

    const results = Object.values(permissionResults);
    const isLoading = results.some(r => r.isLoading);
    const hasErrors = results.some(r => r.error);
    
    let allowed = false;
    
    if (!isLoading && !hasErrors) {
      if (requireAll) {
        // AND logic - all permissions must be true
        allowed = results.every(r => r.allowed);
      } else {
        // OR logic - at least one permission must be true
        allowed = results.some(r => r.allowed);
      }
    }

    if (debug) {
      console.log('OptimizedPermissionGate: Permission state:', {
        permissionsToCheck,
        results,
        requireAll,
        allowed,
        isLoading,
        hasErrors,
      });
    }

    return { allowed, isLoading, hasErrors };
  }, [isAuthenticated, user, permissionsToCheck, permissionResults, requireAll, debug]);

  // Not authenticated
  if (!isAuthenticated) {
    if (hideOnDenied) {
      return null;
    }
    return <>{unauthorized || fallback || <div>Please log in to access this content</div>}</>;
  }

  // Loading state (only show if actively loading AND user wants loading UI)
  if (permissionState.isLoading && showLoading) {
    return (
      <>
        {loading || (
          <div className="flex items-center justify-center p-2">
            <LoadingSpinner size="sm" text="" />
          </div>
        )}
      </>
    );
  }

  // Error state
  if (permissionState.hasErrors) {
    if (hideOnDenied) {
      return null;
    }
    return (
      <>
        {unauthorized || fallback || (
          <div className="text-red-600 p-4">
            Permission check failed
          </div>
        )}
      </>
    );
  }

  // Permission denied
  if (!permissionState.allowed) {
    if (hideOnDenied) {
      return null;
    }
    return (
      <>
        {unauthorized || fallback || (
          <div className="text-gray-600 p-4">
            You don't have permission to access this content
          </div>
        )}
      </>
    );
  }

  // Permission granted
  return <>{children}</>;
};

/**
 * Higher-order component version for optimized permission wrapping
 */
export function withOptimizedPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissionProps: Omit<OptimizedPermissionGateProps, 'children'>
) {
  return function OptimizedPermissionWrappedComponent(props: P) {
    return (
      <OptimizedPermissionGate {...permissionProps}>
        <Component {...props} />
      </OptimizedPermissionGate>
    );
  };
}

/**
 * Hook for imperative optimized permission checking
 */
export function useOptimizedPermissionGate() {
  return {
    /**
     * Check permissions synchronously using batch results
     */
    checkPermissions: (specs: PermissionSpec[], requireAll: boolean = false) => {
      const results = usePermissionBatch(specs);
      const values = Object.values(results);
      
      if (requireAll) {
        return values.every(r => r.allowed && !r.isLoading);
      } else {
        return values.some(r => r.allowed && !r.isLoading);
      }
    },
  };
}

export { OptimizedPermissionGate };
export default OptimizedPermissionGate;