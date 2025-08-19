import { SetMetadata } from '@nestjs/common';

// Permission format: {resource}.{action}.{scope}
// Examples:
// - 'users.create.platform' - Create users at platform level
// - 'users.read.organization' - Read users at organization level
// - 'payroll.read.property' - Read payroll at property level
// - 'profile.update.own' - Update own profile only

export interface PermissionObject {
  resource: string;
  action: string;
  scope: 'platform' | 'organization' | 'property' | 'department' | 'own';
  conditions?: Record<string, any>; // Additional conditions for complex permissions
}

export type Permission = string | PermissionObject;

export interface ConditionalPermissionConfig {
  permission: Permission;
  condition: (context: any) => boolean | Promise<boolean>;
  description?: string;
  errorMessage?: string;
}

export const PERMISSION_KEY = 'permissions';
export const CONDITIONAL_PERMISSION_KEY = 'conditional_permissions';
export const PERMISSION_SCOPE_KEY = 'permission_scope';

/**
 * Decorator to require specific permissions for an endpoint
 * 
 * @example
 * // String format
 * @RequirePermission('users.create.platform')
 * 
 * @example
 * // Object format
 * @RequirePermission({ resource: 'users', action: 'create', scope: 'platform' })
 * 
 * @example
 * // Multiple permissions (OR logic)
 * @RequirePermission(['users.create.platform', 'users.create.organization'])
 * 
 * @example
 * // With conditions
 * @RequirePermission({
 *   resource: 'users',
 *   action: 'update',
 *   scope: 'department',
 *   conditions: { sameDepartment: true }
 * })
 */
export const RequirePermission = (...permissions: Permission[]) => 
  SetMetadata(PERMISSION_KEY, permissions);

/**
 * Decorator for conditional permissions with custom logic
 * 
 * @example
 * @ConditionalPermission({
 *   permission: 'payroll.read.department',
 *   condition: (ctx) => ctx.user.departmentId === ctx.params.departmentId,
 *   description: 'Can only read payroll for own department'
 * })
 */
export const ConditionalPermission = (conditionalPermission: ConditionalPermissionConfig) =>
  SetMetadata(CONDITIONAL_PERMISSION_KEY, conditionalPermission);

/**
 * Decorator to automatically apply scope-based filtering to query results
 * This is useful for endpoints that should automatically filter results 
 * based on the user's organizational context
 * 
 * @example
 * @Get()
 * @PermissionScope('property') // Will automatically filter by user's propertyId
 * async findAll() { ... }
 * 
 * @example 
 * @Get()
 * @PermissionScope('department') // Will automatically filter by user's departmentId
 * async findDepartmentUsers() { ... }
 */
export const PermissionScope = (scope: 'platform' | 'organization' | 'property' | 'department' | 'own') =>
  SetMetadata(PERMISSION_SCOPE_KEY, scope);




/**
 * Utility to convert string permission to object format
 */
