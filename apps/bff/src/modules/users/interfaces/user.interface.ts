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
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeRole: boolean;
  canChangeStatus: boolean;
}