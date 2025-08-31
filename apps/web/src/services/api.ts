import axios from 'axios';
import { TOKEN_STORAGE_KEY, TENANT_STORAGE_KEY } from '../utils/constants';
import { logApiRequest, logApiResponse, logApiError } from '../utils/logger';

// Use VITE_API_URL if set, otherwise use Railway backend URL
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-copy-production-328d.up.railway.app';

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
    
    // Add tenant context headers (override path for PLATFORM_ADMIN)
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
        // Omit X-Acting-As to avoid CORS preflight blocks from backend
      } catch (error) {
        // Silently handle invalid tenant info in production
        if (import.meta.env.DEV) {
          console.warn('Failed to parse tenant info for headers:', error);
        }
      }
    }
    
    // Log requests in development
    logApiRequest(
      config.method || 'GET',
      config.url || '',
      {
        data: config.data,
        tenantHeaders: {
          'X-Organization-Id': config.headers['X-Organization-Id'],
          'X-Property-Id': config.headers['X-Property-Id']
        }
      }
    );
    
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
    logApiResponse(response.config.url || '', response.data);
    return response;
  },
  (error) => {
    // Log errors (always logged)
    logApiError(error.config?.url || '', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TENANT_STORAGE_KEY);
      window.location.href = '/login';
    }
    
    // Handle tenant-related errors
    if (error.response?.status === 403 && error.response?.data?.code === 'TENANT_ACCESS_DENIED') {
      logApiError('Tenant access denied', error.response.data.message);
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