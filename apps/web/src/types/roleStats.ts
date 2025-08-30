export interface RoleStatistics {
  totalRoles: number;
  totalAssignments: number;
  assignmentsByRole: Record<string, number>;
  assignmentsByLevel: Record<string, number>;
  recentAssignments: RecentAssignment[];
}

export interface RecentAssignment {
  id: string;
  userId: string;
  roleId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  role: {
    id: string;
    name: string;
    description: string;
    level: number;
    permissions: Permission[];
    userCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  assignedAt: Date;
  assignedBy: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
}

export interface AnalyticsMetrics {
  systemHealthScore: number;
  roleCoverage: number;
  permissionUtilization: number;
  assignmentAccuracy: number;
  securityScore: number;
  optimizationScore: number;
}

export interface RoleUsageData {
  roleId: string;
  roleName: string;
  userCount: number;
  level: number;
  permissions: number;
  lastAssignment: Date;
  trend: 'up' | 'down' | 'stable';
}

export interface PermissionUsageData {
  permissionId: string;
  resource: string;
  action: string;
  scope: string;
  usageCount: number;
  rolesUsingIt: number;
  lastUsed: Date;
  intensity: 'high' | 'medium' | 'low' | 'unused';
}

export interface AssignmentTrendData {
  date: string;
  assignments: number;
  revocations: number;
  modifications: number;
  netChange: number;
}

export interface SecurityMetrics {
  overPrivilegedUsers: number;
  underPrivilegedUsers: number;
  redundantRoles: number;
  orphanedPermissions: number;
  riskScore: number;
  complianceScore: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'consolidation' | 'permissions' | 'redundancy' | 'security' | 'efficiency' | 'compliance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  affectedRoles: string[];
  affectedUsers: number;
  estimatedBenefit: string;
  actionItems: string[];
}

export interface UserBehaviorMetrics {
  mostActiveAssigners: Array<{
    userId: string;
    name: string;
    assignmentsCount: number;
    avgTimeToAssign: number;
  }>;
  assignmentPatterns: Array<{
    timeOfDay: number;
    dayOfWeek: number;
    assignmentCount: number;
  }>;
  rolePopularity: Array<{
    roleId: string;
    roleName: string;
    requestCount: number;
    fulfillmentRate: number;
  }>;
}

export interface GeographicDistribution {
  organizationId: string;
  organizationName: string;
  propertyId?: string;
  propertyName?: string;
  roleDistribution: Record<string, number>;
  totalUsers: number;
  assignmentDensity: number;
}

export interface NetworkGraphData {
  nodes: Array<{
    id: string;
    name: string;
    type: 'role' | 'permission' | 'user';
    level?: number;
    count?: number;
    size: number;
    color: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    weight: number;
    type: 'role-permission' | 'user-role';
  }>;
}

export interface HeatmapData {
  resources: string[];
  scopes: string[];
  matrix: Array<{
    resource: string;
    scope: string;
    value: number;
    roleCount: number;
    userCount: number;
  }>;
}

export interface ComprehensiveRoleAnalytics {
  executiveSummary: AnalyticsMetrics;
  roleAnalytics: {
    usage: RoleUsageData[];
    trends: AssignmentTrendData[];
    distribution: Record<string, number>;
  };
  permissionAnalytics: {
    usage: PermissionUsageData[];
    coverage: HeatmapData;
    gaps: string[];
  };
  userAnalytics: {
    behavior: UserBehaviorMetrics;
    satisfaction: number;
    engagement: number;
  };
  securityDashboard: SecurityMetrics;
  optimizationRecommendations: OptimizationRecommendation[];
  geographicAnalysis: GeographicDistribution[];
  networkGraph: NetworkGraphData;
  timeSeriesData: AssignmentTrendData[];
}

export interface DashboardFilters {
  timeRange: {
    start: Date;
    end: Date;
    preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  };
  organizationId?: string;
  propertyId?: string;
  roleTypes?: ('system' | 'custom')[];
  departments?: string[];
}

export interface ChartConfiguration {
  type: 'pie' | 'bar' | 'line' | 'area' | 'heatmap' | 'network' | 'scatter';
  interactive: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'viridis' | 'categorical';
  animation: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'xlsx' | 'png' | 'svg';
  includeCharts: boolean;
  includeRawData: boolean;
  timeRange?: DashboardFilters['timeRange'];
  sections?: string[];
}