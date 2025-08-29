import React, { useMemo, useCallback, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useModules } from '../hooks/useModules';
import {
  PermissionSpec,
  PermissionContext,
  CommonPermission,
} from '../types/permission';
import LoadingSpinner from './LoadingSpinner';

interface PermissionGateProps {
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
}

/**
 * PermissionGate component for conditional rendering based on user permissions
 * 
 * Features:
 * - Single or multiple permission checks
 * - AND/OR logic for multiple permissions
 * - Predefined common permissions
 * - Customizable fallback components
 * - Loading states
 * - Performance optimization with caching
 * - Debug mode for development
 * 
 * Usage examples:
 * 
 * // Single permission
 * <PermissionGate resource="user" action="create" scope="department">
 *   <CreateUserButton />
 * </PermissionGate>
 * 
 * // Multiple permissions with OR logic
 * <PermissionGate 
 *   permissions={[
 *     { resource: "user", action: "create" },
 *     { resource: "user", action: "update" }
 *   ]}
 *   requireAll={false}
 * >
 *   <UserManagementPanel />
 * </PermissionGate>
 * 
 * // Common permission
 * <PermissionGate commonPermission={COMMON_PERMISSIONS.CREATE_USER}>
 *   <CreateUserButton />
 * </PermissionGate>
 * 
 * // With custom fallback
 * <PermissionGate 
 *   resource="payroll" 
 *   action="view"
 *   unauthorized={<div>You don't have access to payroll data</div>}
 * >
 *   <PayrollData />
 * </PermissionGate>
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
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
}) => {
  const { isAuthenticated, user } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, error } = usePermissions();
  const { isLoadingModules } = useModules();

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

  // Synchronous permission check using memoized computation
  const isAllowed = useMemo(() => {
    if (!isAuthenticated || !user) {
      return false;
    }

    if (permissionsToCheck.length === 0) {
      // No permissions specified, allow by default
      if (debug) {
        console.log('PermissionGate: No permissions specified, allowing access by default');
      }
      return true;
    }

    try {
      let allowed = false;

      if (permissionsToCheck.length === 1) {
        // Single permission check
        const permission = permissionsToCheck[0];
        allowed = hasPermission(
          permission.resource,
          permission.action,
          permission.scope || 'own',
          permission.context
        );
      } else {
        // Multiple permissions check
        if (requireAll) {
          allowed = hasAllPermissions(permissionsToCheck);
        } else {
          allowed = hasAnyPermission(permissionsToCheck);
        }
      }

      if (debug) {
        console.log('PermissionGate: Permission check result:', {
          permissionsToCheck,
          requireAll,
          allowed,
        });
      }

      return allowed;
    } catch (err) {
      console.error('PermissionGate: Permission check failed:', err);
      return false; // Fail closed for security
    }
  }, [
    isAuthenticated,
    user,
    permissionsToCheck,
    requireAll,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    debug,
  ]);

  // Not authenticated
  if (!isAuthenticated) {
    if (hideOnDenied) {
      return null;
    }
    return <>{unauthorized || fallback || <div>Please log in to access this content</div>}</>;
  }

  // Loading state with conservative fallback
  // In optimized version, we prefer to show nothing or cached data rather than loading states
  if ((isLoading || isLoadingModules) && showLoading && permissionsToCheck.length > 0) {
    // For critical permissions, show loading; for UI elements, hide during loading
    const showLoadingState = permissionsToCheck.some(p => 
      ['create', 'delete', 'admin'].includes(p.action || '')
    );
    
    if (showLoadingState) {
      return (
        <>
          {loading || (
            <div className="flex items-center justify-center p-2">
              <LoadingSpinner size="sm" text="Loading..." />
            </div>
          )}
        </>
      );
    } else {
      // Conservative approach: hide UI elements while loading to prevent flicker
      return null;
    }
  }

  // Error state
  if (error) {
    if (hideOnDenied) {
      return null;
    }
    return (
      <>
        {unauthorized || fallback || (
          <div className="text-red-600 p-4">
            Permission check failed: {error}
          </div>
        )}
      </>
    );
  }

  // Permission denied
  if (!isAllowed) {
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

// Higher-order component version
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissionProps: Omit<PermissionGateProps, 'children'>
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate {...permissionProps}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}

// Optimized hook for imperative permission checking in components
export function usePermissionGate() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const checkPermissionGate = useCallback((props: Omit<PermissionGateProps, 'children'>): boolean => {
    const {
      resource,
      action,
      scope = 'own',
      context,
      permissions,
      commonPermission,
      commonPermissions,
      requireAll = false,
    } = props;

    const permissionsToCheck: PermissionSpec[] = [];

    // Build permissions array
    if (resource && action) {
      permissionsToCheck.push({ resource, action, scope, context });
    }

    if (permissions) {
      permissionsToCheck.push(...permissions);
    }

    if (commonPermission) {
      permissionsToCheck.push(commonPermission);
    }

    if (commonPermissions) {
      permissionsToCheck.push(...commonPermissions);
    }

    if (permissionsToCheck.length === 0) {
      return true; // No permissions specified
    }

    try {
      if (permissionsToCheck.length === 1) {
        const permission = permissionsToCheck[0];
        return hasPermission(
          permission.resource,
          permission.action,
          permission.scope || 'own',
          permission.context
        );
      } else {
        if (requireAll) {
          return hasAllPermissions(permissionsToCheck);
        } else {
          return hasAnyPermission(permissionsToCheck);
        }
      }
    } catch (error) {
      console.error('Permission gate check failed:', error);
      return false;
    }
  }, [hasPermission, hasAnyPermission, hasAllPermissions]);

  return { checkPermissionGate };
}

export { PermissionGate };
export default PermissionGate;