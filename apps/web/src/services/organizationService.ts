import api from './api';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  timezone?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  settings?: {
    defaultLanguage?: string;
    supportedLanguages?: string[];
    theme?: string;
    additional?: Record<string, any>;
  };
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    properties: number;
    users: number;
  };
}

export interface OrganizationFilter {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateOrganizationData {
  name: string;
  slug?: string;
  description?: string;
  timezone?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  settings?: {
    defaultLanguage?: string;
    supportedLanguages?: string[];
    theme?: string;
    additional?: Record<string, any>;
  };
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  isActive?: boolean;
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {}

export interface OrganizationStats {
  total: number;
  active: number;
  inactive: number;
  totalProperties: number;
  totalUsers: number;
  byTimezone: Record<string, number>;
}

export interface AssignUsersData {
  userIds: string[];
  propertyId?: string;
}

export interface RemoveUserData {
  userId: string;
  reassignToPropertyId?: string;
}

class OrganizationService {
  private readonly baseUrl = '/organizations';

  async getOrganizations(filter: OrganizationFilter = {}) {
    const params = new URLSearchParams();
    
    if (filter.search) params.append('search', filter.search);
    if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return api.get(url);
  }

  async getOrganization(id: string) {
    return api.get(`${this.baseUrl}/${id}`);
  }

  async createOrganization(data: CreateOrganizationData) {
    return api.post(this.baseUrl, data);
  }

  async updateOrganization(id: string, data: UpdateOrganizationData) {
    return api.patch(`${this.baseUrl}/${id}`, data);
  }

  async deleteOrganization(id: string) {
    return api.delete(`${this.baseUrl}/${id}`);
  }

  async getOrganizationProperties(id: string) {
    return api.get(`${this.baseUrl}/${id}/properties`);
  }

  async getOrganizationUsers(id: string) {
    return api.get(`${this.baseUrl}/${id}/users`);
  }

  async assignUsers(id: string, data: AssignUsersData) {
    return api.post(`${this.baseUrl}/${id}/users/assign`, data);
  }

  async removeUser(id: string, userId: string, data: RemoveUserData) {
    return api.delete(`${this.baseUrl}/${id}/users/${userId}`, { data });
  }

  async getOrganizationStats() {
    // Stats endpoint doesn't exist on backend yet, return mock stats
    // This prevents 404 errors while still providing a working UI
    return Promise.resolve({
      data: {
        total: 0,
        active: 0,
        inactive: 0,
        totalProperties: 0,
        totalUsers: 0,
        byTimezone: {}
      }
    });
  }

  // Utility methods for organization slug handling
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  validateSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 100;
  }
}

export const organizationService = new OrganizationService();