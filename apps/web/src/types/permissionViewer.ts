// Permission Viewer specific types
import { Permission, PermissionContext } from './permission';

export interface PermissionTreeNode {
  id: string;
  name: string;
  type: 'resource' | 'action' | 'permission';
  expanded: boolean;
  children: PermissionTreeNode[];
  permission?: Permission;
  count?: number;
  description?: string;
  level: number;
  parentId?: string;
}

export interface PermissionTreeData {
  nodes: Record<string, PermissionTreeNode>;
  rootNodes: string[];
  totalPermissions: number;
  resourceCounts: Record<string, number>;
}

export interface PermissionFilter {
  searchQuery: string;
  selectedResources: string[];
  selectedActions: string[];
  selectedScopes: string[];
  showOnlyUserPermissions: boolean;
  showOnlyRolePermissions: boolean;
}

export interface PermissionViewerOptions {
  showSearch: boolean;
  showFilters: boolean;
  showExport: boolean;
  showPermissionDetails: boolean;
  showRoleContext: boolean;
  showUserContext: boolean;
  multiSelect: boolean;
  expandAll: boolean;
  showCounts: boolean;
  showDescriptions: boolean;
}

export interface PermissionSelection {
  selectedPermissions: Set<string>;
  selectedNodes: Set<string>;
  lastSelected?: string;
}

export interface PermissionExportOptions {
  format: 'json' | 'csv' | 'yaml' | 'markdown';
  includeDescriptions: boolean;
  includeRoleContext: boolean;
  includeUserContext: boolean;
  filterBySelection: boolean;
}

export interface PermissionUsageStats {
  permissionId: string;
  usageCount: number;
  lastUsed?: Date;
  topRoles: Array<{ roleName: string; count: number }>;
  topUsers: Array<{ userName: string; count: number }>;
}

export interface PermissionRelationship {
  permissionId: string;
  relatedPermissions: string[];
  dependencies: string[];
  conflicts: string[];
}

export interface PermissionAnalytics {
  totalPermissions: number;
  permissionsInUse: number;
  unusedPermissions: number;
  mostUsedPermissions: PermissionUsageStats[];
  leastUsedPermissions: PermissionUsageStats[];
  resourceDistribution: Record<string, number>;
  actionDistribution: Record<string, number>;
  scopeDistribution: Record<string, number>;
}

export interface PermissionTestResult {
  permissionId: string;
  resource: string;
  action: string;
  scope: string;
  allowed: boolean;
  reason: string;
  context?: PermissionContext;
  testedAt: Date;
}

export interface PermissionViewerState {
  treeData: PermissionTreeData | null;
  filter: PermissionFilter;
  options: PermissionViewerOptions;
  selection: PermissionSelection;
  isLoading: boolean;
  error: string | null;
  expandedNodes: Set<string>;
  searchResults: string[];
  currentView: 'tree' | 'list' | 'cards';
  sortBy: 'name' | 'usage' | 'scope' | 'resource' | 'action';
  sortOrder: 'asc' | 'desc';
}

// Component props interfaces
export interface PermissionViewerProps {
  permissions?: Permission[];
  options?: Partial<PermissionViewerOptions>;
  onPermissionSelect?: (permission: Permission) => void;
  onBulkSelect?: (permissions: Permission[]) => void;
  onExport?: (permissions: Permission[], format: string) => void;
  className?: string;
  height?: number;
  showToolbar?: boolean;
  showFooter?: boolean;
}

export interface PermissionTreeNodeProps {
  node: PermissionTreeNode;
  level: number;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string, permission?: Permission) => void;
  isSelected: boolean;
  isExpanded: boolean;
  showCheckboxes: boolean;
  showCounts: boolean;
  showDescriptions: boolean;
  className?: string;
}

export interface PermissionSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  suggestions: string[];
  isLoading: boolean;
  className?: string;
}

export interface PermissionFiltersProps {
  filter: PermissionFilter;
  onFilterChange: (filter: Partial<PermissionFilter>) => void;
  availableResources: string[];
  availableActions: string[];
  availableScopes: string[];
  className?: string;
}

export interface PermissionDetailsProps {
  permission: Permission | null;
  usageStats?: PermissionUsageStats;
  relationships?: PermissionRelationship;
  onClose: () => void;
  className?: string;
}

export interface PermissionExportProps {
  permissions: Permission[];
  selectedPermissions: Permission[];
  onExport: (options: PermissionExportOptions) => void;
  className?: string;
}

// Constants for the permission viewer
export const PERMISSION_TREE_CONFIG = {
  DEFAULT_EXPANDED_LEVELS: 1,
  SEARCH_DEBOUNCE_MS: 300,
  VIRTUAL_SCROLL_THRESHOLD: 100,
  MAX_SEARCH_RESULTS: 50,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
} as const;

export const PERMISSION_VIEWER_ICONS = {
  RESOURCE: '📁',
  ACTION: '⚡',
  PERMISSION: '✅',
  EXPANDED: '📂',
  COLLAPSED: '📁',
  LOADING: '⏳',
  ERROR: '❌',
  SEARCH: '🔍',
  FILTER: '🔽',
  EXPORT: '📤',
  SETTINGS: '⚙️',
} as const;

export const RESOURCE_ICONS = {
  user: '👤',
  role: '🎭',
  document: '📄',
  schedule: '📅',
  payroll: '💰',
  vacation: '🏖️',
  analytics: '📊',
  audit: '📋',
  system: '⚙️',
  organization: '🏢',
  property: '🏨',
  department: '🏬',
  training: '🎓',
  benefit: '🎁',
} as const;

export const ACTION_ICONS = {
  create: '➕',
  read: '👁️',
  update: '✏️',
  delete: '🗑️',
  manage: '⚙️',
  approve: '✅',
  reject: '❌',
  export: '📤',
  import: '📥',
  assign: '🔗',
  revoke: '🚫',
} as const;

export const SCOPE_ICONS = {
  platform: '🌐',
  organization: '🏢',
  property: '🏨',
  department: '🏬',
  own: '👤',
} as const;