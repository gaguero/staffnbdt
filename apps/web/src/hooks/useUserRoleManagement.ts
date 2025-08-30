import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from './usePermissions';
import roleService from '../services/roleService';
import userService from '../services/userService';
import toastService from '../utils/toast';

export interface UserRole {
  id: string;
  roleId: string;
  userId: string;
  role: {
    id: string;
    name: string;
    description?: string;
    level?: number;
    isSystem: boolean;
  };
  assignedAt: string;
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  expiresAt?: string;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface RoleAssignment {
  userId: string;
  roleId: string;
  expiresAt?: string;
  conditions?: Record<string, any>;
  metadata?: {
    assignmentReason?: string;
    [key: string]: any;
  };
}

export interface RoleHistory {
  id: string;
  action: 'ASSIGNED' | 'REMOVED' | 'EXPIRED';
  roleId: string;
  roleName: string;
  assignedAt: string;
  removedAt?: string;
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  reason?: string;
  metadata?: Record<string, any>;
}

export interface EffectivePermissions {
  permissions: Array<{
    id: string;
    resource: string;
    action: string;
    scope: string;
    source: 'system_role' | 'custom_role';
    sourceRole: string;
  }>;
  permissionCount: {
    byCategory: Record<string, number>;
    total: number;
  };
  securityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface UseUserRoleManagementReturn {
  // Current roles data
  currentRoles: UserRole[] | undefined;
  availableRoles: any[] | undefined;
  effectivePermissions: EffectivePermissions | undefined;
  roleHistory: RoleHistory[] | undefined;
  
  // Loading states
  isLoadingCurrentRoles: boolean;
  isLoadingAvailableRoles: boolean;
  isLoadingPermissions: boolean;
  isLoadingHistory: boolean;
  
  // Assignment operations
  assignRole: (assignment: RoleAssignment) => Promise<void>;
  removeRole: (userRoleId: string) => Promise<void>;
  bulkAssignRoles: (assignments: RoleAssignment[]) => Promise<void>;
  bulkRemoveRoles: (userRoleIds: string[]) => Promise<void>;
  
  // Permission operations
  refreshUserPermissions: (userId: string) => Promise<void>;
  
  // Validation
  validateRoleAssignment: (userId: string, roleId: string) => Promise<{
    isValid: boolean;
    conflicts: string[];
    warnings: string[];
    recommendations: string[];
  }>;
  
  // Utilities
  canAssignRole: (roleId: string) => boolean;
  canRemoveRole: (roleId: string) => boolean;
  getRoleConflicts: (roleIds: string[]) => string[];
}

export function useUserRoleManagement(userId?: string): UseUserRoleManagementReturn {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [validationCache, setValidationCache] = useState<Record<string, any>>({});

  // Query current user roles
  const {
    data: currentRoles,
    isLoading: isLoadingCurrentRoles
  } = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await roleService.getUserRoles(userId);
      return response.data;
    },
    enabled: !!userId,
  });

  // Query available roles for assignment
  const {
    data: availableRoles,
    isLoading: isLoadingAvailableRoles
  } = useQuery({
    queryKey: ['availableRoles', userId],
    queryFn: async () => {
      // Get all roles that user has permission to assign
      const response = await roleService.getRoles();
      return response.data;
    },
  });

  // Query effective permissions for user
  const {
    data: effectivePermissions,
    isLoading: isLoadingPermissions,
    refetch: refetchPermissions
  } = useQuery({
    queryKey: ['userEffectivePermissions', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await userService.getUserPermissions(userId);
      return response;
    },
    enabled: !!userId,
  });

  // Query role assignment history
  const {
    data: roleHistory,
    isLoading: isLoadingHistory
  } = useQuery({
    queryKey: ['userRoleHistory', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await userService.getUserRoleHistory(userId);
      return response.data;
    },
    enabled: !!userId,
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async (assignment: RoleAssignment) => {
      return roleService.assignRole(assignment);
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['userRoles', userId] });
      queryClient.invalidateQueries({ queryKey: ['userEffectivePermissions', userId] });
      queryClient.invalidateQueries({ queryKey: ['userRoleHistory', userId] });
      toastService.success('Role assigned successfully');
    },
    onError: (error: any) => {
      console.error('Failed to assign role:', error);
      toastService.error(error?.response?.data?.message || 'Failed to assign role');
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async (userRoleId: string) => {
      return roleService.removeUserRole(userRoleId);
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['userRoles', userId] });
      queryClient.invalidateQueries({ queryKey: ['userEffectivePermissions', userId] });
      queryClient.invalidateQueries({ queryKey: ['userRoleHistory', userId] });
      toastService.success('Role removed successfully');
    },
    onError: (error: any) => {
      console.error('Failed to remove role:', error);
      toastService.error(error?.response?.data?.message || 'Failed to remove role');
    },
  });

  // Bulk assign roles mutation
  const bulkAssignRolesMutation = useMutation({
    mutationFn: async (assignments: RoleAssignment[]) => {
      return roleService.bulkAssignRoles(assignments);
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['userRoles', userId] });
      queryClient.invalidateQueries({ queryKey: ['userEffectivePermissions', userId] });
      queryClient.invalidateQueries({ queryKey: ['userRoleHistory', userId] });
      toastService.success(`${data.success} role(s) assigned successfully`);
    },
    onError: (error: any) => {
      console.error('Failed to bulk assign roles:', error);
      toastService.error(error?.response?.data?.message || 'Failed to assign roles');
    },
  });

  // Bulk remove roles mutation
  const bulkRemoveRolesMutation = useMutation({
    mutationFn: async (userRoleIds: string[]) => {
      return roleService.bulkRemoveRoles(userRoleIds);
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['userRoles', userId] });
      queryClient.invalidateQueries({ queryKey: ['userEffectivePermissions', userId] });
      queryClient.invalidateQueries({ queryKey: ['userRoleHistory', userId] });
      toastService.success(`${data.success} role assignment(s) removed successfully`);
    },
    onError: (error: any) => {
      console.error('Failed to bulk remove roles:', error);
      toastService.error(error?.response?.data?.message || 'Failed to remove roles');
    },
  });

  // Role assignment operations
  const assignRole = useCallback(async (assignment: RoleAssignment) => {
    await assignRoleMutation.mutateAsync(assignment);
  }, [assignRoleMutation]);

  const removeRole = useCallback(async (userRoleId: string) => {
    await removeRoleMutation.mutateAsync(userRoleId);
  }, [removeRoleMutation]);

  const bulkAssignRoles = useCallback(async (assignments: RoleAssignment[]) => {
    await bulkAssignRolesMutation.mutateAsync(assignments);
  }, [bulkAssignRolesMutation]);

  const bulkRemoveRoles = useCallback(async (userRoleIds: string[]) => {
    await bulkRemoveRolesMutation.mutateAsync(userRoleIds);
  }, [bulkRemoveRolesMutation]);

  // Refresh user permissions
  const refreshUserPermissions = useCallback(async (targetUserId: string) => {
    await refetchPermissions();
    // Also refresh current user permissions if updating self
    if (targetUserId === user?.id) {
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
    }
  }, [refetchPermissions, user?.id, queryClient]);

  // Role validation
  const validateRoleAssignment = useCallback(async (
    targetUserId: string,
    roleId: string
  ) => {
    const cacheKey = `${targetUserId}_${roleId}`;
    
    if (validationCache[cacheKey]) {
      return validationCache[cacheKey];
    }

    try {
      // Mock validation logic - replace with actual API call when available
      const userCurrentRoles = currentRoles || [];
      const role = availableRoles?.find(r => r.id === roleId);
      
      const conflicts: string[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Check for role conflicts
      if (userCurrentRoles.some(ur => ur.roleId === roleId)) {
        conflicts.push('User already has this role assigned');
      }

      // Check for level conflicts (system roles)
      const systemRoleLevel = role?.level || 0;
      const highestCurrentLevel = Math.max(...userCurrentRoles.map(ur => ur.role.level || 0));
      
      if (systemRoleLevel < highestCurrentLevel) {
        warnings.push('Assigning lower-level system role may reduce permissions');
      }

      // Add recommendations
      if (userCurrentRoles.length === 0) {
        recommendations.push('Consider assigning appropriate department access');
      }

      const validation = {
        isValid: conflicts.length === 0,
        conflicts,
        warnings,
        recommendations,
      };

      // Cache the validation result for 5 minutes
      setValidationCache(prev => ({
        ...prev,
        [cacheKey]: validation
      }));
      setTimeout(() => {
        setValidationCache(prev => {
          const { [cacheKey]: _, ...rest } = prev;
          return rest;
        });
      }, 5 * 60 * 1000);

      return validation;
    } catch (error) {
      console.error('Role validation failed:', error);
      return {
        isValid: false,
        conflicts: ['Validation failed'],
        warnings: [],
        recommendations: [],
      };
    }
  }, [currentRoles, availableRoles, validationCache]);

  // Permission checks for role operations
  const canAssignRole = useCallback((_roleId: string) => {
    // This would typically check permissions based on role level and user's permissions
    // For now, use a simple permission check
    return hasPermission('role', 'assign', 'department').valueOf() || 
           hasPermission('role', 'assign', 'property').valueOf() ||
           hasPermission('role', 'assign', 'organization').valueOf();
  }, [hasPermission]);

  const canRemoveRole = useCallback((_roleId: string) => {
    // Similar permission check for removal
    return hasPermission('role', 'assign', 'department').valueOf() || 
           hasPermission('role', 'assign', 'property').valueOf() ||
           hasPermission('role', 'assign', 'organization').valueOf();
  }, [hasPermission]);

  // Get role conflicts based on current assignments
  const getRoleConflicts = useCallback((roleIds: string[]) => {
    const conflicts: string[] = [];
    const currentRoleIds = (currentRoles || []).map(ur => ur.roleId);
    
    roleIds.forEach(roleId => {
      if (currentRoleIds.includes(roleId)) {
        const role = availableRoles?.find(r => r.id === roleId);
        conflicts.push(`Already has role: ${role?.name || roleId}`);
      }
    });

    return conflicts;
  }, [currentRoles, availableRoles]);

  return {
    // Current roles data
    currentRoles: currentRoles as any,
    availableRoles,
    effectivePermissions: effectivePermissions as any,
    roleHistory,
    
    // Loading states
    isLoadingCurrentRoles,
    isLoadingAvailableRoles,
    isLoadingPermissions,
    isLoadingHistory,
    
    // Assignment operations
    assignRole,
    removeRole,
    bulkAssignRoles,
    bulkRemoveRoles,
    
    // Permission operations
    refreshUserPermissions,
    
    // Validation
    validateRoleAssignment,
    
    // Utilities
    canAssignRole: (roleId: string) => Boolean(canAssignRole(roleId)),
    canRemoveRole: (roleId: string) => Boolean(canRemoveRole(roleId)),
    getRoleConflicts,
  };
}

export default useUserRoleManagement;