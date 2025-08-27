// Main dashboard component
export { RoleHistoryDashboard } from './RoleHistoryDashboard';

// Core history display components
export { SystemRoleHistory } from './SystemRoleHistory';
export { HistoryTimeline } from './HistoryTimeline';
export { UserRoleHistory } from './UserRoleHistory';
export { RoleAssignmentHistory } from './RoleAssignmentHistory';
export { AdminActivityHistory } from './AdminActivityHistory';
export { BulkOperationHistory } from './BulkOperationHistory';

// Filter and utility components
export { HistoryFilters } from './HistoryFilters';
export { HistoryExport } from './HistoryExport';
export { HistoryAnalytics } from './HistoryAnalytics';

// Re-export types for convenience
export type {
  RoleHistoryDashboardProps,
  UserRoleHistoryProps,
  RoleAssignmentHistoryProps,
  AdminActivityHistoryProps,
  RoleAssignmentHistoryEntry,
  RoleHistoryFilter,
  RoleHistoryResponse,
  RoleHistoryAnalytics,
  HistoryExportOptions,
  ExportResult,
  RollbackOperation,
  RollbackResult,
} from '../../types/roleHistory';