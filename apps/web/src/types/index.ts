export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',           // SaaS platform admins - full system access
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER',   // Hotel chain owner
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',   // Organization settings manager
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',       // Hotel property manager
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',       // Department manager
  STAFF = 'STAFF',                             // Regular employees
  CLIENT = 'CLIENT',                           // External client users
  VENDOR = 'VENDOR',                           // External vendor users
}

// Re-export auth types
export * from './auth';

export type date = Date | string;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF' | 'CLIENT' | 'VENDOR';
  departmentId?: string;
  position?: string;
  phoneNumber?: string;
  hireDate?: date;
  profilePhoto?: string;
  createdAt: date;
  updatedAt: date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: date;
  updatedAt: date;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  scope: 'GENERAL' | 'DEPARTMENT' | 'USER';
  departmentId?: string;
  userId?: string;
  uploadedById: string;
  createdAt: date;
  updatedAt: date;
}

export interface Payslip {
  id: string;
  userId: string;
  payPeriodStart: date;
  payPeriodEnd: date;
  grossPay: number;
  netPay: number;
  deductions: Record<string, number>;
  additions: Record<string, number>;
  fileUrl?: string;
  status: 'DRAFT' | 'FINALIZED';
  createdAt: date;
  updatedAt: date;
}

export interface VacationRequest {
  id: string;
  userId: string;
  startDate: date;
  endDate: date;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedById?: string;
  approvedAt?: date;
  rejectionReason?: string;
  createdAt: date;
  updatedAt: date;
}

export interface TrainingSession {
  id: string;
  title: string;
  description: string;
  moduleCount: number;
  passingScore: number;
  isActive: boolean;
  version: number;
  createdById: string;
  createdAt: date;
  updatedAt: date;
}

export interface TrainingEnrollment {
  id: string;
  userId: string;
  sessionId: string;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  score?: number;
  completedAt?: date;
  createdAt: date;
  updatedAt: date;
}

export interface CommercialBenefit {
  id: string;
  partnerName: string;
  category: string;
  discount: string;
  description: string;
  validUntil?: date;
  imageUrl?: string;
  termsAndConditions?: string;
  contactInfo?: string;
  isActive: boolean;
  createdAt: date;
  updatedAt: date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: date;
}

// Re-export permission types - explicit exports to avoid conflicts
export type {
  PermissionEvaluationResult,
  BulkPermissionResult,
  Permission,
  CustomRole,
  UserPermissionSummary,
  PermissionCheckDto,
  BulkPermissionCheckDto,
  PermissionContext,
  PermissionSpec,
  CommonPermission
} from './permission';
export { PERMISSION_RESOURCES, PERMISSION_ACTIONS, PERMISSION_SCOPES, COMMON_PERMISSIONS } from './permission';

// Re-export hotel types
export * from './hotel';

// Re-export role types - explicit exports to avoid conflicts
export type {
  SystemRole,
  UserRoleAssignment,
  RoleHierarchy,
  RolePermissionMatrix,
  RoleAnalytics
} from './role';
export { SYSTEM_ROLES, ROLE_HIERARCHY, isSystemRole, getSystemRoleInfo, getRoleLevel, canManageRole, getRoleHierarchyLevel, formatRoleName } from './role';

// Re-export role history types
export * from './roleHistory';

// Re-export module registry types
export type {
  ModuleManifest,
  PermissionDefinition as ModulePermissionDefinition,
  NavItem as ModuleNavItem,
} from '../services/moduleRegistryService';