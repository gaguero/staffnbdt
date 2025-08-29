import { Permission, CustomRole, PermissionCondition, PermissionCache } from '@prisma/client';

export interface PermissionEvaluationContext {
  userId: string;
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
  resource?: string;
  resourceId?: string;
  targetOrganizationId?: string; // For cross-org access validation
  enabledModules?: string[]; // For module-aware permission checks
  userType?: string; // For user type specific permissions
  currentTime?: Date;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface PermissionEvaluationResult {
  allowed: boolean;
  reason?: string;
  conditions?: any;
  source: 'role' | 'user' | 'cached' | 'default' | 'legacy' | 'validation';
  ttl?: number; // Time to live for cache in seconds
  moduleRestrictions?: string[]; // Modules that restrict this permission
  crossOrgAccess?: boolean; // Whether cross-org access was required
}

export interface CachedPermission {
  userId: string;
  organizationId?: string;
  propertyId?: string;
  resource: string;
  action: string;
  scope: string;
  allowed: boolean;
  conditions?: any;
  expiresAt: Date;
}

export interface PermissionConditionEvaluator {
  conditionType: string;
  evaluate(condition: PermissionCondition, context: PermissionEvaluationContext): boolean;
}

export interface BulkPermissionCheck {
  resource: string;
  action: string;
  scope: string;
  context?: Partial<PermissionEvaluationContext>;
}

export interface BulkPermissionResult {
  permissions: Record<string, PermissionEvaluationResult>;
  cached: number;
  evaluated: number;
  errors: string[];
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

export interface PermissionValidationRule {
  resource: string;
  action: string;
  scope: string;
  requiredRole?: string;
  requiredPermissions?: string[];
  conditions?: any;
}

export interface PermissionGrantRequest {
  userId: string;
  permissionId: string;
  grantedBy: string;
  conditions?: any;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface PermissionRevokeRequest {
  userId: string;
  permissionId: string;
  revokedBy: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RoleAssignmentRequest {
  userId: string;
  roleId: string;
  assignedBy: string;
  expiresAt?: Date;
  conditions?: any;
  metadata?: Record<string, any>;
}