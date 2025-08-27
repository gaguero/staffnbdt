import api from './api';

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: Permission[];
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  role: Role;
  assignedAt: Date;
  assignedBy: string;
}

export interface RoleAssignment {
  userId: string;
  roleId: string;
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
}

export interface CreateRoleInput {
  name: string;
  description: string;
  level: number;
  permissions: string[]; // Permission IDs
}

export interface UpdateRoleInput extends Partial<CreateRoleInput> {}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class RoleService {
  // Role Management
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await api.get('/roles?includeSystemRoles=true');
    return response.data;
  }

  async getRole(id: string): Promise<ApiResponse<Role>> {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  }

  async createRole(role: CreateRoleInput): Promise<ApiResponse<Role>> {
    const response = await api.post('/roles', role);
    return response.data;
  }

  async updateRole(id: string, role: UpdateRoleInput): Promise<ApiResponse<Role>> {
    const response = await api.patch(`/roles/${id}`, role);
    return response.data;
  }

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  }

  // Permission Management
  async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    const response = await api.get('/permissions');
    return response.data;
  }

  async getPermissionsByResource(): Promise<ApiResponse<Record<string, Permission[]>>> {
    const response = await api.get('/permissions/by-resource');
    return response.data;
  }

  // User Role Assignments
  async getUserRoles(userId?: string): Promise<ApiResponse<UserRole[]>> {
    const params = userId ? `?userId=${userId}` : '';
    const response = await api.get(`/user-roles${params}`);
    return response.data;
  }

  async assignRole(assignment: RoleAssignment): Promise<ApiResponse<UserRole>> {
    const response = await api.post('/user-roles', assignment);
    return response.data;
  }

  async removeUserRole(userRoleId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/user-roles/${userRoleId}`);
    return response.data;
  }

  async updateUserRole(userRoleId: string, assignment: Partial<RoleAssignment>): Promise<ApiResponse<UserRole>> {
    const response = await api.patch(`/user-roles/${userRoleId}`, assignment);
    return response.data;
  }

  // Bulk Operations
  async bulkAssignRoles(assignments: RoleAssignment[]): Promise<ApiResponse<UserRole[]>> {
    const response = await api.post('/user-roles/bulk', { assignments });
    return response.data;
  }

  async bulkRemoveRoles(userRoleIds: string[]): Promise<ApiResponse<void>> {
    const response = await api.delete('/user-roles/bulk', { data: { userRoleIds } });
    return response.data;
  }

  // Role Analytics
  async getRoleStats(): Promise<ApiResponse<{
    totalRoles: number;
    totalAssignments: number;
    assignmentsByRole: Record<string, number>;
    assignmentsByLevel: Record<string, number>;
    recentAssignments: UserRole[];
  }>> {
    const response = await api.get('/roles/stats');
    return response.data;
  }

  // Permission Checking
  async checkUserPermissions(userId: string, permissions: { resource: string; action: string; scope?: string }[]): Promise<ApiResponse<{
    results: Record<string, boolean>;
    summary: {
      total: number;
      granted: number;
      denied: number;
    };
  }>> {
    const response = await api.post(`/users/${userId}/check-permissions`, { permissions });
    return response.data;
  }

  // Role Templates
  async getRoleTemplates(): Promise<ApiResponse<{
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
  }[]>> {
    const response = await api.get('/roles/templates');
    return response.data;
  }

  async createRoleFromTemplate(templateId: string, customizations: Partial<CreateRoleInput>): Promise<ApiResponse<Role>> {
    const response = await api.post(`/roles/from-template/${templateId}`, customizations);
    return response.data;
  }
}

export const roleService = new RoleService();
export default roleService;