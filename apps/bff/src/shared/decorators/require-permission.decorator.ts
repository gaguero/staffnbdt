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
    ASSIGN_PLATFORM: 'user.assign.platform',
    ASSIGN_ORGANIZATION: 'user.assign.organization',
    ASSIGN_PROPERTY: 'user.assign.property',
    REMOVE_PLATFORM: 'user.remove.platform',
    REMOVE_ORGANIZATION: 'user.remove.organization',
    REMOVE_PROPERTY: 'user.remove.property',
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

  // Organization management
  ORGANIZATION: {
    CREATE_PLATFORM: 'organization.create.platform',
    READ_PLATFORM: 'organization.read.platform',
    READ_ORGANIZATION: 'organization.read.organization',
    UPDATE_PLATFORM: 'organization.update.platform',
    UPDATE_ORGANIZATION: 'organization.update.organization',
    DELETE_PLATFORM: 'organization.delete.platform',
  },

  // Property management
  PROPERTY: {
    CREATE_PLATFORM: 'property.create.platform',
    CREATE_ORGANIZATION: 'property.create.organization',
    READ_PLATFORM: 'property.read.platform',
    READ_ORGANIZATION: 'property.read.organization',
    READ_PROPERTY: 'property.read.property',
    UPDATE_PLATFORM: 'property.update.platform',
    UPDATE_ORGANIZATION: 'property.update.organization',
    UPDATE_PROPERTY: 'property.update.property',
    DELETE_PLATFORM: 'property.delete.platform',
    DELETE_ORGANIZATION: 'property.delete.organization',
  },

  // Role management
  ROLE: {
    CREATE_PLATFORM: 'role.create.platform',
    CREATE_ORGANIZATION: 'role.create.organization',
    CREATE_PROPERTY: 'role.create.property',
    READ_PLATFORM: 'role.read.platform',
    READ_ORGANIZATION: 'role.read.organization',
    READ_PROPERTY: 'role.read.property',
    READ_DEPARTMENT: 'role.read.department',
    UPDATE_PLATFORM: 'role.update.platform',
    UPDATE_ORGANIZATION: 'role.update.organization',
    UPDATE_PROPERTY: 'role.update.property',
    DELETE_PLATFORM: 'role.delete.platform',
    DELETE_ORGANIZATION: 'role.delete.organization',
    DELETE_PROPERTY: 'role.delete.property',
    ASSIGN_PLATFORM: 'role.assign.platform',
    ASSIGN_ORGANIZATION: 'role.assign.organization',
    ASSIGN_PROPERTY: 'role.assign.property',
    ASSIGN_DEPARTMENT: 'role.assign.department',
  },

  // Hotel operations - Units (Rooms)
  UNIT: {
    CREATE_PLATFORM: 'unit.create.platform',
    CREATE_PROPERTY: 'unit.create.property',
    READ_PLATFORM: 'unit.read.platform',
    READ_PROPERTY: 'unit.read.property',
    UPDATE_PLATFORM: 'unit.update.platform',
    UPDATE_PROPERTY: 'unit.update.property',
    DELETE_PLATFORM: 'unit.delete.platform',
    DELETE_PROPERTY: 'unit.delete.property',
    STATUS_PROPERTY: 'unit.status.property',
    MAINTENANCE_PROPERTY: 'unit.maintenance.property',
  },

  // Hotel operations - Guests
  GUEST: {
    CREATE_PLATFORM: 'guest.create.platform',
    CREATE_PROPERTY: 'guest.create.property',
    READ_PLATFORM: 'guest.read.platform',
    READ_PROPERTY: 'guest.read.property',
    READ_OWN: 'guest.read.own',
    UPDATE_PLATFORM: 'guest.update.platform',
    UPDATE_PROPERTY: 'guest.update.property',
    DELETE_PLATFORM: 'guest.delete.platform',
    DELETE_PROPERTY: 'guest.delete.property',
    BLACKLIST_PLATFORM: 'guest.blacklist.platform',
    BLACKLIST_PROPERTY: 'guest.blacklist.property',
  },

  // Hotel operations - Reservations
  RESERVATION: {
    CREATE_PLATFORM: 'reservation.create.platform',
    CREATE_PROPERTY: 'reservation.create.property',
    READ_PLATFORM: 'reservation.read.platform',
    READ_PROPERTY: 'reservation.read.property',
    READ_OWN: 'reservation.read.own',
    UPDATE_PLATFORM: 'reservation.update.platform',
    UPDATE_PROPERTY: 'reservation.update.property',
    DELETE_PLATFORM: 'reservation.delete.platform',
    DELETE_PROPERTY: 'reservation.delete.property',
    CHECKIN_PROPERTY: 'reservation.checkin.property',
    CHECKOUT_PROPERTY: 'reservation.checkout.property',
    CANCEL_PROPERTY: 'reservation.cancel.property',
  },

  // Concierge module
  CONCIERGE: {
    CREATE_PLATFORM: 'concierge.create.platform',
    CREATE_PROPERTY: 'concierge.create.property',
    READ_PLATFORM: 'concierge.read.platform',
    READ_PROPERTY: 'concierge.read.property',
    UPDATE_PLATFORM: 'concierge.update.platform',
    UPDATE_PROPERTY: 'concierge.update.property',
    DELETE_PLATFORM: 'concierge.delete.platform',
    DELETE_PROPERTY: 'concierge.delete.property',
    OBJECT_TYPES_PROPERTY: 'concierge.object-types.property',
    PLAYBOOKS_PROPERTY: 'concierge.playbooks.property',
    EXECUTE_PROPERTY: 'concierge.execute.property',
    ASSIGN_PROPERTY: 'concierge.assign.property',
  },

  // Vendor module
  VENDOR: {
    CREATE_PLATFORM: 'vendor.create.platform',
    CREATE_PROPERTY: 'vendor.create.property',
    READ_PLATFORM: 'vendor.read.platform',
    READ_PROPERTY: 'vendor.read.property',
    READ_OWN: 'vendor.read.own',
    UPDATE_PLATFORM: 'vendor.update.platform',
    UPDATE_PROPERTY: 'vendor.update.property',
    UPDATE_OWN: 'vendor.update.own',
    DELETE_PLATFORM: 'vendor.delete.platform',
    DELETE_PROPERTY: 'vendor.delete.property',
    LINK_PROPERTY: 'vendor.link.property',
    CONFIRM_PROPERTY: 'vendor.confirm.property',
    PORTAL_VENDOR: 'vendor.portal.vendor',
  },

  // System administration
  SYSTEM: {
    ADMIN_PLATFORM: 'system.admin.platform',
    CONFIG_PLATFORM: 'system.config.platform',
    AUDIT_PLATFORM: 'system.audit.platform',
    ANALYTICS_PLATFORM: 'system.analytics.platform',
    ANALYTICS_PROPERTY: 'system.analytics.property',
  },

  // Portal access
  PORTAL: {
    ACCESS_PLATFORM: 'portal.access.platform',
    ACCESS_PROPERTY: 'portal.access.property',
    ACCESS_CLIENT: 'portal.access.client',
    ACCESS_VENDOR: 'portal.access.vendor',
  },
} as const;