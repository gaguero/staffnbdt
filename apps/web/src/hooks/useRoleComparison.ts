import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRoles, usePermissions } from './useRoles';
import {
  RoleComparisonData,
  RoleComparison,
  ComparisonMetrics,
  PermissionMatrix,
  PermissionDifferences,
  ComparisonSuggestion,
  ComparisonFilters,
  ComparisonViewState,
  ComparisonError,
  RoleSimilarityMap,
} from '../types/roleComparison';
import { Permission } from '../types/permission';
// Local Role enum definition
export enum Role {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',
  STAFF = 'STAFF'
}
import { usePermissions as useUserPermissions } from './usePermissions';

interface UseRoleComparisonProps {
  initialRoles?: string[];
  maxRoles?: number;
  autoAnalyze?: boolean;
}

interface UseRoleComparisonReturn {
  // State
  comparison: RoleComparison | null;
  selectedRoles: RoleComparisonData[];
  availableRoles: RoleComparisonData[];
  isLoading: boolean;
  isAnalyzing: boolean;
  error: ComparisonError | null;
  viewState: ComparisonViewState;
  
  // Actions
  selectRole: (roleId: string) => void;
  unselectRole: (roleId: string) => void;
  clearSelection: () => void;
  analyzeRoles: () => Promise<void>;
  setFilters: (filters: Partial<ComparisonFilters>) => void;
  setView: (view: ComparisonViewState['currentView']) => void;
  
  // Computed values
  canAddMore: boolean;
  hasMinimumRoles: boolean;
  similarityMatrix: RoleSimilarityMap;
}

export function useRoleComparison({
  initialRoles = [],
  maxRoles = 4,
  autoAnalyze = true,
}: UseRoleComparisonProps = {}): UseRoleComparisonReturn {
  // External data
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: _permissionsData, isLoading: permissionsLoading } = usePermissions();
  const { hasPermission: _hasPermission } = useUserPermissions();
  
  // Internal state
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(initialRoles);
  const [comparison, setComparison] = useState<RoleComparison | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<ComparisonError | null>(null);
  const [viewState, setViewState] = useState<ComparisonViewState>({
    currentView: 'summary',
    selectedRoles: initialRoles,
    filters: {
      roleTypes: ['system', 'custom'],
      categories: [],
      scopes: [],
      actions: [],
      permissionSearch: '',
      roleSearch: '',
    },
    config: {
      maxRoles,
      showSystemRoles: true,
      showCustomRoles: true,
      enableVisualizations: true,
      enableExport: true,
      enableSuggestions: true,
      includeUsageStats: true,
      includeHierarchy: true,
    },
    expandedCategories: [],
    sortBy: 'name',
    sortOrder: 'asc',
    showAdvancedOptions: false,
  });
  
  // Transform roles data to comparison format
  const availableRoles = useMemo((): RoleComparisonData[] => {
    if (!rolesData) return [];
    
    return rolesData.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: (role as any).isSystemRole || false,
      systemRole: (role as any).isSystemRole ? (role.name as Role) : undefined,
      permissions: (role.permissions || []).map(p => ({ ...p, createdAt: new Date(), updatedAt: new Date() })),
      userCount: (role as any).userCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }, [rolesData]);
  
  const selectedRoles = useMemo(() => {
    return availableRoles.filter(role => selectedRoleIds.includes(role.id));
  }, [availableRoles, selectedRoleIds]);
  
  const isLoading = rolesLoading || permissionsLoading;
  const canAddMore = selectedRoleIds.length < maxRoles;
  const hasMinimumRoles = selectedRoleIds.length >= 2;
  
  // Calculate similarity matrix
  const similarityMatrix = useMemo((): RoleSimilarityMap => {
    const matrix: RoleSimilarityMap = {};
    
    selectedRoles.forEach(role1 => {
      matrix[role1.id] = {};
      selectedRoles.forEach(role2 => {
        if (role1.id === role2.id) {
          matrix[role1.id][role2.id] = 1;
        } else {
          matrix[role1.id][role2.id] = calculateSimilarity(role1, role2);
        }
      });
    });
    
    return matrix;
  }, [selectedRoles]);
  
  // Role selection actions
  const selectRole = useCallback((roleId: string) => {
    if (selectedRoleIds.includes(roleId) || !canAddMore) return;
    
    const newSelection = [...selectedRoleIds, roleId];
    setSelectedRoleIds(newSelection);
    setViewState(prev => ({ ...prev, selectedRoles: newSelection }));
    
    if (autoAnalyze && newSelection.length >= 2) {
      setTimeout(() => analyzeRoles(), 100);
    }
  }, [selectedRoleIds, canAddMore, autoAnalyze]);
  
  const unselectRole = useCallback((roleId: string) => {
    const newSelection = selectedRoleIds.filter(id => id !== roleId);
    setSelectedRoleIds(newSelection);
    setViewState(prev => ({ ...prev, selectedRoles: newSelection }));
    
    if (newSelection.length < 2) {
      setComparison(null);
    } else if (autoAnalyze) {
      setTimeout(() => analyzeRoles(), 100);
    }
  }, [selectedRoleIds, autoAnalyze]);
  
  const clearSelection = useCallback(() => {
    setSelectedRoleIds([]);
    setComparison(null);
    setViewState(prev => ({ ...prev, selectedRoles: [] }));
    setError(null);
  }, []);
  
  // Analysis functions
  const analyzeRoles = useCallback(async () => {
    if (selectedRoles.length < 2) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      
      // Build permission matrix
      const permissionMatrix = buildPermissionMatrix(selectedRoles);
      
      // Calculate differences
      const differences = calculatePermissionDifferences(selectedRoles, permissionMatrix);
      
      // Calculate metrics
      const metrics = calculateComparisonMetrics(selectedRoles, permissionMatrix, differences);
      
      // Generate suggestions
      const suggestions = await generateSuggestions(selectedRoles, differences, metrics);
      
      const analysisTime = Date.now() - startTime;
      
      const newComparison: RoleComparison = {
        roles: selectedRoles,
        metrics,
        permissionMatrix,
        differences,
        suggestions,
        timestamp: new Date(),
      };
      
      setComparison(newComparison);
      
      console.log(`Role comparison analysis completed in ${analysisTime}ms`);
    } catch (err) {
      const error: ComparisonError = {
        type: 'analysis',
        message: err instanceof Error ? err.message : 'Analysis failed',
        details: err,
        timestamp: new Date(),
      };
      setError(error);
      console.error('Role comparison analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedRoles]);
  
  // Filter and view actions
  const setFilters = useCallback((newFilters: Partial<ComparisonFilters>) => {
    setViewState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));
  }, []);
  
  const setView = useCallback((view: ComparisonViewState['currentView']) => {
    setViewState(prev => ({ ...prev, currentView: view }));
  }, []);
  
  // Auto-analyze on selection change
  useEffect(() => {
    if (autoAnalyze && hasMinimumRoles) {
      analyzeRoles();
    }
  }, [autoAnalyze, hasMinimumRoles, selectedRoleIds]);
  
  return {
    // State
    comparison,
    selectedRoles,
    availableRoles,
    isLoading,
    isAnalyzing,
    error,
    viewState,
    
    // Actions
    selectRole,
    unselectRole,
    clearSelection,
    analyzeRoles,
    setFilters,
    setView,
    
    // Computed values
    canAddMore,
    hasMinimumRoles,
    similarityMatrix,
  };
}

