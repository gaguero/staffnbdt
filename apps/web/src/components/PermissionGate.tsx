import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
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
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Build permissions array from props
  const getPermissionsToCheck = (): PermissionSpec[] => {
    const permissionsToCheck: PermissionSpec[] = [];

    // Single permission
    if (resource && action) {
      permissionsToCheck.push({ resource, action, scope, context });
    }

    // Multiple permissions
    if (permissions) {
      permissionsToCheck.push(...permissions);
    }

    // Common permission
    if (commonPermission) {
      permissionsToCheck.push(commonPermission);
    }

    // Multiple common permissions
    if (commonPermissions) {
      permissionsToCheck.push(...commonPermissions);
    }

    return permissionsToCheck;
  };

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (!isAuthenticated || !user) {
        setIsAllowed(false);
        setIsLoading(false);
        return;
      }

      const permissionsToCheck = getPermissionsToCheck();

      if (permissionsToCheck.length === 0) {
        // No permissions specified, allow by default
        setIsAllowed(true);
        setIsLoading(false);
        if (debug) {
          // No permissions specified, allowing access by default
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let allowed = false;

        if (permissionsToCheck.length === 1) {
          // Single permission check
          const permission = permissionsToCheck[0];
          allowed = await hasPermission(
            permission.resource,
            permission.action,
            permission.scope || 'own',
            permission.context
          );
        } else {
          // Multiple permissions check
          if (requireAll) {
            allowed = await hasAllPermissions(permissionsToCheck);
          } else {
            allowed = await hasAnyPermission(permissionsToCheck);
          }
        }

        setIsAllowed(allowed);

        if (debug) {
          // Permission check result logged
        }
      } catch (err) {
        // Permission check failed
        setError(err instanceof Error ? err.message : 'Permission check failed');
        setIsAllowed(false); // Fail closed for security
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [
    isAuthenticated,
    user,
    resource,
    action,
    scope,
    context,
    permissions,
    commonPermission,
    commonPermissions,
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

  // Loading state
  if (isLoading && showLoading) {
    return (
      <>
        {loading || (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner size="sm" text="Checking permissions..." />
          </div>
        )}
      </>
    );
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

// Hook for imperative permission checking in components
export function usePermissionGate() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const checkPermissionGate = async (props: Omit<PermissionGateProps, 'children'>): Promise<boolean> => {
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
        return await hasPermission(
          permission.resource,
          permission.action,
          permission.scope || 'own',
          permission.context
        );
      } else {
        if (requireAll) {
          return await hasAllPermissions(permissionsToCheck);
        } else {
          return await hasAnyPermission(permissionsToCheck);
        }
      }
    } catch (error) {
      // Permission gate check failed
      return false;
    }
  };

  return { checkPermissionGate };
}

export { PermissionGate };
export default PermissionGate;