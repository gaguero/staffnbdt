// Permission Editor types and interfaces
import { Permission, PermissionContext } from './permission';
import { PermissionFilter } from './permissionViewer';

// Local Role enum definition
export enum Role {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',
  STAFF = 'STAFF'
}

export interface PermissionEditorState {
  mode: 'create' | 'edit' | 'view' | 'clone';
  role: RoleConfiguration;
  selectedPermissions: Set<string>;
  availablePermissions: Permission[];
  validationErrors: ValidationError[];
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  searchQuery: string;
  activeCategory: string | null;
  draggedPermission: Permission | null;
  dropZoneActive: boolean;
  lastAction: EditorAction | null;
  undoStack: EditorState[];
  redoStack: EditorState[];
}

export interface RoleConfiguration {
  id?: string;
  name: string;
  displayName?: string;
  description: string;
  level: RoleLevel;
  isCustomRole: boolean;
  permissions: string[];
  conditions: PermissionCondition[];
  metadata: RoleMetadata;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  version: number;
}

export interface RoleMetadata {
  category: string;
  tags: string[];
  color?: string;
  icon?: string;
  isTemplate: boolean;
  templateId?: string;
  usage: RoleUsageStats;
}

export interface RoleUsageStats {
  userCount: number;
  lastUsed?: Date;
  popularityScore: number;
}

export interface PermissionCondition {
  id: string;
  type: 'time-based' | 'location-based' | 'department-based' | 'custom';
  name: string;
  description: string;
  config: Record<string, any>;
  permissions: string[];
  isActive: boolean;
}

export interface ValidationError {
  type: 'error' | 'warning' | 'info';
  field?: string;
  code: string;
  message: string;
  suggestions?: string[];
  permissionIds?: string[];
}