// Helper functions
function calculateSimilarity(role1: RoleComparisonData, role2: RoleComparisonData): number {
  const permissions1 = new Set(role1.permissions.map(p => `${p.resource}.${p.action}.${p.scope}`));
  const permissions2 = new Set(role2.permissions.map(p => `${p.resource}.${p.action}.${p.scope}`));
  
  const intersection = new Set(Array.from(permissions1).filter(p => permissions2.has(p)));
  const union = new Set([...Array.from(permissions1), ...Array.from(permissions2)]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function buildPermissionMatrix(roles: RoleComparisonData[]): PermissionMatrix {
  const allPermissions = new Map<string, Permission>();
  const rolePermissionMap: Record<string, Record<string, boolean>> = {};
  const categories: Record<string, Permission[]> = {};
  
  // Collect all unique permissions
  roles.forEach(role => {
    rolePermissionMap[role.id] = {};
    
    role.permissions.forEach(permission => {
      const permissionKey = `${permission.resource}.${permission.action}.${permission.scope}`;
      allPermissions.set(permissionKey, permission);
      rolePermissionMap[role.id][permissionKey] = true;
      
      // Group by resource (category)
      if (!categories[permission.resource]) {
        categories[permission.resource] = [];
      }
      if (!categories[permission.resource].find(p => `${p.resource}.${p.action}.${p.scope}` === permissionKey)) {
        categories[permission.resource].push(permission);
      }
    });
  });
  
  // Fill in missing permissions as false
  roles.forEach(role => {
    allPermissions.forEach((_permission, key) => {
      if (!(key in rolePermissionMap[role.id])) {
        rolePermissionMap[role.id][key] = false;
      }
    });
  });
  
  return {
    permissions: Array.from(allPermissions.values()),
    rolePermissionMap,
    categories,
  };
}

function calculatePermissionDifferences(
  roles: RoleComparisonData[],
  matrix: PermissionMatrix
): PermissionDifferences {
  const shared: Permission[] = [];
  const unique: Record<string, Permission[]> = {};
  const missing: Record<string, Permission[]> = {};
  const conflicts: any[] = []; // Simplified for now
  
  // Initialize role maps
  roles.forEach(role => {
    unique[role.id] = [];
    missing[role.id] = [];
  });
  
  // Analyze each permission
  matrix.permissions.forEach((permission, _index) => {
    const permissionKey = `${permission.resource}.${permission.action}.${permission.scope}`;
    const rolesWithPermission = roles.filter(role => matrix.rolePermissionMap[role.id][permissionKey]);
    
    if (rolesWithPermission.length === roles.length) {
      // All roles have this permission
      shared.push(permission);
    } else if (rolesWithPermission.length === 1) {
      // Only one role has this permission
      unique[rolesWithPermission[0].id].push(permission);
    }
    
    // Track missing permissions for each role
    roles.forEach(role => {
      if (!matrix.rolePermissionMap[role.id][permissionKey]) {
        missing[role.id].push(permission);
      }
    });
  });
  
  return { shared, unique, missing, conflicts };
}

function calculateComparisonMetrics(
  roles: RoleComparisonData[],
  matrix: PermissionMatrix,
  differences: PermissionDifferences
): ComparisonMetrics {
  const totalPermissions = matrix.permissions.length;
  const sharedPermissions = differences.shared.length;
  const uniquePermissions = Object.values(differences.unique).reduce((sum, perms) => sum + perms.length, 0);
  
  const permissionsByCategory = Object.entries(matrix.categories).reduce(
    (acc, [category, permissions]) => {
      acc[category] = permissions.length;
      return acc;
    },
    {} as Record<string, number>
  );
  
  // Calculate average similarity score
  const similarities: number[] = [];
  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      similarities.push(calculateSimilarity(roles[i], roles[j]));
    }
  }
  const similarityScore = similarities.length > 0 
    ? similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length 
    : 0;
  
  const coverageGap = totalPermissions > 0 ? (totalPermissions - sharedPermissions) / totalPermissions : 0;
  const overlapCoefficient = similarityScore; // Simplified
  const permissionDensity = roles.length > 0 
    ? roles.reduce((sum, role) => sum + role.permissions.length, 0) / roles.length 
    : 0;
  
  return {
    totalPermissions,
    sharedPermissions,
    uniquePermissions,
    permissionsByCategory,
    similarityScore,
    coverageGap,
    overlapCoefficient,
    permissionDensity,
  };
}

