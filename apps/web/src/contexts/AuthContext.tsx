import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../utils/constants';
import permissionService from '../services/permissionService';
import { Permission, UserPermissionSummary } from '../types/permission';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF';
  departmentId?: string;
  profilePhoto?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  permissionSummary: UserPermissionSummary | null;
  permissionsLoading: boolean;
  permissionsError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionSummary, setPermissionSummary] = useState<UserPermissionSummary | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Load permissions for stored user
        loadPermissions(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data.data;
      
      // Store auth data
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      
      // Set axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setUser(user);
      
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
    
    // Clear axios header
    delete api.defaults.headers.common['Authorization'];
    
    // Clear permission cache
    permissionService.clearLocalCache();
    
    // Reset state
    setUser(null);
    setPermissions([]);
    setPermissionSummary(null);
    setPermissionsError(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    
    // If role changed, refresh permissions
    if (user && user.role !== updatedUser.role) {
      loadPermissions(updatedUser);
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
        isAuthenticated: !!user,
        isLoading,
        permissions,
        permissionSummary,
        permissionsLoading,
        permissionsError,
        login,
        logout,
        updateUser,
        refreshPermissions,
        clearPermissionCache,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};