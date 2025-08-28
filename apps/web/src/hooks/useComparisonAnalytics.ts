import { useMemo } from 'react';
import {
  RoleComparisonData,
  PermissionMatrix,
  VennDiagramData,
  NetworkGraphData,
  HeatmapData,
  ComparisonMetrics,
} from '../types/roleComparison';

interface UseComparisonAnalyticsProps {
  roles: RoleComparisonData[];
  matrix: PermissionMatrix;
  metrics: ComparisonMetrics;
}

export interface UseComparisonAnalyticsReturn {
  vennDiagramData: VennDiagramData | null;
  networkGraphData: NetworkGraphData | null;
  heatmapData: HeatmapData | null;
  statisticalSummary: StatisticalSummary;
  roleDistanceMatrix: number[][];
  categoryAnalysis: CategoryAnalysis;
}

interface StatisticalSummary {
  meanPermissions: number;
  medianPermissions: number;
  permissionVariance: number;
  maxSimilarity: number;
  minSimilarity: number;
  averageSimilarity: number;
  entropyScore: number;
}

interface CategoryAnalysis {
  categoryOverlap: Record<string, number>;
  categoryDiversity: Record<string, number>;
  criticalGaps: Array<{
    category: string;
    missingRoles: string[];
    impact: 'high' | 'medium' | 'low';
  }>;
}

const ROLE_COLORS = {
  PLATFORM_ADMIN: '#ef4444',
  ORGANIZATION_OWNER: '#a855f7',
  ORGANIZATION_ADMIN: '#6366f1',
  PROPERTY_MANAGER: '#3b82f6',
  DEPARTMENT_ADMIN: '#10b981',
  STAFF: '#6b7280',
  custom: '#8b5cf6',
};