async function generateSuggestions(
  roles: RoleComparisonData[],
  _differences: PermissionDifferences,
  metrics: ComparisonMetrics
): Promise<ComparisonSuggestion[]> {
  const suggestions: ComparisonSuggestion[] = [];
  
  // High similarity suggestion
  if (metrics.similarityScore > 0.8) {
    suggestions.push({
      type: 'consolidation',
      title: 'Consider Role Consolidation',
      description: 'These roles have very similar permissions and could potentially be consolidated.',
      impact: 'medium',
      effort: 'medium',
      affectedRoles: roles.map(r => r.id),
      actionItems: [
        'Review business requirements for separate roles',
        'Identify any unique use cases',
        'Plan migration strategy for affected users',
      ],
      priority: 3,
    });
  }
  
  // Coverage gap suggestion
  if (metrics.coverageGap > 0.5) {
    suggestions.push({
      type: 'gap',
      title: 'Significant Permission Gaps',
      description: 'Large differences in permissions between roles may indicate missing access or over-privileged roles.',
      impact: 'high',
      effort: 'low',
      affectedRoles: roles.map(r => r.id),
      actionItems: [
        'Review permission gaps for each role',
        'Validate business requirements',
        'Update role permissions as needed',
      ],
      priority: 1,
    });
  }
  
  // Low similarity suggestion
  if (metrics.similarityScore < 0.2) {
    suggestions.push({
      type: 'optimization',
      title: 'Roles Are Well Differentiated',
      description: 'These roles have distinct permission sets, which is good for security and clarity.',
      impact: 'low',
      effort: 'low',
      affectedRoles: roles.map(r => r.id),
      actionItems: [
        'Document role differences clearly',
        'Ensure role names reflect their purpose',
        'Regular review to maintain differentiation',
      ],
      priority: 5,
    });
  }
  
  return suggestions.sort((a, b) => a.priority - b.priority);
}

export default useRoleComparison;
