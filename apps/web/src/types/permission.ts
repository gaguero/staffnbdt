// Permission-related types for frontend

export interface PermissionEvaluationResult {
  allowed: boolean;
  reason?: string;
  conditions?: any;
  source: 'role' | 'user' | 'cached' | 'default';
  ttl?: number; // Time to live for cache in seconds
}

export interface BulkPermissionResult {
  permissions: Record<string, PermissionEvaluationResult>;
  cached: number;
  evaluated: number;
  errors: string[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  conditions?: any;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserPermissionSummary {
  userId: string;
  roles: CustomRole[];
  permissions: Permission[];
  inheritedPermissions: Permission[];
  directPermissions: Permission[];
  deniedPermissions: Permission[];
  cacheStats: {
    totalCached: number;
    expiredCached: number;
    validCached: number;
  };
}

export interface PermissionCheckDto {
  resource: string;
  action: string;
  scope: string;
  context?: Record<string, any>;
}

export interface BulkPermissionCheckDto {
  permissions: PermissionCheckDto[];
  globalContext?: Record<string, any>;
}

export interface PermissionContext {
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
  resourceId?: string;
  [key: string]: any;
}

// Permission constants for common use cases
export const PERMISSION_RESOURCES = {
  USER: 'user',
  DEPARTMENT: 'department',
  ORGANIZATION: 'organization',
  PROPERTY: 'property',
  DOCUMENT: 'document',
  PAYROLL: 'payroll',
  VACATION: 'vacation',
  TRAINING: 'training',
  BENEFIT: 'benefit',
  AUDIT: 'audit',
} as const;

export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  EXPORT: 'export',
  IMPORT: 'import',
  ASSIGN: 'assign',
  REVOKE: 'revoke',
} as const;

export const PERMISSION_SCOPES = {
  OWN: 'own',
  DEPARTMENT: 'department',
  PROPERTY: 'property',
  ORGANIZATION: 'organization',
  PLATFORM: 'platform',
} as const;

// Type guards for permission checking
export type PermissionResource = typeof PERMISSION_RESOURCES[keyof typeof PERMISSION_RESOURCES];
export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];
export type PermissionScope = typeof PERMISSION_SCOPES[keyof typeof PERMISSION_SCOPES];

// Helper type for permission specification
export interface PermissionSpec {
  resource: PermissionResource | string;
  action: PermissionAction | string;
  scope?: PermissionScope | string;
  context?: PermissionContext;
}

