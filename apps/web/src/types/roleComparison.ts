import { Permission } from './permission';

// Local Role enum definition
export enum Role {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',
  STAFF = 'STAFF'
}

// Core interfaces for role comparison
export interface RoleComparisonData {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  systemRole?: Role;
  permissions: Permission[];
  userCount?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ComparisonMetrics {
  totalPermissions: number;
  sharedPermissions: number;
  uniquePermissions: number;
  permissionsByCategory: Record<string, number>;
  similarityScore: number;
  coverageGap: number;
  overlapCoefficient: number;
  hierarchyDistance?: number;
  usageFrequency?: number;
  permissionDensity: number;
}

export interface RoleComparison {
  roles: RoleComparisonData[];
  metrics: ComparisonMetrics;
  permissionMatrix: PermissionMatrix;
  differences: PermissionDifferences;
  suggestions: ComparisonSuggestion[];
  timestamp: Date;
}

export interface PermissionMatrix {
  permissions: Permission[];
  rolePermissionMap: Record<string, Record<string, boolean>>; // roleId -> permissionId -> hasPermission
  categories: Record<string, Permission[]>;
}

export interface PermissionDifferences {
  shared: Permission[]; // Permissions all roles have
  unique: Record<string, Permission[]>; // roleId -> unique permissions
  missing: Record<string, Permission[]>; // roleId -> permissions others have but this role doesn't
  conflicts: PermissionConflict[];
}

export interface PermissionConflict {
  permission: Permission;
  roles: string[];
  conflictType: 'scope' | 'action' | 'condition';
  details: string;
}

export interface ComparisonSuggestion {
  type: 'consolidation' | 'migration' | 'optimization' | 'hierarchy' | 'gap';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  affectedRoles: string[];
  actionItems: string[];
  priority: number;
}

// Visualization data interfaces
export interface VennDiagramData {
  sets: Array<{
    id: string;
    label: string;
    size: number;
    color: string;
  }>;
  intersections: Array<{
    sets: string[];
    size: number;
    permissions: Permission[];
  }>;
}

export interface NetworkGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: 'role' | 'permission' | 'category';
    size: number;
    color: string;
    metadata: any;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
    type: 'has_permission' | 'inherits' | 'similar';
    metadata: any;
  }>;
}

export interface HeatmapData {
  rows: string[]; // role names
  columns: string[]; // permission names or categories
  values: number[][]; // intensity values (0-1)
  metadata: Record<string, any>;
}

// Comparison configuration
export interface ComparisonConfig {
  maxRoles: number;
  showSystemRoles: boolean;
  showCustomRoles: boolean;
  enableVisualizations: boolean;
  enableExport: boolean;
  enableSuggestions: boolean;
  categoryFilter?: string[];
  scopeFilter?: string[];
  actionFilter?: string[];
  includeUsageStats: boolean;
  includeHierarchy: boolean;
}

// Filter and search interfaces
export interface ComparisonFilters {
  roleTypes: ('system' | 'custom')[];
  categories: string[];
  scopes: string[];
  actions: string[];
  permissionSearch: string;
  roleSearch: string;
  minSimilarity?: number;
  maxSimilarity?: number;
}

export interface RoleSearchResult {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  matchScore: number;
  matchReasons: string[];
}

// Export interfaces
export interface ComparisonExportData {
  comparison: RoleComparison;
  exportFormat: 'pdf' | 'excel' | 'csv' | 'json' | 'markdown';
  includeVisualization: boolean;
  includeRecommendations: boolean;
  includeMetadata: boolean;
}

export interface ComparisonReport {
  title: string;
  summary: string;
  roles: RoleComparisonData[];
  keyFindings: string[];
  recommendations: ComparisonSuggestion[];
  metrics: ComparisonMetrics;
  generatedAt: Date;
  generatedBy?: string;
}

// History and bookmarks
export interface ComparisonHistory {
  id: string;
  name: string;
  roleIds: string[];
  filters: ComparisonFilters;
  createdAt: Date;
  lastAccessed: Date;
  isBookmarked: boolean;
}

// View state interfaces
export type ComparisonView = 'matrix' | 'diff' | 'venn' | 'summary' | 'hierarchy' | 'network';

export interface ComparisonViewState {
  currentView: ComparisonView;
  selectedRoles: string[];
  filters: ComparisonFilters;
  config: ComparisonConfig;
  expandedCategories: string[];
  sortBy: 'name' | 'similarity' | 'permissions' | 'usage';
  sortOrder: 'asc' | 'desc';
  showAdvancedOptions: boolean;
}

// Analytics interfaces
export interface ComparisonAnalytics {
  totalComparisons: number;
  mostComparedRoles: Array<{ roleId: string; count: number }>;
  popularFilters: Array<{ filter: string; count: number }>;
  averageComparisonTime: number;
  exportFrequency: Record<string, number>;
}

// Utility types
export type RoleSimilarityMap = Record<string, Record<string, number>>;
export type PermissionCategoryMap = Record<string, Permission[]>;
export type RoleHierarchyMap = Record<string, string[]>; // roleId -> parent role IDs

// Error handling
export interface ComparisonError {
  type: 'data_load' | 'permission_check' | 'analysis' | 'export' | 'visualization';
  message: string;
  details?: any;
  timestamp: Date;
}

// Performance tracking
export interface ComparisonPerformance {
  dataLoadTime: number;
  analysisTime: number;
  renderTime: number;
  totalTime: number;
  cacheHits: number;
  cacheMisses: number;
}
