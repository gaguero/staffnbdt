// Common API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

// Pagination interfaces
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// Auth API types
export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    departmentId?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface MagicLinkRequest {
  email: string;
  redirectUrl?: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  departmentId?: string;
  position?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

// User API types
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  departmentId?: string;
  position?: string;
  hireDate?: string;
  phoneNumber?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: string;
  departmentId?: string;
  position?: string;
  hireDate?: string;
  phoneNumber?: string;
  emergencyContact?: Record<string, any>;
}

export interface UserFilterQuery extends PaginationQuery {
  role?: string;
  departmentId?: string;
  search?: string;
}

// Department API types
export interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
}

// Document API types
export interface UploadDocumentRequest {
  title: string;
  description?: string;
  scope: string;
  departmentId?: string;
  userId?: string;
  tags?: string[];
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  tags?: string[];
}

export interface DocumentFilterQuery extends PaginationQuery {
  scope?: string;
  departmentId?: string;
  userId?: string;
  tags?: string[];
  search?: string;
}

export interface UploadResponse {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
}

// Payroll API types
export interface PayslipUploadRequest {
  file: File;
  period: string;
}

export interface PayslipValidationResult {
  valid: boolean;
  errors: PayslipValidationError[];
  previewData: PayslipPreview[];
}

export interface PayslipValidationError {
  row: number;
  field: string;
  message: string;
}

export interface PayslipPreview {
  email: string;
  grossSalary: number;
  deductions: Record<string, any>;
  netSalary: number;
}

// Vacation API types
export interface CreateVacationRequest {
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
  attachments?: string[];
}

export interface UpdateVacationRequest {
  startDate?: string;
  endDate?: string;
  reason?: string;
  attachments?: string[];
}

export interface VacationApprovalRequest {
  status: 'APPROVED' | 'REJECTED';
  rejectedReason?: string;
}

export interface VacationFilterQuery extends PaginationQuery {
  userId?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

// Training API types
export interface CreateTrainingSessionRequest {
  title: string;
  description: string;
  category: string;
  passingScore?: number;
  duration?: number;
  contentBlocks: CreateContentBlockRequest[];
}

export interface CreateContentBlockRequest {
  type: string;
  title: string;
  content?: string;
  fileUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  formSchema?: Record<string, any>;
  order: number;
}

export interface UpdateTrainingSessionRequest {
  title?: string;
  description?: string;
  category?: string;
  passingScore?: number;
  duration?: number;
  contentBlocks?: CreateContentBlockRequest[];
}

export interface EnrollUserRequest {
  sessionId: string;
}

export interface SubmitAnswersRequest {
  blockId: string;
  answers: Record<string, any>;
}

export interface TrainingFilterQuery extends PaginationQuery {
  category?: string;
  isActive?: boolean;
  search?: string;
}

// Benefits API types
export interface CreateBenefitRequest {
  partnerName: string;
  category: string;
  description: string;
  discount: string;
  imageUrl?: string;
  websiteUrl?: string;
  contactInfo?: string;
  validFrom?: string;
  validUntil?: string;
  terms?: string;
}

export interface UpdateBenefitRequest {
  partnerName?: string;
  category?: string;
  description?: string;
  discount?: string;
  imageUrl?: string;
  websiteUrl?: string;
  contactInfo?: string;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
  terms?: string;
}

export interface BenefitFilterQuery extends PaginationQuery {
  category?: string;
  isActive?: boolean;
  search?: string;
}

// Notification API types
export interface CreateNotificationRequest {
  userId?: string; // If not provided, creates system-wide notification
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface NotificationFilterQuery extends PaginationQuery {
  userId?: string;
  type?: string;
  read?: boolean;
}

// File upload types
export interface FileUploadProgress {
  fileKey: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}