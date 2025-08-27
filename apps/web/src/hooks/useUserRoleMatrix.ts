import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import { userService } from '../services/userService';
import { usePermissions } from './usePermissions';
import {
  UserRoleMatrixState,
  MatrixUser,
  MatrixRole,
  MatrixFilters,
  BulkSelection,
  RoleAssignmentOperation,
  UseUserRoleMatrixReturn,
  ValidationResult,
} from '../types/userRoleMatrix';
// Temporary enum definition until the enums package path is fixed
enum SystemRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER', 
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',
  STAFF = 'STAFF'
}
import { toast } from 'react-hot-toast';

const CACHE_KEYS = {
  users: 'user-role-matrix:users',
  roles: 'user-role-matrix:roles',
  assignments: 'user-role-matrix:assignments',
} as const;

const DEFAULT_FILTERS: MatrixFilters = {
  search: '',
  statusFilter: 'active',
  roleTypeFilter: 'all',
};

const DEFAULT_BULK_SELECTION: BulkSelection = {
  selectedUsers: new Set(),
  selectedRoles: new Set(),
  mode: 'none',
};

/**
 * Custom hook for managing User Role Matrix state and operations
 * Provides comprehensive role assignment management with optimistic updates,
 * bulk operations, and performance optimizations
 */
