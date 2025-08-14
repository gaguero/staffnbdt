import { Role, DocumentScope, VacationType, VacationStatus, EnrollmentStatus, ContentBlockType } from '../enums';

// Base interface for all entities with audit fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// User management
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  departmentId?: string | null;
  department?: Department | null;
  position?: string | null;
  hireDate?: Date | null;
  phoneNumber?: string | null;
  emergencyContact?: Record<string, any> | null;
  idDocument?: string | null; // Encrypted
  profilePhoto?: string | null;
  
  // Relations
  documents?: Document[];
  payslips?: Payslip[];
  vacations?: Vacation[];
  enrollments?: Enrollment[];
  notifications?: Notification[];
  auditLogs?: AuditLog[];
}

export interface Department extends Omit<BaseEntity, 'deletedAt'> {
  name: string;
  description?: string | null;
  
  // Relations
  users?: User[];
  documents?: Document[];
}

// Document management
export interface Document extends BaseEntity {
  title: string;
  description?: string | null;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  scope: DocumentScope;
  departmentId?: string | null;
  department?: Department | null;
  userId?: string | null;
  user?: User | null;
  uploadedBy: string;
  tags: string[];
}

// Payroll management
export interface Payslip extends Omit<BaseEntity, 'updatedAt' | 'deletedAt'> {
  userId: string;
  user?: User;
  period: string; // "YYYY-MM" format
  grossSalary: number;
  deductions: Record<string, any>;
  netSalary: number;
  currency: string;
  pdfUrl?: string | null;
  importBatch?: string | null;
  viewedAt?: Date | null;
}

// Vacation management
export interface Vacation extends BaseEntity {
  userId: string;
  user?: User;
  type: VacationType;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
  status: VacationStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedReason?: string | null;
  attachments: string[];
}

// Training management
export interface TrainingSession extends BaseEntity {
  title: string;
  description: string;
  category: string;
  version: number;
  isActive: boolean;
  passingScore?: number | null;
  duration?: number | null; // in minutes
  contentBlocks: ContentBlock[];
  createdBy: string;
  
  // Relations
  enrollments?: Enrollment[];
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  title: string;
  content?: string;
  fileUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  formSchema?: Record<string, any>; // JSON schema for FORM type
  order: number;
}

export interface Enrollment extends BaseEntity {
  userId: string;
  user?: User;
  sessionId: string;
  session?: TrainingSession;
  status: EnrollmentStatus;
  progress: Record<string, any>; // Track which blocks viewed
  answers?: Record<string, any> | null;
  score?: number | null;
  completedAt?: Date | null;
  certificateUrl?: string | null;
}

// Commercial benefits
export interface CommercialBenefit extends BaseEntity {
  partnerName: string;
  category: string;
  description: string;
  discount: string;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  contactInfo?: string | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  isActive: boolean;
  terms?: string | null;
}

// Notifications
export interface Notification extends Omit<BaseEntity, 'updatedAt' | 'deletedAt'> {
  userId: string;
  user?: User;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  read: boolean;
  readAt?: Date | null;
}

// Audit logging
export interface AuditLog extends Omit<BaseEntity, 'updatedAt' | 'deletedAt'> {
  userId: string;
  user?: User;
  action: string;
  entity: string;
  entityId: string;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}