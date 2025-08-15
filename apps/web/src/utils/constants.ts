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
  SUPERADMIN: 'SUPERADMIN',
  DEPARTMENT_ADMIN: 'DEPARTMENT_ADMIN',
  STAFF: 'STAFF',
} as const;

export const ROLE_LABELS = {
  SUPERADMIN: 'Super Admin',
  DEPARTMENT_ADMIN: 'Department Admin',
  STAFF: 'Staff',
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
  SUPERADMIN: [
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