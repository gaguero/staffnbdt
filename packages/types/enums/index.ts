// Multi-tenant role-based access control enums
export enum Role {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',        // Manages entire platform, all tenants
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER', // Manages hotel chain/group
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN', // Manages organization settings
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',     // Manages individual hotel property
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',     // Manages department within property
  STAFF = 'STAFF'                           // Self-service access to own resources
}

// Document management enums
export enum DocumentScope {
  GENERAL = 'GENERAL',
  DEPARTMENT = 'DEPARTMENT',
  USER = 'USER'
}

// Vacation management enums
export enum VacationType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  PERSONAL = 'PERSONAL',
  UNPAID = 'UNPAID'
}

export enum VacationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

// Training module enums
export enum EnrollmentStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Content block types for training modules
export enum ContentBlockType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  VIDEO = 'VIDEO',
  LINK = 'LINK',
  FORM = 'FORM'
}

// Notification types
export enum NotificationType {
  SYSTEM = 'SYSTEM',
  PAYROLL = 'PAYROLL',
  VACATION = 'VACATION',
  TRAINING = 'TRAINING',
  DOCUMENT = 'DOCUMENT'
}

// File upload status
export enum UploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Audit action types
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  UPLOAD = 'UPLOAD',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT'
}