import api from './api';

export interface ModuleSubscription {
  id: string;
  organizationId: string;
  propertyId?: string;
  moduleId: string;
  isEnabled: boolean;
  enabledAt?: string;
  disabledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleStatusDetail {
  moduleId: string;
  organizationEnabled: boolean;
  propertyEnabled?: boolean;
  effectiveStatus: boolean;
  hasPrecedence: 'organization' | 'property' | 'none';
  organizationSubscription?: ModuleSubscription;
  propertySubscription?: ModuleSubscription;
}

export interface PropertyModuleResponse {
  organizationModules: ModuleSubscription[];
  propertyModules: ModuleSubscription[];
  statusDetails: ModuleStatusDetail[];
}

class ModuleManagementService {
  private readonly baseUrl = '/module-subscriptions';

  /**
   * Get organization-level module subscriptions
   */
  async getOrganizationModules(organizationId: string): Promise<ModuleSubscription[]> {
    try {
      const response = await api.get(`${this.baseUrl}/organization/${organizationId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Failed to fetch organization modules for ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Get property-level module subscriptions with organization context
   */
  async getPropertyModules(organizationId: string, propertyId: string): Promise<PropertyModuleResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/property/${propertyId}`, {
        params: { organizationId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch property modules for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Enable a module for a specific property (creates property-level override)
   */
  async enableModuleForProperty(
    organizationId: string, 
    propertyId: string, 
    moduleId: string
  ): Promise<ModuleSubscription> {
    try {
      const response = await api.post(
        `${this.baseUrl}/property/${propertyId}/enable/${moduleId}`,
        { organizationId }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to enable module ${moduleId} for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Disable a module for a specific property (creates property-level override)
   */
  async disableModuleForProperty(
    organizationId: string, 
    propertyId: string, 
    moduleId: string
  ): Promise<ModuleSubscription> {
    try {
      const response = await api.post(
        `${this.baseUrl}/property/${propertyId}/disable/${moduleId}`,
        { organizationId }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to disable module ${moduleId} for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Remove property-level override (revert to organization-level setting)
   */
  async removePropertyOverride(
    organizationId: string, 
    propertyId: string, 
    moduleId: string
  ): Promise<void> {
    try {
      await api.delete(
        `${this.baseUrl}/property/${propertyId}/override/${moduleId}`,
        { params: { organizationId } }
      );
    } catch (error) {
      console.error(`Failed to remove property override for module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed status for a specific module across organization and property levels
   */
  async getModuleStatusDetails(
    organizationId: string, 
    propertyId: string, 
    moduleId: string
  ): Promise<ModuleStatusDetail> {
    try {
      const response = await api.get(
        `${this.baseUrl}/status/${moduleId}`,
        { params: { organizationId, propertyId } }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get module status for ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk enable/disable modules for organization
   */
  async bulkUpdateOrganizationModules(
    organizationId: string,
    updates: { moduleId: string; isEnabled: boolean }[]
  ): Promise<ModuleSubscription[]> {
    try {
      const response = await api.put(
        `${this.baseUrl}/organization/${organizationId}/bulk`,
        { updates }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to bulk update organization modules:`, error);
      throw error;
    }
  }

  /**
   * Bulk enable/disable modules for property
   */
  async bulkUpdatePropertyModules(
    organizationId: string,
    propertyId: string,
    updates: { moduleId: string; isEnabled: boolean }[]
  ): Promise<ModuleSubscription[]> {
    try {
      const response = await api.put(
        `${this.baseUrl}/property/${propertyId}/bulk`,
        { organizationId, updates }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to bulk update property modules:`, error);
      throw error;
    }
  }

  /**
   * Get module enablement history for audit purposes
   */
  async getModuleHistory(
    organizationId: string,
    propertyId?: string,
    moduleId?: string
  ): Promise<any[]> {
    try {
      const params: any = { organizationId };
      if (propertyId) params.propertyId = propertyId;
      if (moduleId) params.moduleId = moduleId;

      const response = await api.get(`${this.baseUrl}/history`, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Failed to fetch module history:`, error);
      return [];
    }
  }
}

export const moduleManagementService = new ModuleManagementService();
export default moduleManagementService;