export function useComparisonAnalytics({
  roles,
  matrix,
  metrics: _metrics,
}: UseComparisonAnalyticsProps): UseComparisonAnalyticsReturn {
  // Venn Diagram Data
  const vennDiagramData = useMemo((): VennDiagramData | null => {
    if (roles.length < 2 || roles.length > 3) return null;
    
    const sets = roles.map((role, _index) => ({
      id: role.id,
      label: role.name,
      size: role.permissions.length,
      color: getRoleColor(role),
    }));
    
    const intersections = calculateIntersections(roles, matrix);
    
    return { sets, intersections };
  }, [roles, matrix]);
  
  // Network Graph Data
  const networkGraphData = useMemo((): NetworkGraphData | null => {
    if (roles.length < 2) return null;
    
    const nodes: NetworkGraphData['nodes'] = [];
    const edges: NetworkGraphData['edges'] = [];
    
    // Role nodes
    roles.forEach(role => {
      nodes.push({
        id: role.id,
        label: role.name,
        type: 'role',
        size: Math.max(20, Math.min(60, role.permissions.length * 2)),
        color: getRoleColor(role),
        metadata: {
          permissionCount: role.permissions.length,
          userCount: role.userCount || 0,
          isSystemRole: role.isSystemRole,
        },
      });
    });
    
    // Permission category nodes
    Object.entries(matrix.categories).forEach(([category, _permissions]) => {
      nodes.push({
        id: `category_${category}`,
        label: category,
        type: 'category',
        size: Math.max(15, Math.min(40, permissions.length * 1.5)),
        color: '#e5e7eb',
        metadata: {
          permissionCount: permissions.length,
        },
      });
    });
    
    // Edges between roles (similarity)
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const similarity = calculateRoleSimilarity(roles[i], roles[j]);
        if (similarity > 0.1) {
          edges.push({
            source: roles[i].id,
            target: roles[j].id,
            weight: similarity,
            type: 'similar',
            metadata: { similarity },
          });
        }
      }
    }
    
    // Edges from roles to categories
    roles.forEach(role => {
      Object.entries(matrix.categories).forEach(([category, permissions]) => {
        const rolePermissionsInCategory = role.permissions.filter(
          p => p.resource === category
        ).length;
        
        if (rolePermissionsInCategory > 0) {
          const strength = rolePermissionsInCategory / permissions.length;
          edges.push({
            source: role.id,
            target: `category_${category}`,
            weight: strength,
            type: 'has_permission',
            metadata: {
              permissionCount: rolePermissionsInCategory,
              totalInCategory: permissions.length,
            },
          });
        }
      });
    });
    
    return { nodes, edges };
  }, [roles, matrix]);
  
  // Heatmap Data
  const heatmapData = useMemo((): HeatmapData | null => {
    if (roles.length < 2) return null;
    
    const rows = roles.map(role => role.name);
    const columns = Object.keys(matrix.categories);
    
    const values = roles.map(role => {
      return columns.map(category => {
        const categoryPermissions = matrix.categories[category] || [];
        const rolePermissionsInCategory = role.permissions.filter(
          p => p.resource === category
        ).length;
        
        return categoryPermissions.length > 0 
          ? rolePermissionsInCategory / categoryPermissions.length 
          : 0;
      });
    });
    
    return {
      rows,
      columns,
      values,
      metadata: {
        maxValue: Math.max(...values.flat()),
        minValue: Math.min(...values.flat()),
        categories: matrix.categories,
      },
    };
  }, [roles, matrix]);
  
  // Statistical Summary
  const statisticalSummary = useMemo((): StatisticalSummary => {
    const permissionCounts = roles.map(role => role.permissions.length);
    const meanPermissions = permissionCounts.reduce((sum, count) => sum + count, 0) / permissionCounts.length;
    const sortedCounts = [...permissionCounts].sort((a, b) => a - b);
    const medianPermissions = sortedCounts.length % 2 === 0
      ? (sortedCounts[sortedCounts.length / 2 - 1] + sortedCounts[sortedCounts.length / 2]) / 2
      : sortedCounts[Math.floor(sortedCounts.length / 2)];
    
    const permissionVariance = permissionCounts.reduce(
      (sum, count) => sum + Math.pow(count - meanPermissions, 2),
      0
    ) / permissionCounts.length;
    
    const similarities: number[] = [];
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        similarities.push(calculateRoleSimilarity(roles[i], roles[j]));
      }
    }
    
    const maxSimilarity = similarities.length > 0 ? Math.max(...similarities) : 0;
    const minSimilarity = similarities.length > 0 ? Math.min(...similarities) : 0;
    const averageSimilarity = similarities.length > 0 
      ? similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length 
      : 0;
    
    // Calculate entropy (diversity measure)
    const totalPermissions = roles.reduce((sum, role) => sum + role.permissions.length, 0);
    const entropyScore = totalPermissions > 0 ? calculateEntropy(roles, totalPermissions) : 0;
    
    return {
      meanPermissions,
      medianPermissions,
      permissionVariance,
      maxSimilarity,
      minSimilarity,
      averageSimilarity,
      entropyScore,
    };
  }, [roles]);
  
  // Role Distance Matrix
  const roleDistanceMatrix = useMemo((): number[][] => {
    return roles.map(role1 => 
      roles.map(role2 => 
        role1.id === role2.id ? 0 : 1 - calculateRoleSimilarity(role1, role2)
      )
    );
  }, [roles]);
  
  // Category Analysis
  const categoryAnalysis = useMemo((): CategoryAnalysis => {
    const categoryOverlap: Record<string, number> = {};
    const categoryDiversity: Record<string, number> = {};
    const criticalGaps: CategoryAnalysis['criticalGaps'] = [];
    
    Object.entries(matrix.categories).forEach(([category, _permissions]) => {
      // Calculate overlap - how many roles share permissions in this category
      const rolesWithCategory = roles.filter(role => 
        role.permissions.some(p => p.resource === category)
      );
      categoryOverlap[category] = rolesWithCategory.length / roles.length;
      
      // Calculate diversity - permission distribution across roles
      const permissionCounts = roles.map(role => 
        role.permissions.filter(p => p.resource === category).length
      );
      const maxCount = Math.max(...permissionCounts);
      categoryDiversity[category] = maxCount > 0 
        ? 1 - (permissionCounts.reduce((sum, count) => sum + count, 0) / (roles.length * maxCount))
        : 0;
      
      // Identify critical gaps
      const rolesWithoutCategory = roles.filter(role => 
        !role.permissions.some(p => p.resource === category)
      );
      
      if (rolesWithoutCategory.length > 0 && isBusinessCriticalCategory(category)) {
        criticalGaps.push({
          category,
          missingRoles: rolesWithoutCategory.map(role => role.id),
          impact: getGapImpact(category, rolesWithoutCategory.length, roles.length),
        });
      }
    });
    
    return {
      categoryOverlap,
      categoryDiversity,
      criticalGaps,
    };
  }, [roles, matrix]);
  
  return {
    vennDiagramData,
    networkGraphData,
    heatmapData,
    statisticalSummary,
    roleDistanceMatrix,
    categoryAnalysis,
  };
}

