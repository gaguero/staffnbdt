import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import systemRolesService, { 
  SystemRoleInfo, 
  SystemRoleAssignment
} from '../services/systemRolesService';
import { toastService } from '../services/toastService';

export const SYSTEM_ROLES_QUERY_KEYS = {
  all: ['system-roles'] as const,
  list: () => [...SYSTEM_ROLES_QUERY_KEYS.all, 'list'] as const,
  detail: (role: string) => [...SYSTEM_ROLES_QUERY_KEYS.all, 'detail', role] as const,
  users: (role: string) => [...SYSTEM_ROLES_QUERY_KEYS.all, 'users', role] as const,
  permissions: (role: string) => [...SYSTEM_ROLES_QUERY_KEYS.all, 'permissions', role] as const,
  statistics: () => [...SYSTEM_ROLES_QUERY_KEYS.all, 'statistics'] as const,
  history: (userId: string) => [...SYSTEM_ROLES_QUERY_KEYS.all, 'history', userId] as const,
  userPermissions: (userId: string) => ['user-permissions', userId] as const,
};

/**
 * Hook for managing system roles
 */
export const useSystemRoles = () => {
  return useQuery({
    queryKey: SYSTEM_ROLES_QUERY_KEYS.list(),
    queryFn: systemRolesService.getAllSystemRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Hook for getting specific system role information
 */
export const useSystemRoleInfo = (role: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: SYSTEM_ROLES_QUERY_KEYS.detail(role),
    queryFn: () => systemRolesService.getSystemRoleInfo(role),
    enabled: enabled && !!role,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for getting users by role
 */
export const useUsersByRole = (role: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: SYSTEM_ROLES_QUERY_KEYS.users(role),
    queryFn: () => systemRolesService.getUsersByRole(role),
    enabled: enabled && !!role,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for previewing role permissions
 */
export const useRolePermissionPreview = (role: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: SYSTEM_ROLES_QUERY_KEYS.permissions(role),
    queryFn: () => systemRolesService.previewRolePermissions(role),
    enabled: enabled && !!role,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for getting role statistics
 */
export const useRoleStatistics = () => {
  return useQuery({
    queryKey: SYSTEM_ROLES_QUERY_KEYS.statistics(),
    queryFn: systemRolesService.getRoleStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for getting user role history
 */
export const useUserRoleHistory = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: SYSTEM_ROLES_QUERY_KEYS.history(userId),
    queryFn: () => systemRolesService.getUserRoleHistory(userId),
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for getting user permissions
 */
export const useUserPermissions = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: SYSTEM_ROLES_QUERY_KEYS.userPermissions(userId),
    queryFn: () => systemRolesService.getUserPermissions(userId),
    enabled: enabled && !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook for assigning system role
 */
export const useAssignSystemRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemRolesService.assignSystemRole,
    onMutate: async (_assignment: SystemRoleAssignment) => {
      toastService.loading('Assigning role...', { id: 'assign-role' });
    },
    onSuccess: (_data, variables) => {
      toastService.dismiss('assign-role');
      toastService.success(`Role ${variables.role} assigned successfully`);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.userPermissions(variables.userId) });
      queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.history(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Invalidate user queries
    },
    onError: (error: any, variables) => {
      toastService.dismiss('assign-role');
      toastService.error(
        error.response?.data?.message || 
        `Failed to assign role ${variables.role}`
      );
    },
  });
};

/**
 * Hook for bulk assigning system roles
 */
export const useBulkAssignSystemRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignments, reason }: { assignments: SystemRoleAssignment[], reason?: string }) => 
      systemRolesService.bulkAssignSystemRoles(assignments, reason),
    onMutate: async ({ assignments }) => {
      toastService.loading(`Assigning roles to ${assignments.length} users...`, { id: 'bulk-assign' });
    },
    onSuccess: (data, variables) => {
      toastService.dismiss('bulk-assign');
      const { successful, failed } = data;
      
      if (failed.length === 0) {
        toastService.success(`Successfully assigned roles to all ${successful.length} users`);
      } else {
        toastService.warning(
          `Assigned roles to ${successful.length} users. ${failed.length} failed.`,
          { duration: 6000 }
        );
      }

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Invalidate individual user permissions
      variables.assignments.forEach(assignment => {
        queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.userPermissions(assignment.userId) });
      });
    },
    onError: (error: any, _variables) => {
      toastService.dismiss('bulk-assign');
      toastService.error(
        error.response?.data?.message || 
        'Failed to assign roles in bulk'
      );
    },
  });
};

/**
 * Hook for changing user role with permission refresh
 */
export const useChangeUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role, reason }: { userId: string, role: string, reason?: string }) =>
      systemRolesService.changeUserRole(userId, role, reason),
    onMutate: async ({ userId: _userId, role }) => {
      toastService.loading(`Changing role to ${role}...`, { id: 'change-role' });
    },
    onSuccess: (_data, variables) => {
      toastService.dismiss('change-role');
      toastService.success(`User role changed to ${variables.role} successfully`);

      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.userPermissions(variables.userId) });
      queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.history(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Force refresh user permissions
      queryClient.refetchQueries({ 
        queryKey: SYSTEM_ROLES_QUERY_KEYS.userPermissions(variables.userId),
        type: 'active' 
      });
    },
    onError: (error: any, variables) => {
      toastService.dismiss('change-role');
      toastService.error(
        error.response?.data?.message || 
        `Failed to change role to ${variables.role}`
      );
    },
  });
};

/**
 * Hook for refreshing user permissions
 */
export const useRefreshUserPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemRolesService.refreshUserPermissions,
    onMutate: async (_userId: string) => {
      toastService.loading('Refreshing permissions...', { id: 'refresh-permissions' });
    },
    onSuccess: (data, userId) => {
      toastService.dismiss('refresh-permissions');
      toastService.success('Permissions refreshed successfully');

      // Update the permissions cache immediately
      queryClient.setQueryData(
        SYSTEM_ROLES_QUERY_KEYS.userPermissions(userId),
        data
      );

      // Also invalidate to ensure fresh data on next fetch
      queryClient.invalidateQueries({ 
        queryKey: SYSTEM_ROLES_QUERY_KEYS.userPermissions(userId) 
      });
    },
    onError: (error: any) => {
      toastService.dismiss('refresh-permissions');
      toastService.error(
        error.response?.data?.message || 
        'Failed to refresh permissions'
      );
    },
  });
};

/**
 * Hook for system role management with filtering and search
 */
export const useSystemRoleManagement = () => {
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'ALL' | 'INTERNAL' | 'CLIENT' | 'VENDOR'>('ALL');
  const [assignableOnly, setAssignableOnly] = useState(false);

  const { data: roles = [], isLoading, error } = useSystemRoles();

  const filteredRoles = roles.filter((role: SystemRoleInfo) => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUserType = userTypeFilter === 'ALL' || role.userType === userTypeFilter;
    const matchesAssignable = !assignableOnly || role.assignable;

    return matchesSearch && matchesUserType && matchesAssignable;
  });

  const toggleRoleSelection = useCallback((roleId: string) => {
    setSelectedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRoles(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedRoles(new Set(filteredRoles.map(role => role.role)));
  }, [filteredRoles]);

  return {
    roles: filteredRoles,
    isLoading,
    error,
    selectedRoles,
    searchTerm,
    setSearchTerm,
    userTypeFilter,
    setUserTypeFilter,
    assignableOnly,
    setAssignableOnly,
    toggleRoleSelection,
    clearSelection,
    selectAll,
  };
};