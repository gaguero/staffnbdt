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

export enum IdVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface IdVerificationResult {
  status: IdVerificationStatus;
  verifiedBy: string;
  verifiedAt: string;
  notes?: string;
}