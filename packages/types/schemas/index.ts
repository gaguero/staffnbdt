import { z } from 'zod';
import { Role, DocumentScope, VacationType, VacationStatus, ContentBlockType } from '../enums';

// Pagination schema
export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().optional()
});

export const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
  redirectUrl: z.string().url().optional()
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  departmentId: z.string().cuid().optional(),
  position: z.string().max(100).optional()
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.nativeEnum(Role),
  departmentId: z.string().cuid().optional(),
  position: z.string().max(100).optional(),
  hireDate: z.string().datetime().optional(),
  phoneNumber: z.string().max(20).optional()
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().cuid().optional(),
  position: z.string().max(100).optional(),
  hireDate: z.string().datetime().optional(),
  phoneNumber: z.string().max(20).optional(),
  emergencyContact: z.record(z.any()).optional()
});

export const userFilterSchema = paginationQuerySchema.extend({
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().cuid().optional(),
  search: z.string().max(100).optional()
});

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  description: z.string().max(500).optional()
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional()
});

// Document schemas
export const uploadDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  scope: z.nativeEnum(DocumentScope),
  departmentId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  tags: z.array(z.string().max(50)).max(10).optional().default([])
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional()
});

export const documentFilterSchema = paginationQuerySchema.extend({
  scope: z.nativeEnum(DocumentScope).optional(),
  departmentId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(100).optional()
});

// Payroll schemas
export const payslipUploadSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format')
});

// Vacation schemas
export const createVacationSchema = z.object({
  type: z.nativeEnum(VacationType),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().max(1000).optional(),
  attachments: z.array(z.string().url()).max(5).optional().default([])
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate']
});

export const updateVacationSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  reason: z.string().max(1000).optional(),
  attachments: z.array(z.string().url()).max(5).optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate']
});

export const vacationApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectedReason: z.string().max(1000).optional()
}).refine(data => {
  if (data.status === 'REJECTED') {
    return !!data.rejectedReason;
  }
  return true;
}, {
  message: 'Rejection reason is required when rejecting',
  path: ['rejectedReason']
});

export const vacationFilterSchema = paginationQuerySchema.extend({
  userId: z.string().cuid().optional(),
  status: z.nativeEnum(VacationStatus).optional(),
  type: z.nativeEnum(VacationType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Training schemas
export const contentBlockSchema = z.object({
  type: z.nativeEnum(ContentBlockType),
  title: z.string().min(1, 'Block title is required').max(200),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  formSchema: z.record(z.any()).optional(),
  order: z.number().min(0)
}).refine(data => {
  switch (data.type) {
    case ContentBlockType.TEXT:
      return !!data.content;
    case ContentBlockType.FILE:
      return !!data.fileUrl;
    case ContentBlockType.VIDEO:
      return !!data.videoUrl;
    case ContentBlockType.LINK:
      return !!data.linkUrl;
    case ContentBlockType.FORM:
      return !!data.formSchema;
    default:
      return false;
  }
}, {
  message: 'Required field missing for block type'
});

export const createTrainingSessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  category: z.string().min(1, 'Category is required').max(100),
  passingScore: z.number().min(0).max(100).optional(),
  duration: z.number().min(1).optional(),
  contentBlocks: z.array(contentBlockSchema).min(1, 'At least one content block is required')
});

export const updateTrainingSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  category: z.string().min(1).max(100).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  duration: z.number().min(1).optional(),
  contentBlocks: z.array(contentBlockSchema).optional()
});

export const enrollUserSchema = z.object({
  sessionId: z.string().cuid('Invalid session ID')
});

export const submitAnswersSchema = z.object({
  blockId: z.string().min(1, 'Block ID is required'),
  answers: z.record(z.any())
});

export const trainingFilterSchema = paginationQuerySchema.extend({
  category: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(100).optional()
});

// Benefits schemas
export const createBenefitSchema = z.object({
  partnerName: z.string().min(1, 'Partner name is required').max(200),
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().min(1, 'Description is required').max(2000),
  discount: z.string().min(1, 'Discount is required').max(200),
  imageUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  contactInfo: z.string().max(500).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  terms: z.string().max(5000).optional()
}).refine(data => {
  if (data.validFrom && data.validUntil) {
    return new Date(data.validUntil) > new Date(data.validFrom);
  }
  return true;
}, {
  message: 'Valid until must be after valid from',
  path: ['validUntil']
});

export const updateBenefitSchema = z.object({
  partnerName: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(2000).optional(),
  discount: z.string().min(1).max(200).optional(),
  imageUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  contactInfo: z.string().max(500).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  terms: z.string().max(5000).optional()
});

export const benefitFilterSchema = paginationQuerySchema.extend({
  category: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(100).optional()
});

// Notification schemas
export const createNotificationSchema = z.object({
  userId: z.string().cuid().optional(),
  type: z.string().min(1, 'Type is required').max(50),
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(2000),
  data: z.record(z.any()).optional()
});

export const notificationFilterSchema = paginationQuerySchema.extend({
  userId: z.string().cuid().optional(),
  type: z.string().max(50).optional(),
  read: z.coerce.boolean().optional()
});

// File upload schemas
export const fileUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().min(1, 'File size must be greater than 0'),
  mimeType: z.string().min(1, 'MIME type is required')
});

// Export all schemas for easy access
export const schemas = {
  // Pagination
  paginationQuery: paginationQuerySchema,
  
  // Auth
  login: loginSchema,
  magicLink: magicLinkSchema,
  register: registerSchema,
  resetPassword: resetPasswordSchema,
  
  // Users
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  userFilter: userFilterSchema,
  
  // Departments
  createDepartment: createDepartmentSchema,
  updateDepartment: updateDepartmentSchema,
  
  // Documents
  uploadDocument: uploadDocumentSchema,
  updateDocument: updateDocumentSchema,
  documentFilter: documentFilterSchema,
  
  // Payroll
  payslipUpload: payslipUploadSchema,
  
  // Vacations
  createVacation: createVacationSchema,
  updateVacation: updateVacationSchema,
  vacationApproval: vacationApprovalSchema,
  vacationFilter: vacationFilterSchema,
  
  // Training
  contentBlock: contentBlockSchema,
  createTrainingSession: createTrainingSessionSchema,
  updateTrainingSession: updateTrainingSessionSchema,
  enrollUser: enrollUserSchema,
  submitAnswers: submitAnswersSchema,
  trainingFilter: trainingFilterSchema,
  
  // Benefits
  createBenefit: createBenefitSchema,
  updateBenefit: updateBenefitSchema,
  benefitFilter: benefitFilterSchema,
  
  // Notifications
  createNotification: createNotificationSchema,
  notificationFilter: notificationFilterSchema,
  
  // File uploads
  fileUpload: fileUploadSchema
};