export function parsePermission(permission: string): PermissionObject {
  const parts = permission.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid permission format: ${permission}. Expected format: resource.action.scope`);
  }

  return {
    resource: parts[0],
    action: parts[1],
    scope: parts[2] as PermissionObject['scope'],
  };
}

/**
 * Utility to convert object permission to string format
 */
export function stringifyPermission(permission: PermissionObject): string {
  return `${permission.resource}.${permission.action}.${permission.scope}`;
}

/**
 * Utility to normalize permissions to object format
 */
export function normalizePermission(permission: Permission): PermissionObject {
  if (typeof permission === 'string') {
    return parsePermission(permission);
  }
  return permission;
}

/**
 * Utility to check if permission matches a pattern
 * Supports wildcards: users.*.platform, *.read.*, etc.
 */
export function matchesPermissionPattern(permission: string, pattern: string): boolean {
  const permParts = permission.split('.');
  const patternParts = pattern.split('.');

  if (permParts.length !== patternParts.length) {
    return false;
  }

  return patternParts.every((part, index) => {
    return part === '*' || part === permParts[index];
  });
}

/**
 * Permission constants for common operations
 */
export const PERMISSIONS = {
  // User management
  USERS: {
    CREATE_PLATFORM: 'users.create.platform',
    CREATE_ORGANIZATION: 'users.create.organization', 
    CREATE_PROPERTY: 'users.create.property',
    CREATE_DEPARTMENT: 'users.create.department',
    READ_PLATFORM: 'users.read.platform',
    READ_ORGANIZATION: 'users.read.organization',
    READ_PROPERTY: 'users.read.property', 
    READ_DEPARTMENT: 'users.read.department',
    READ_OWN: 'users.read.own',
    UPDATE_PLATFORM: 'users.update.platform',
    UPDATE_ORGANIZATION: 'users.update.organization',
    UPDATE_PROPERTY: 'users.update.property',
    UPDATE_DEPARTMENT: 'users.update.department',
    UPDATE_OWN: 'users.update.own',
    DELETE_PLATFORM: 'users.delete.platform',
    DELETE_ORGANIZATION: 'users.delete.organization',
    DELETE_PROPERTY: 'users.delete.property',
    DELETE_DEPARTMENT: 'users.delete.department',
    CHANGE_ROLE: 'users.change_role.platform',
    INVITE: 'users.invite.department',
  },
  
  // Profile management
  PROFILE: {
    READ_OWN: 'profile.read.own',
    READ_DEPARTMENT: 'profile.read.department',
    READ_PROPERTY: 'profile.read.property',
    UPDATE_OWN: 'profile.update.own',
    UPDATE_DEPARTMENT: 'profile.update.department',
    VERIFY_ID: 'profile.verify_id.department',
  },

  // Payroll management
  PAYROLL: {
    READ_PLATFORM: 'payroll.read.platform',
    READ_ORGANIZATION: 'payroll.read.organization',
    READ_PROPERTY: 'payroll.read.property',
    READ_DEPARTMENT: 'payroll.read.department',
    READ_OWN: 'payroll.read.own',
    CREATE_DEPARTMENT: 'payroll.create.department',
    CREATE_PROPERTY: 'payroll.create.property',
    PROCESS_CSV: 'payroll.process_csv.property',
    GENERATE_PDF: 'payroll.generate_pdf.department',
  },

  // Department management
  DEPARTMENTS: {
    CREATE_PROPERTY: 'departments.create.property',
    READ_PLATFORM: 'departments.read.platform',
    READ_ORGANIZATION: 'departments.read.organization',
    READ_PROPERTY: 'departments.read.property',
    READ_OWN: 'departments.read.own',
    UPDATE_PROPERTY: 'departments.update.property',
    DELETE_PROPERTY: 'departments.delete.property',
  },

  // Document management
  DOCUMENTS: {
    READ_PLATFORM: 'documents.read.platform',
    READ_ORGANIZATION: 'documents.read.organization',
    READ_PROPERTY: 'documents.read.property',
    READ_DEPARTMENT: 'documents.read.department',
    CREATE_DEPARTMENT: 'documents.create.department',
    CREATE_PROPERTY: 'documents.create.property',
    UPDATE_DEPARTMENT: 'documents.update.department',
    DELETE_DEPARTMENT: 'documents.delete.department',
  },

  // Training management
  TRAINING: {
    READ_PLATFORM: 'training.read.platform',
    READ_ORGANIZATION: 'training.read.organization',
    READ_PROPERTY: 'training.read.property',
    READ_DEPARTMENT: 'training.read.department',
    READ_OWN: 'training.read.own',
    CREATE_PROPERTY: 'training.create.property',
    CREATE_DEPARTMENT: 'training.create.department',
    ENROLL_DEPARTMENT: 'training.enroll.department',
    GRADE_DEPARTMENT: 'training.grade.department',
  },

  // Vacation management
  VACATION: {
    READ_PLATFORM: 'vacation.read.platform',
    READ_ORGANIZATION: 'vacation.read.organization',
    READ_PROPERTY: 'vacation.read.property',
    READ_DEPARTMENT: 'vacation.read.department',
    READ_OWN: 'vacation.read.own',
    CREATE_OWN: 'vacation.create.own',
    APPROVE_DEPARTMENT: 'vacation.approve.department',
    APPROVE_PROPERTY: 'vacation.approve.property',
  },

  // Commercial benefits
  BENEFITS: {
    READ_PLATFORM: 'benefits.read.platform',
    READ_ORGANIZATION: 'benefits.read.organization',
    READ_PROPERTY: 'benefits.read.property',
    CREATE_PROPERTY: 'benefits.create.property',
    UPDATE_PROPERTY: 'benefits.update.property',
    DELETE_PROPERTY: 'benefits.delete.property',
  },
} as const;