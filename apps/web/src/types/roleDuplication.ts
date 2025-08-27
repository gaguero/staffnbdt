import { Role } from '../services/roleService';
import { Permission } from './permission';

/**
 * Types for Role Duplication System
 */

export type CloneType = 
  | 'full'        // Copy everything exactly
  | 'permissions' // Copy only permissions, reset metadata
  | 'template'    // Create template with suggested modifications
  | 'partial'     // Select specific aspects to copy
  | 'hierarchy';  // Clone with hierarchy-appropriate adjustments

export interface CloneConfiguration {
  sourceRoleId: string;
  cloneType: CloneType;
  newMetadata: {
    name: string;
    description: string;
    level: number;
    category?: string;
    tags?: string[];
  };
  permissionFilters: {
    includeCategories: string[];
    excludeCategories: string[];
    includeScopes: string[];
    excludeScopes: string[];
    customSelections: string[]; // specific permission IDs
  };
  scopeAdjustments: Record<string, string>; // permission scope modifications
  conditions?: any; // conditional permissions to apply
  preserveLineage: boolean; // track parent-child relationships
  inheritanceRules?: {
    copyUserAssignments: boolean;
    adjustLevel: boolean;
    autoSuggestLevel: boolean;
  };
}

export interface ClonePreview {
  sourceRole: Role;
  targetConfiguration: CloneConfiguration;
  resultingPermissions: Permission[];
  addedPermissions: Permission[];
  removedPermissions: Permission[];
  modifiedPermissions: Permission[];
  validationErrors: string[];
  validationWarnings: string[];
  suggestedImprovements: string[];
  estimatedLevel: number;
  conflictAnalysis: {
    namingConflicts: string[];
    permissionConflicts: string[];
    hierarchyConflicts: string[];
  };
}

export interface RoleLineage {
  id: string;
  name: string;
  parentRoleId?: string;
  parentRole?: RoleLineage;
  childRoles: RoleLineage[];
  clonedFrom?: string;
  clonedAt?: Date;
  cloneType?: CloneType;
  generationLevel: number; // 0 = original, 1 = first clone, etc.
  cloneCount: number; // how many times this role has been cloned
  lineagePath: string[]; // path from root ancestor
}

export interface CloneBatchConfig {
  sourceRoles: string[];
  batchType: 'variations' | 'departments' | 'properties' | 'regions';
  namePattern: string; // e.g., "{sourceName} - {department}"
  variations: Array<{
    name: string;
    adjustments: Partial<CloneConfiguration>;
  }>;
  globalAdjustments: Partial<CloneConfiguration>;
}

export interface CloneTemplate {
  id: string;
  name: string;
  description: string;
  sourceRoleId: string;
  configuration: CloneConfiguration;
  usage: {
    timesUsed: number;
    lastUsed?: Date;
    successRate: number;
  };
  tags: string[];
  category: 'department' | 'hierarchy' | 'specialized' | 'property' | 'custom';
  isRecommended: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface DuplicationStats {
  totalClones: number;
  clonesByType: Record<CloneType, number>;
  popularSourceRoles: Array<{
    roleId: string;
    roleName: string;
    cloneCount: number;
  }>;
  recentActivity: Array<{
    sourceRoleId: string;
    sourceRoleName: string;
    targetRoleName: string;
    cloneType: CloneType;
    clonedAt: Date;
    clonedBy: string;
  }>;
  templateUsage: Array<{
    templateId: string;
    templateName: string;
    timesUsed: number;
    successRate: number;
  }>;
}

export interface CloneValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  suggestions: Array<{
    type: 'name' | 'description' | 'permissions' | 'level';
    message: string;
    autoApplicable: boolean;
    action?: () => void;
  }>;
  conflicts: Array<{
    type: 'naming' | 'permissions' | 'hierarchy';
    message: string;
    resolution: string;
  }>;
}

export interface SmartCloneRecommendation {
  recommendationType: 'level_adjustment' | 'permission_addition' | 'permission_removal' | 'name_suggestion';
  confidence: number; // 0-1
  explanation: string;
  suggestedValue: any;
  reasoning: string;
  isAutoApplicable: boolean;
}

