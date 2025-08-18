import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF';
  departmentId?: string;
  department?: {
    id: string;
    name: string;
    level: number;
    parent?: {
      id: string;
      name: string;
      level: number;
    };
  };
  position?: string;
  phoneNumber?: string;
  hireDate?: string;
  emergencyContact?: any;
  idDocument?: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserFilter {
  search?: string;
  role?: string;
  departmentId?: string;
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
}

export interface BulkImportResult {
  successCount: number;
  failureCount: number;
  successful: User[];
  failed: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

export interface UserPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeRole: boolean;
  canChangeStatus: boolean;
}

class UserService {
  async getUsers(filter?: UserFilter) {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.role) params.append('role', filter.role);
    if (filter?.departmentId) params.append('departmentId', filter.departmentId);
    if (filter?.limit) params.append('limit', filter.limit.toString());
    if (filter?.offset) params.append('offset', filter.offset.toString());
    if (filter?.includeInactive) params.append('includeInactive', filter.includeInactive.toString());

    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  }

  async getUser(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async getUserPermissions(id: string): Promise<UserPermissions> {
    const response = await api.get(`/users/${id}/permissions`);
    return response.data;
  }

  async createUser(data: Partial<User>) {
    const response = await api.post('/users', data);
    return response.data;
  }

  async updateUser(id: string, data: Partial<User>) {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }

  async restoreUser(id: string) {
    const response = await api.post(`/users/${id}/restore`);
    return response.data;
  }

  async changeUserRole(id: string, role: string) {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  }

  async changeUserStatus(id: string, isActive: boolean) {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data;
  }

  async getUserStats() {
    const response = await api.get('/users/stats');
    return response.data;
  }

  async getUsersByDepartment(departmentId: string) {
    const response = await api.get(`/users/department/${departmentId}`);
    return response.data;
  }

  async bulkImportUsers(users: any[], validateOnly = false): Promise<BulkImportResult> {
    const response = await api.post('/users/bulk', {
      users,
      validateOnly,
    });
    return response.data;
  }

  async importUsersFromCsv(file: File, validateOnly = false, sendInvitations = true): Promise<BulkImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('validateOnly', validateOnly.toString());
    formData.append('sendInvitations', sendInvitations.toString());

    const response = await api.post('/users/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async exportUsers(filter?: UserFilter): Promise<Blob> {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.role) params.append('role', filter.role);
    if (filter?.departmentId) params.append('departmentId', filter.departmentId);

    const response = await api.get(`/users/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getImportTemplate(): Promise<Blob> {
    const response = await api.get('/users/export/template', {
      responseType: 'blob',
    });
    return response.data;
  }

  async sendInvitation(userId: string) {
    const response = await api.post(`/users/${userId}/invite`);
    return response.data;
  }

  async resendInvitation(userId: string) {
    const response = await api.post(`/users/${userId}/resend`);
    return response.data;
  }

  async changeUserDepartment(userId: string, departmentId: string) {
    const response = await api.patch(`/users/${userId}/department`, { departmentId });
    return response.data;
  }

  async removeFromDepartment(userId: string) {
    const response = await api.delete(`/users/${userId}/department`);
    return response.data;
  }

  async permanentDeleteUser(id: string) {
    const response = await api.delete(`/users/${id}/permanent`);
    return response.data;
  }
}

export const userService = new UserService();