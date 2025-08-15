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