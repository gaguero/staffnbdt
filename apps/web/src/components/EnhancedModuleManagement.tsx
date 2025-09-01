import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useModules } from '../hooks/useModules';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { canManageModules } from '../types/auth';
import PermissionGate from './PermissionGate';
import LoadingSpinner from './LoadingSpinner';
import { toastService } from '../services/toastService';
import { propertyService } from '../services/propertyService';
import moduleManagementService, { ModuleStatusDetail, PropertyModuleResponse } from '../services/moduleManagementService';

interface PropertyOption {
  id: string;
  name: string;
  organizationId: string;
}

const EnhancedModuleManagement: React.FC = () => {
  const { user } = useAuth();
  const { organization, property: currentProperty } = useTenant();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(currentProperty?.id || '');

  // Get all modules available
  const {
    allModules,
    isLoadingAllModules,
    error: modulesError,
  } = useModules();

  // Get properties for the current organization
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const response = await propertyService.getProperties({ organizationId: organization.id });
      return response.data || [];
    },
    enabled: !!organization?.id,
  });

  // Get module status for selected property
  const { 
    data: propertyModuleData, 
    isLoading: isLoadingPropertyModules,
    refetch: refetchPropertyModules 
  } = useQuery({
    queryKey: ['propertyModules', organization?.id, selectedPropertyId],
    queryFn: async (): Promise<PropertyModuleResponse> => {
      if (!organization?.id || !selectedPropertyId) {
        throw new Error('Missing organization or property ID');
      }
      return moduleManagementService.getPropertyModules(organization.id, selectedPropertyId);
    },
    enabled: !!organization?.id && !!selectedPropertyId,
  });

  // Organization-level module toggle
  const orgToggleMutation = useMutation({
    mutationFn: async ({ moduleId, enable }: { moduleId: string; enable: boolean }) => {
      if (!organization?.id) throw new Error('No organization selected');
      
      const updates = [{ moduleId, isEnabled: enable }];
      return moduleManagementService.bulkUpdateOrganizationModules(organization.id, updates);
    },
    onSuccess: (_, { moduleId, enable }) => {
      toastService.success(
        enable 
          ? `Module ${moduleId} enabled for organization`
          : `Module ${moduleId} disabled for organization`
      );
      refetchPropertyModules();
      queryClient.invalidateQueries({ queryKey: ['propertyModules'] });
    },
    onError: (error: any) => {
      toastService.error(
        `Organization toggle failed: ${error?.response?.data?.message || error.message}`
      );
    },
  });

  // Property-level module toggle
  const propertyToggleMutation = useMutation({
    mutationFn: async ({ moduleId, enable }: { moduleId: string; enable: boolean }) => {
      if (!organization?.id || !selectedPropertyId) {
        throw new Error('Missing organization or property ID');
      }
      
      if (enable) {
        await moduleManagementService.enableModuleForProperty(organization.id, selectedPropertyId, moduleId);
      } else {
        await moduleManagementService.disableModuleForProperty(organization.id, selectedPropertyId, moduleId);
      }
    },
    onSuccess: (_, { moduleId, enable }) => {
      toastService.success(
        enable 
          ? `Module ${moduleId} enabled for property`
          : `Module ${moduleId} disabled for property`
      );
      refetchPropertyModules();
    },
    onError: (error: any) => {
      toastService.error(
        `Property toggle failed: ${error?.response?.data?.message || error.message}`
      );
    },
  });

  // Remove property override
  const removeOverrideMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!organization?.id || !selectedPropertyId) {
        throw new Error('Missing organization or property ID');
      }
      await moduleManagementService.removePropertyOverride(organization.id, selectedPropertyId, moduleId);
    },
    onSuccess: (_, moduleId) => {
      toastService.success(`Property override removed for module ${moduleId}`);
      refetchPropertyModules();
    },
    onError: (error: any) => {
      toastService.error(
        `Remove override failed: ${error?.response?.data?.message || error.message}`
      );
    },
  });

  // Computed module status for display
  const moduleStatusMap = useMemo(() => {
    if (!propertyModuleData?.statusDetails) return new Map();
    
    const map = new Map<string, ModuleStatusDetail>();
    propertyModuleData.statusDetails.forEach(status => {
      map.set(status.moduleId, status);
    });
    return map;
  }, [propertyModuleData]);

  // Handlers
  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const handleOrganizationToggle = (moduleId: string, enable: boolean) => {
    orgToggleMutation.mutate({ moduleId, enable });
  };

  const handlePropertyToggle = (moduleId: string, enable: boolean) => {
    propertyToggleMutation.mutate({ moduleId, enable });
  };

  const handleRemoveOverride = (moduleId: string) => {
    removeOverrideMutation.mutate(moduleId);
  };

  // Loading and error states
  if (!user) {
    return (
      <div className="text-center text-gray-500 py-8">
        {t('auth.notAuthenticated')}
      </div>
    );
  }

  if (!canManageModules(user)) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('modules.accessDenied')}
        </h2>
        <p className="text-gray-600">
          {t('modules.accessDeniedDescription')}
        </p>
      </div>
    );
  }

  if (isLoadingAllModules || isLoadingProperties) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text={t('modules.loading')} />
      </div>
    );
  }

  if (modulesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="text-red-400 text-sm">⚠️</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {t('modules.error')}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {modulesError}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      resource="module"
      action="manage"
      scope="organization"
      unauthorized={
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {t('modules.permissionRequired')}
          </h2>
          <p className="text-gray-600">
            {t('modules.permissionRequiredDescription')}
          </p>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('modules.management')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('modules.managementDescription')}
            </p>
          </div>

          {/* Property Selector */}
          {properties.length > 0 && (
            <div className="w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('modules.selectProperty')}
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-warm-gold focus:border-warm-gold"
              >
                <option value="">{t('modules.selectPropertyPlaceholder')}</option>
                {properties.map((prop: PropertyOption) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!selectedPropertyId ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">🏨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('modules.selectPropertyTitle')}
            </h3>
            <p className="text-gray-600">
              {t('modules.selectPropertyMessage')}
            </p>
          </div>
        ) : (
          <>
            {/* Loading state for property modules */}
            {isLoadingPropertyModules ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="md" text={t('modules.loadingProperty')} />
              </div>
            ) : (
              <>
                {/* Module Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allModules.map(module => {
                    const status = moduleStatusMap.get(module.moduleId);
                    const isOrgEnabled = status?.organizationEnabled || false;
                    const hasPropertyOverride = status?.hasPrecedence === 'property';
                    const effectiveStatus = status?.effectiveStatus || false;

                    return (
                      <div key={module.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        {/* Module Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {module.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {module.description || t('modules.noDescription')}
                            </p>
                            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                              <span>{t('modules.category')}: {module.category}</span>
                              <span>{t('modules.version')}: {module.version}</span>
                            </div>
                          </div>
                          
                          {/* Status Indicator */}
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            effectiveStatus 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {effectiveStatus ? t('modules.enabled') : t('modules.disabled')}
                          </div>
                        </div>

                        {/* Organization Level */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                {t('modules.organizationLevel')}
                              </span>
                              {hasPropertyOverride && (
                                <div className="text-xs text-gray-500">
                                  {t('modules.overriddenByProperty')}
                                </div>
                              )}
                            </div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isOrgEnabled}
                                onChange={(e) => handleOrganizationToggle(module.moduleId, e.target.checked)}
                                disabled={orgToggleMutation.isPending}
                                className="w-4 h-4 text-warm-gold focus:ring-warm-gold border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">
                                {isOrgEnabled ? t('modules.enabled') : t('modules.disabled')}
                              </span>
                            </label>
                          </div>

                          {/* Property Level */}
                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                {t('modules.propertyLevel')}
                              </span>
                              {hasPropertyOverride && (
                                <div className="flex items-center mt-1">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {t('modules.override')}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={status?.propertyEnabled || false}
                                  onChange={(e) => handlePropertyToggle(module.moduleId, e.target.checked)}
                                  disabled={propertyToggleMutation.isPending}
                                  className="w-4 h-4 text-warm-gold focus:ring-warm-gold border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                  {status?.propertyEnabled ? t('modules.enabled') : t('modules.disabled')}
                                </span>
                              </label>
                              
                              {hasPropertyOverride && (
                                <button
                                  onClick={() => handleRemoveOverride(module.moduleId)}
                                  disabled={removeOverrideMutation.isPending}
                                  className="text-xs text-red-600 hover:text-red-800 underline"
                                  title={t('modules.removeOverride')}
                                >
                                  {t('modules.reset')}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Effective Status */}
                          <div className="text-xs text-center text-gray-600 pt-2 border-t border-gray-100">
                            {t('modules.effectiveStatus')}: 
                            <span className={`ml-1 font-medium ${
                              effectiveStatus ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {effectiveStatus ? t('modules.enabled') : t('modules.disabled')}
                            </span>
                            {hasPropertyOverride && (
                              <span className="ml-2 text-blue-600">
                                ({t('modules.propertyControlled')})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* System Module Badge */}
                        {module.isSystemModule && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {t('modules.systemModule')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Module Statistics */}
                {propertyModuleData && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {t('modules.statistics')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {allModules.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t('modules.totalModules')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {propertyModuleData.statusDetails.filter(s => s.organizationEnabled).length}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t('modules.orgEnabled')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {propertyModuleData.statusDetails.filter(s => s.hasPrecedence === 'property').length}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t('modules.propertyOverrides')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {propertyModuleData.statusDetails.filter(s => s.effectiveStatus).length}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t('modules.activeModules')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </PermissionGate>
  );
};

export default EnhancedModuleManagement;