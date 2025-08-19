import { useCallback } from 'react';
import { useTenant } from '../contexts/TenantContext';
import api from '../services/api';

/**
 * Hook that provides tenant-aware API utilities
 * Automatically includes tenant context in API calls
 */
export const useTenantAwareApi = () => {
  const { organizationId, propertyId } = useTenant();

  // Create API call with explicit tenant context
  const apiCallWithTenant = useCallback(
    (method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, data?: any, customHeaders?: Record<string, string>) => {
      const headers = {
        ...customHeaders,
      };

      // Add tenant headers if available
      if (organizationId) {
        headers['X-Organization-Id'] = organizationId;
      }
      if (propertyId) {
        headers['X-Property-Id'] = propertyId;
      }

      switch (method) {
        case 'get':
          return api.get(url, { headers });
        case 'post':
          return api.post(url, data, { headers });
        case 'put':
          return api.put(url, data, { headers });
        case 'patch':
          return api.patch(url, data, { headers });
        case 'delete':
          return api.delete(url, { headers });
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    [organizationId, propertyId]
  );

  // Convenience methods
  const get = useCallback((url: string, headers?: Record<string, string>) => 
    apiCallWithTenant('get', url, undefined, headers), [apiCallWithTenant]
  );

  const post = useCallback((url: string, data?: any, headers?: Record<string, string>) => 
    apiCallWithTenant('post', url, data, headers), [apiCallWithTenant]
  );

  const put = useCallback((url: string, data?: any, headers?: Record<string, string>) => 
    apiCallWithTenant('put', url, data, headers), [apiCallWithTenant]
  );

  const patch = useCallback((url: string, data?: any, headers?: Record<string, string>) => 
    apiCallWithTenant('patch', url, data, headers), [apiCallWithTenant]
  );

  const del = useCallback((url: string, headers?: Record<string, string>) => 
    apiCallWithTenant('delete', url, undefined, headers), [apiCallWithTenant]
  );

  // Build tenant-aware URLs
  const buildTenantUrl = useCallback((baseUrl: string, includePropertyId: boolean = true) => {
    let url = baseUrl;
    
    if (organizationId) {
      url = url.includes('?') 
        ? `${url}&organizationId=${organizationId}`
        : `${url}?organizationId=${organizationId}`;
    }
    
    if (includePropertyId && propertyId) {
      url = url.includes('?')
        ? `${url}&propertyId=${propertyId}`
        : `${url}?propertyId=${propertyId}`;
    }
    
    return url;
  }, [organizationId, propertyId]);

  return {
    // Direct API methods with tenant context
    get,
    post,
    put,
    patch,
    delete: del,
    
    // Utility methods
    apiCallWithTenant,
    buildTenantUrl,
    
    // Tenant information
    tenantContext: {
      organizationId,
      propertyId,
    },
  };
};