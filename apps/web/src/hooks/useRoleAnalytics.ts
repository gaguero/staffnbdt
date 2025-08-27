import { useQuery, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import { DashboardFilters, ComprehensiveRoleAnalytics } from '../types/roleStats';
import { useMemo } from 'react';

// Query Keys for Analytics
export const analyticsQueryKeys = {
  all: ['role-analytics'] as const,
  comprehensive: (filters?: DashboardFilters) => 
    [...analyticsQueryKeys.all, 'comprehensive', filters] as const,
  permissions: (filters?: DashboardFilters) => 
    [...analyticsQueryKeys.all, 'permissions', filters] as const,
  trends: (filters?: DashboardFilters) => 
    [...analyticsQueryKeys.all, 'trends', filters] as const,
  security: (filters?: DashboardFilters) => 
    [...analyticsQueryKeys.all, 'security', filters] as const,
  optimization: (filters?: DashboardFilters) => 
    [...analyticsQueryKeys.all, 'optimization', filters] as const,
  realtime: () => [...analyticsQueryKeys.all, 'realtime'] as const,
};

// Main comprehensive analytics hook
export function useRoleAnalytics(filters?: DashboardFilters) {
  return useQuery({
    queryKey: analyticsQueryKeys.comprehensive(filters),
    queryFn: () => roleService.getComprehensiveAnalytics(filters),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
  });
}

// Permission analytics
export function usePermissionAnalytics(filters?: DashboardFilters) {
  return useQuery({
    queryKey: analyticsQueryKeys.permissions(filters),
    queryFn: () => roleService.getPermissionAnalytics(filters),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Assignment trends
export function useAssignmentTrends(filters?: DashboardFilters) {
  return useQuery({
    queryKey: analyticsQueryKeys.trends(filters),
    queryFn: () => roleService.getAssignmentTrends(filters),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Security metrics
export function useSecurityMetrics(filters?: DashboardFilters) {
  return useQuery({
    queryKey: analyticsQueryKeys.security(filters),
    queryFn: () => roleService.getSecurityMetrics(filters),
    select: (data) => data.data,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Optimization recommendations
export function useOptimizationRecommendations(filters?: DashboardFilters) {
  return useQuery({
    queryKey: analyticsQueryKeys.optimization(filters),
    queryFn: () => roleService.getOptimizationRecommendations(filters),
    select: (data) => data.data,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Real-time statistics
export function useRealTimeStats() {
  return useQuery({
    queryKey: analyticsQueryKeys.realtime(),
    queryFn: () => roleService.getRealTimeStats(),
    select: (data) => data.data,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    staleTime: 20 * 1000, // Consider stale after 20 seconds
  });
}

// Combined dashboard data hook
export function useDashboardData(filters?: DashboardFilters) {
  const comprehensiveData = useRoleAnalytics(filters);
  const permissionData = usePermissionAnalytics(filters);
  const trendsData = useAssignmentTrends(filters);
  const securityData = useSecurityMetrics(filters);
  const optimizationData = useOptimizationRecommendations(filters);
  const realTimeData = useRealTimeStats();

  const isLoading = useMemo(() => 
    comprehensiveData.isLoading || 
    permissionData.isLoading || 
    trendsData.isLoading || 
    securityData.isLoading || 
    optimizationData.isLoading ||
    realTimeData.isLoading
  , [comprehensiveData.isLoading, permissionData.isLoading, trendsData.isLoading, securityData.isLoading, optimizationData.isLoading, realTimeData.isLoading]);

  const hasError = useMemo(() => 
    comprehensiveData.error || 
    permissionData.error || 
    trendsData.error || 
    securityData.error || 
    optimizationData.error ||
    realTimeData.error
  , [comprehensiveData.error, permissionData.error, trendsData.error, securityData.error, optimizationData.error, realTimeData.error]);

  return {
    comprehensive: comprehensiveData.data,
    permissions: permissionData.data,
    trends: trendsData.data,
    security: securityData.data,
    optimization: optimizationData.data,
    realTime: realTimeData.data,
    isLoading,
    hasError,
    refetch: () => {
      comprehensiveData.refetch();
      permissionData.refetch();
      trendsData.refetch();
      securityData.refetch();
      optimizationData.refetch();
      realTimeData.refetch();
    },
  };
}

// Analytics calculations hook
export function useAnalyticsCalculations(data?: ComprehensiveRoleAnalytics) {
  return useMemo(() => {
    if (!data) return null;

    // Calculate system health score
    const calculateHealthScore = () => {
      const { executiveSummary } = data;
      return Math.round(
        (executiveSummary.roleCoverage * 0.3 +
         executiveSummary.permissionUtilization * 0.25 +
         executiveSummary.assignmentAccuracy * 0.2 +
         executiveSummary.securityScore * 0.15 +
         executiveSummary.optimizationScore * 0.1) * 100
      ) / 100;
    };

    // Calculate role efficiency
    const calculateRoleEfficiency = () => {
      const { roleAnalytics } = data;
      const totalRoles = roleAnalytics.usage.length;
      const activeRoles = roleAnalytics.usage.filter(role => role.userCount > 0).length;
      return totalRoles > 0 ? Math.round((activeRoles / totalRoles) * 100) : 0;
    };

    // Calculate permission coverage
    const calculatePermissionCoverage = () => {
      const { permissionAnalytics } = data;
      const totalPermissions = permissionAnalytics.usage.length;
      const usedPermissions = permissionAnalytics.usage.filter(perm => perm.usageCount > 0).length;
      return totalPermissions > 0 ? Math.round((usedPermissions / totalPermissions) * 100) : 0;
    };

    // Calculate assignment velocity (assignments per day)
    const calculateAssignmentVelocity = () => {
      const { timeSeriesData } = data;
      if (timeSeriesData.length < 2) return 0;
      
      const totalAssignments = timeSeriesData.reduce((sum, day) => sum + day.assignments, 0);
      return Math.round(totalAssignments / timeSeriesData.length);
    };

    // Risk assessment
    const calculateRiskLevel = () => {
      const { securityDashboard } = data;
      if (securityDashboard.riskScore >= 80) return 'high';
      if (securityDashboard.riskScore >= 50) return 'medium';
      return 'low';
    };

    // Top insights
    const generateTopInsights = () => {
      const insights = [];
      
      if (calculateRoleEfficiency() < 70) {
        insights.push({
          type: 'warning',
          message: `${100 - calculateRoleEfficiency()}% of roles are unused`,
          action: 'Review and consolidate inactive roles'
        });
      }
      
      if (data.securityDashboard.overPrivilegedUsers > 0) {
        insights.push({
          type: 'error',
          message: `${data.securityDashboard.overPrivilegedUsers} users have excessive permissions`,
          action: 'Review and reduce over-privileged access'
        });
      }
      
      if (calculatePermissionCoverage() < 60) {
        insights.push({
          type: 'info',
          message: `${100 - calculatePermissionCoverage()}% of permissions are unused`,
          action: 'Consider removing or archiving unused permissions'
        });
      }
      
      return insights.slice(0, 5); // Top 5 insights
    };

    return {
      healthScore: calculateHealthScore(),
      roleEfficiency: calculateRoleEfficiency(),
      permissionCoverage: calculatePermissionCoverage(),
      assignmentVelocity: calculateAssignmentVelocity(),
      riskLevel: calculateRiskLevel(),
      topInsights: generateTopInsights(),
      rawData: data,
    };
  }, [data]);
}

// Refresh dashboard data
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  
  return {
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.all });
    },
    refreshComprehensive: (filters?: DashboardFilters) => {
      queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.comprehensive(filters) });
    },
    refreshRealTime: () => {
      queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.realtime() });
    },
  };
}