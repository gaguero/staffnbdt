// Export all types and interfaces
export * from './entities';
export * from './api';
export * from './enums';
export * from './schemas';

// Import types for internal use in this file
import type { User, Department, Document, Vacation, Enrollment, TrainingSession, Payslip, Notification, AuditLog } from './entities';
import { Role } from './enums';

// Type utilities
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredOnly<T, K extends keyof T> = Pick<T, K>;
export type WithoutTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type WithoutId<T> = Omit<T, 'id'>;
export type CreateInput<T> = WithoutTimestamps<WithoutId<T>>;
export type UpdateInput<T> = Partial<WithoutTimestamps<WithoutId<T>>>;

// Common utility types
export type ID = string;
export type Timestamp = Date;
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
export type EmptyObject = Record<string, never>;

// API response utilities
export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ErrorResponse = {
  success: false;
  error: string;
  message: string;
  details?: Record<string, any>;
};

export type ApiResult<T> = SuccessResponse<T> | ErrorResponse;

// Form state types
export type FormState<T> = {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
};

// Upload state types
export type UploadState = {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
};

// Common filter types
export type DateRange = {
  from?: Date;
  to?: Date;
};

export type SortOrder = 'asc' | 'desc';

export type SortConfig<T> = {
  field: keyof T;
  direction: SortOrder;
};

// Permission types for RBAC
export type Permission = 
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'departments:read'
  | 'departments:write'
  | 'departments:delete'
  | 'documents:read'
  | 'documents:write'
  | 'documents:delete'
  | 'payroll:read'
  | 'payroll:write'
  | 'vacation:read'
  | 'vacation:write'
  | 'vacation:approve'
  | 'training:read'
  | 'training:write'
  | 'training:delete'
  | 'benefits:read'
  | 'benefits:write'
  | 'benefits:delete'
  | 'notifications:read'
  | 'notifications:write'
  | 'audit:read';

// Note: Role enum is already exported from './enums'

export type RolePermissions = {
  [key in Role]: Permission[];
};

// Theme types for UI
export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeConfig = {
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
};

// Layout types
export type LayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showSidebar?: boolean;
  showHeader?: boolean;
};

// Navigation types
export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
  permissions?: Permission[];
};

// Dashboard types
export type DashboardCard = {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  href?: string;
};

export type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
};

// Search types
export type SearchResult<T> = {
  items: T[];
  total: number;
  query: string;
  facets?: Record<string, { value: string; count: number }[]>;
};

export type SearchFilters = Record<string, string | string[] | number | boolean>;

// Export commonly used type combinations
export type UserWithDepartment = User & { department: Department };
export type DocumentWithRelations = Document & { 
  department?: Department; 
  user?: User; 
};
export type VacationWithUser = Vacation & { user: User };
export type EnrollmentWithSession = Enrollment & { 
  session: TrainingSession; 
  user: User; 
};
export type PayslipWithUser = Payslip & { user: User };
export type NotificationWithUser = Notification & { user: User };
export type AuditLogWithUser = AuditLog & { user: User };