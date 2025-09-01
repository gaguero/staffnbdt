import { useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSystemRoles, useAssignSystemRole, useChangeUserRole, SYSTEM_ROLES_QUERY_KEYS } from './useSystemRoles';
import { usePermissions, PERMISSION_QUERY_KEYS } from './usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { Role, ROLE_HIERARCHY, canManageRole } from '../types/role';
import { toastService } from '../services/toastService';

/**
 * Comprehensive hook that provides all role management functionality
 * with real-time UI updates and proper permission refreshing
 */
export const useComprehensiveRoleManagement = () => {
  const queryClient = useQueryClient();
  const { user: currentUser, refreshAuth } = useAuth();
  const { refreshPermissions } = usePermissions();
  
  // System roles data
  const { data: systemRoles = [], isLoading: rolesLoading, error: rolesError } = useSystemRoles();
  
  // Mutations
  const assignSystemRole = useAssignSystemRole();
  const changeUserRole = useChangeUserRole();

  /**
   * Get roles that current user can assign
   */
  const assignableRoles = useMemo(() => {
    if (!currentUser || !systemRoles.length) return [];

    const currentUserRole = currentUser.role as Role;
    
    return systemRoles.filter(role => {
      // Only show assignable roles
      if (!role.assignable) return false;
      
      // Platform Admin can assign any role
      if (currentUserRole === Role.PLATFORM_ADMIN) return true;
      
      // Other users can only assign roles they can manage
      return canManageRole(currentUserRole, role.role as Role);
    });
  }, [currentUser, systemRoles]);

  /**
   * Check if current user can manage a specific user's role
   */
  const canManageUser = useCallback((targetUserRole: string) => {
    if (!currentUser) return false;
    
    const currentUserRole = currentUser.role as Role;
    const targetRole = targetUserRole as Role;
    
    return canManageRole(currentUserRole, targetRole);
  }, [currentUser]);

  /**
   * Get available role upgrades for a user
   */
  const getAvailableUpgrades = useCallback((userRole: string) => {
    const currentLevel = ROLE_HIERARCHY[userRole as Role]?.level ?? 999;
    
    return assignableRoles.filter(role => {
      const targetLevel = ROLE_HIERARCHY[role.role as Role]?.level ?? 999;
      return targetLevel < currentLevel; // Lower level number = higher privilege
    });
  }, [assignableRoles]);

  /**
   * Get available role downgrades for a user
   */
  const getAvailableDowngrades = useCallback((userRole: string) => {
    const currentLevel = ROLE_HIERARCHY[userRole as Role]?.level ?? 999;
    
    return assignableRoles.filter(role => {
      const targetLevel = ROLE_HIERARCHY[role.role as Role]?.level ?? 999;
      return targetLevel > currentLevel; // Higher level number = lower privilege
    });
  }, [assignableRoles]);

  /**
   * Assign or change a user's role with comprehensive UI updates
   */
  const assignUserRole = useCallback(async ({
    userId,
    currentRole,
    newRole,
    reason = '',
    silent = false
  }: {
    userId: string;
    currentRole?: string;
    newRole: string;
    reason?: string;
    silent?: boolean;
  }) => {
    try {
      const isCurrentUser = userId === currentUser?.id;
      
      if (!silent) {
        toastService.loading('Updating user role...', { id: 'role-update' });
      }

      // Determine if this is a role change or new assignment
      if (currentRole && currentRole !== 'STAFF') {
        await changeUserRole.mutateAsync({
          userId,
          role: newRole,
          reason: reason || 'Role changed via role management system'
        });
      } else {
        await assignSystemRole.mutateAsync({
          userId,
          role: newRole,
          reason: reason || 'Role assigned via role management system'
        });
      }

      // Comprehensive cache invalidation
      await Promise.all([
        // System role queries
        queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.userPermissions(userId) }),
        queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.history(userId) }),
        queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.statistics() }),
        
        // User queries
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        
        // Permission queries (if current user)
        ...(isCurrentUser ? [
          queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.all }),
          refreshPermissions(),
          refreshAuth()
        ] : [])
      ]);

      if (!silent) {
        toastService.dismiss('role-update');
        toastService.success(`Role ${currentRole ? 'changed to' : 'assigned:'} ${newRole}`, {
          duration: 4000
        });
        
        if (isCurrentUser) {
          toastService.info('Your permissions have been updated. Some features may now be available or unavailable.', {
            duration: 6000
          });
        }
      }

      return true;
    } catch (error) {
      if (!silent) {
        toastService.dismiss('role-update');
        toastService.error(
          error instanceof Error ? error.message : 'Failed to update user role'
        );
      }
      throw error;
    }
  }, [
    currentUser?.id, 
    changeUserRole, 
    assignSystemRole, 
    queryClient, 
    refreshPermissions, 
    refreshAuth
  ]);

  /**
   * Bulk assign roles to multiple users
   */
  const bulkAssignRoles = useCallback(async (assignments: Array<{
    userId: string;
    currentRole?: string;
    newRole: string;
    reason?: string;
  }>) => {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ userId: string; error: string }>
    };

    toastService.loading(`Assigning roles to ${assignments.length} users...`, { 
      id: 'bulk-role-update' 
    });

    for (const assignment of assignments) {
      try {
        await assignUserRole({
          ...assignment,
          silent: true
        });
        results.successful.push(assignment.userId);
      } catch (error) {
        results.failed.push({
          userId: assignment.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    toastService.dismiss('bulk-role-update');

    if (results.failed.length === 0) {
      toastService.success(`Successfully assigned roles to all ${results.successful.length} users`);
    } else if (results.successful.length === 0) {
      toastService.error(`Failed to assign roles to all ${assignments.length} users`);
    } else {
      toastService.warning(
        `Assigned roles to ${results.successful.length} users. ${results.failed.length} failed.`,
        { duration: 6000 }
      );
    }

    return results;
  }, [assignUserRole]);

  /**
   * Get role recommendations for a user based on their current role and context
   */
  const getRoleRecommendations = useCallback((userRole: string, context?: {
    departmentId?: string;
    propertyRole?: string;
    experience?: 'new' | 'experienced' | 'senior';
  }) => {
    const currentLevel = ROLE_HIERARCHY[userRole as Role]?.level ?? 999;
    const recommendations: Array<{
      role: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Basic role progression recommendations
    if (userRole === Role.STAFF && context?.experience === 'experienced') {
      recommendations.push({
        role: Role.DEPARTMENT_ADMIN,
        reason: 'Ready for department leadership responsibilities',
        priority: 'medium'
      });
    }

    if (userRole === Role.DEPARTMENT_ADMIN && context?.experience === 'senior') {
      recommendations.push({
        role: Role.PROPERTY_MANAGER,
        reason: 'Qualified for property-wide management',
        priority: 'high'
      });
    }

    return recommendations.filter(rec => 
      assignableRoles.some(assignable => assignable.role === rec.role)
    );
  }, [assignableRoles]);

  /**
   * Force refresh all role-related data
   */
  const refreshAllRoleData = useCallback(async () => {
    toastService.loading('Refreshing role data...', { id: 'refresh-roles' });
    
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SYSTEM_ROLES_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        refreshPermissions()
      ]);
      
      toastService.dismiss('refresh-roles');
      toastService.success('Role data refreshed');
    } catch (error) {
      toastService.dismiss('refresh-roles');
      toastService.error('Failed to refresh role data');
      throw error;
    }
  }, [queryClient, refreshPermissions]);

  // Auto-refresh on auth changes
  useEffect(() => {
    if (currentUser) {
      refreshAllRoleData();
    }
  }, [currentUser?.id, currentUser?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Data
    systemRoles,
    assignableRoles,
    isLoading: rolesLoading,
    error: rolesError,
    currentUser,

    // Role management functions
    assignUserRole,
    bulkAssignRoles,
    canManageUser,
    getAvailableUpgrades,
    getAvailableDowngrades,
    getRoleRecommendations,

    // Utility functions
    refreshAllRoleData,

    // Mutation states
    isAssigning: assignSystemRole.isPending || changeUserRole.isPending,
  };
};

export default useComprehensiveRoleManagement;