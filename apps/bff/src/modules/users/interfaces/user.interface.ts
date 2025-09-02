import { User, Role } from '@prisma/client';

export interface UserWithDepartment extends User {
  department?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<Role, number>;
  byDepartment: Record<string, number>;
}

export interface UserPermissions {
  userId: string;
  systemRole: Role;
  roleInfo: {
    name: string;
    description: string;
    level: number;
    userType: string;
    capabilities: string[];
  };
  permissions: string[];
  customRoles: any[];
  lastUpdated: Date;
}

// Legacy permissions interface for backwards compatibility
export interface UserActionPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeRole: boolean;
  canChangeStatus: boolean;
}