import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import PermissionGate from './PermissionGate';

interface RoleBasedComponentProps {
  children: ReactNode;
  
  // Role-based access (legacy)
  roles?: UserRole[] | string[];
  role?: UserRole | string;
  requireAll?: boolean; // For multiple roles
  
  // Permission-based access (new)
  resource?: string;
  action?: string;
  scope?: string;
  
  // Fallback and behavior
  fallback?: ReactNode;
  unauthorized?: ReactNode;
  hideOnDenied?: boolean;
  
  // Migration settings
  usePermissions?: boolean; // Enable permission-based checks
  
  // Debugging
  debug?: boolean;
}

/**
 * RoleBasedComponent provides backwards compatibility for role-based access control
 * while supporting migration to permission-based access control.
 * 
 * Features:
 * - Legacy role-based access control
 * - Permission-based access control (when enabled)
 * - Gradual migration support
 * - Backwards compatibility with existing code
 * 
 * Migration path:
 * 1. Use with existing roles prop
 * 2. Add permission props alongside roles
 * 3. Enable usePermissions flag to test permission logic
 * 4. Remove roles prop when migration is complete
 * 
 * Usage examples:
 * 
 * // Legacy role-based (still works)
 * <RoleBasedComponent roles={[UserRole.DEPARTMENT_ADMIN, UserRole.PLATFORM_ADMIN]}>
 *   <AdminPanel />
 * </RoleBasedComponent>
 * 
 * // Mixed: roles with permission fallback
 * <RoleBasedComponent 
 *   roles={[UserRole.DEPARTMENT_ADMIN]}
 *   resource="user" 
 *   action="create"
 *   usePermissions={true}
 * >
 *   <CreateUserButton />
 * </RoleBasedComponent>
 * 
 * // Pure permission-based (new way)
 * <RoleBasedComponent 
 *   resource="user" 
 *   action="create" 
 *   scope="department"
 *   usePermissions={true}
 * >
 *   <CreateUserButton />
 * </RoleBasedComponent>
 */
const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  children,
  roles,
  role,
  requireAll = false,
  resource,
  action,
  scope = 'own',
  fallback,
  unauthorized,
  hideOnDenied = false,
  usePermissions = false,
  debug = false,
}) => {
  const { user, isAuthenticated } = useAuth();

  // If usePermissions is enabled and we have permission props, use PermissionGate
  if (usePermissions && resource && action) {
    if (debug) {
      // Using permission-based access control
    }

    return (
      <PermissionGate
        resource={resource}
        action={action}
        scope={scope}
        fallback={fallback}
        unauthorized={unauthorized}
        hideOnDenied={hideOnDenied}
        debug={debug}
      >
        {children}
      </PermissionGate>
    );
  }

  // Legacy role-based access control
  if (!isAuthenticated || !user) {
    if (hideOnDenied) {
      return null;
    }
    return <>{unauthorized || fallback || <div>Please log in to access this content</div>}</>;
  }

  // Build roles array
  const rolesToCheck: string[] = [];
  if (role) {
    rolesToCheck.push(typeof role === 'string' ? role : role);
  }
  if (roles) {
    rolesToCheck.push(...roles.map(r => typeof r === 'string' ? r : r));
  }

  if (rolesToCheck.length === 0) {
    // No roles specified, allow by default
    if (debug) {
      // No roles specified, allowing access by default
    }
    return <>{children}</>;
  }

  // Check role access
  let hasAccess = false;

  if (requireAll) {
    // User must have ALL specified roles
    hasAccess = rolesToCheck.every(roleToCheck => user.role === roleToCheck);
  } else {
    // User must have ANY of the specified roles
    hasAccess = rolesToCheck.some(roleToCheck => user.role === roleToCheck);
  }

  if (debug) {
    // Role check completed
  }

  // Check if user has access based on roles
  if (!hasAccess) {
    if (hideOnDenied) {
      return null;
    }
    return <>{unauthorized || fallback || <div>You don't have permission to access this content</div>}</>;
  }

  return <>{children}</>;
};

// Higher-order component version
export function withRoles<P extends object>(
  Component: React.ComponentType<P>,
  roleProps: Omit<RoleBasedComponentProps, 'children'>
) {
  return function RoleWrappedComponent(props: P) {
    return (
      <RoleBasedComponent {...roleProps}>
        <Component {...props} />
      </RoleBasedComponent>
    );
  };
}

// Helper function to check roles imperatively
export function useRoleCheck() {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (role: UserRole | string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return user.role === (typeof role === 'string' ? role : role);
  };

  const hasAnyRole = (roles: (UserRole | string)[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return roles.some(role => user.role === (typeof role === 'string' ? role : role));
  };

  const hasAllRoles = (roles: (UserRole | string)[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return roles.every(role => user.role === (typeof role === 'string' ? role : role));
  };

  const isAdmin = (): boolean => {
    return hasAnyRole([
      UserRole.PLATFORM_ADMIN,
      UserRole.ORGANIZATION_ADMIN,
      UserRole.PROPERTY_MANAGER,
      UserRole.DEPARTMENT_ADMIN,
    ]);
  };

  const canManageUsers = (): boolean => {
    return hasAnyRole([
      UserRole.PLATFORM_ADMIN,
      UserRole.ORGANIZATION_ADMIN,
      UserRole.PROPERTY_MANAGER,
      UserRole.DEPARTMENT_ADMIN,
    ]);
  };

  const canManageDepartments = (): boolean => {
    return hasAnyRole([
      UserRole.PLATFORM_ADMIN,
      UserRole.ORGANIZATION_ADMIN,
      UserRole.PROPERTY_MANAGER,
    ]);
  };

  const canViewReports = (): boolean => {
    return hasAnyRole([
      UserRole.PLATFORM_ADMIN,
      UserRole.ORGANIZATION_ADMIN,
      UserRole.PROPERTY_MANAGER,
      UserRole.DEPARTMENT_ADMIN,
    ]);
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    canManageUsers,
    canManageDepartments,
    canViewReports,
    user,
    isAuthenticated,
  };
}

export default RoleBasedComponent;