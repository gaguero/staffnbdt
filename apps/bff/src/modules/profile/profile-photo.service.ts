import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { StorageService } from '../../shared/storage/storage.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { User, PhotoType, ProfilePhoto } from '@prisma/client';

export interface PhotoUploadOptions {
  photoType?: PhotoType;
  isPrimary?: boolean;
  description?: string;
  metadata?: any;
}

export interface PhotoMetadata {
  mimeType: string;
  size: number;
  fileName: string;
}

@Injectable()
export class ProfilePhotoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Upload a new profile photo for a user
   */
  async uploadPhoto(
    userId: string,
    file: Express.Multer.File,
    currentUser: User,
    options: PhotoUploadOptions = {},
  ): Promise<ProfilePhoto> {
    // Users can only upload their own photos unless they're admins
    if (currentUser.id !== userId && !this.canManageUserPhotos(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to upload photos for this user');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      console.log('📸 Starting profile photo upload:', {
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        photoType: options.photoType || PhotoType.FORMAL,
      });

      // Get tenant context for R2 upload
      const tenantContext = this.tenantContextService.getTenantContext(currentUser);

      // Generate file key for photo
      const photoKey = this.storageService.generateTenantFileKey(
        'profiles',
        options.photoType || PhotoType.FORMAL,
        file.originalname,
        tenantContext,
      );

      // Save file to storage (R2 or local)
      const fileBuffer = file.buffer || (file.path ? await require('fs/promises').readFile(file.path) : null);
      if (!fileBuffer) {
        throw new Error('Could not read file data');
      }

      const savedFile = await this.storageService.saveFile(fileBuffer, {
        key: photoKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        tenantContext,
        module: 'profiles',
        type: options.photoType || PhotoType.FORMAL,
      });

      // If this is a primary photo, unset any existing primary photos
      if (options.isPrimary !== false) {
        await this.prisma.profilePhoto.updateMany({
          where: {
            userId,
            isPrimary: true,
            isActive: true,
            deletedAt: null,
          },
          data: { isPrimary: false },
        });
      }

      // Check if user already has this photo type (limit 1 per type)
      const existingPhoto = await this.prisma.profilePhoto.findFirst({
        where: {
          userId,
          photoType: options.photoType || PhotoType.FORMAL,
          isActive: true,
          deletedAt: null,
        },
      });

      if (existingPhoto) {
        // Soft delete the existing photo of this type
        await this.prisma.profilePhoto.update({
          where: { id: existingPhoto.id },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });

        // Delete the old file from storage
        try {
          await this.storageService.deleteFile(existingPhoto.fileKey);
        } catch (error) {
          console.warn('⚠️ Failed to delete old photo file from storage:', error.message);
        }
      }

      // Create ProfilePhoto record
      const profilePhoto = await this.prisma.profilePhoto.create({
        data: {
          userId,
          fileKey: savedFile.key,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: savedFile.size,
          photoType: options.photoType || PhotoType.FORMAL,
          isPrimary: options.isPrimary !== false,
          description: options.description,
          metadata: options.metadata || {},
        },
      });

      // Update user's profilePhoto field for backward compatibility
      if (profilePhoto.isPrimary) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { profilePhoto: `/api/profile/photo/${userId}` },
        });
      }

      await this.auditService.log({
        userId: currentUser.id,
        action: 'UPLOAD_PROFILE_PHOTO',
        entity: 'ProfilePhoto',
        entityId: profilePhoto.id,
        newData: {
          userId,
          fileKey: savedFile.key,
          photoType: profilePhoto.photoType,
          isPrimary: profilePhoto.isPrimary,
          size: savedFile.size,
        },
      });

      console.log('✅ Profile photo uploaded successfully:', profilePhoto.id);
      return profilePhoto;
    } catch (error) {
      console.error('❌ Profile photo upload error:', {
        error: error.message,
        stack: error.stack,
        userId,
        fileName: file?.originalname,
      });

      throw new InternalServerErrorException(
        `Failed to upload profile photo: ${error.message}`
      );
    }
  }

  /**
   * Get all photos for a user
   */
  async getUserPhotos(
    userId: string,
    currentUser: User,
    photoType?: PhotoType,
  ): Promise<ProfilePhoto[]> {
    // Users can view their own photos, admins can view photos in their scope
    if (currentUser.id !== userId && !this.canViewUserPhotos(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to view photos for this user');
    }

    const whereClause: any = {
      userId,
      isActive: true,
      deletedAt: null,
    };

    if (photoType) {
      whereClause.photoType = photoType;
    }

    const photos = await this.prisma.profilePhoto.findMany({
      where: whereClause,
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'VIEW_PROFILE_PHOTOS',
      entity: 'ProfilePhoto',
      entityId: userId,
      newData: { viewedPhotosCount: photos.length, photoType },
    });

    return photos;
  }

  /**
   * Get primary photo for a user
   */
  async getPrimaryPhoto(userId: string, currentUser: User): Promise<ProfilePhoto | null> {
    const photos = await this.getUserPhotos(userId, currentUser);
    return photos.find(photo => photo.isPrimary) || photos[0] || null;
  }

  /**
   * Get photo stream for serving
   */
  async getPhotoStream(
    photoId: string,
    currentUser: User,
  ): Promise<{ stream: any; metadata: PhotoMetadata }> {
    const photo = await this.prisma.profilePhoto.findUnique({
      where: {
        id: photoId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // Check permissions
    if (currentUser.id !== photo.userId && !this.canViewUserPhotos(currentUser, photo.userId)) {
      throw new ForbiddenException('Insufficient permissions to view this photo');
    }

    try {
      // Check if file exists in storage
      const fileExists = await this.storageService.checkFileExists(photo.fileKey);
      if (!fileExists) {
        throw new NotFoundException('Photo file not found in storage');
      }

      // Create read stream
      const stream = await this.storageService.createReadStream(photo.fileKey);

      await this.auditService.log({
        userId: currentUser.id,
        action: 'VIEW_PROFILE_PHOTO',
        entity: 'ProfilePhoto',
        entityId: photo.id,
        newData: { viewedPhotoId: photo.id },
      });

      return {
        stream,
        metadata: {
          mimeType: photo.mimeType,
          size: photo.size,
          fileName: photo.fileName,
        },
      };
    } catch (error) {
      console.error('❌ Photo stream error:', {
        error: error.message,
        photoId,
        fileKey: photo.fileKey,
      });

      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to retrieve photo: ${error.message}`
      );
    }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: string, currentUser: User): Promise<void> {
    const photo = await this.prisma.profilePhoto.findUnique({
      where: {
        id: photoId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // Check permissions
    if (currentUser.id !== photo.userId && !this.canManageUserPhotos(currentUser, photo.userId)) {
      throw new ForbiddenException('Insufficient permissions to delete this photo');
    }

    try {
      // Soft delete the photo record
      await this.prisma.profilePhoto.update({
        where: { id: photoId },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });

      // Delete file from storage
      try {
        await this.storageService.deleteFile(photo.fileKey);
      } catch (error) {
        console.warn('⚠️ Failed to delete photo file from storage:', error.message);
        // Continue even if file deletion fails
      }

      // If this was the primary photo, update user's profilePhoto field
      if (photo.isPrimary) {
        // Find another photo to make primary (prefer FORMAL type)
        const nextPhoto = await this.prisma.profilePhoto.findFirst({
          where: {
            userId: photo.userId,
            isActive: true,
            deletedAt: null,
            id: { not: photoId },
          },
          orderBy: [
            { photoType: 'asc' }, // FORMAL comes first
            { createdAt: 'desc' },
          ],
        });

        if (nextPhoto) {
          await this.prisma.profilePhoto.update({
            where: { id: nextPhoto.id },
            data: { isPrimary: true },
          });
          await this.prisma.user.update({
            where: { id: photo.userId },
            data: { profilePhoto: `/api/profile/photo/${photo.userId}` },
          });
        } else {
          await this.prisma.user.update({
            where: { id: photo.userId },
            data: { profilePhoto: null },
          });
        }
      }

      await this.auditService.log({
        userId: currentUser.id,
        action: 'DELETE_PROFILE_PHOTO',
        entity: 'ProfilePhoto',
        entityId: photo.id,
        oldData: {
          fileKey: photo.fileKey,
          photoType: photo.photoType,
          isPrimary: photo.isPrimary,
        },
      });

      console.log('✅ Profile photo deleted successfully:', photoId);
    } catch (error) {
      console.error('❌ Photo deletion error:', {
        error: error.message,
        photoId,
        fileKey: photo.fileKey,
      });

      throw new InternalServerErrorException(
        `Failed to delete photo: ${error.message}`
      );
    }
  }

  /**
   * Set a photo as primary
   */
  async setPrimaryPhoto(photoId: string, currentUser: User): Promise<ProfilePhoto> {
    const photo = await this.prisma.profilePhoto.findUnique({
      where: {
        id: photoId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // Check permissions
    if (currentUser.id !== photo.userId && !this.canManageUserPhotos(currentUser, photo.userId)) {
      throw new ForbiddenException('Insufficient permissions to manage this photo');
    }

    // Any photo type can be primary

    // Unset any existing primary photos
    await this.prisma.profilePhoto.updateMany({
      where: {
        userId: photo.userId,
        isPrimary: true,
        isActive: true,
        deletedAt: null,
      },
      data: { isPrimary: false },
    });

    // Set this photo as primary
    const updatedPhoto = await this.prisma.profilePhoto.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });

    // Update user's profilePhoto field for backward compatibility
    await this.prisma.user.update({
      where: { id: photo.userId },
      data: { profilePhoto: `/api/profile/photo/${photo.userId}` },
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'SET_PRIMARY_PHOTO',
      entity: 'ProfilePhoto',
      entityId: photo.id,
      newData: { setPrimaryPhoto: true },
    });

    return updatedPhoto;
  }

  /**
   * Check if current user can view photos for target user
   */
  private canViewUserPhotos(currentUser: User, targetUserId: string): boolean {
    // Users can view their own photos
    if (currentUser.id === targetUserId) {
      return true;
    }

    // Platform admins can view any photos
    if (currentUser.role === 'PLATFORM_ADMIN') {
      return true;
    }

    // Department admins can view photos of users in their department
    if (currentUser.role === 'DEPARTMENT_ADMIN') {
      // TODO: Add department-level access check
      return true;
    }

    return false;
  }

  /**
   * Check if current user can manage photos for target user
   */
  private canManageUserPhotos(currentUser: User, targetUserId: string): boolean {
    // Users can manage their own photos
    if (currentUser.id === targetUserId) {
      return true;
    }

    // Platform admins can manage any photos
    if (currentUser.role === 'PLATFORM_ADMIN') {
      return true;
    }

    // Organization owners and admins can manage photos in their scope
    if (currentUser.role === 'ORGANIZATION_OWNER' || currentUser.role === 'ORGANIZATION_ADMIN') {
      // TODO: Add organization-level access check
      return true;
    }

    return false;
  }
}