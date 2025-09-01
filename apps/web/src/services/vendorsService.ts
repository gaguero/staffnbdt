import api from './api';
import {
  Vendor,
  VendorLink,
  VendorFilter,
  VendorLinkFilter,
  CreateVendorInput,
  UpdateVendorInput,
  CreateVendorLinkInput,
  ConfirmVendorLinkInput,
  GenerateMagicLinkInput,
  VendorDirectory,
  VendorLinkTracking,
  VendorPortalData,
  VendorPortalSession,
  VendorStats,
  VendorNotification,
} from '../types/vendors';

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

class VendorsService {
  // Vendors Management
  async getVendors(filter?: VendorFilter): Promise<ApiResponse<PaginatedResponse<Vendor>>> {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category.join(','));
    if (filter?.search) params.append('search', filter.search);
    if (filter?.isActive !== undefined) params.append('isActive', filter.isActive.toString());
    if (filter?.hasActiveLinks !== undefined) params.append('hasActiveLinks', filter.hasActiveLinks.toString());
    if (filter?.performanceRating) {
      params.append('minRating', filter.performanceRating.min.toString());
      params.append('maxRating', filter.performanceRating.max.toString());
    }

    const response = await api.get(`/vendors?${params.toString()}`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        data: response.data.data.data.map((vendor: any) => this.transformVendor(vendor))
      }
    };
  }

  async getVendor(id: string): Promise<ApiResponse<Vendor>> {
    const response = await api.get(`/vendors/${id}`);
    return {
      ...response.data,
      data: this.transformVendor(response.data.data)
    };
  }

  async createVendor(input: CreateVendorInput): Promise<ApiResponse<Vendor>> {
    const response = await api.post('/vendors', input);
    return {
      ...response.data,
      data: this.transformVendor(response.data.data)
    };
  }

  async updateVendor(id: string, input: UpdateVendorInput): Promise<ApiResponse<Vendor>> {
    const response = await api.patch(`/vendors/${id}`, input);
    return {
      ...response.data,
      data: this.transformVendor(response.data.data)
    };
  }

  async deleteVendor(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/vendors/${id}`);
    return response.data;
  }

  async toggleVendorStatus(id: string): Promise<ApiResponse<Vendor>> {
    const response = await api.post(`/vendors/${id}/toggle-status`);
    return {
      ...response.data,
      data: this.transformVendor(response.data.data)
    };
  }

  // Vendor Links Management
  async getVendorLinks(filter?: VendorLinkFilter): Promise<ApiResponse<PaginatedResponse<VendorLink>>> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status.join(','));
    if (filter?.vendorId) params.append('vendorId', filter.vendorId);
    if (filter?.objectType) params.append('objectType', filter.objectType);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.expiringWithinHours) params.append('expiringWithinHours', filter.expiringWithinHours.toString());
    if (filter?.dateRange) {
      params.append('startDate', filter.dateRange.start.toISOString());
      params.append('endDate', filter.dateRange.end.toISOString());
    }

    const response = await api.get(`/vendors/links?${params.toString()}`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        data: response.data.data.data.map((link: any) => this.transformVendorLink(link))
      }
    };
  }

  async getVendorLink(id: string): Promise<ApiResponse<VendorLink>> {
    const response = await api.get(`/vendors/links/${id}`);
    return {
      ...response.data,
      data: this.transformVendorLink(response.data.data)
    };
  }

  async createVendorLink(input: CreateVendorLinkInput): Promise<ApiResponse<VendorLink>> {
    const response = await api.post('/vendors/links', input);
    return {
      ...response.data,
      data: this.transformVendorLink(response.data.data)
    };
  }

  async confirmVendorLink(linkId: string, input: ConfirmVendorLinkInput): Promise<ApiResponse<VendorLink>> {
    const response = await api.post(`/vendors/links/${linkId}/confirm`, input);
    return {
      ...response.data,
      data: this.transformVendorLink(response.data.data)
    };
  }

  async cancelVendorLink(linkId: string, reason?: string): Promise<ApiResponse<VendorLink>> {
    const response = await api.post(`/vendors/links/${linkId}/cancel`, { reason });
    return {
      ...response.data,
      data: this.transformVendorLink(response.data.data)
    };
  }

  // Magic Link Management
  async generateMagicLink(input: GenerateMagicLinkInput): Promise<ApiResponse<{ magicLink: string; expiresAt: Date }>> {
    const response = await api.post('/vendors/magic-links', input);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        expiresAt: new Date(response.data.data.expiresAt)
      }
    };
  }

  async validatePortalToken(token: string): Promise<ApiResponse<VendorPortalSession>> {
    const response = await api.get(`/vendors/portal/${token}`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        expiresAt: new Date(response.data.data.expiresAt)
      }
    };
  }

  async getPortalData(token: string): Promise<ApiResponse<VendorPortalData>> {
    const response = await api.get(`/vendors/portal/${token}/data`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        vendor: this.transformVendor(response.data.data.vendor),
        link: this.transformVendorLink(response.data.data.link)
      }
    };
  }

  // Vendor Directory
  async getVendorDirectory(): Promise<ApiResponse<VendorDirectory>> {
    const response = await api.get('/vendors/directory');
    return {
      ...response.data,
      data: {
        ...response.data.data,
        vendors: response.data.data.vendors.map((vendor: any) => this.transformVendor(vendor))
      }
    };
  }

  // Link Tracking
  async getVendorLinkTracking(linkId: string): Promise<ApiResponse<VendorLinkTracking>> {
    const response = await api.get(`/vendors/links/${linkId}/tracking`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        vendor: this.transformVendor(response.data.data.vendor),
        createdAt: new Date(response.data.data.createdAt),
        confirmationAt: response.data.data.confirmationAt ? new Date(response.data.data.confirmationAt) : undefined,
        expiresAt: response.data.data.expiresAt ? new Date(response.data.data.expiresAt) : undefined,
        lastNotificationAt: response.data.data.lastNotificationAt ? new Date(response.data.data.lastNotificationAt) : undefined,
        lastPortalAccessAt: response.data.data.lastPortalAccessAt ? new Date(response.data.data.lastPortalAccessAt) : undefined,
      }
    };
  }

  // Notifications Management
  async getVendorNotifications(linkId: string): Promise<ApiResponse<VendorNotification[]>> {
    const response = await api.get(`/vendors/links/${linkId}/notifications`);
    return {
      ...response.data,
      data: response.data.data.map((notification: any) => ({
        ...notification,
        sentAt: notification.sentAt ? new Date(notification.sentAt) : undefined,
        deliveredAt: notification.deliveredAt ? new Date(notification.deliveredAt) : undefined,
        nextRetryAt: notification.nextRetryAt ? new Date(notification.nextRetryAt) : undefined,
      }))
    };
  }

  async sendNotification(linkId: string, channels: string[]): Promise<ApiResponse<void>> {
    const response = await api.post(`/vendors/links/${linkId}/notify`, { channels });
    return response.data;
  }

  async resendNotification(notificationId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/vendors/notifications/${notificationId}/resend`);
    return response.data;
  }

  // Statistics
  async getVendorStats(): Promise<ApiResponse<VendorStats>> {
    const response = await api.get('/vendors/stats');
    return response.data;
  }

  // Bulk Operations
  async bulkUpdateVendors(vendorIds: string[], updates: Partial<UpdateVendorInput>): Promise<ApiResponse<void>> {
    const response = await api.post('/vendors/bulk/update', {
      vendorIds,
      updates
    });
    return response.data;
  }

  async bulkNotifyLinks(linkIds: string[], channels: string[]): Promise<ApiResponse<void>> {
    const response = await api.post('/vendors/links/bulk/notify', {
      linkIds,
      channels
    });
    return response.data;
  }

  async bulkCancelLinks(linkIds: string[], reason?: string): Promise<ApiResponse<void>> {
    const response = await api.post('/vendors/links/bulk/cancel', {
      linkIds,
      reason
    });
    return response.data;
  }

  // Search and Suggestions
  async searchVendors(query: string, category?: string): Promise<ApiResponse<Vendor[]>> {
    const params = new URLSearchParams();
    params.append('search', query);
    if (category) params.append('category', category);
    params.append('limit', '10');
    
    const response = await api.get(`/vendors?${params.toString()}`);
    return {
      data: response.data.data?.data || [],
      message: 'Vendor search completed successfully',
      success: true
    };
  }

  async getVendorSuggestions(objectType: string, metadata?: Record<string, any>): Promise<ApiResponse<Vendor[]>> {
    const response = await api.post('/vendors/suggestions', {
      objectType,
      metadata
    });
    return {
      ...response.data,
      data: response.data.data.map((vendor: any) => this.transformVendor(vendor))
    };
  }

  // Helper methods
  private transformVendor(vendor: any): Vendor {
    return {
      ...vendor,
      createdAt: new Date(vendor.createdAt),
      updatedAt: new Date(vendor.updatedAt),
      policies: vendor.policies || {
        responseTime: 24,
        cancellationPolicy: '',
        paymentTerms: '',
        requiresConfirmation: true,
        allowsModification: false,
        channels: ['email']
      },
      performance: vendor.performance || {
        averageResponseTime: 0,
        confirmationRate: 0,
        totalBookings: 0,
        lastBookingDate: undefined,
        rating: undefined,
        notes: []
      },
      links: vendor.links ? vendor.links.map((link: any) => this.transformVendorLink(link)) : []
    };
  }

  private transformVendorLink(link: any): VendorLink {
    return {
      ...link,
      confirmationAt: link.confirmationAt ? new Date(link.confirmationAt) : undefined,
      expiresAt: link.expiresAt ? new Date(link.expiresAt) : undefined,
      createdAt: new Date(link.createdAt),
      updatedAt: new Date(link.updatedAt),
      notificationChannels: link.notificationChannels || ['email'],
      metadata: link.metadata || {}
    };
  }
}

export const vendorsService = new VendorsService();
export default vendorsService;
