export const TOKEN_STORAGE_KEY = 'nayara_auth_token';
export const USER_STORAGE_KEY = 'nayara_user_data';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    MAGIC_LINK: '/auth/magic-link',
    VERIFY_MAGIC: '/auth/verify-magic',
    REGISTER: '/auth/register',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: '/users',
  DEPARTMENTS: '/departments',
  DOCUMENTS: '/documents',
  PAYROLL: '/payroll',
  VACATION: '/vacation',
  TRAINING: '/training',
  BENEFITS: '/benefits',
};

export const ROLES = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  ORGANIZATION_OWNER: 'ORGANIZATION_OWNER',
  ORGANIZATION_ADMIN: 'ORGANIZATION_ADMIN',
  PROPERTY_MANAGER: 'PROPERTY_MANAGER',
  DEPARTMENT_ADMIN: 'DEPARTMENT_ADMIN',
  STAFF: 'STAFF',
  // Legacy for compatibility
  SUPERADMIN: 'SUPERADMIN',
} as const;

export const ROLE_LABELS = {
  PLATFORM_ADMIN: 'Platform Admin',
  ORGANIZATION_OWNER: 'Organization Owner',
  ORGANIZATION_ADMIN: 'Organization Admin',
  PROPERTY_MANAGER: 'Property Manager',
  DEPARTMENT_ADMIN: 'Department Admin',
  STAFF: 'Staff',
  // Legacy for compatibility
  SUPERADMIN: 'Super Admin',
} as const;

export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

export const FILE_TYPE_ICONS = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'text/plain': '📃',
  'application/zip': '📦',
  'video/mp4': '🎥',
  'audio/mpeg': '🎵',
} as const;

export const ROLE_PERMISSIONS = {
  PROPERTY_MANAGER: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'departments.create',
    'departments.read',
    'departments.update',
    'departments.delete',
    'documents.create',
    'documents.read',
    'documents.update',
    'documents.delete',
    'payroll.create',
    'payroll.read',
    'payroll.update',
    'payroll.delete',
    'vacation.approve',
    'vacation.read.all',
    'training.create',
    'training.manage',
    'benefits.manage',
  ],
  DEPARTMENT_ADMIN: [
    'users.read.department',
    'users.update.department',
    'documents.create.department',
    'documents.read.department',
    'documents.update.department',
    'payroll.read.department',
    'vacation.approve.department',
    'vacation.read.department',
    'training.read',
    'benefits.read',
  ],
  STAFF: [
    'users.read.self',
    'users.update.self',
    'documents.read.self',
    'payroll.read.self',
    'vacation.create',
    'vacation.read.self',
    'training.read',
    'training.complete',
    'benefits.read',
  ],
} as const;