// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
export const API_TIMEOUT = 30000 // 30 seconds

// Authentication
export const TOKEN_STORAGE_KEY = 'nayara_auth_tokens'
export const USER_STORAGE_KEY = 'nayara_user'
export const REFRESH_TOKEN_THRESHOLD = 5 * 60 * 1000 // 5 minutes before expiry

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]

export const FILE_TYPE_ICONS = {
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'text/plain': '📄',
  'text/csv': '📊',
  'video/mp4': '🎥',
  'video/webm': '🎥',
  'video/ogg': '🎥'
}

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Date Formats
export const DATE_FORMAT = 'dd/MM/yyyy'
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'
export const TIME_FORMAT = 'HH:mm'

// Cache Keys for React Query
export const CACHE_KEYS = {
  USER: 'user',
  USERS: 'users',
  DEPARTMENTS: 'departments',
  DOCUMENTS: 'documents',
  VACATION_REQUESTS: 'vacation-requests',
  PAYROLL: 'payroll',
  TRAINING_SESSIONS: 'training-sessions',
  TRAINING_ENROLLMENTS: 'training-enrollments',
  BENEFITS: 'benefits',
  NOTIFICATIONS: 'notifications',
  DASHBOARD_STATS: 'dashboard-stats'
} as const

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  DOCUMENTS: '/documents',
  PAYROLL: '/payroll',
  VACATION: '/vacation',
  TRAINING: '/training',
  BENEFITS: '/benefits',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_DEPARTMENTS: '/admin/departments',
  ADMIN_DOCUMENTS: '/admin/documents',
  ADMIN_TRAINING: '/admin/training',
  ADMIN_BENEFITS: '/admin/benefits'
} as const

// User Roles and Permissions
export const ROLE_PERMISSIONS = {
  SUPERADMIN: [
    'users:read',
    'users:write',
    'users:delete',
    'departments:read',
    'departments:write',
    'departments:delete',
    'documents:read',
    'documents:write',
    'documents:delete',
    'payroll:read',
    'payroll:write',
    'vacation:read',
    'vacation:write',
    'vacation:approve',
    'training:read',
    'training:write',
    'training:delete',
    'benefits:read',
    'benefits:write',
    'benefits:delete'
  ],
  DEPARTMENT_ADMIN: [
    'users:read',
    'users:write',
    'documents:read',
    'documents:write',
    'payroll:read',
    'vacation:read',
    'vacation:approve',
    'training:read',
    'training:write',
    'benefits:read'
  ],
  STAFF: [
    'documents:read',
    'payroll:read',
    'vacation:read',
    'vacation:write',
    'training:read',
    'benefits:read'
  ]
} as const

// Status Colors
export const STATUS_COLORS = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'neutral',
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
  ACTIVE: 'success',
  INACTIVE: 'neutral'
} as const

// Training Configuration
export const TRAINING_CONFIG = {
  MIN_PASSING_SCORE: 70,
  MAX_ATTEMPTS: 3,
  CONTENT_BLOCK_TYPES: [
    { value: 'TEXT', label: 'Text Content' },
    { value: 'FILE', label: 'File Download' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'LINK', label: 'External Link' },
    { value: 'FORM', label: 'Quiz/Form' }
  ]
}

// Notification Settings
export const NOTIFICATION_SETTINGS = {
  TOAST_DURATION: 4000,
  AUTO_REFRESH_INTERVAL: 60000, // 1 minute
  MAX_NOTIFICATIONS: 50
}

// Mobile Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
}

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: TOKEN_STORAGE_KEY,
  USER_DATA: USER_STORAGE_KEY,
  THEME: 'nayara_theme',
  LANGUAGE: 'nayara_language',
  DASHBOARD_LAYOUT: 'nayara_dashboard_layout',
  SIDEBAR_COLLAPSED: 'nayara_sidebar_collapsed'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
  INVALID_FILE_TYPE: 'File type not supported',
  UPLOAD_FAILED: 'File upload failed. Please try again.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'You have been logged out successfully.',
  PROFILE_UPDATED: 'Your profile has been updated successfully.',
  DOCUMENT_UPLOADED: 'Document uploaded successfully.',
  VACATION_REQUESTED: 'Vacation request submitted successfully.',
  TRAINING_COMPLETED: 'Training session completed successfully.',
  PASSWORD_RESET: 'Password reset link has been sent to your email.',
  DATA_SAVED: 'Data saved successfully.',
  DATA_DELETED: 'Data deleted successfully.'
} as const

// Feature Flags
export const FEATURES = {
  OFFLINE_SUPPORT: true,
  PWA_ENABLED: true,
  NOTIFICATIONS: true,
  ANALYTICS: false,
  DARK_MODE: false
} as const

// External Links
export const EXTERNAL_LINKS = {
  HELP_CENTER: 'https://help.nayara.com',
  PRIVACY_POLICY: 'https://nayara.com/privacy',
  TERMS_OF_SERVICE: 'https://nayara.com/terms',
  CONTACT_SUPPORT: 'mailto:support@nayara.com'
} as const

// Department Colors (for visual distinction)
export const DEPARTMENT_COLORS = [
  '#AA8E67', // Warm Gold
  '#7C8E67', // Forest Green
  '#A4C4C8', // Ocean Teal
  '#DCFEF4', // Sky Blue
  '#2E7D32', // Success Green
  '#0277BD', // Info Blue
  '#ED6C02', // Warning Orange
  '#C62828'  // Error Red
]