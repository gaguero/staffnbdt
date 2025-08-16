import api from './api';

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentFilter {
  search?: string;
  limit?: number;
  offset?: number;
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

  async createDepartment(data: Partial<Department>) {
    const response = await api.post('/departments', data);
    return response.data;
  }

  async updateDepartment(id: string, data: Partial<Department>) {
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
}

export const departmentService = new DepartmentService();