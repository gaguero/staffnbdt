import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moduleManagementService, { 
  ModuleStatusDetail, 
  PropertyModuleResponse
} from '../services/moduleManagementService';
import { toastService } from '../services/toastService';

// Query keys for module management caching
export const MODULE_MANAGEMENT_QUERY_KEYS = {
  all: ['moduleManagement'] as const,
  organizationModules: (orgId: string) => 
    [...MODULE_MANAGEMENT_QUERY_KEYS.all, 'organization', orgId] as const,
  propertyModules: (orgId: string, propId: string) => 
    [...MODULE_MANAGEMENT_QUERY_KEYS.all, 'property', orgId, propId] as const,
  moduleStatus: (orgId: string, propId: string, moduleId: string) => 
    [...MODULE_MANAGEMENT_QUERY_KEYS.all, 'status', orgId, propId, moduleId] as const,
  history: (orgId: string, propId?: string, moduleId?: string) => 
    [...MODULE_MANAGEMENT_QUERY_KEYS.all, 'history', orgId, propId, moduleId] as const,
};

/**
 * Hook to manage organization-level module subscriptions
 */
export function useOrganizationModules(organizationId?: string) {
  const { data: modules = [], isLoading, error, refetch } = useQuery({
    queryKey: MODULE_MANAGEMENT_QUERY_KEYS.organizationModules(organizationId || ''),
    queryFn: () => {
      if (!organizationId) throw new Error('Organization ID is required');
      return moduleManagementService.getOrganizationModules(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  return {
    organizationModules: modules,
    isLoadingOrgModules: isLoading,
    orgModulesError: error?.message || null,
    refetchOrgModules: refetch,
  };
}

/**
 * Hook to manage property-level module subscriptions with organization context
 */
export function usePropertyModules(organizationId?: string, propertyId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: MODULE_MANAGEMENT_QUERY_KEYS.propertyModules(organizationId || '', propertyId || ''),
    queryFn: (): Promise<PropertyModuleResponse> => {
      if (!organizationId || !propertyId) {
        throw new Error('Both organization and property IDs are required');
      }
      return moduleManagementService.getPropertyModules(organizationId, propertyId);
    },
    enabled: !!organizationId && !!propertyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return {
    propertyModuleData: data,
    organizationModules: data?.organizationModules || [],
    propertyModules: data?.propertyModules || [],
    statusDetails: data?.statusDetails || [],
    isLoadingPropertyModules: isLoading,
    propertyModulesError: error?.message || null,
    refetchPropertyModules: refetch,
  };
}

/**
 * Hook to get detailed status for a specific module
 */
export function useModuleStatus(organizationId?: string, propertyId?: string, moduleId?: string) {
  const { data: status, isLoading, error } = useQuery({
    queryKey: MODULE_MANAGEMENT_QUERY_KEYS.moduleStatus(
      organizationId || '', 
      propertyId || '', 
      moduleId || ''
    ),
    queryFn: (): Promise<ModuleStatusDetail> => {
      if (!organizationId || !propertyId || !moduleId) {
        throw new Error('Organization, property, and module IDs are required');
      }
      return moduleManagementService.getModuleStatusDetails(organizationId, propertyId, moduleId);
    },
    enabled: !!organizationId && !!propertyId && !!moduleId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    moduleStatus: status,
    isLoadingStatus: isLoading,
    statusError: error?.message || null,
  };
}

/**
 * Hook for module management mutations
 */
export function useModuleManagementMutations(organizationId?: string, propertyId?: string) {
  const queryClient = useQueryClient();

  // Enable module for property
  const enablePropertyModule = useMutation({
    mutationFn: (moduleId: string) => {
      if (!organizationId || !propertyId) {
        throw new Error('Organization and property IDs are required');
      }
      return moduleManagementService.enableModuleForProperty(organizationId, propertyId, moduleId);
    },
    onSuccess: (_, moduleId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: MODULE_MANAGEMENT_QUERY_KEYS.propertyModules(organizationId || '', propertyId || '')
      });
      queryClient.invalidateQueries({
        queryKey: MODULE_MANAGEMENT_QUERY_KEYS.moduleStatus(organizationId || '', propertyId || '', moduleId)
      });
      
      toastService.success(`Module ${moduleId} enabled for property`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to enable module';
      toastService.error(`Enable failed: ${message}`);
    },
  });

  // Disable module for property
  const disablePropertyModule = useMutation({
    mutationFn: (moduleId: string) => {
      if (!organizationId || !propertyId) {
        throw new Error('Organization and property IDs are required');
      }
      return moduleManagementService.disableModuleForProperty(organizationId, propertyId, moduleId);
    },
    onSuccess: (_, moduleId) => {
      queryClient.invalidateQueries({
        queryKey: MODULE_MANAGEMENT_QUERY_KEYS.propertyModules(organizationId || '', propertyId || '')
      });
      queryClient.invalidateQueries({
        queryKey: MODULE_MANAGEMENT_QUERY_KEYS.moduleStatus(organizationId || '', propertyId || '', moduleId)
      });
      
      toastService.success(`Module ${moduleId} disabled for property`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to disable module';
      toastService.error(`Disable failed: ${message}`);
    },
  });

  // Remove property override
  const removePropertyOverride = useMutation({
    mutationFn: (moduleId: string) => {
      if (!organizationId || !propertyId) {
        throw new Error('Organization and property IDs are required');
      }
      return moduleManagementService.removePropertyOverride(organizationId, propertyId, moduleId);
    },
    onSuccess: (_, moduleId) => {
      queryClient.invalidateQueries({
        queryKey: MODULE_MANAGEMENT_QUERY_KEYS.propertyModules(organizationId || '', propertyId || '')
      });
      queryClient.invalidateQueries({
        queryKey: MODULE_MANAGEMENT_QUERY_KEYS.moduleStatus(organizationId || '', propertyId || '', moduleId)
      });
      
      toastService.success(`Property override removed for module ${moduleId}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to remove override';
      toastService.error(`Remove override failed: ${message}`);
    },
  });

  // Bulk update property modules
  const bulkUpdatePropertyModules = useMutation({
    mutationFn: (updates: { moduleId: string; isEnabled: boolean }[]) => {
      if (!organizationId || !propertyId) {
        throw new Error('Organization and property IDs are required');
      }
      return moduleManagementService.bulkUpdatePropertyModules(organizationId, propertyId, updates);
    },
    onSuccess: (_, updates) => {
      queryClient.invalidateQueries({
        queryKey: MODULE_MANAGEMENT_QUERY_KEYS.propertyModules(organizationId || '', propertyId || '')
      });
      
      const enabledCount = updates.filter(u => u.isEnabled).length;
      const disabledCount = updates.length - enabledCount;
      
      toastService.success(
        `Bulk update completed: ${enabledCount} enabled, ${disabledCount} disabled`
      );
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to bulk update modules';
      toastService.error(`Bulk update failed: ${message}`);
    },
  });

  // Bulk update organization modules
  const bulkUpdateOrganizationModules = useMutation({
    mutationFn: (updates: { moduleId: string; isEnabled: boolean }[]) => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }
      return moduleManagementService.bulkUpdateOrganizationModules(organizationId, updates);
    },
    onSuccess: (_, updates) => {
      queryClient.invalidateQueries({
        queryKey: MODULE_MANAGEMENT_QUERY_KEYS.organizationModules(organizationId || '')
      });
      
      if (propertyId) {
        queryClient.invalidateQueries({
          queryKey: MODULE_MANAGEMENT_QUERY_KEYS.propertyModules(organizationId || '', propertyId)
        });
      }
      
      const enabledCount = updates.filter(u => u.isEnabled).length;
      const disabledCount = updates.length - enabledCount;
      
      toastService.success(
        `Organization bulk update completed: ${enabledCount} enabled, ${disabledCount} disabled`
      );
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to bulk update organization modules';
      toastService.error(`Organization bulk update failed: ${message}`);
    },
  });

  return {
    // Mutations
    enablePropertyModule: enablePropertyModule.mutate,
    disablePropertyModule: disablePropertyModule.mutate,
    removePropertyOverride: removePropertyOverride.mutate,
    bulkUpdatePropertyModules: bulkUpdatePropertyModules.mutate,
    bulkUpdateOrganizationModules: bulkUpdateOrganizationModules.mutate,
    
    // Loading states
    isEnablingModule: enablePropertyModule.isPending,
    isDisablingModule: disablePropertyModule.isPending,
    isRemovingOverride: removePropertyOverride.isPending,
    isBulkUpdatingProperty: bulkUpdatePropertyModules.isPending,
    isBulkUpdatingOrganization: bulkUpdateOrganizationModules.isPending,
    
    // Mutation instances for advanced usage
    enablePropertyModuleMutation: enablePropertyModule,
    disablePropertyModuleMutation: disablePropertyModule,
    removePropertyOverrideMutation: removePropertyOverride,
    bulkUpdatePropertyModulesMutation: bulkUpdatePropertyModules,
    bulkUpdateOrganizationModulesMutation: bulkUpdateOrganizationModules,
  };
}

/**
 * Hook to get module enablement history
 */
export function useModuleHistory(
  organizationId?: string, 
  propertyId?: string, 
  moduleId?: string
) {
  const { data: history = [], isLoading, error } = useQuery({
    queryKey: MODULE_MANAGEMENT_QUERY_KEYS.history(organizationId || '', propertyId, moduleId),
    queryFn: () => {
      if (!organizationId) throw new Error('Organization ID is required');
      return moduleManagementService.getModuleHistory(organizationId, propertyId, moduleId);
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    moduleHistory: history,
    isLoadingHistory: isLoading,
    historyError: error?.message || null,
  };
}

/**
 * Combined hook for complete module management functionality
 */
export function useCompleteModuleManagement(organizationId?: string, propertyId?: string) {
  const orgModules = useOrganizationModules(organizationId);
  const propModules = usePropertyModules(organizationId, propertyId);
  const mutations = useModuleManagementMutations(organizationId, propertyId);
  const history = useModuleHistory(organizationId, propertyId);

  return {
    // Organization data
    ...orgModules,
    
    // Property data
    ...propModules,
    
    // Mutations
    ...mutations,
    
    // History
    ...history,
    
    // Combined loading states
    isLoading: orgModules.isLoadingOrgModules || propModules.isLoadingPropertyModules,
    
    // Combined error state
    error: orgModules.orgModulesError || propModules.propertyModulesError,
    
    // Refresh all data
    refreshAll: () => {
      orgModules.refetchOrgModules();
      propModules.refetchPropertyModules();
    },
  };
}