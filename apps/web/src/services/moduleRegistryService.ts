import api from './api';
import { UserType } from '../types/auth';

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
      const response = await api.get(this.baseUrl);
      const payload = (response.data && (response.data.data ?? response.data)) as ModuleManifest[];
      return Array.isArray(payload) ? payload : [];
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
      const response = await api.get(
        `${this.baseUrl}/organization/${organizationId}`,
        { params }
      );
      const payload = (response.data && (response.data.data ?? response.data)) as ModuleManifest[];
      return Array.isArray(payload) ? payload : [];
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
      const response = await api.get(
        `${this.baseUrl}/${moduleId}`
      );
      const payload = (response.data && (response.data.data ?? response.data)) as ModuleManifest | null;
      return (payload as any)?.moduleId ? (payload as ModuleManifest) : null;
    } catch (error) {
      console.error(`Failed to fetch module manifest for ${moduleId}:`, error);
      return null;
    }
  }

  /**
   * Get permissions for a specific module
   */
  async getModulePermissions(moduleId: string, userType: UserType = UserType.INTERNAL): Promise<PermissionDefinition[]> {
    try {
      const response = await api.get(
        `${this.baseUrl}/${moduleId}/permissions`,
        { params: { userType } }
      );
      const payload = (response.data && (response.data.data ?? response.data)) as PermissionDefinition[];
      return Array.isArray(payload) ? payload : [];
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
        const navItems = userType === UserType.INTERNAL 
          ? module.internalNavigation 
          : module.externalNavigation;

        if (Array.isArray(navItems) && navItems.length > 0) {
          navigationItems.push(...navItems);
          return;
        }

        // Fallback navigation for known modules if manifests don't include nav yet
        switch (module.moduleId) {
          case 'concierge': {
            navigationItems.push({
              id: 'concierge-home',
              label: 'nav.concierge',
              path: '/concierge',
              icon: '🛎️',
              requiredPermissions: userType === UserType.INTERNAL 
                ? ['concierge.objects.read.property'] 
                : [],
            });
            break;
          }
          case 'vendors': {
            navigationItems.push({
              id: 'vendors-home',
              label: 'nav.vendors',
              path: '/vendors',
              icon: '🤝',
              requiredPermissions: userType === UserType.INTERNAL 
                ? ['vendors.portal.access.property'] 
                : [],
            });
            break;
          }
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
        const modulePermissions = userType === UserType.INTERNAL
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