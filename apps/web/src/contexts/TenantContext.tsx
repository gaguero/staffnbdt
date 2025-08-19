import React, { createContext, useContext, ReactNode } from 'react';
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
  address?: string;
  organizationId: string;
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
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

// Custom hook for property selection UI
export const usePropertySelector = () => {
  const { availableProperties, propertyId, switchProperty } = useTenant();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectProperty = async (newPropertyId: string) => {
    if (newPropertyId === propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      await switchProperty(newPropertyId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch property';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    availableProperties,
    currentPropertyId: propertyId,
    selectProperty,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};