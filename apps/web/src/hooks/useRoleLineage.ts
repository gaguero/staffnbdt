import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RoleLineage,
  UseRoleLineageReturn,
  CloneType
} from '../types/roleDuplication';
import { roleService } from '../services/roleService';

/**
 * Hook for managing role lineage and family trees
 */
export const useRoleLineage = (roleId?: string): UseRoleLineageReturn => {
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(roleId);
  
  // Query for role lineage data
  const {
    data: lineageData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['roleLineage', selectedRoleId],
    queryFn: () => selectedRoleId ? roleService.getRoleLineage(selectedRoleId) : null,
    enabled: !!selectedRoleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const lineage = lineageData?.lineage || null;
  const ancestors = lineageData?.ancestors || [];
  const descendants = lineageData?.descendants || [];
  const siblings = lineageData?.siblings || [];
  const lineageTree = lineageData?.tree || ({} as RoleLineage);

  // Load lineage for a specific role
  const loadLineage = useCallback(async (roleId: string) => {
    setSelectedRoleId(roleId);
  }, []);

  // Refresh current lineage
  const refreshLineage = useCallback(async () => {
    if (selectedRoleId) {
      await refetch();
    }
  }, [selectedRoleId, refetch]);

  // Get role generation (0 = original, 1 = first clone, etc.)
  const getRoleGeneration = useCallback((roleId: string): number => {
    if (!lineageData) return 0;
    
    const role = findRoleInTree(lineageData.tree, roleId);
    return role?.generationLevel || 0;
  }, [lineageData]);

  // Get clone history for a role
  const getCloneHistory = useCallback((roleId: string) => {
    if (!lineageData) return [];
    
    const role = findRoleInTree(lineageData.tree, roleId);
    if (!role) return [];
    
    return role.childRoles.map(child => ({
      clonedRole: child,
      clonedAt: child.clonedAt || new Date(),
      cloneType: child.cloneType || 'full' as CloneType
    }));
  }, [lineageData]);

  // Check if one role is ancestor of another
  const isAncestor = useCallback((potentialAncestor: string, descendant: string): boolean => {
    if (!lineageData) return false;
    
    const descendantRole = findRoleInTree(lineageData.tree, descendant);
    if (!descendantRole) return false;
    
    return descendantRole.lineagePath.includes(potentialAncestor);
  }, [lineageData]);

  // Check if one role is descendant of another
  const isDescendant = useCallback((potentialDescendant: string, ancestor: string): boolean => {
    return isAncestor(ancestor, potentialDescendant);
  }, [isAncestor]);

  // Helper function to find role in lineage tree
  const findRoleInTree = (tree: RoleLineage, targetId: string): RoleLineage | null => {
    if (tree.id === targetId) return tree;
    
    for (const child of tree.childRoles || []) {
      const found = findRoleInTree(child, targetId);
      if (found) return found;
    }
    
    return null;
  };

  return {
    // State
    lineage,
    isLoading,
    error: error?.message || null,
    
    // Data
    ancestors,
    descendants,
    siblings,
    lineageTree,
    
    // Actions
    loadLineage,
    refreshLineage,
    
    // Utilities
    getRoleGeneration,
    getCloneHistory,
    isAncestor,
    isDescendant
  };
};

export default useRoleLineage;
