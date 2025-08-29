import api from './api';
import { UserType } from '@prisma/client';

export interface PermissionDefinition {
  resource: string;
  action: string;
  scope: string;
  name: string;
  description?: string;
  category?: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  requiredPermissions: string[];
  children?: NavItem[];
}

export interface ModuleManifest {
  id: string;
  moduleId: string;
  name: string;
  version: string;
  category: string;
  description?: string;
  internalPermissions: PermissionDefinition[];
  externalPermissions: PermissionDefinition[];
  internalNavigation: NavItem[];
  externalNavigation: NavItem[];
  dependencies: string[];
  isSystemModule: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleRegistryResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

class ModuleRegistryService {
  private readonly baseUrl = '/module-registry';

  /**
   * Get all available modules
   */
  async getAllModules(): Promise<ModuleManifest[]> {
    try {
      const response = await api.get<ModuleRegistryResponse<ModuleManifest[]>>(this.baseUrl);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch all modules:', error);
      return [];
    }
  }

  /**
   * Get enabled modules for an organization with optional user type filtering
   */
  async getEnabledModules(organizationId: string, userType?: UserType): Promise<ModuleManifest[]> {
    try {
      const params = userType ? { userType } : {};
      const response = await api.get<ModuleRegistryResponse<ModuleManifest[]>>(
        `${this.baseUrl}/organization/${organizationId}`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to fetch enabled modules for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Get a specific module manifest by ID
   */
  async getModuleManifest(moduleId: string): Promise<ModuleManifest | null> {
    try {
      const response = await api.get<ModuleRegistryResponse<ModuleManifest>>(
        `${this.baseUrl}/${moduleId}`
      );
      return response.data.data || null;
    } catch (error) {
      console.error(`Failed to fetch module manifest for ${moduleId}:`, error);
      return null;
    }
  }

  /**
   * Get permissions for a specific module
   */
  async getModulePermissions(moduleId: string, userType: UserType = 'INTERNAL'): Promise<PermissionDefinition[]> {
    try {
      const response = await api.get<ModuleRegistryResponse<PermissionDefinition[]>>(
        `${this.baseUrl}/${moduleId}/permissions`,
        { params: { userType } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to fetch permissions for module ${moduleId}:`, error);
      return [];
    }
  }

  /**
   * Enable a module for an organization
   */
  async enableModule(organizationId: string, moduleId: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/organization/${organizationId}/enable/${moduleId}`);
    } catch (error) {
      console.error(`Failed to enable module ${moduleId} for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Disable a module for an organization
   */
  async disableModule(organizationId: string, moduleId: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/organization/${organizationId}/disable/${moduleId}`);
    } catch (error) {
      console.error(`Failed to disable module ${moduleId} for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  async validateModuleDependencies(moduleId: string): Promise<{ isValid: boolean; message: string }> {
    try {
      const response = await api.get<ModuleRegistryResponse<{ 
        moduleId: string; 
        isValid: boolean; 
        message: string; 
      }>>(`${this.baseUrl}/${moduleId}/dependencies/validate`);
      
      const data = response.data.data;
      return {
        isValid: data.isValid,
        message: data.message
      };
    } catch (error) {
      console.error(`Failed to validate dependencies for module ${moduleId}:`, error);
      return {
        isValid: false,
        message: 'Failed to validate dependencies'
      };
    }
  }

  /**
   * Get navigation items for enabled modules based on user type
   */
  async getModuleNavigation(organizationId: string, userType: UserType): Promise<NavItem[]> {
    try {
      const modules = await this.getEnabledModules(organizationId, userType);
      
      const navigationItems: NavItem[] = [];
      
      modules.forEach(module => {
        const navItems = userType === 'INTERNAL' 
          ? module.internalNavigation 
          : module.externalNavigation;
          
        if (Array.isArray(navItems)) {
          navigationItems.push(...navItems);
        }
      });
      
      return navigationItems;
    } catch (error) {
      console.error(`Failed to build module navigation for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Get available permissions for enabled modules
   */
  async getEnabledModulePermissions(organizationId: string, userType: UserType): Promise<PermissionDefinition[]> {
    try {
      const modules = await this.getEnabledModules(organizationId, userType);
      
      const permissions: PermissionDefinition[] = [];
      
      modules.forEach(module => {
        const modulePermissions = userType === 'INTERNAL'
          ? module.internalPermissions
          : module.externalPermissions;
          
        if (Array.isArray(modulePermissions)) {
          permissions.push(...modulePermissions);
        }
      });
      
      return permissions;
    } catch (error) {
      console.error(`Failed to get module permissions for organization ${organizationId}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const moduleRegistryService = new ModuleRegistryService();
export default moduleRegistryService;