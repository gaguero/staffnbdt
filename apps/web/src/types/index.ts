import { z } from 'zod'

// User roles enum
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',
  STAFF = 'STAFF'
}

// Document access levels
export enum DocumentAccess {
  PUBLIC = 'PUBLIC',
  DEPARTMENT = 'DEPARTMENT',
  USER = 'USER'
}

// Vacation request status
export enum VacationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

// Training session status
export enum TrainingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

// Content block types for training
export enum ContentBlockType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  VIDEO = 'VIDEO',
  LINK = 'LINK',
  FORM = 'FORM'
}

// Zod schemas for validation
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().optional(),
  position: z.string().optional(),
  startDate: z.date().optional(),
  isActive: z.boolean(),
  profilePicture: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  department: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional()
  }).optional()
})

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  url: z.string(),
  access: z.nativeEnum(DocumentAccess),
  departmentId: z.string().optional(),
  userId: z.string().optional(),
  uploadedById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  uploadedBy: UserSchema.pick({ id: true, firstName: true, lastName: true }).optional()
})

export const VacationRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  days: z.number(),
  reason: z.string().optional(),
  status: z.nativeEnum(VacationStatus),
  approvedById: z.string().optional(),
  approvedAt: z.date().optional(),
  rejectionReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: UserSchema.pick({ id: true, firstName: true, lastName: true }).optional(),
  approvedBy: UserSchema.pick({ id: true, firstName: true, lastName: true }).optional()
})

export const PayrollSchema = z.object({
  id: z.string(),
  userId: z.string(),
  period: z.string(),
  grossSalary: z.number(),
  deductions: z.number(),
  netSalary: z.number(),
  overtime: z.number().optional(),
  bonus: z.number().optional(),
  payslipUrl: z.string().optional(),
  createdAt: z.date(),
  user: UserSchema.pick({ id: true, firstName: true, lastName: true }).optional()
})

export const TrainingSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.nativeEnum(TrainingStatus),
  departmentId: z.string().optional(),
  passingScore: z.number().optional(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  department: DepartmentSchema.optional(),
  createdBy: UserSchema.pick({ id: true, firstName: true, lastName: true }).optional(),
  enrollments: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    enrolledAt: z.date(),
    completedAt: z.date().optional(),
    score: z.number().optional(),
    passed: z.boolean().optional()
  })).optional()
})

export const ContentBlockSchema = z.object({
  id: z.string(),
  trainingSessionId: z.string(),
  type: z.nativeEnum(ContentBlockType),
  title: z.string(),
  content: z.string(),
  order: z.number(),
  required: z.boolean(),
  createdAt: z.date()
})

export const BenefitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  provider: z.string(),
  discount: z.string().optional(),
  location: z.string().optional(),
  contactInfo: z.string().optional(),
  imageUrl: z.string().optional(),
  validUntil: z.date().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Type inference from Zod schemas
export type User = z.infer<typeof UserSchema>
export type Department = z.infer<typeof DepartmentSchema>
export type Document = z.infer<typeof DocumentSchema>
export type VacationRequest = z.infer<typeof VacationRequestSchema>
export type Payroll = z.infer<typeof PayrollSchema>
export type TrainingSession = z.infer<typeof TrainingSessionSchema>
export type ContentBlock = z.infer<typeof ContentBlockSchema>
export type Benefit = z.infer<typeof BenefitSchema>

// API Response types
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface MagicLinkRequest {
  email: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthUser extends User {
  permissions: string[]
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: Record<string, unknown>
}

// Upload types
export interface FileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// Notification types
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: date
  action?: {
    label: string
    url: string
  }
}

// Dashboard widget types
export interface DashboardWidget {
  id: string
  title: string
  type: 'stat' | 'chart' | 'list' | 'calendar'
  permissions: UserRole[]
  data?: unknown
}

// Error types
export interface ApiError {
  message: string
  code: string
  status: number
  details?: Record<string, unknown>
}

export interface FormError {
  field: string
  message: string
}

// Filter and search types
export interface SearchFilters {
  query?: string
  department?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Theme types
export interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    info: string
  }
  fonts: {
    heading: string
    subheading: string
    body: string
  }
}

export type date = Date | string