export interface ValidationRule {
  name: string;
  severity: 'error' | 'warning' | 'info';
  check: (permissions: Permission[], role: RoleConfiguration) => ValidationResult;
  autoFix?: (permissions: Permission[], role: RoleConfiguration) => Permission[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationSuggestion {
  type: 'add-permission' | 'remove-permission' | 'add-condition' | 'change-role-level';
  message: string;
  permissionIds?: string[];
  action: () => void;
}

export interface EditorAction {
  type: 'add-permission' | 'remove-permission' | 'update-metadata' | 'change-conditions';
  timestamp: Date;
  data: any;
  undoData: any;
}

export interface EditorState {
  selectedPermissions: Set<string>;
  role: RoleConfiguration;
  timestamp: Date;
}

export interface PermissionCard {
  permission: Permission;
  isSelected: boolean;
  isDragging: boolean;
  isDroppable: boolean;
  conflicts: string[];
  dependencies: string[];
  conditions: PermissionCondition[];
}

export interface CategoryGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  permissions: Permission[];
  count: number;
  selectedCount: number;
  isExpanded: boolean;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  permissions: string[];
  roleLevel: RoleLevel;
  tags: string[];
  popularity: number;
  isSystemTemplate: boolean;
  previewImage?: string;
}

export interface DragDropState {
  isDragging: boolean;
  draggedItem: Permission | null;
  dropTarget: DropTarget | null;
  dropZones: DropZone[];
  validDropTargets: string[];
  dragPreview: DragPreview | null;
}

export interface DropTarget {
  id: string;
  type: 'workspace' | 'category' | 'template' | 'trash';
  accepts: string[];
  isActive: boolean;
  isValid: boolean;
}

export interface DropZone {
  id: string;
  name: string;
  description: string;
  accepts: (permission: Permission) => boolean;
  onDrop: (permission: Permission) => void;
  className: string;
  isActive: boolean;
}

export interface DragPreview {
  permission: Permission;
  position: { x: number; y: number };
  offset: { x: number; y: number };
}

export interface EditorWorkspace {
  selectedPermissions: PermissionCard[];
  groupedByCategory: Record<string, PermissionCard[]>;
  searchResults: PermissionCard[];
  recentlyAdded: PermissionCard[];
  conflicts: PermissionConflict[];
  coverage: CoverageAnalysis;
}

export interface PermissionConflict {
  type: 'mutual-exclusion' | 'hierarchy-violation' | 'scope-mismatch';
  severity: 'error' | 'warning';
  permissions: string[];
  message: string;
  resolution: string;
  autoFixAvailable: boolean;
}

export interface CoverageAnalysis {
  totalPermissions: number;
  selectedPermissions: number;
  coveragePercentage: number;
  missingCriticalPermissions: string[];
  redundantPermissions: string[];
  resourceCoverage: Record<string, number>;
  actionCoverage: Record<string, number>;
  scopeCoverage: Record<string, number>;
}

export interface PermissionPalette {
  categories: CategoryGroup[];
  searchResults: Permission[];
  recentPermissions: Permission[];
  popularPermissions: Permission[];
  recommendations: Permission[];
  filterState: PermissionFilter;
}

export interface RoleComparison {
  baseRole: RoleConfiguration;
  compareRole: RoleConfiguration;
  differences: RoleDifference[];
  similarities: RoleSimilarity[];
  migrationPath: MigrationStep[];
}

export interface RoleDifference {
  type: 'permission-added' | 'permission-removed' | 'metadata-changed';
  field: string;
  baseValue: any;
  compareValue: any;
  impact: 'high' | 'medium' | 'low';
}

export interface RoleSimilarity {
  type: 'shared-permissions' | 'similar-metadata';
  description: string;
  percentage: number;
}

export interface MigrationStep {
  action: 'add' | 'remove' | 'modify';
  target: string;
  description: string;
  impact: string;
  required: boolean;
}

export interface PreviewResult {
  role: RoleConfiguration;
  testCases: TestCase[];
  scenarios: TestScenario[];
  recommendations: string[];
  warnings: string[];
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: string;
  context: PermissionContext;
  expectedResult: boolean;
  actualResult?: boolean;
  passed?: boolean;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  passed: boolean;
  coverage: number;
}

// Enums and constants
export enum RoleLevel {
  PLATFORM = 'platform',
  ORGANIZATION = 'organization', 
  PROPERTY = 'property',
  DEPARTMENT = 'department',
  INDIVIDUAL = 'individual'
}

export enum EditorMode {
  CREATE = 'create',
  EDIT = 'edit',
  VIEW = 'view',
  CLONE = 'clone'
}

export enum PermissionCardSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum DragState {
  IDLE = 'idle',
  DRAGGING = 'dragging',
  OVER_TARGET = 'over-target',
  INVALID_TARGET = 'invalid-target'
}

// Component Props Interfaces
export interface PermissionEditorProps {
  mode: EditorMode;
  roleId?: string;
  templateId?: string;
  onSave: (role: RoleConfiguration) => Promise<void>;
  onCancel: () => void;
  onPreview?: (role: RoleConfiguration) => void;
  className?: string;
  maxHeight?: number;
  showAdvancedFeatures?: boolean;
  allowTemplateCreation?: boolean;
  enableComparison?: boolean;
  context: 'role-management' | 'user-assignment' | 'audit';
}

export interface RoleMetadataEditorProps {
  role: RoleConfiguration;
  onChange: (metadata: Partial<RoleMetadata>) => void;
  errors: ValidationError[];
  className?: string;
  showAdvanced?: boolean;
}

export interface PermissionPaletteProps {
  permissions: Permission[];
  selectedPermissions: Set<string>;
  searchQuery: string;
  activeCategory: string | null;
  onPermissionSelect: (permission: Permission) => void;
  onCategoryChange: (category: string | null) => void;
  onSearchChange: (query: string) => void;
  className?: string;
  showCategories?: boolean;
  showSearch?: boolean;
  showRecommendations?: boolean;
}

export interface PermissionWorkspaceProps {
  permissions: PermissionCard[];
  dragDropState: DragDropState;
  validationErrors: ValidationError[];
  onPermissionRemove: (permissionId: string) => void;
  onPermissionReorder: (fromIndex: number, toIndex: number) => void;
  onDropPermission: (permission: Permission, dropZone: DropZone) => void;
  className?: string;
  layout?: 'grid' | 'list' | 'grouped';
  showConflicts?: boolean;
  showDependencies?: boolean;
}

export interface PermissionCardProps {
  permission: Permission;
  isSelected: boolean;
  isDragging: boolean;
  hasConflicts: boolean;
  hasDependencies: boolean;
  conditions: PermissionCondition[];
  size: PermissionCardSize;
  onSelect: (permission: Permission) => void;
  onRemove: (permissionId: string) => void;
  onShowDetails: (permission: Permission) => void;
  className?: string;
  showTooltip?: boolean;
  showConditions?: boolean;
}

export interface ValidationPanelProps {
  errors: ValidationError[];
  suggestions: ValidationSuggestion[];
  onApplySuggestion: (suggestion: ValidationSuggestion) => void;
  onDismissError: (error: ValidationError) => void;
  className?: string;
  showAutoFix?: boolean;
}

export interface PreviewPanelProps {
  role: RoleConfiguration;
  testResults: PreviewResult;
  onRunTests: () => void;
  onExportRole: () => void;
  className?: string;
  showTestCases?: boolean;
  showScenarios?: boolean;
}

export interface SaveRoleDialogProps {
  role: RoleConfiguration;
  isOpen: boolean;
  onSave: (role: RoleConfiguration) => Promise<void>;
  onCancel: () => void;
  validationErrors: ValidationError[];
  existingRoles: RoleConfiguration[];
  showTemplateOption?: boolean;
}

// Default configurations
export const DEFAULT_ROLE_CONFIGURATION: RoleConfiguration = {
  name: '',
  displayName: '',
  description: '',
  level: RoleLevel.DEPARTMENT,
  isCustomRole: true,
  permissions: [],
  conditions: [],
  metadata: {
    category: 'custom',
    tags: [],
    isTemplate: false,
    usage: {
      userCount: 0,
      popularityScore: 0
    }
  },
  version: 1
};

export const EDITOR_VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'required-fields',
    severity: 'error',
    check: (_permissions, role) => ({
      isValid: !!(role.name && role.description),
      errors: [
        ...(role.name ? [] : [{ type: 'error' as const, field: 'name', code: 'required', message: 'Role name is required' }]),
        ...(role.description ? [] : [{ type: 'error' as const, field: 'description', code: 'required', message: 'Role description is required' }])
      ],
      suggestions: []
    })
  },
  {
    name: 'permission-conflicts',
    severity: 'warning',
    check: (_permissions: Permission[], _role: RoleConfiguration) => {
      const conflicts: ValidationError[] = [];
      // Add conflict detection logic here
      return {
        isValid: conflicts.length === 0,
        errors: conflicts,
        suggestions: []
      };
    }
  }
];

