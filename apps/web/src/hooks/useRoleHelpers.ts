import { useMemo } from 'react';
import { Role } from '../../../packages/types/enums';
import { 
  SYSTEM_ROLES, 
  ROLE_HIERARCHY, 
  isSystemRole, 
  getSystemRoleInfo,
  getRoleLevel,
  canManageRole,
  formatRoleName,
  SystemRole,
  CustomRole
} from '../types/role';

export interface UseRoleHelpersReturn {
  isSystemRole: (role: string) => role is Role;
  getSystemRoleInfo: (role: Role) => SystemRole;
  formatRoleName: (role: string) => string;
  getRoleLevel: (role: Role) => number;
  canManageRole: (managerRole: Role, targetRole: Role) => boolean;
  getRoleIcon: (role: string) => string;
  getRoleDescription: (role: string, customRoles?: CustomRole[]) => string;
  sortRolesByLevel: (roles: string[]) => string[];
  getAvailableRolesToAssign: (currentUserRole: Role) => Role[];
  getRoleHierarchyPath: (role: Role) => Role[];
  compareRoleLevels: (role1: Role, role2: Role) => number;
}

/**
 * Custom hook providing utility functions for role management
 */
export const useRoleHelpers = (customRoles: CustomRole[] = []): UseRoleHelpersReturn => {
  
  const getRoleIcon = (role: string): string => {
    if (isSystemRole(role)) {
      return SYSTEM_ROLES[role].icon;
    }
    const customRole = customRoles.find(r => r.name === role);
    return customRole ? '🎭' : '❓';
  };

  const getRoleDescription = (role: string, roles?: CustomRole[]): string => {
    if (isSystemRole(role)) {
      return SYSTEM_ROLES[role].description;
    }
    const roleList = roles || customRoles;
    const customRole = roleList.find(r => r.name === role);
    return customRole?.description || `Custom role: ${role}`;
  };

  const sortRolesByLevel = (roles: string[]): string[] => {
    return roles.sort((a, b) => {
      const aIsSystem = isSystemRole(a);
      const bIsSystem = isSystemRole(b);
      
      // System roles come first, sorted by level
      if (aIsSystem && bIsSystem) {
        return getRoleLevel(a as Role) - getRoleLevel(b as Role);
      }
      
      // System roles before custom roles
      if (aIsSystem && !bIsSystem) return -1;
      if (!aIsSystem && bIsSystem) return 1;
      
      // Custom roles sorted alphabetically
      return a.localeCompare(b);
    });
  };

  const getAvailableRolesToAssign = (currentUserRole: Role): Role[] => {
    if (!isSystemRole(currentUserRole)) {
      return [];
    }
    
    return ROLE_HIERARCHY[currentUserRole].canManage;
  };

  const getRoleHierarchyPath = (role: Role): Role[] => {
    const path: Role[] = [role];
    let current = role;
    
    while (ROLE_HIERARCHY[current].inheritsFrom.length > 0) {
      current = ROLE_HIERARCHY[current].inheritsFrom[0];
      path.unshift(current);
    }
    
    return path;
  };

  const compareRoleLevels = (role1: Role, role2: Role): number => {
    return getRoleLevel(role1) - getRoleLevel(role2);
  };

  return useMemo(() => ({
    isSystemRole,
    getSystemRoleInfo,
    formatRoleName,
    getRoleLevel,
    canManageRole,
    getRoleIcon,
    getRoleDescription,
    sortRolesByLevel,
    getAvailableRolesToAssign,
    getRoleHierarchyPath,
    compareRoleLevels
  }), [customRoles]);
};

/**
 * Hook for role-based UI decisions
 */
export const useRoleUI = (userRole: Role, customRoles: CustomRole[] = []) => {
  const helpers = useRoleHelpers(customRoles);

  const canCreateRole = useMemo(() => {
    return [Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER].includes(userRole);
  }, [userRole]);

  const canAssignRole = useMemo(() => {
    return helpers.getAvailableRolesToAssign(userRole).length > 0;
  }, [userRole, helpers]);

  const canViewRoleAnalytics = useMemo(() => {
    return [
      Role.PLATFORM_ADMIN,
      Role.ORGANIZATION_OWNER,
      Role.ORGANIZATION_ADMIN
    ].includes(userRole);
  }, [userRole]);

  const canManageCustomRoles = useMemo(() => {
    return [Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER].includes(userRole);
  }, [userRole]);

  return {
    ...helpers,
    canCreateRole,
    canAssignRole,
    canViewRoleAnalytics,
    canManageCustomRoles
  };
};