/**
 * Profile-related TypeScript types for the Nayara HR Portal
 * These types match the backend API interfaces and ensure type safety
 */

export enum IdVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface IdDocumentMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  encryptedPath: string;
  verificationStatus: IdVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface IdDocumentStatus {
  status: IdVerificationStatus;
  uploadedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  filename?: string;
  size?: number;
}

export interface VerificationAction {
  status: IdVerificationStatus;
  notes?: string;
}

export interface IdVerificationResult {
  status: IdVerificationStatus;
  verifiedBy: string;
  verifiedAt: string;
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary?: boolean;
}

export interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  emergencyContact?: EmergencyContact[];
  idDocument?: IdDocumentMetadata;
  department?: {
    id: string;
    name: string;
  };
  position?: string;
  role: 'SUPERADMIN' | 'DEPARTMENT_ADMIN' | 'STAFF';
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  emergencyContact?: EmergencyContact[];
}

export interface PhotoUploadResponse {
  success: boolean;
  data: {
    profilePhoto: string;
  };
  message: string;
}

export interface IdDocumentUploadResponse {
  success: boolean;
  data: {
    status: IdVerificationStatus;
    uploadedAt: string;
    filename: string;
  };
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// File upload constraints
export const FILE_CONSTRAINTS = {
  PROFILE_PHOTO: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
  },
  ID_DOCUMENT: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
} as const;

// Component prop types
export interface IDDocumentUploadProps {
  onStatusUpdate?: (status: IdVerificationStatus) => void;
  onDocumentUpdate?: (hasDocument: boolean) => void;
  showAdminControls?: boolean;
  userId?: string;
}

export interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdate?: (photoUrl: string) => void;
  onPhotoDelete?: () => void;
}

// Utility type helpers
export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error';
export type VerificationStatusColor = 'badge-success' | 'badge-info' | 'badge-error' | 'badge-warning' | 'badge-neutral';

export const getStatusColor = (status: IdVerificationStatus): VerificationStatusColor => {
  switch (status) {
    case IdVerificationStatus.VERIFIED:
      return 'badge-success';
    case IdVerificationStatus.PENDING:
      return 'badge-info';
    case IdVerificationStatus.REJECTED:
      return 'badge-error';
    case IdVerificationStatus.EXPIRED:
      return 'badge-warning';
    default:
      return 'badge-neutral';
  }
};

export const getStatusIcon = (status: IdVerificationStatus): string => {
  switch (status) {
    case IdVerificationStatus.VERIFIED:
      return '✓';
    case IdVerificationStatus.PENDING:
      return '⏳';
    case IdVerificationStatus.REJECTED:
      return '✗';
    case IdVerificationStatus.EXPIRED:
      return '⚠️';
    default:
      return '📄';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const validateFile = (file: File, constraints: typeof FILE_CONSTRAINTS.ID_DOCUMENT | typeof FILE_CONSTRAINTS.PROFILE_PHOTO): string | null => {
  if (!constraints.ALLOWED_TYPES.includes(file.type)) {
    const allowedExtensions = constraints.ALLOWED_EXTENSIONS.join(', ');
    return `Please select a valid file type: ${allowedExtensions}`;
  }
  if (file.size > constraints.MAX_SIZE) {
    const maxSizeMB = Math.round(constraints.MAX_SIZE / (1024 * 1024));
    return `File size must be less than ${maxSizeMB}MB.`;
  }
  return null;
};