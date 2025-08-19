import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, TENANT_STORAGE_KEY } from '../utils/constants';
import permissionService from '../services/permissionService';
import { Permission, UserPermissionSummary } from '../types/permission';

interface Organization {
  id: string;
  name: string;
  code: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface Property {
  id: string;
  name: string;
  code: string;
  address?: string;
  organizationId: string;
}

interface TenantInfo {
  organizationId?: string;
  organization?: Organization;
  propertyId?: string;
  property?: Property;
  availableProperties?: Property[];
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF';
  departmentId?: string;
  profilePhoto?: string;
  phoneNumber?: string;
  organizationId?: string;
  propertyId?: string;
  properties?: Property[];
}

interface AuthContextType {
  user: User | null;
  tenantInfo: TenantInfo;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  permissionSummary: UserPermissionSummary | null;
  permissionsLoading: boolean;
  permissionsError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  switchProperty: (propertyId: string) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  clearPermissionCache: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({});
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionSummary, setPermissionSummary] = useState<UserPermissionSummary | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedTenant = localStorage.getItem(TENANT_STORAGE_KEY);
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Restore tenant context
        if (storedTenant) {
          const parsedTenant = JSON.parse(storedTenant);
          setTenantInfo(parsedTenant);
        } else {
          // Initialize tenant context from user data
          const tenantFromUser: TenantInfo = {
            organizationId: parsedUser.organizationId,
            propertyId: parsedUser.propertyId,
            availableProperties: parsedUser.properties || []
          };
          setTenantInfo(tenantFromUser);
          localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenantFromUser));
        }
        
        // Load permissions for stored user
        loadPermissions(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored data:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TENANT_STORAGE_KEY);
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, organization, property, availableProperties } = response.data.data;
      
      // Store auth data
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      
      // Set axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Initialize tenant context
      const tenant: TenantInfo = {
        organizationId: user.organizationId || organization?.id,
        organization,
        propertyId: user.propertyId || property?.id,
        property,
        availableProperties: availableProperties || user.properties || []
      };
      
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
      
      setUser(user);
      setTenantInfo(tenant);
      
      // Load permissions after successful login
      await loadPermissions(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TENANT_STORAGE_KEY);
    
    // Clear axios header
    delete api.defaults.headers.common['Authorization'];
    
    // Clear permission cache
    permissionService.clearLocalCache();
    
    // Reset state
    setUser(null);
    setTenantInfo({});
    setPermissions([]);
    setPermissionSummary(null);
    setPermissionsError(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    
    // Update tenant info if organization or property changed
    if (updatedUser.organizationId !== user?.organizationId || updatedUser.propertyId !== user?.propertyId) {
      const updatedTenant: TenantInfo = {
        ...tenantInfo,
        organizationId: updatedUser.organizationId,
        propertyId: updatedUser.propertyId,
        availableProperties: updatedUser.properties || tenantInfo.availableProperties
      };
      setTenantInfo(updatedTenant);
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(updatedTenant));
    }
    
    // If role changed, refresh permissions
    if (user && user.role !== updatedUser.role) {
      loadPermissions(updatedUser);
    }
  };

  const switchProperty = async (propertyId: string) => {
    if (!user || !tenantInfo.availableProperties) {
      throw new Error('Cannot switch property - no user or available properties');
    }

    const targetProperty = tenantInfo.availableProperties.find(p => p.id === propertyId);
    if (!targetProperty) {
      throw new Error('Property not found in available properties');
    }

    try {
      // Call API to switch property context
      const response = await api.post('/auth/switch-property', { propertyId });
      const { user: updatedUser, accessToken } = response.data.data;
      
      // Update token if provided (some implementations may issue new token)
      if (accessToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // Update user with new property context
      const userWithNewProperty = {
        ...user,
        propertyId: propertyId
      };
      
      setUser(userWithNewProperty);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithNewProperty));
      
      // Update tenant context
      const updatedTenant: TenantInfo = {
        ...tenantInfo,
        propertyId: propertyId,
        property: targetProperty
      };
      
      setTenantInfo(updatedTenant);
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(updatedTenant));
      
      // Refresh permissions as they may be property-specific
      await loadPermissions(userWithNewProperty);
      
    } catch (error) {
      console.error('Failed to switch property:', error);
      throw error;
    }
  };

  // Load user permissions
  const loadPermissions = async (userToLoad?: User) => {
    const currentUser = userToLoad || user;
    if (!currentUser) {
      return;
    }

    setPermissionsLoading(true);
    setPermissionsError(null);

    try {
      const summary = await permissionService.getMyPermissions();
      setPermissions(summary.permissions);
      setPermissionSummary(summary);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissionsError(error instanceof Error ? error.message : 'Failed to load permissions');
      // Don't reset permissions on error to maintain any cached data
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Refresh permissions
  const refreshPermissions = async () => {
    if (!user) {
      return;
    }

    // Clear cache first
    permissionService.clearLocalCache();
    await loadPermissions();
  };

  // Clear permission cache
  const clearPermissionCache = async () => {
    if (!user) {
      return;
    }

    try {
      await permissionService.clearMyCache();
      await loadPermissions();
    } catch (error) {
      console.error('Failed to clear permission cache:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenantInfo,
        isAuthenticated: !!user,
        isLoading,
        permissions,
        permissionSummary,
        permissionsLoading,
        permissionsError,
        login,
        logout,
        updateUser,
        switchProperty,
        refreshPermissions,
        clearPermissionCache,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};