export interface RoleDuplicationContext {
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
  userId: string;
  permissions: string[];
  availableRoles: Role[];
  existingNames: string[];
  hierarchyConstraints: {
    minLevel: number;
    maxLevel: number;
    allowedCategories: string[];
  };
}

/**
 * Hook return types
 */
export interface UseRoleDuplicationReturn {
  // State
  isCloning: boolean;
  clonePreview: ClonePreview | null;
  validationResult: CloneValidationResult | null;
  recommendations: SmartCloneRecommendation[];
  
  // Actions
  startClone: (sourceRoleId: string, initialConfig?: Partial<CloneConfiguration>) => void;
  updateConfiguration: (config: Partial<CloneConfiguration>) => void;
  generatePreview: () => Promise<ClonePreview>;
  validateConfiguration: () => Promise<CloneValidationResult>;
  executeClone: () => Promise<Role>;
  cancelClone: () => void;
  
  // Recommendations
  applyRecommendation: (recommendation: SmartCloneRecommendation) => void;
  getSmartSuggestions: () => SmartCloneRecommendation[];
  
  // Batch operations
  startBatchClone: (config: CloneBatchConfig) => void;
  executeBatchClone: () => Promise<Role[]>;
}

export interface UseRoleLineageReturn {
  // State
  lineage: RoleLineage | null;
  isLoading: boolean;
  error: string | null;
  
  // Data
  ancestors: RoleLineage[];
  descendants: RoleLineage[];
  siblings: RoleLineage[];
  lineageTree: RoleLineage;
  
  // Actions
  loadLineage: (roleId: string) => Promise<void>;
  refreshLineage: () => Promise<void>;
  
  // Utilities
  getRoleGeneration: (roleId: string) => number;
  getCloneHistory: (roleId: string) => Array<{
    clonedRole: RoleLineage;
    clonedAt: Date;
    cloneType: CloneType;
  }>;
  isAncestor: (potentialAncestor: string, descendant: string) => boolean;
  isDescendant: (potentialDescendant: string, ancestor: string) => boolean;
}

/**
 * Event types for role duplication
 */
export interface RoleCloneEvent {
  type: 'clone_started' | 'clone_completed' | 'clone_failed' | 'clone_cancelled';
  sourceRoleId: string;
  targetRoleId?: string;
  cloneType: CloneType;
  configuration: CloneConfiguration;
  timestamp: Date;
  userId: string;
  metadata?: Record<string, any>;
}

export interface BulkCloneEvent {
  type: 'bulk_clone_started' | 'bulk_clone_completed' | 'bulk_clone_progress';
  batchId: string;
  totalRoles: number;
  completedRoles: number;
  failedRoles: number;
  configuration: CloneBatchConfig;
  timestamp: Date;
  userId: string;
}

/**
 * Component prop types
 */
export interface RoleDuplicatorProps {
  sourceRole: Role;
  onCloneComplete: (clonedRole: Role) => void;
  onCancel: () => void;
  initialConfiguration?: Partial<CloneConfiguration>;
  context?: RoleDuplicationContext;
  showAdvancedOptions?: boolean;
  enableBatchCloning?: boolean;
  className?: string;
}

export interface CloneOptionsDialogProps {
  isOpen: boolean;
  sourceRole: Role;
  onConfirm: (configuration: CloneConfiguration) => void;
  onCancel: () => void;
  initialConfiguration?: Partial<CloneConfiguration>;
  showPreview?: boolean;
  enableSmartSuggestions?: boolean;
}

export interface BulkCloneDialogProps {
  isOpen: boolean;
  sourceRoles: Role[];
  onConfirm: (config: CloneBatchConfig) => void;
  onCancel: () => void;
  templates?: CloneTemplate[];
  maxBatchSize?: number;
}

export interface ClonePreviewProps {
  preview: ClonePreview;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  showDetailedDiff?: boolean;
  showValidationDetails?: boolean;
  className?: string;
}

export interface RoleLineageTreeProps {
  rootRole: RoleLineage;
  selectedRoleId?: string;
  onRoleSelect?: (role: RoleLineage) => void;
  onCloneRole?: (role: RoleLineage) => void;
  showCloneActions?: boolean;
  maxDepth?: number;
  className?: string;
}
