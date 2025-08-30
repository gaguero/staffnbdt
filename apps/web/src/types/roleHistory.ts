export interface RoleAssignmentHistoryEntry {
  id: string;
  timestamp: Date;
  action: 'ASSIGNED' | 'REMOVED' | 'MODIFIED' | 'EXPIRED' | 'BULK_ASSIGNED' | 'BULK_REMOVED';
  userId: string;
  roleId: string;
  userRoleId?: string; // For tracking specific assignment instances
  adminId: string; // Who made the change
  reason?: string;
  context: {
    source: 'manual' | 'bulk' | 'template' | 'migration' | 'automated' | 'system';
    batchId?: string; // For bulk operations
    parentAction?: string; // For related changes
    operationType?: string; // Additional context
  };
  metadata: {
    userDetails: UserSummary;
    roleDetails: RoleSummary;
    adminDetails: UserSummary;
    systemInfo: SystemContext;
  };
  changes?: {
    before: Permission[];
    after: Permission[];
    permissionDiff: PermissionDiff;
  };
  // Compliance fields
  auditTrail: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
  };
  // Tenant context
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role?: string;
  department?: string;
}

export interface RoleSummary {
  id: string;
  name: string;
  description?: string;
  level: number;
  isSystemRole?: boolean;
  permissionCount: number;
  category?: string;
}

export interface SystemContext {
  platform: string;
  version: string;
  environment: 'development' | 'production' | 'staging';
  tenantContext: {
    organizationName?: string;
    propertyName?: string;
    departmentName?: string;
  };
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
}

export interface PermissionDiff {
  added: Permission[];
  removed: Permission[];
  unchanged: Permission[];
  summary: {
    totalAdded: number;
    totalRemoved: number;
    totalUnchanged: number;
    netChange: number;
  };
}

// History filtering and pagination
export interface RoleHistoryFilter {
  // Time filters
  dateFrom?: Date;
  dateTo?: Date;
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d' | 'custom';
  
  // Entity filters
  userIds?: string[];
  roleIds?: string[];
  adminIds?: string[];
  
  // Action filters
  actions?: RoleAssignmentHistoryEntry['action'][];
  sources?: RoleAssignmentHistoryEntry['context']['source'][];
  
  // Tenant filters
  organizationIds?: string[];
  propertyIds?: string[];
  departmentIds?: string[];
  
  // Search
  searchTerm?: string;
  
  // Bulk operation filters
  batchId?: string;
  showBulkOperations?: boolean;
  groupByBatch?: boolean;
  
  // Pagination
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'action' | 'userName' | 'roleName' | 'adminName';
  sortDirection?: 'asc' | 'desc';
}

export interface RoleHistoryResponse {
  entries: RoleAssignmentHistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: RoleHistorySummary;
}

export interface RoleHistorySummary {
  totalEntries: number;
  actionsCount: {
    [K in RoleAssignmentHistoryEntry['action']]: number;
  };
  sourcesCount: {
    [K in RoleAssignmentHistoryEntry['context']['source']]: number;
  };
  periodStats: {
    thisHour: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  topUsers: {
    userId: string;
    userName: string;
    changeCount: number;
  }[];
  topRoles: {
    roleId: string;
    roleName: string;
    changeCount: number;
  }[];
  topAdmins: {
    adminId: string;
    adminName: string;
    changeCount: number;
  }[];
}

// Timeline view types
export interface TimelineEntry extends RoleAssignmentHistoryEntry {
  groupKey?: string; // For grouping related entries
  isGrouped?: boolean;
  groupSize?: number;
}

export interface TimelineGroup {
  groupKey: string;
  timestamp: Date;
  entries: TimelineEntry[];
  summary: {
    action: string;
    affectedUsers: number;
    affectedRoles: number;
    adminName: string;
  };
}

// Analytics types
export interface RoleHistoryAnalytics {
  trends: {
    assignmentVelocity: {
      period: string;
      assignments: number;
      removals: number;
      netChange: number;
    }[];
    rolePopularity: {
      roleId: string;
      roleName: string;
      assignmentCount: number;
      trend: 'up' | 'down' | 'stable';
    }[];
    adminActivity: {
      adminId: string;
      adminName: string;
      actionsCount: number;
      lastActivity: Date;
    }[];
  };
  patterns: {
    bulkOperationFrequency: number;
    averageAssignmentDuration: number;
    peakActivityHours: number[];
    mostCommonReasons: string[];
  };
  compliance: {
    auditCoverage: number; // Percentage of actions with audit trail
    retentionCompliance: number; // Percentage within retention period
    approvalCompliance?: number; // If approval workflow is enabled
    suspiciousPatterns: {
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      count: number;
    }[];
  };
}

// Export types
export interface HistoryExportOptions {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  includeMetadata: boolean;
  includePermissionChanges: boolean;
  includeAuditTrail: boolean;
  dateRange: {
    from: Date;
    to: Date;
  };
  filters: RoleHistoryFilter;
  grouping?: 'none' | 'user' | 'role' | 'admin' | 'batch';
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  error?: string;
}

// Component props types
export interface RoleHistoryDashboardProps {
  initialFilters?: RoleHistoryFilter;
  showAnalytics?: boolean;
  enableExport?: boolean;
  enableRealTimeUpdates?: boolean;
  height?: string;
}

export interface UserRoleHistoryProps {
  userId: string;
  showPermissionChanges?: boolean;
  enableRollback?: boolean;
  maxEntries?: number;
}

export interface RoleAssignmentHistoryProps {
  roleId: string;
  showUserDetails?: boolean;
  groupByTimeframe?: boolean;
  maxEntries?: number;
}

export interface AdminActivityHistoryProps {
  adminId?: string;
  showImpactMetrics?: boolean;
  showSuspiciousActivity?: boolean;
  maxEntries?: number;
}

// Rollback functionality
export interface RollbackOperation {
  historyEntryId: string;
  reason: string;
  confirmationRequired: boolean;
  impactAnalysis: {
    affectedUsers: number;
    affectedRoles: number;
    potentialIssues: string[];
  };
}

export interface RollbackResult {
  success: boolean;
  rollbackEntryId?: string;
  message: string;
  affectedEntries: string[];
  error?: string;
}