import api from './api';

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF';
  departmentId?: string;
  department?: {
    id: string;
    name: string;
  };
  position?: string;
  hireDate?: string;
  phoneNumber?: string;
  emergencyContact?: EmergencyContactsData | LegacyEmergencyContactsData | null;
  idDocument?: IdDocumentMetadata | null;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
}

export interface EmergencyContactsData {
  contacts: EmergencyContact[];
  updatedAt: string;
}

// Legacy interface for backward compatibility
export interface LegacyEmergencyContactsData {
  primaryContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };
  secondaryContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };
}

export interface IdDocumentMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  status: IdVerificationStatus;
}

export enum IdVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  position?: string;
}

export interface ProfilePhotoUploadResult {
  profilePhoto: string;
}

export interface IdDocumentUploadResult {
  documentId: string;
  status: IdVerificationStatus;
}

export interface IdDocumentStatus {
  status: IdVerificationStatus;
  uploadedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  filename?: string;
  size?: number;
}

export interface VerificationAction {
  status: IdVerificationStatus;
  notes?: string;
}

export enum PhotoType {
  FORMAL = 'FORMAL',
  CASUAL = 'CASUAL',
  UNIFORM = 'UNIFORM',
  FUNNY = 'FUNNY'
}

export interface ProfilePhoto {
  id: string;
  userId: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  photoType: PhotoType;
  isActive: boolean;
  isPrimary: boolean;
  description?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPhotosResponse {
  photos: ProfilePhoto[];
  photosByType: Record<PhotoType, number>;
  primaryPhoto: ProfilePhoto | null;
}

export interface PhotoUploadOptions {
  isPrimary?: boolean;
  description?: string;
}

export interface PhotoTypeInfo {
  type: PhotoType;
  displayName: string;
  description: string;
  hasPhoto: boolean;
  photoUrl: string | null;
}

export interface PhotoTypesResponse {
  photoTypes: PhotoTypeInfo[];
}

class ProfileService {
  async getProfile(): Promise<Profile> {
    const response = await api.get('/profile');
    return response.data.data;
  }

  async getProfileById(userId: string): Promise<Profile> {
    const response = await api.get(`/profile/${userId}`);
    return response.data.data;
  }

  async updateProfile(data: UpdateProfileData): Promise<Profile> {
    const response = await api.put('/profile', data);
    return response.data.data;
  }

  async uploadProfilePhoto(file: File): Promise<ProfilePhotoUploadResult> {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await api.post('/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async deleteProfilePhoto(): Promise<{ success: boolean }> {
    const response = await api.delete('/profile/photo');
    return response.data.data;
  }

  async uploadIdDocument(file: File): Promise<IdDocumentUploadResult> {
    const formData = new FormData();
    formData.append('idDocument', file);

    const response = await api.post('/profile/id', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async getIdDocumentStatus(): Promise<IdDocumentStatus> {
    const response = await api.get('/profile/id/status');
    return response.data.data;
  }

  async getIdDocumentStatusForUser(userId: string): Promise<IdDocumentStatus> {
    const response = await api.get(`/profile/id/${userId}/status`);
    return response.data.data;
  }

  async verifyIdDocument(userId: string, action: VerificationAction): Promise<{ success: boolean }> {
    const response = await api.post(`/profile/id/${userId}/verify`, action);
    return response.data.data;
  }

  async downloadIdDocument(userId: string): Promise<Blob> {
    const response = await api.get(`/profile/id/${userId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async updateEmergencyContacts(contacts: LegacyEmergencyContactsData): Promise<{ success: boolean }> {
    // Transform legacy format to new format
    const transformedContacts: EmergencyContact[] = [];
    
    if (contacts.primaryContact) {
      transformedContacts.push({
        ...contacts.primaryContact,
        isPrimary: true
      });
    }
    
    if (contacts.secondaryContact) {
      transformedContacts.push({
        ...contacts.secondaryContact,
        isPrimary: false
      });
    }
    
    const requestData = {
      contacts: transformedContacts
    };
    
    const response = await api.post('/profile/emergency-contacts', requestData);
    return response.data.data;
  }

  // === NEW MULTI-PHOTO METHODS ===

  async getUserPhotos(): Promise<UserPhotosResponse> {
    const response = await api.get('/profile/photos');
    return response.data.data;
  }

  async getUserPhotosById(userId: string): Promise<UserPhotosResponse> {
    const response = await api.get(`/profile/photos/${userId}`);
    return response.data.data;
  }

  async getPhotoTypes(): Promise<PhotoTypesResponse> {
    const response = await api.get('/profile/photo-types');
    return response.data.data;
  }

  async uploadPhotoByType(
    photoType: PhotoType,
    file: File,
    options: PhotoUploadOptions = {}
  ): Promise<ProfilePhoto> {
    const formData = new FormData();
    formData.append('photo', file);
    
    if (options.isPrimary !== undefined) {
      formData.append('isPrimary', String(options.isPrimary));
    }
    
    if (options.description) {
      formData.append('description', options.description);
    }

    const response = await api.post(`/profile/photos/upload/${photoType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async setPrimaryPhoto(photoId: string): Promise<ProfilePhoto> {
    const response = await api.put(`/profile/photos/primary/${photoId}`);
    return response.data.data;
  }

  async deleteSpecificPhoto(photoId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/profile/photos/${photoId}`);
    return response.data.data;
  }

  async getPhotoByType(userId: string, photoType: PhotoType): Promise<Blob> {
    const response = await api.get(`/profile/photo/${userId}/${photoType}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const profileService = new ProfileService();
export default profileService;

// Helper function to get photo URL for display
export const getPhotoUrl = (userId: string, photoType?: PhotoType): string => {
  if (photoType) {
    return `/api/profile/photo/${userId}/${photoType}`;
  }
  return `/api/profile/photo/${userId}`;
};