export function useUserRoleMatrix(): UseUserRoleMatrixReturn {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const operationHistoryRef = useRef<RoleAssignmentOperation[]>([]);

  // Core state management
  const [filters, setFilters] = useState<MatrixFilters>(DEFAULT_FILTERS);
  const [bulkSelection, setBulkSelection] = useState<BulkSelection>(DEFAULT_BULK_SELECTION);
  const [error, setError] = useState<string | null>(null);
  const [optimisticOperations, setOptimisticOperations] = useState<Map<string, RoleAssignmentOperation>>(new Map());

  // Data fetching queries
  const usersQuery = useQuery({
    queryKey: [CACHE_KEYS.users],
    queryFn: async () => {
      const response = await userService.getUsers({ includeInactive: true });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const rolesQuery = useQuery({
    queryKey: [CACHE_KEYS.roles],
    queryFn: async () => {
      const response = await roleService.getRoles();
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const assignmentsQuery = useQuery({
    queryKey: [CACHE_KEYS.assignments],
    queryFn: async () => {
      const response = await roleService.getUserRoles();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Transform data for matrix display
  const matrixUsers = useMemo((): MatrixUser[] => {
    if (!usersQuery.data) return [];
    
    return usersQuery.data.map((user: any) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.profilePhoto,
      department: user.department ? {
        id: user.department.id,
        name: user.department.name,
      } : undefined,
      status: user.deletedAt ? 'inactive' : 'active',
      assignedRoles: assignmentsQuery.data?.filter(assignment => assignment.userId === user.id) || [],
    }));
  }, [usersQuery.data, assignmentsQuery.data]);

  const matrixRoles = useMemo((): MatrixRole[] => {
    if (!rolesQuery.data) return [];
    
    return rolesQuery.data.map(role => {
      const isSystemRole = Object.values(SystemRole).includes(role.name as SystemRole);
      const userCount = assignmentsQuery.data?.filter(assignment => assignment.roleId === role.id).length || 0;
      
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        isSystemRole,
        systemRole: isSystemRole ? (role.name as SystemRole) : undefined,
        userCount,
        permissions: role.permissions,
      };
    });
  }, [rolesQuery.data, assignmentsQuery.data]);

  // Create assignment lookup map for O(1) access
  const assignmentMap = useMemo((): Map<string, Set<string>> => {
    const map = new Map<string, Set<string>>();
    
    if (assignmentsQuery.data) {
      assignmentsQuery.data.forEach(assignment => {
        const userRoles = map.get(assignment.userId) || new Set();
        userRoles.add(assignment.roleId);
        map.set(assignment.userId, userRoles);
      });
    }
    
    // Apply optimistic operations
    optimisticOperations.forEach((operation, _key) => {
      const userRoles = map.get(operation.userId) || new Set();
      if (operation.type === 'assign') {
        userRoles.add(operation.roleId);
      } else {
        userRoles.delete(operation.roleId);
      }
      map.set(operation.userId, userRoles);
    });
    
    return map;
  }, [assignmentsQuery.data, optimisticOperations]);

  // Mutation for single role assignment
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const assignment = {
        userId,
        roleId,
      };
      const response = await roleService.assignRole(assignment);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.assignments] });
      operationHistoryRef.current.push({
        type: 'assign',
        userId: variables.userId,
        roleId: variables.roleId,
      });
      toast.success('Role assigned successfully');
    },
    onError: (error: any, variables) => {
      console.error('Role assignment failed:', error);
      toast.error(`Failed to assign role: ${error.message}`);
      // Remove optimistic update
      setOptimisticOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(`${variables.userId}-${variables.roleId}`);
        return newMap;
      });
    },
  });

  // Mutation for role unassignment
  const unassignRoleMutation = useMutation({
    mutationFn: async ({ userRoleId }: { userRoleId: string }) => {
      await roleService.removeUserRole(userRoleId);
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.assignments] });
      toast.success('Role unassigned successfully');
    },
    onError: (error: any, _variables) => {
      console.error('Role unassignment failed:', error);
      toast.error(`Failed to unassign role: ${error.message}`);
    },
  });

  // Mutation for bulk operations
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ assignments, isAssign }: { assignments: Array<{ userId: string; roleId: string }>; isAssign: boolean }) => {
      if (isAssign) {
        const response = await roleService.bulkAssignRoles(assignments);
        return response.data;
      } else {
        // For unassign, we need to find the userRole IDs first
        const userRoleIds = assignments.map(assignment => {
          const userRole = assignmentsQuery.data?.find(
            ur => ur.userId === assignment.userId && ur.roleId === assignment.roleId
          );
          return userRole?.id;
        }).filter(Boolean) as string[];
        
        if (userRoleIds.length > 0) {
          await roleService.bulkRemoveRoles(userRoleIds);
        }
        return userRoleIds;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.assignments] });
      const action = variables.isAssign ? 'assigned' : 'unassigned';
      toast.success(`Roles ${action} successfully`);
      setBulkSelection(DEFAULT_BULK_SELECTION);
    },
    onError: (error: any, variables) => {
      console.error('Bulk operation failed:', error);
      const action = variables.isAssign ? 'assign' : 'unassign';
      toast.error(`Failed to ${action} roles: ${error.message}`);
    },
  });

  // Validation helper
  const validateOperation = useCallback(async (userId: string, roleId: string, isAssign: boolean): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check permissions
    const canAssign = await hasPermission('user-roles', isAssign ? 'create' : 'delete');
    if (!canAssign) {
      errors.push('You do not have permission to modify role assignments');
    }

    // Check if operation makes sense
    const isCurrentlyAssigned = assignmentMap.get(userId)?.has(roleId) || false;
    if (isAssign && isCurrentlyAssigned) {
      warnings.push('Role is already assigned to this user');
    } else if (!isAssign && !isCurrentlyAssigned) {
      warnings.push('Role is not currently assigned to this user');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [hasPermission, assignmentMap]);

  // Core actions
  const toggleRole = useCallback(async (userId: string, roleId: string) => {
    const isAssigned = assignmentMap.get(userId)?.has(roleId) || false;
    const validation = await validateOperation(userId, roleId, !isAssigned);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Show warnings but continue
    validation.warnings.forEach(warning => toast(warning, { icon: '⚠️' }));

    if (isAssigned) {
      // Find the user role to unassign
      const userRole = assignmentsQuery.data?.find(
        ur => ur.userId === userId && ur.roleId === roleId
      );
      
      if (userRole) {
        // Add optimistic update
        setOptimisticOperations(prev => {
          const newMap = new Map(prev);
          newMap.set(`${userId}-${roleId}`, {
            type: 'unassign',
            userId,
            roleId,
            previousAssignment: userRole,
          });
          return newMap;
        });
        
        unassignRoleMutation.mutate({ userRoleId: userRole.id });
      }
    } else {
      // Add optimistic update
      setOptimisticOperations(prev => {
        const newMap = new Map(prev);
        newMap.set(`${userId}-${roleId}`, {
          type: 'assign',
          userId,
          roleId,
        });
        return newMap;
      });
      
      assignRoleMutation.mutate({ userId, roleId });
    }
  }, [assignmentMap, assignRoleMutation, unassignRoleMutation, assignmentsQuery.data, validateOperation]);

  const bulkAssignRoles = useCallback(async (userIds: string[], roleIds: string[]) => {
    const assignments = userIds.flatMap(userId =>
      roleIds.map(roleId => ({ userId, roleId }))
    );
    
    // Filter out already assigned combinations
    const newAssignments = assignments.filter(({ userId, roleId }) => {
      const isAssigned = assignmentMap.get(userId)?.has(roleId) || false;
      return !isAssigned;
    });
    
    if (newAssignments.length === 0) {
      toast('No new role assignments to make', { icon: '⚠️' });
      return;
    }
    
    bulkOperationMutation.mutate({ assignments: newAssignments, isAssign: true });
  }, [assignmentMap, bulkOperationMutation]);

  const bulkUnassignRoles = useCallback(async (userIds: string[], roleIds: string[]) => {
    const assignments = userIds.flatMap(userId =>
      roleIds.map(roleId => ({ userId, roleId }))
    );
    
    // Filter to only currently assigned combinations
    const existingAssignments = assignments.filter(({ userId, roleId }) => {
      const isAssigned = assignmentMap.get(userId)?.has(roleId) || false;
      return isAssigned;
    });
    
    if (existingAssignments.length === 0) {
      toast('No role assignments to remove', { icon: '⚠️' });
      return;
    }
    
    bulkOperationMutation.mutate({ assignments: existingAssignments, isAssign: false });
  }, [assignmentMap, bulkOperationMutation]);

  // Selection management
  const selectUser = useCallback((userId: string, selected: boolean) => {
    setBulkSelection(prev => {
      const newSelectedUsers = new Set(prev.selectedUsers);
      if (selected) {
        newSelectedUsers.add(userId);
      } else {
        newSelectedUsers.delete(userId);
      }
      
      const mode = newSelectedUsers.size > 0 ? 'users' : 
                   prev.selectedRoles.size > 0 ? 'roles' : 'none';
      
      return {
        ...prev,
        selectedUsers: newSelectedUsers,
        mode,
      };
    });
  }, []);

  const selectRole = useCallback((roleId: string, selected: boolean) => {
    setBulkSelection(prev => {
      const newSelectedRoles = new Set(prev.selectedRoles);
      if (selected) {
        newSelectedRoles.add(roleId);
      } else {
        newSelectedRoles.delete(roleId);
      }
      
      const mode = newSelectedRoles.size > 0 ? 'roles' : 
                   prev.selectedUsers.size > 0 ? 'users' : 'none';
      
      return {
        ...prev,
        selectedRoles: newSelectedRoles,
        mode,
      };
    });
  }, []);

  const selectAllUsers = useCallback(() => {
    const filteredUsers = getFilteredUsers();
    const allUserIds = new Set(filteredUsers.map(user => user.id));
    setBulkSelection(prev => ({
      ...prev,
      selectedUsers: allUserIds,
      mode: allUserIds.size > 0 ? 'users' : prev.selectedRoles.size > 0 ? 'roles' : 'none',
    }));
  }, []);

  const selectAllRoles = useCallback(() => {
    const filteredRoles = getFilteredRoles();
    const allRoleIds = new Set(filteredRoles.map(role => role.id));
    setBulkSelection(prev => ({
      ...prev,
      selectedRoles: allRoleIds,
      mode: allRoleIds.size > 0 ? 'roles' : prev.selectedUsers.size > 0 ? 'users' : 'none',
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setBulkSelection(DEFAULT_BULK_SELECTION);
  }, []);

  // Filter helpers
  const getFilteredUsers = useCallback((): MatrixUser[] => {
    return matrixUsers.filter(user => {
      // Status filter
      if (filters.statusFilter !== 'all' && user.status !== filters.statusFilter) {
        return false;
      }
      
      // Department filter
      if (filters.departmentId && user.department?.id !== filters.departmentId) {
        return false;
      }
      
      // Role filter
      if (filters.roleFilter) {
        const userRoles = assignmentMap.get(user.id) || new Set();
        if (!userRoles.has(filters.roleFilter)) {
          return false;
        }
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  }, [matrixUsers, filters, assignmentMap]);

  const getFilteredRoles = useCallback((): MatrixRole[] => {
    return matrixRoles.filter(role => {
      // Role type filter
      if (filters.roleTypeFilter !== 'all') {
        const isSystemRole = role.isSystemRole;
        if (filters.roleTypeFilter === 'system' && !isSystemRole) {
          return false;
        }
        if (filters.roleTypeFilter === 'custom' && isSystemRole) {
          return false;
        }
      }
      
      return true;
    });
  }, [matrixRoles, filters]);

  // Utility functions
  const isRoleAssigned = useCallback((userId: string, roleId: string): boolean => {
    return assignmentMap.get(userId)?.has(roleId) || false;
  }, [assignmentMap]);

  const getUserRoleCount = useCallback((userId: string): number => {
    return assignmentMap.get(userId)?.size || 0;
  }, [assignmentMap]);

  const getRoleUserCount = useCallback((roleId: string): number => {
    let count = 0;
    for (const roleSet of assignmentMap.values()) {
      if (roleSet.has(roleId)) {
        count++;
      }
    }
    return count;
  }, [assignmentMap]);

  const canAssignRole = useCallback(async (userId: string, roleId: string) => {
    const validation = await validateOperation(userId, roleId, true);
    return validation.isValid;
  }, [validateOperation]);

  const canUnassignRole = useCallback(async (userId: string, roleId: string) => {
    const validation = await validateOperation(userId, roleId, false);
    return validation.isValid;
  }, [validateOperation]);

  const updateFilters = useCallback((newFilters: Partial<MatrixFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.users] }),
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.roles] }),
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.assignments] }),
    ]);
  }, [queryClient]);

  const undoLastOperation = useCallback(async () => {
    const lastOperation = operationHistoryRef.current.pop();
    if (!lastOperation) {
      toast('No operations to undo', { icon: '⚠️' });
      return;
    }
    
    // Perform reverse operation
    if (lastOperation.type === 'assign') {
      const userRole = assignmentsQuery.data?.find(
        ur => ur.userId === lastOperation.userId && ur.roleId === lastOperation.roleId
      );
      if (userRole) {
        await unassignRoleMutation.mutateAsync({ userRoleId: userRole.id });
        toast.success('Operation undone');
      }
    } else if (lastOperation.type === 'unassign' && lastOperation.previousAssignment) {
      await assignRoleMutation.mutateAsync({
        userId: lastOperation.userId,
        roleId: lastOperation.roleId,
      });
      toast.success('Operation undone');
    }
  }, [assignRoleMutation, unassignRoleMutation, assignmentsQuery.data]);

  // Cleanup optimistic operations when queries succeed
  useEffect(() => {
    if (assignmentsQuery.isSuccess) {
      setOptimisticOperations(new Map());
    }
  }, [assignmentsQuery.isSuccess]);

  // Clear error when queries succeed
  useEffect(() => {
    if (assignmentsQuery.isSuccess && rolesQuery.isSuccess && usersQuery.isSuccess) {
      setError(null);
    }
  }, [assignmentsQuery.isSuccess, rolesQuery.isSuccess, usersQuery.isSuccess]);

  // Set error from query errors
  useEffect(() => {
    const errors = [
      usersQuery.error?.message,
      rolesQuery.error?.message,
      assignmentsQuery.error?.message,
    ].filter(Boolean);
    
    if (errors.length > 0) {
      setError(errors.join('; '));
    }
  }, [usersQuery.error, rolesQuery.error, assignmentsQuery.error]);

  const state: UserRoleMatrixState = {
    users: matrixUsers,
    roles: matrixRoles,
    assignments: assignmentMap,
    loading: usersQuery.isLoading || rolesQuery.isLoading || assignmentsQuery.isLoading ||
             assignRoleMutation.isPending || unassignRoleMutation.isPending || bulkOperationMutation.isPending,
    error,
    filters,
    bulkSelection,
  };

  return {
    state,
    actions: {
      toggleRole,
      bulkAssignRoles,
      bulkUnassignRoles,
      selectUser,
      selectRole,
      selectAllUsers,
      selectAllRoles,
      clearSelection,
      updateFilters,
      refreshData,
      undoLastOperation,
    },
    utils: {
      isRoleAssigned,
      getUserRoleCount,
      getRoleUserCount,
      getFilteredUsers,
      getFilteredRoles,
      canAssignRole: (userId: string, roleId: string) => {
        // Convert async function to sync by returning a default value
        // In a real implementation, this should be handled differently
        canAssignRole(userId, roleId).catch(() => false);
        return false;
      },
      canUnassignRole: (userId: string, roleId: string) => {
        // Convert async function to sync by returning a default value
        // In a real implementation, this should be handled differently
        canUnassignRole(userId, roleId).catch(() => false);
        return false;
      },
    },
  };
}

export default useUserRoleMatrix;
