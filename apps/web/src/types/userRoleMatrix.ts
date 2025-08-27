import { User } from '../services/userService';
import { Role, UserRole } from '../services/roleService';
import { Role as SystemRole } from '../../../packages/types/enums';

// Core matrix data structures
export interface MatrixUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  department?: {
    id: string;
    name: string;
  };
  status: 'active' | 'inactive';
  assignedRoles: UserRoleAssignment[];
}

export interface MatrixRole {
  id: string;
  name: string;
  description: string;
  level: number;
  isSystemRole: boolean;
  systemRole?: SystemRole;
  userCount: number;
  permissions?: Permission[];
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
}

// Matrix state and operations
export interface UserRoleMatrixState {
  users: MatrixUser[];
  roles: MatrixRole[];
  assignments: Map<string, Set<string>>; // userId -> Set of roleIds
  loading: boolean;
  error: string | null;
  filters: MatrixFilters;
  bulkSelection: BulkSelection;
}

export interface MatrixFilters {
  search: string;
  departmentId?: string;
  roleFilter?: string;
  statusFilter: 'all' | 'active' | 'inactive';
  roleTypeFilter: 'all' | 'system' | 'custom';
}

export interface BulkSelection {
  selectedUsers: Set<string>;
  selectedRoles: Set<string>;
  mode: 'none' | 'users' | 'roles' | 'both';
}

// Operation types
export interface RoleAssignmentOperation {
  type: 'assign' | 'unassign';
  userId: string;
  roleId: string;
  previousAssignment?: UserRoleAssignment;
}

export interface BulkOperation {
  type: 'bulk_assign' | 'bulk_unassign' | 'bulk_replace';
  userIds: string[];
  roleIds: string[];
  operations: RoleAssignmentOperation[];
}

export interface MatrixOperationResult {
  success: boolean;
  operations: RoleAssignmentOperation[];
  errors: string[];
  warnings: string[];
  rollbackData?: any;
}

// Virtualization support
export interface VirtualizedMatrixProps {
  visibleUsers: MatrixUser[];
  visibleRoles: MatrixRole[];
  startUserIndex: number;
  endUserIndex: number;
  userHeight: number;
  containerHeight: number;
  scrollOffset: number;
}

// Audit and history
export interface AssignmentAudit {
  id: string;
  userId: string;
  roleId: string;
  action: 'assigned' | 'unassigned' | 'modified';
  performedBy: string;
  performedAt: Date;
  reason?: string;
  previousState?: any;
  newState?: any;
}

// Filter and search types
export interface SearchConfiguration {
  searchFields: (keyof MatrixUser)[];
  fuzzySearch: boolean;
  highlightMatches: boolean;
  debounceMs: number;
}

export interface FilterConfiguration {
  showSystemRoles: boolean;
  showCustomRoles: boolean;
  groupByDepartment: boolean;
  sortBy: 'name' | 'department' | 'roleCount' | 'lastModified';
  sortOrder: 'asc' | 'desc';
}

// Performance optimization types
export interface MatrixPerformanceConfig {
  virtualScrolling: boolean;
  batchSize: number;
  debounceMs: number;
  cacheTimeout: number;
  maxVisibleUsers: number;
  maxVisibleRoles: number;
}

// Component props
export interface UserRoleMatrixProps {
  users?: MatrixUser[];
  roles?: MatrixRole[];
  assignments?: UserRoleAssignment[];
  onAssignRole?: (userId: string, roleId: string) => Promise<void>;
  onUnassignRole?: (userId: string, roleId: string) => Promise<void>;
  onBulkAssign?: (userIds: string[], roleIds: string[]) => Promise<void>;
  onBulkUnassign?: (userIds: string[], roleIds: string[]) => Promise<void>;
  permissions?: {
    canAssignRoles: boolean;
    canUnassignRoles: boolean;
    canViewAuditLog: boolean;
    canBulkAssign: boolean;
  };
  configuration?: {
    search: SearchConfiguration;
    filters: FilterConfiguration;
    performance: MatrixPerformanceConfig;
  };
  className?: string;
}

export interface UserRoleMatrixRowProps {
  user: MatrixUser;
  roles: MatrixRole[];
  assignments: Set<string>;
  onToggleRole: (userId: string, roleId: string, isAssigned: boolean) => void;
  onUserSelect: (userId: string, selected: boolean) => void;
  isUserSelected: boolean;
  selectedRoles: Set<string>;
  isOptimistic?: boolean;
  permissions: {
    canAssignRoles: boolean;
    canUnassignRoles: boolean;
  };
}

export interface UserRoleMatrixHeaderProps {
  roles: MatrixRole[];
  selectedUsers: Set<string>;
  selectedRoles: Set<string>;
  onRoleSelect: (roleId: string, selected: boolean) => void;
  onSelectAllUsers: () => void;
  onSelectAllRoles: () => void;
  userCount: number;
  permissions: {
    canBulkAssign: boolean;
  };
}

export interface BulkActionBarProps {
  selectedUsers: Set<string>;
  selectedRoles: Set<string>;
  onBulkAssign: () => void;
  onBulkUnassign: () => void;
  onClearSelection: () => void;
  isLoading: boolean;
  className?: string;
}

// Hook return types
export interface UseUserRoleMatrixReturn {
  state: UserRoleMatrixState;
  actions: {
    toggleRole: (userId: string, roleId: string) => Promise<void>;
    bulkAssignRoles: (userIds: string[], roleIds: string[]) => Promise<void>;
    bulkUnassignRoles: (userIds: string[], roleIds: string[]) => Promise<void>;
    selectUser: (userId: string, selected: boolean) => void;
    selectRole: (roleId: string, selected: boolean) => void;
    selectAllUsers: () => void;
    selectAllRoles: () => void;
    clearSelection: () => void;
    updateFilters: (filters: Partial<MatrixFilters>) => void;
    refreshData: () => Promise<void>;
    undoLastOperation: () => Promise<void>;
  };
  utils: {
    isRoleAssigned: (userId: string, roleId: string) => boolean;
    getUserRoleCount: (userId: string) => number;
    getRoleUserCount: (roleId: string) => number;
    getFilteredUsers: () => MatrixUser[];
    getFilteredRoles: () => MatrixRole[];
    canAssignRole: (userId: string, roleId: string) => boolean;
    canUnassignRole: (userId: string, roleId: string) => boolean;
  };
}

// Error types
export interface MatrixError {
  code: string;
  message: string;
  details?: any;
  recovery?: () => void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Analytics types
export interface MatrixAnalytics {
  totalUsers: number;
  totalRoles: number;
  totalAssignments: number;
  avgRolesPerUser: number;
  avgUsersPerRole: number;
  mostAssignedRoles: { roleId: string; count: number }[];
  usersWithMostRoles: { userId: string; count: number }[];
  recentAssignments: AssignmentAudit[];
}
