import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useTenantAwareApi } from '../hooks/useTenantAwareApi';
import { useLanguage } from '../contexts/LanguageContext';
import PropertySelector from './PropertySelector';
import TenantSwitcher from './TenantSwitcher';

const TenantDemo: React.FC = () => {
  const { user, tenantInfo } = useAuth();
  const { 
    organizationId, 
    propertyId, 
    availableProperties, 
    isMultiProperty,
    hasOrganization,
    getCurrentPropertyName,
    getCurrentOrganizationName 
  } = useTenant();
  const { tenantContext } = useTenantAwareApi();
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <h2 className="text-xl font-semibold text-charcoal mb-6">
        Tenant Context Demo
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Context Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-charcoal">Current Context</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">User</label>
              <div className="text-sm text-charcoal">
                {user?.firstName} {user?.lastName} ({user?.role})
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Organization</label>
              <div className="text-sm text-charcoal">
                {getCurrentOrganizationName()}
                {organizationId && (
                  <span className="text-xs text-gray-500 ml-2">({organizationId})</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Property</label>
              <div className="text-sm text-charcoal">
                {getCurrentPropertyName()}
                {propertyId && (
                  <span className="text-xs text-gray-500 ml-2">({propertyId})</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Available Properties</label>
              <div className="text-sm text-charcoal">
                {availableProperties.length} properties
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {availableProperties.map(p => p.name).join(', ')}
              </div>
            </div>

            <div className="flex space-x-4 text-xs">
              <span className={`px-2 py-1 rounded ${hasOrganization ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {hasOrganization ? 'Has Organization' : 'No Organization'}
              </span>
              <span className={`px-2 py-1 rounded ${isMultiProperty ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                {isMultiProperty ? 'Multi-Property' : 'Single Property'}
              </span>
            </div>
          </div>
        </div>

        {/* Tenant Switching Components */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-charcoal">Tenant Switching</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                PropertySelector (Dropdown)
              </label>
              <PropertySelector variant="dropdown" showOrganization={true} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                PropertySelector (Modal)
              </label>
              <PropertySelector variant="modal" showOrganization={true} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                TenantSwitcher (Advanced)
              </label>
              <TenantSwitcher showOrganizationInfo={true} />
            </div>
          </div>
        </div>
      </div>

      {/* API Context Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-charcoal mb-4">API Integration</h3>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Tenant Headers</h4>
          <div className="text-sm text-charcoal space-y-1">
            <div>
              <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">X-Organization-Id:</span>
              <span className="ml-2">{tenantContext.organizationId || 'Not set'}</span>
            </div>
            <div>
              <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">X-Property-Id:</span>
              <span className="ml-2">{tenantContext.propertyId || 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Data Display */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-charcoal mb-4">Raw Tenant Data</h3>
        
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-auto">
          <pre className="text-xs font-mono">
            {JSON.stringify({
              tenantInfo,
              availableProperties,
              userTenantData: {
                organizationId: user?.organizationId,
                propertyId: user?.propertyId,
                properties: user?.properties
              }
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TenantDemo;