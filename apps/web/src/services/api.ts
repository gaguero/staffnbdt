import axios from 'axios';
import { TOKEN_STORAGE_KEY, TENANT_STORAGE_KEY } from '../utils/constants';

// Use VITE_API_URL if set, otherwise use relative paths (for Railway deployment)
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token and tenant context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant context headers
    const tenantInfo = localStorage.getItem(TENANT_STORAGE_KEY);
    if (tenantInfo) {
      try {
        const parsedTenant = JSON.parse(tenantInfo);
        if (parsedTenant.organizationId) {
          config.headers['X-Organization-Id'] = parsedTenant.organizationId;
        }
        if (parsedTenant.propertyId) {
          config.headers['X-Property-Id'] = parsedTenant.propertyId;
        }
      } catch (error) {
        console.warn('Failed to parse tenant info for headers:', error);
      }
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        tenantHeaders: {
          'X-Organization-Id': config.headers['X-Organization-Id'],
          'X-Property-Id': config.headers['X-Property-Id']
        }
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${error.config?.url}`, error.response?.data || error.message);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TENANT_STORAGE_KEY);
      window.location.href = '/login';
    }
    
    // Handle tenant-related errors
    if (error.response?.status === 403 && error.response?.data?.code === 'TENANT_ACCESS_DENIED') {
      console.error('Tenant access denied:', error.response.data.message);
      // Could trigger a property selector or show a tenant error modal
    }
    
    // Extract meaningful error message
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An unexpected error occurred';
    
    // Create a new error with the extracted message
    const enhancedError = new Error(errorMessage);
    enhancedError.name = error.name;
    // Preserve the original error for debugging
    (enhancedError as any).originalError = error;
    (enhancedError as any).response = error.response;
    
    return Promise.reject(enhancedError);
  }
);

export default api;