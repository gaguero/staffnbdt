import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';

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
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  organizationId: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    logoUrl?: string;
    logoDarkUrl?: string;
    fontHeading?: string;
    fontBody?: string;
  };
}

interface TenantContextType {
  // Current context
  organizationId?: string;
  organization?: Organization;
  propertyId?: string;
  property?: Property;
  availableProperties: Property[];
  
  // Actions
  switchProperty: (propertyId: string) => Promise<void>;
  
  // Utilities
  canAccessProperty: (propertyId: string) => boolean;
  isMultiProperty: boolean;
  hasOrganization: boolean;
  getCurrentPropertyName: () => string;
  getCurrentOrganizationName: () => string;
  
  // Additional properties for usePropertySelector
  isLoading?: boolean;
  error?: string | null;
  getPropertyById?: (propertyId: string) => Property | undefined;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { tenantInfo, switchProperty: authSwitchProperty } = useAuth();

  const canAccessProperty = (propertyId: string): boolean => {
    return tenantInfo.availableProperties?.some(p => p.id === propertyId) || false;
  };

  const isMultiProperty = tenantInfo.availableProperties ? tenantInfo.availableProperties.length > 1 : false;
  const hasOrganization = !!tenantInfo.organizationId;

  const getCurrentPropertyName = (): string => {
    if (tenantInfo.property) {
      return tenantInfo.property.name;
    }
    if (tenantInfo.propertyId && tenantInfo.availableProperties) {
      const property = tenantInfo.availableProperties.find(p => p.id === tenantInfo.propertyId);
      return property?.name || 'Unknown Property';
    }
    return 'No Property Selected';
  };

  const getCurrentOrganizationName = (): string => {
    if (tenantInfo.organization) {
      return tenantInfo.organization.name;
    }
    return 'No Organization';
  };

  const getPropertyById = (propertyId: string): Property | undefined => {
    return tenantInfo.availableProperties?.find(p => p.id === propertyId);
  };

  const value: TenantContextType = {
    organizationId: tenantInfo.organizationId,
    organization: tenantInfo.organization,
    propertyId: tenantInfo.propertyId,
    property: tenantInfo.property,
    availableProperties: tenantInfo.availableProperties || [],
    switchProperty: authSwitchProperty,
    canAccessProperty,
    isMultiProperty,
    hasOrganization,
    getCurrentPropertyName,
    getCurrentOrganizationName,
    isLoading: false,
    error: null,
    getPropertyById,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

// Enhanced custom hook for property selection UI
export const usePropertySelector = () => {
  const { 
    availableProperties, 
    propertyId, 
    switchProperty, 
    isLoading: tenantLoading, 
    error: tenantError,
    canAccessProperty,
    getPropertyById 
  } = useTenant();
  const [localError, setLocalError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Combine tenant and local errors
  const error = tenantError || localError;
  const isLoading = tenantLoading;

  const selectProperty = async (newPropertyId: string) => {
    if (newPropertyId === propertyId) return;

    if (!canAccessProperty(newPropertyId)) {
      setLocalError('You do not have access to this property');
      return;
    }

    setLocalError(null);
    setRetryCount(0);

    try {
      await switchProperty(newPropertyId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch property';
      setLocalError(errorMessage);
      throw err;
    }
  };

  const retrySelection = async (propertyId: string) => {
    if (retryCount >= 3) {
      setLocalError('Maximum retry attempts reached. Please try again later.');
      return;
    }

    setRetryCount(prev => prev + 1);
    try {
      await selectProperty(propertyId);
    } catch (err) {
      console.error(`Retry ${retryCount + 1} failed:`, err);
    }
  };

  const clearError = () => {
    setLocalError(null);
    setRetryCount(0);
  };

  // Auto-clear local errors after 10 seconds
  useEffect(() => {
    if (localError) {
      const timer = setTimeout(() => setLocalError(null), 10000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [localError]);

  return {
    availableProperties,
    currentPropertyId: propertyId,
    selectProperty,
    retrySelection,
    getPropertyById,
    canAccessProperty,
    isLoading,
    error,
    retryCount,
    clearError,
  };
};

// Additional utility hooks
export const useTenantPermissions = () => {
  const { organizationId, propertyId, availableProperties } = useTenant();
  
  const canManageProperty = (targetPropertyId?: string) => {
    // Users can manage their current property or any property they have access to
    const targetId = targetPropertyId || propertyId;
    return availableProperties.some(p => p.id === targetId);
  };

  const canAccessAllProperties = () => {
    // This would typically check user role and permissions
    return availableProperties.length > 0;
  };

  return {
    organizationId,
    propertyId,
    canManageProperty,
    canAccessAllProperties,
  };
};

export const useTenantStats = () => {
  const { availableProperties, propertyId, organizationId } = useTenant();

  const stats = useMemo(() => {
    return {
      totalProperties: availableProperties.length,
      currentPropertyIndex: availableProperties.findIndex(p => p.id === propertyId),
      hasMultipleProperties: availableProperties.length > 1,
      organizationPropertyCount: availableProperties.filter(p => p.organizationId === organizationId).length,
    };
  }, [availableProperties, propertyId, organizationId]);

  return stats;
};