export const PERMISSION_CATEGORIES: Record<string, CategoryGroup> = {
  user: {
    id: 'user',
    name: 'User Management',
    description: 'Permissions for managing users and profiles',
    icon: '👤',
    color: 'blue',
    permissions: [],
    count: 0,
    selectedCount: 0,
    isExpanded: true
  },
  role: {
    id: 'role',
    name: 'Role & Access',
    description: 'Permissions for managing roles and access control',
    icon: '🎭',
    color: 'purple',
    permissions: [],
    count: 0,
    selectedCount: 0,
    isExpanded: true
  },
  document: {
    id: 'document',
    name: 'Documents',
    description: 'Permissions for document management',
    icon: '📄',
    color: 'green',
    permissions: [],
    count: 0,
    selectedCount: 0,
    isExpanded: true
  },
  schedule: {
    id: 'schedule',
    name: 'Scheduling',
    description: 'Permissions for schedule and time management',
    icon: '📅',
    color: 'yellow',
    permissions: [],
    count: 0,
    selectedCount: 0,
    isExpanded: true
  },
  payroll: {
    id: 'payroll',
    name: 'Payroll & Finance',
    description: 'Permissions for payroll and financial operations',
    icon: '💰',
    color: 'emerald',
    permissions: [],
    count: 0,
    selectedCount: 0,
    isExpanded: true
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics & Reports',
    description: 'Permissions for analytics and reporting',
    icon: '📊',
    color: 'indigo',
    permissions: [],
    count: 0,
    selectedCount: 0,
    isExpanded: true
  },
  system: {
    id: 'system',
    name: 'System Administration',
    description: 'Permissions for system-level operations',
    icon: '⚙️',
    color: 'gray',
    permissions: [],
    count: 0,
    selectedCount: 0,
    isExpanded: true
  }
};

export const ROLE_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'front-desk-staff',
    name: 'Front Desk Staff',
    description: 'Standard permissions for front desk operations',
    category: 'hospitality',
    permissions: [
      'user.read.property',
      'schedule.read.own',
      'document.read.department'
    ],
    roleLevel: RoleLevel.DEPARTMENT,
    tags: ['front-desk', 'customer-service'],
    popularity: 95,
    isSystemTemplate: true
  },
  {
    id: 'housekeeping-supervisor',
    name: 'Housekeeping Supervisor',
    description: 'Supervisor-level permissions for housekeeping department',
    category: 'hospitality',
    permissions: [
      'user.read.department',
      'schedule.manage.department',
      'document.create.department'
    ],
    roleLevel: RoleLevel.DEPARTMENT,
    tags: ['housekeeping', 'supervisor'],
    popularity: 85,
    isSystemTemplate: true
  },
  {
    id: 'property-admin',
    name: 'Property Administrator',
    description: 'Administrative permissions for property management',
    category: 'management',
    permissions: [
      'user.manage.property',
      'role.manage.property',
      'analytics.read.property'
    ],
    roleLevel: RoleLevel.PROPERTY,
    tags: ['admin', 'management'],
    popularity: 75,
    isSystemTemplate: true
  }
];

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  FOCUS_SEARCH: '/',
  SAVE_ROLE: 'Ctrl+S',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  PREVIEW: 'Ctrl+P',
  SELECT_ALL: 'Ctrl+A',
  CLEAR_SELECTION: 'Escape',
  TOGGLE_PALETTE: 'Tab',
  DELETE_SELECTED: 'Delete'
} as const;

export const DRAG_TYPES = {
  PERMISSION: 'permission',
  PERMISSION_GROUP: 'permission-group',
  ROLE_TEMPLATE: 'role-template'
} as const;

export const DROP_ZONES = {
  WORKSPACE: 'workspace',
  PALETTE: 'palette',
  TRASH: 'trash',
  CATEGORY: 'category'
} as const;