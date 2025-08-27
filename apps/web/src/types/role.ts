import { Role } from '../../../packages/types/enums';

export interface SystemRole {
  id: Role;
  label: string;
  description: string;
  level: number;
  icon: string;
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  level?: number;
  permissions: Permission[];
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
  isSystem?: boolean;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  roleType: 'system' | 'custom';
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  role?: CustomRole;
  systemRole?: Role;
  assignedAt: Date;
  assignedBy: string;
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
}

export interface RoleHierarchy {
  [Role.PLATFORM_ADMIN]: {
    level: 0;
    canManage: Role[];
    inheritsFrom: Role[];
  };
  [Role.ORGANIZATION_OWNER]: {
    level: 1;
    canManage: Role[];
    inheritsFrom: Role[];
  };
  [Role.ORGANIZATION_ADMIN]: {
    level: 2;
    canManage: Role[];
    inheritsFrom: Role[];
  };
  [Role.PROPERTY_MANAGER]: {
    level: 3;
    canManage: Role[];
    inheritsFrom: Role[];
  };
  [Role.DEPARTMENT_ADMIN]: {
    level: 4;
    canManage: Role[];
    inheritsFrom: Role[];
  };
  [Role.STAFF]: {
    level: 5;
    canManage: Role[];
    inheritsFrom: Role[];
  };
}

export interface RolePermissionMatrix {
  [key: string]: {
    [resource: string]: {
      [action: string]: {
        [scope: string]: boolean;
      };
    };
  };
}

export interface RoleAnalytics {
  totalSystemRoles: number;
  totalCustomRoles: number;
  totalAssignments: number;
  assignmentsByRole: Record<string, number>;
  assignmentsByLevel: Record<string, number>;
  permissionUsage: Record<string, number>;
  recentAssignments: UserRoleAssignment[];
  roleDistribution: {
    systemRoles: Record<Role, number>;
    customRoles: Record<string, number>;
  };
}

export const SYSTEM_ROLES: Record<Role, SystemRole> = {
  [Role.PLATFORM_ADMIN]: {
    id: Role.PLATFORM_ADMIN,
    label: 'Platform Admin',
    description: 'Manages entire platform and all tenants',
    level: 0,
    icon: '🌐'
  },
  [Role.ORGANIZATION_OWNER]: {
    id: Role.ORGANIZATION_OWNER,
    label: 'Organization Owner',
    description: 'Manages hotel chain/group operations',
    level: 1,
    icon: '👑'
  },
  [Role.ORGANIZATION_ADMIN]: {
    id: Role.ORGANIZATION_ADMIN,
    label: 'Organization Admin',
    description: 'Manages organization settings and policies',
    level: 2,
    icon: '⚙️'
  },
  [Role.PROPERTY_MANAGER]: {
    id: Role.PROPERTY_MANAGER,
    label: 'Property Manager',
    description: 'Manages individual hotel property operations',
    level: 3,
    icon: '🏨'
  },
  [Role.DEPARTMENT_ADMIN]: {
    id: Role.DEPARTMENT_ADMIN,
    label: 'Department Admin',
    description: 'Manages specific department within property',
    level: 4,
    icon: '📋'
  },
  [Role.STAFF]: {
    id: Role.STAFF,
    label: 'Staff',
    description: 'Self-service access to own resources',
    level: 5,
    icon: '👤'
  }
};

export const ROLE_HIERARCHY: RoleHierarchy = {
  [Role.PLATFORM_ADMIN]: {
    level: 0,
    canManage: [
      Role.ORGANIZATION_OWNER,
      Role.ORGANIZATION_ADMIN,
      Role.PROPERTY_MANAGER,
      Role.DEPARTMENT_ADMIN,
      Role.STAFF
    ],
    inheritsFrom: []
  },
  [Role.ORGANIZATION_OWNER]: {
    level: 1,
    canManage: [
      Role.ORGANIZATION_ADMIN,
      Role.PROPERTY_MANAGER,
      Role.DEPARTMENT_ADMIN,
      Role.STAFF
    ],
    inheritsFrom: []
  },
  [Role.ORGANIZATION_ADMIN]: {
    level: 2,
    canManage: [
      Role.PROPERTY_MANAGER,
      Role.DEPARTMENT_ADMIN,
      Role.STAFF
    ],
    inheritsFrom: [Role.ORGANIZATION_OWNER]
  },
  [Role.PROPERTY_MANAGER]: {
    level: 3,
    canManage: [
      Role.DEPARTMENT_ADMIN,
      Role.STAFF
    ],
    inheritsFrom: [Role.ORGANIZATION_ADMIN]
  },
  [Role.DEPARTMENT_ADMIN]: {
    level: 4,
    canManage: [Role.STAFF],
    inheritsFrom: [Role.PROPERTY_MANAGER]
  },
  [Role.STAFF]: {
    level: 5,
    canManage: [],
    inheritsFrom: [Role.DEPARTMENT_ADMIN]
  }
};

// Utility functions
export const isSystemRole = (role: string): role is Role => {
  return Object.values(Role).includes(role as Role);
};

export const getSystemRoleInfo = (role: Role): SystemRole => {
  return SYSTEM_ROLES[role];
};

export const getRoleLevel = (role: Role): number => {
  return SYSTEM_ROLES[role].level;
};

export const canManageRole = (managerRole: Role, targetRole: Role): boolean => {
  return ROLE_HIERARCHY[managerRole].canManage.includes(targetRole);
};

export const getRoleHierarchyLevel = (role: Role): number => {
  return ROLE_HIERARCHY[role].level;
};

export const formatRoleName = (role: string): string => {
  if (isSystemRole(role)) {
    return SYSTEM_ROLES[role].label;
  }
  return role;
};