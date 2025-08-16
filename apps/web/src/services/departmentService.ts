import api from './api';

export interface Department {
  id: string;
  name: string;
  description?: string;
  location?: string;
  budget?: number;
  managerId?: string;
  parentId?: string;
  level: number;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    position?: string;
  };
  parent?: {
    id: string;
    name: string;
    level: number;
  };
  children?: Array<{
    id: string;
    name: string;
    level: number;
  }>;
  users?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    position?: string;
    hireDate?: string;
    phoneNumber?: string;
  }>;
  _count?: {
    users: number;
    children: number;
    trainingSessions: number;
    documents: number;
  };
}

export interface DepartmentFilter {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DepartmentDropdownItem {
  id: string;
  name: string;
  level: number;
  parentId?: string;
}

class DepartmentService {
  async getDepartments(filter?: DepartmentFilter) {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.limit) params.append('limit', filter.limit.toString());
    if (filter?.offset) params.append('offset', filter.offset.toString());

    const queryString = params.toString();
    const response = await api.get(`/departments${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async getDepartment(id: string) {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  }

  async createDepartment(data: {
    name: string;
    description?: string;
    location?: string;
    budget?: number;
    managerId?: string;
    parentId?: string;
  }) {
    const response = await api.post('/departments', data);
    return response.data;
  }

  async updateDepartment(id: string, data: {
    name?: string;
    description?: string;
    location?: string;
    budget?: number;
    managerId?: string;
    parentId?: string;
  }) {
    const response = await api.patch(`/departments/${id}`, data);
    return response.data;
  }

  async deleteDepartment(id: string) {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  }

  async getDepartmentStats(id: string) {
    const response = await api.get(`/departments/${id}/stats`);
    return response.data;
  }

  async getOverallStats() {
    const response = await api.get('/departments/stats/overall');
    return response.data;
  }

  async searchDepartments(query: string) {
    const response = await api.get(`/departments/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Hierarchy-related methods
  async getHierarchy() {
    const response = await api.get('/departments/hierarchy');
    return response.data;
  }

  async getDepartmentsForDropdown() {
    const response = await api.get('/departments/dropdown');
    return response.data;
  }

  async getDepartmentsForDropdownWithExclusion(excludeId: string) {
    const response = await api.get(`/departments/dropdown/${excludeId}`);
    return response.data;
  }

  async getDepartmentAncestors(id: string) {
    const response = await api.get(`/departments/${id}/ancestors`);
    return response.data;
  }

  async getDepartmentDescendants(id: string) {
    const response = await api.get(`/departments/${id}/descendants`);
    return response.data;
  }
}

export const departmentService = new DepartmentService();