// Helper functions
function getRoleColor(role: RoleComparisonData): string {
  if (role.isSystemRole && role.systemRole) {
    return ROLE_COLORS[role.systemRole] || ROLE_COLORS.custom;
  }
  return ROLE_COLORS.custom;
}

function calculateRoleSimilarity(role1: RoleComparisonData, role2: RoleComparisonData): number {
  const permissions1 = new Set(role1.permissions.map(p => `${p.resource}.${p.action}.${p.scope}`));
  const permissions2 = new Set(role2.permissions.map(p => `${p.resource}.${p.action}.${p.scope}`));
  
  const intersection = new Set([...permissions1].filter(p => permissions2.has(p)));
  const union = new Set([...permissions1, ...permissions2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function calculateIntersections(
  roles: RoleComparisonData[],
  matrix: PermissionMatrix
): VennDiagramData['intersections'] {
  const intersections: VennDiagramData['intersections'] = [];
  
  if (roles.length === 2) {
    const [role1, role2] = roles;
    const sharedPermissions = matrix.permissions.filter(permission => {
      const key = `${permission.resource}.${permission.action}.${permission.scope}`;
      return matrix.rolePermissionMap[role1.id][key] && matrix.rolePermissionMap[role2.id][key];
    });
    
    intersections.push({
      sets: [role1.id, role2.id],
      size: sharedPermissions.length,
      permissions: sharedPermissions,
    });
  } else if (roles.length === 3) {
    const [role1, role2, role3] = roles;
    
    // Pairwise intersections
    [[role1, role2], [role1, role3], [role2, role3]].forEach(([r1, r2]) => {
      const sharedPermissions = matrix.permissions.filter(permission => {
        const key = `${permission.resource}.${permission.action}.${permission.scope}`;
        return matrix.rolePermissionMap[r1.id][key] && matrix.rolePermissionMap[r2.id][key];
      });
      
      intersections.push({
        sets: [r1.id, r2.id],
        size: sharedPermissions.length,
        permissions: sharedPermissions,
      });
    });
    
    // Three-way intersection
    const allSharedPermissions = matrix.permissions.filter(permission => {
      const key = `${permission.resource}.${permission.action}.${permission.scope}`;
      return matrix.rolePermissionMap[role1.id][key] && 
             matrix.rolePermissionMap[role2.id][key] && 
             matrix.rolePermissionMap[role3.id][key];
    });
    
    intersections.push({
      sets: [role1.id, role2.id, role3.id],
      size: allSharedPermissions.length,
      permissions: allSharedPermissions,
    });
  }
  
  return intersections;
}

function calculateEntropy(roles: RoleComparisonData[], totalPermissions: number): number {
  const permissionCounts = roles.map(role => role.permissions.length);
  let entropy = 0;
  
  permissionCounts.forEach(count => {
    if (count > 0) {
      const probability = count / totalPermissions;
      entropy -= probability * Math.log2(probability);
    }
  });
  
  return entropy;
}

function isBusinessCriticalCategory(category: string): boolean {
  const criticalCategories = ['user', 'organization', 'property', 'department', 'payroll'];
  return criticalCategories.includes(category.toLowerCase());
}

function getGapImpact(
  category: string, 
  missingRoleCount: number, 
  totalRoleCount: number
): 'high' | 'medium' | 'low' {
  const missingPercentage = missingRoleCount / totalRoleCount;
  const isCritical = isBusinessCriticalCategory(category);
  
  if (isCritical && missingPercentage > 0.5) return 'high';
  if (isCritical || missingPercentage > 0.7) return 'medium';
  return 'low';
}

export default useComparisonAnalytics;
