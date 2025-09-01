import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePermissions } from './usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSION_QUERY_KEYS } from './usePermissions';
import { SYSTEM_ROLES_QUERY_KEYS } from './useSystemRoles';

/**
 * Hook for managing UI updates after role changes
 * Ensures proper permission refresh and navigation updates
 */
export const useRoleManagement = () => {
  const queryClient = useQueryClient();
  const { refreshPermissions } = usePermissions();
  const { user: currentUser, refreshAuth } = useAuth();

  /**
   * Handle role change completion - refresh all relevant caches and permissions
   */
  const handleRoleChanged = useCallback(async (
    userId: string, 
    newRole: string, 
    wasCurrentUser = false
  ) => {
    try {
      // 1. Invalidate all system role queries
      await queryClient.invalidateQueries({ 
        queryKey: SYSTEM_ROLES_QUERY_KEYS.all 
      });

      // 2. Invalidate user-specific permission queries
      await queryClient.invalidateQueries({ 
        queryKey: SYSTEM_ROLES_QUERY_KEYS.userPermissions(userId) 
      });

      // 3. Invalidate role history for the user
      await queryClient.invalidateQueries({ 
        queryKey: SYSTEM_ROLES_QUERY_KEYS.history(userId) 
      });

      // 4. Invalidate general user queries (for user lists)
      await queryClient.invalidateQueries({ 
        queryKey: ['users'] 
      });

      // 5. If this was the current user, refresh their auth and permissions
      if (wasCurrentUser || userId === currentUser?.id) {
        // Clear all permission-related cache
        await queryClient.invalidateQueries({ 
          queryKey: PERMISSION_QUERY_KEYS.all 
        });
        
        // Refresh current user's permissions
        await refreshPermissions();
        
        // Refresh auth context to get updated user info
        await refreshAuth();
      }

      // 6. Invalidate role statistics
      await queryClient.invalidateQueries({ 
        queryKey: SYSTEM_ROLES_QUERY_KEYS.statistics() 
      });

    } catch (error) {
      console.error('Failed to refresh after role change:', error);
      // Don't throw - role change was successful, we just couldn't refresh the UI perfectly
    }
  }, [queryClient, refreshPermissions, currentUser?.id, refreshAuth]);

  /**
   * Force refresh of all role-related data
   */
  const refreshAllRoleData = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: SYSTEM_ROLES_QUERY_KEYS.all 
    });
    
    await queryClient.invalidateQueries({ 
      queryKey: PERMISSION_QUERY_KEYS.all 
    });
    
    await queryClient.invalidateQueries({ 
      queryKey: ['users'] 
    });
    
    await refreshPermissions();
  }, [queryClient, refreshPermissions]);

  /**
   * Check if navigation should be updated after role change
   */
  const shouldUpdateNavigation = useCallback((
    userId: string, 
    oldRole: string, 
    newRole: string
  ) => {
    // If current user's role changed, navigation needs update
    if (userId === currentUser?.id) {
      return true;
    }
    
    // If role level changed significantly, might affect what current user can see
    const oldLevel = Object.values(SYSTEM_ROLES_QUERY_KEYS).find(r => r === oldRole)?.level || 999;
    const newLevel = Object.values(SYSTEM_ROLES_QUERY_KEYS).find(r => r === newRole)?.level || 999;
    
    return Math.abs(oldLevel - newLevel) > 1;
  }, [currentUser?.id]);

  return {
    handleRoleChanged,
    refreshAllRoleData,
    shouldUpdateNavigation,
  };
};

export default useRoleManagement;