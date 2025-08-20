import api from './api';

export interface Property {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  type?: string;
  timezone?: string;
  currency?: string;
  settings?: {
    checkInTime?: string;
    checkOutTime?: string;
    maxOccupancy?: number;
    amenities?: string[];
    policies?: Record<string, any>;
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
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    departments: number;
    users: number;
    rooms?: number;
  };
}

export interface PropertyFilter {
  search?: string;
  organizationId?: string;
  isActive?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface CreatePropertyData {
  name: string;
  slug?: string;
  description?: string;
  organizationId: string;
  propertyType?: 'HOTEL' | 'RESORT' | 'HOSTEL' | 'APARTMENT' | 'VILLA' | 'OTHER';
  timezone?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  settings?: {
    modules?: string[];
    defaultDepartments?: string[];
    additional?: Record<string, any>;
  };
  branding?: {
    inherit?: boolean;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  isActive?: boolean;
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> {}

export interface PropertyStats {
  total: number;
  active: number;
  inactive: number;
  totalDepartments: number;
  totalUsers: number;
  byType: Record<string, number>;
  byOrganization: Record<string, number>;
}

export interface AssignUsersData {
  userIds: string[];
  departmentId?: string;
}

export interface RemoveUserData {
  userId: string;
  reassignToDepartmentId?: string;
}

class PropertyService {
  private readonly baseUrl = '/properties';

  async getProperties(filter: PropertyFilter = {}) {
    const params = new URLSearchParams();
    
    if (filter.search) params.append('search', filter.search);
    if (filter.organizationId) params.append('organizationId', filter.organizationId);
    if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
    if (filter.type) params.append('type', filter.type);
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    const response = await api.get(url);
    
    // Backend returns: { success: true, data: { data: [properties], meta: {...} }, message: "..." }
    // Axios wraps this in another data property, so we need response.data.data.data
    console.log('Properties API response:', response);
    
    if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
      // Return in the format expected by the frontend
      return {
        data: response.data.data.data,  // Extract the properties array
        meta: response.data.data.meta   // Include pagination metadata
      };
    }
    
    // Fallback to original response
    return response;
  }

  async getProperty(id: string) {
    return api.get(`${this.baseUrl}/${id}`);
  }

  async createProperty(data: CreatePropertyData) {
    return api.post(this.baseUrl, data);
  }

  async updateProperty(id: string, data: UpdatePropertyData) {
    return api.patch(`${this.baseUrl}/${id}`, data);
  }

  async deleteProperty(id: string) {
    return api.delete(`${this.baseUrl}/${id}`);
  }

  async getPropertyDepartments(id: string) {
    return api.get(`${this.baseUrl}/${id}/departments`);
  }

  async getPropertyUsers(id: string) {
    return api.get(`${this.baseUrl}/${id}/users`);
  }

  async assignUsers(id: string, data: AssignUsersData) {
    return api.post(`${this.baseUrl}/${id}/users/assign`, data);
  }

  async removeUser(id: string, userId: string, data: RemoveUserData) {
    return api.delete(`${this.baseUrl}/${id}/users/${userId}`, { data });
  }

  async getPropertyStats() {
    // Stats endpoint doesn't exist on backend yet, return mock stats
    // This prevents 404 errors while still providing a working UI
    return Promise.resolve({
      data: {
        total: 0,
        active: 0,
        inactive: 0,
        totalDepartments: 0,
        totalUsers: 0,
        byType: {},
        byOrganization: {}
      }
    });
  }

  // Utility methods for property slug handling
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

  // Property type options
  getPropertyTypes() {
    return [
      { value: 'hotel', label: 'Hotel' },
      { value: 'resort', label: 'Resort' },
      { value: 'boutique', label: 'Boutique Hotel' },
      { value: 'motel', label: 'Motel' },
      { value: 'hostel', label: 'Hostel' },
      { value: 'apartment', label: 'Apartment Hotel' },
      { value: 'villa', label: 'Villa' },
      { value: 'lodge', label: 'Lodge' },
      { value: 'other', label: 'Other' }
    ];
  }

  // Currency options
  getCurrencies() {
    return [
      { value: 'USD', label: 'US Dollar (USD)' },
      { value: 'EUR', label: 'Euro (EUR)' },
      { value: 'GBP', label: 'British Pound (GBP)' },
      { value: 'CRC', label: 'Costa Rican Colón (CRC)' },
      { value: 'CAD', label: 'Canadian Dollar (CAD)' },
      { value: 'AUD', label: 'Australian Dollar (AUD)' },
      { value: 'JPY', label: 'Japanese Yen (JPY)' },
      { value: 'CNY', label: 'Chinese Yuan (CNY)' },
      { value: 'MXN', label: 'Mexican Peso (MXN)' }
    ];
  }

  // Timezone options
  getTimezones() {
    return [
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'America/Costa_Rica', label: 'Costa Rica Time' },
      { value: 'Europe/London', label: 'London Time (GMT)' },
      { value: 'Europe/Paris', label: 'Central European Time' },
      { value: 'Asia/Tokyo', label: 'Japan Time' },
      { value: 'Australia/Sydney', label: 'Sydney Time' }
    ];
  }
}

export const propertyService = new PropertyService();