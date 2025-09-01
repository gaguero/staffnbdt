import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { moduleRegistryService } from '../services/moduleRegistryService';
import { UserType } from '../types/auth';
import { usePermissions } from './usePermissions';
import { useMemo } from 'react';

// Query keys for module caching
export const MODULE_QUERY_KEYS = {
  all: ['modules'] as const,
  allModules: () => [...MODULE_QUERY_KEYS.all, 'all'] as const,
  enabled: (organizationId: string, userType?: UserType) => 
    [...MODULE_QUERY_KEYS.all, 'enabled', organizationId, userType] as const,
  manifest: (moduleId: string) => 
    [...MODULE_QUERY_KEYS.all, 'manifest', moduleId] as const,
  permissions: (moduleId: string, userType: UserType) => 
    [...MODULE_QUERY_KEYS.all, 'permissions', moduleId, userType] as const,
  navigation: (organizationId: string, userType: UserType) => 
    [...MODULE_QUERY_KEYS.all, 'navigation', organizationId, userType] as const,
  modulePermissions: (organizationId: string, userType: UserType) => 
    [...MODULE_QUERY_KEYS.all, 'modulePermissions', organizationId, userType] as const,
};

/**
 * Hook to manage module registry operations
 */
export function useModules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get enabled modules for current user's organization
  const {
    data: enabledModules = [],
    isLoading: isLoadingModules,
    error: modulesError,
    refetch: refetchModules,
  } = useQuery({
    queryKey: MODULE_QUERY_KEYS.enabled(user?.organizationId || '', user?.userType),
    queryFn: () => {
      if (!user?.organizationId) return Promise.resolve([]);
      return moduleRegistryService.getEnabledModules(user.organizationId, user.userType);
    },
    enabled: !!user?.organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  // Get all available modules (for admins)
  const {
    data: allModules = [],
    isLoading: isLoadingAllModules,
    error: allModulesError,
  } = useQuery({
    queryKey: MODULE_QUERY_KEYS.allModules(),
    queryFn: () => moduleRegistryService.getAllModules(),
    enabled: user?.role === 'PLATFORM_ADMIN' || user?.role === 'ORGANIZATION_OWNER',
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Enable module mutation
  const enableModuleMutation = useMutation({
    mutationFn: ({ organizationId, moduleId }: { organizationId: string; moduleId: string }) =>
      moduleRegistryService.enableModule(organizationId, moduleId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch enabled modules
      queryClient.invalidateQueries({ 
        queryKey: MODULE_QUERY_KEYS.enabled(variables.organizationId, user?.userType) 
      });
      // Also invalidate navigation and permissions caches
      queryClient.invalidateQueries({ 
        queryKey: MODULE_QUERY_KEYS.navigation(variables.organizationId, user?.userType || UserType.INTERNAL) 
      });
      queryClient.invalidateQueries({ 
        queryKey: MODULE_QUERY_KEYS.modulePermissions(variables.organizationId, user?.userType || UserType.INTERNAL) 
      });
    },
  });

  // Disable module mutation
  const disableModuleMutation = useMutation({
    mutationFn: ({ organizationId, moduleId }: { organizationId: string; moduleId: string }) =>
      moduleRegistryService.disableModule(organizationId, moduleId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch enabled modules
      queryClient.invalidateQueries({ 
        queryKey: MODULE_QUERY_KEYS.enabled(variables.organizationId, user?.userType) 
      });
      // Also invalidate navigation and permissions caches
      queryClient.invalidateQueries({ 
        queryKey: MODULE_QUERY_KEYS.navigation(variables.organizationId, user?.userType || UserType.INTERNAL) 
      });
      queryClient.invalidateQueries({ 
        queryKey: MODULE_QUERY_KEYS.modulePermissions(variables.organizationId, user?.userType || UserType.INTERNAL) 
      });
    },
  });

  return {
    // Data
    enabledModules,
    allModules,
    
    // Loading states
    isLoadingModules,
    isLoadingAllModules,
    isLoading: isLoadingModules || isLoadingAllModules,
    
    // Errors
    modulesError: modulesError?.message || null,
    allModulesError: allModulesError?.message || null,
    error: modulesError?.message || allModulesError?.message || null,
    
    // Actions
    enableModule: enableModuleMutation.mutate,
    disableModule: disableModuleMutation.mutate,
    refetchModules,
    
    // Mutation states
    isEnablingModule: enableModuleMutation.isPending,
    isDisablingModule: disableModuleMutation.isPending,
    enableModuleError: enableModuleMutation.error?.message || null,
    disableModuleError: disableModuleMutation.error?.message || null,
  };
}

/**
 * Hook to get module navigation items
 */
export function useModuleNavigation(userType?: UserType) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveUserType = userType || user?.userType || UserType.INTERNAL;
  
  const {
    data: navigationItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: MODULE_QUERY_KEYS.navigation(user?.organizationId || '', effectiveUserType),
    queryFn: () => {
      if (!user?.organizationId) return Promise.resolve([]);
      return moduleRegistryService.getModuleNavigation(user.organizationId, effectiveUserType);
    },
    enabled: !!user?.organizationId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Filter navigation items based on user permissions
  const filteredNavigationItems = useMemo(() => {
    return navigationItems.filter(item => {
      // If no required permissions, always show
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true;
      }

      // PLATFORM_ADMIN bypass: show all module items
      if (user?.role === 'PLATFORM_ADMIN') {
        return true;
      }

      // OR logic: show if user has any of the required permissions
      return item.requiredPermissions.some(permission => {
        const [resource, action, scope] = permission.split('.');
        return hasPermission(resource, action, scope || 'own');
      });
    });
  }, [navigationItems, hasPermission, user]);

  return {
    navigationItems: filteredNavigationItems,
    allNavigationItems: navigationItems,
    isLoading,
    error: error?.message || null,
  };
}

/**
 * Hook to get specific module manifest
 */
export function useModuleManifest(moduleId: string | undefined) {
  return useQuery({
    queryKey: MODULE_QUERY_KEYS.manifest(moduleId || ''),
    queryFn: () => moduleRegistryService.getModuleManifest(moduleId!),
    enabled: !!moduleId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to get module permissions
 */
export function useModulePermissions(moduleId: string | undefined, userType?: UserType) {
  const { user } = useAuth();
  const effectiveUserType = userType || user?.userType || UserType.INTERNAL;
  
  return useQuery({
    queryKey: MODULE_QUERY_KEYS.permissions(moduleId || '', effectiveUserType),
    queryFn: () => moduleRegistryService.getModulePermissions(moduleId!, effectiveUserType),
    enabled: !!moduleId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to get all module permissions for current organization
 */
export function useAllModulePermissions(userType?: UserType) {
  const { user } = useAuth();
  const effectiveUserType = userType || user?.userType || UserType.INTERNAL;
  
  return useQuery({
    queryKey: MODULE_QUERY_KEYS.modulePermissions(user?.organizationId || '', effectiveUserType),
    queryFn: () => {
      if (!user?.organizationId) return Promise.resolve([]);
      return moduleRegistryService.getModulePermissions(user.organizationId, effectiveUserType);
    },
    enabled: !!user?.organizationId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to validate module dependencies
 */
export function useModuleDependencies(moduleId: string | undefined) {
  return useQuery({
    queryKey: [...MODULE_QUERY_KEYS.all, 'dependencies', moduleId],
    queryFn: () => moduleRegistryService.validateModuleDependencies(moduleId!),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes (shorter since dependencies can change)
  });
}

export default useModules;