// Common permission combinations
export const COMMON_PERMISSIONS = {
  // User management
  CREATE_USER: { resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.CREATE, scope: PERMISSION_SCOPES.DEPARTMENT },
  VIEW_ALL_USERS: { resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.READ, scope: PERMISSION_SCOPES.DEPARTMENT },
  EDIT_USER: { resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.UPDATE, scope: PERMISSION_SCOPES.DEPARTMENT },
  DELETE_USER: { resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.DELETE, scope: PERMISSION_SCOPES.DEPARTMENT },
  
  // Organization management
  CREATE_ORGANIZATION: { resource: PERMISSION_RESOURCES.ORGANIZATION, action: PERMISSION_ACTIONS.CREATE, scope: PERMISSION_SCOPES.PLATFORM },
  VIEW_ORGANIZATIONS: { resource: PERMISSION_RESOURCES.ORGANIZATION, action: PERMISSION_ACTIONS.READ, scope: PERMISSION_SCOPES.PLATFORM },
  EDIT_ORGANIZATION: { resource: PERMISSION_RESOURCES.ORGANIZATION, action: PERMISSION_ACTIONS.UPDATE, scope: PERMISSION_SCOPES.PLATFORM },
  DELETE_ORGANIZATION: { resource: PERMISSION_RESOURCES.ORGANIZATION, action: PERMISSION_ACTIONS.DELETE, scope: PERMISSION_SCOPES.PLATFORM },
  
  // Property management
  CREATE_PROPERTY: { resource: PERMISSION_RESOURCES.PROPERTY, action: PERMISSION_ACTIONS.CREATE, scope: PERMISSION_SCOPES.ORGANIZATION },
  VIEW_PROPERTIES: { resource: PERMISSION_RESOURCES.PROPERTY, action: PERMISSION_ACTIONS.READ, scope: PERMISSION_SCOPES.ORGANIZATION },
  EDIT_PROPERTY: { resource: PERMISSION_RESOURCES.PROPERTY, action: PERMISSION_ACTIONS.UPDATE, scope: PERMISSION_SCOPES.ORGANIZATION },
  DELETE_PROPERTY: { resource: PERMISSION_RESOURCES.PROPERTY, action: PERMISSION_ACTIONS.DELETE, scope: PERMISSION_SCOPES.ORGANIZATION },
  
  // Department management
  CREATE_DEPARTMENT: { resource: PERMISSION_RESOURCES.DEPARTMENT, action: PERMISSION_ACTIONS.CREATE, scope: PERMISSION_SCOPES.PROPERTY },
  MANAGE_DEPARTMENT: { resource: PERMISSION_RESOURCES.DEPARTMENT, action: PERMISSION_ACTIONS.UPDATE, scope: PERMISSION_SCOPES.DEPARTMENT },
  
  // Document management
  UPLOAD_DOCUMENT: { resource: PERMISSION_RESOURCES.DOCUMENT, action: PERMISSION_ACTIONS.CREATE, scope: PERMISSION_SCOPES.DEPARTMENT },
  VIEW_DOCUMENTS: { resource: PERMISSION_RESOURCES.DOCUMENT, action: PERMISSION_ACTIONS.READ, scope: PERMISSION_SCOPES.DEPARTMENT },
  DELETE_DOCUMENT: { resource: PERMISSION_RESOURCES.DOCUMENT, action: PERMISSION_ACTIONS.DELETE, scope: PERMISSION_SCOPES.DEPARTMENT },
  
  // Payroll management
  VIEW_PAYROLL: { resource: PERMISSION_RESOURCES.PAYROLL, action: PERMISSION_ACTIONS.READ, scope: PERMISSION_SCOPES.OWN },
  MANAGE_PAYROLL: { resource: PERMISSION_RESOURCES.PAYROLL, action: PERMISSION_ACTIONS.UPDATE, scope: PERMISSION_SCOPES.DEPARTMENT },
  EXPORT_PAYROLL: { resource: PERMISSION_RESOURCES.PAYROLL, action: PERMISSION_ACTIONS.EXPORT, scope: PERMISSION_SCOPES.DEPARTMENT },
  
  // Vacation management
  REQUEST_VACATION: { resource: PERMISSION_RESOURCES.VACATION, action: PERMISSION_ACTIONS.CREATE, scope: PERMISSION_SCOPES.OWN },
  APPROVE_VACATION: { resource: PERMISSION_RESOURCES.VACATION, action: PERMISSION_ACTIONS.APPROVE, scope: PERMISSION_SCOPES.DEPARTMENT },
  VIEW_VACATION_REQUESTS: { resource: PERMISSION_RESOURCES.VACATION, action: PERMISSION_ACTIONS.READ, scope: PERMISSION_SCOPES.DEPARTMENT },
  
  // Training management
  VIEW_TRAINING: { resource: PERMISSION_RESOURCES.TRAINING, action: PERMISSION_ACTIONS.READ, scope: PERMISSION_SCOPES.OWN },
  MANAGE_TRAINING: { resource: PERMISSION_RESOURCES.TRAINING, action: PERMISSION_ACTIONS.UPDATE, scope: PERMISSION_SCOPES.DEPARTMENT },
  CREATE_TRAINING: { resource: PERMISSION_RESOURCES.TRAINING, action: PERMISSION_ACTIONS.CREATE, scope: PERMISSION_SCOPES.DEPARTMENT },
  
  // Benefits management
  VIEW_BENEFITS: { resource: PERMISSION_RESOURCES.BENEFIT, action: PERMISSION_ACTIONS.READ, scope: PERMISSION_SCOPES.OWN },
  MANAGE_BENEFITS: { resource: PERMISSION_RESOURCES.BENEFIT, action: PERMISSION_ACTIONS.UPDATE, scope: PERMISSION_SCOPES.PROPERTY },
  
  // Audit logs
  VIEW_AUDIT_LOGS: { resource: PERMISSION_RESOURCES.AUDIT, action: PERMISSION_ACTIONS.READ, scope: PERMISSION_SCOPES.DEPARTMENT },
} as const;

export type CommonPermission = typeof COMMON_PERMISSIONS[keyof typeof COMMON_PERMISSIONS];