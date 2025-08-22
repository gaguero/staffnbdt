import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
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
  private readonly logger = new Logger(ProfilePhotoService.name);
  
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
    request: any,
    options: PhotoUploadOptions = {},
  ): Promise<ProfilePhoto> {
    // Users can only upload their own photos unless they're admins
    if (currentUser.id !== userId && !this.canManageUserPhotos(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to upload photos for this user');
    }

    // Get tenant context with fallback
    let tenantContext;
    try {
      tenantContext = this.tenantContextService.getTenantContext(request);
    } catch (error) {
      console.warn('⚠️ No tenant context in upload request, using minimal security check:', error.message);
      // For legacy users without tenant context, we still need basic user verification
      tenantContext = null;
    }
    
    // Verify user exists with flexible tenant filtering
    const whereClause: any = { 
      id: userId, 
      deletedAt: null,
    };
    
    // Add tenant filtering only if we have tenant context
    if (tenantContext?.organizationId) {
      whereClause.organizationId = tenantContext.organizationId;
    }
    
    console.log('👤 Looking up user with criteria:', whereClause);
    
    const user = await this.prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) {
      console.error('❌ User not found for photo upload:', {
        userId,
        requestedBy: currentUser.id,
        tenantContext: this.tenantContextService.getTenantContextSafe(request),
      });
      throw new NotFoundException('User not found or access denied');
    }

    try {
      console.log('📸 Starting profile photo upload:', {
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        photoType: options.photoType || PhotoType.FORMAL,
      });

      // Use tenant context from user verification or create fallback for R2 upload
      if (!tenantContext) {
        // Create fallback tenant context using user's organization/property
        tenantContext = {
          userId: currentUser.id,
          organizationId: user.organizationId || currentUser.organizationId,
          propertyId: user.propertyId || currentUser.propertyId,
          departmentId: user.departmentId || currentUser.departmentId,
          userRole: currentUser.role,
        };
        console.log('📸 Using fallback tenant context for photo upload:', tenantContext);
      } else {
        console.log('📸 Using existing tenant context for photo upload:', tenantContext);
      }

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

      // If this is a primary photo, unset any existing primary photos within tenant
      if (options.isPrimary !== false) {
        await this.prisma.profilePhoto.updateMany({
          where: {
            userId,
            organizationId: tenantContext.organizationId,
            propertyId: tenantContext.propertyId,
            isPrimary: true,
            isActive: true,
            deletedAt: null,
          },
          data: { isPrimary: false },
        });
      }

      // Check if user already has this photo type within tenant (limit 1 per type)
      const existingPhoto = await this.prisma.profilePhoto.findFirst({
        where: {
          userId,
          organizationId: tenantContext.organizationId,
          propertyId: tenantContext.propertyId,
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

      // Create ProfilePhoto record with tenant context
      const profilePhoto = await this.prisma.profilePhoto.create({
        data: {
          userId,
          organizationId: tenantContext.organizationId,
          propertyId: tenantContext.propertyId,
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

      // Check if it's an R2 configuration issue
      if (error.message?.includes('credentials') || error.message?.includes('R2')) {
        console.error('❌ R2 configuration error detected:', error.message);
        throw new InternalServerErrorException(
          'Storage service configuration error. Please check R2 credentials.'
        );
      }
      
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
    request: any,
    photoType?: PhotoType,
  ): Promise<ProfilePhoto[]> {
    // Users can view their own photos, admins can view photos in their scope
    if (currentUser.id !== userId && !this.canViewUserPhotos(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to view photos for this user');
    }

    console.log('📸 Getting user photos:', {
      userId,
      requestedBy: currentUser.id,
      photoType,
    });

    // Enhanced user lookup with multiple fallback strategies
    let targetUser: User | null = null;
    let tenantContext: any = null;
    
    try {
      tenantContext = this.tenantContextService.getTenantContext(request);
      console.log('📸 Tenant context found from request:', tenantContext);
      
      // First, try to find user within the current tenant context
      targetUser = await this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
          organizationId: tenantContext.organizationId,
          ...(tenantContext.propertyId && { propertyId: tenantContext.propertyId }),
        },
      });
      
      console.log('📸 User found in current tenant context:', !!targetUser);
    } catch (error) {
      console.warn('⚠️ No tenant context in request, will use fallback strategies:', error.message);
    }
    
    // Fallback 1: If no user found in tenant context or no tenant context, try with current user's context
    if (!targetUser) {
      console.log('📸 Trying fallback 1: Current user\'s organization context');
      targetUser = await this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
          organizationId: currentUser.organizationId,
        },
      });
      
      if (targetUser) {
        tenantContext = {
          organizationId: currentUser.organizationId,
          propertyId: currentUser.propertyId,
        };
        console.log('📸 User found using current user\'s context:', tenantContext);
      }
    }
    
    // Fallback 2: If still no user found, try without any tenant filtering (legacy mode)
    if (!targetUser) {
      console.log('📸 Trying fallback 2: Legacy mode without tenant filtering');
      targetUser = await this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
      });
      
      if (targetUser) {
        tenantContext = {
          organizationId: targetUser.organizationId,
          propertyId: targetUser.propertyId,
        };
        console.log('📸 User found in legacy mode, using user\'s tenant context:', tenantContext);
      }
    }
    
    // If user still not found, throw error with detailed context
    if (!targetUser) {
      const errorContext = {
        userId,
        requestedBy: currentUser.id,
        requestTenantContext: this.tenantContextService.getTenantContextSafe(request),
        currentUserTenantContext: {
          organizationId: currentUser.organizationId,
          propertyId: currentUser.propertyId,
        },
        timestamp: new Date().toISOString(),
      };
      
      console.error('❌ User not found after all fallback strategies:', errorContext);
      
      this.logger.error('Profile photo user lookup failed', {
        context: 'ProfilePhotoService',
        method: 'getUserPhotos',
        ...errorContext,
      });
      
      throw new NotFoundException(`User not found. The user may not exist, may be deleted, or you may not have access to view their profile photos.`);
    }
    
    // Ensure tenant context is properly set
    if (!tenantContext || (!tenantContext.organizationId && !tenantContext.propertyId)) {
      console.log('📸 No tenant context available, using legacy mode for photos query');
      tenantContext = { organizationId: null, propertyId: null };
    }
    
    const whereClause: any = {
      userId,
      isActive: true,
      deletedAt: null,
    };

    // Enhanced tenant filtering logic that handles legacy photos and edge cases
    if (tenantContext && (tenantContext.organizationId || tenantContext.propertyId)) {
      // Use comprehensive OR logic to include all possible photo scenarios
      const orConditions = [];
      
      // 1. Include legacy photos without any tenant context (for backward compatibility)
      orConditions.push({
        AND: [
          { organizationId: null },
          { propertyId: null },
        ],
      });
      
      // 2. If we have full tenant context, include exact matches
      if (tenantContext.organizationId && tenantContext.propertyId) {
        orConditions.push({
          AND: [
            { organizationId: tenantContext.organizationId },
            { propertyId: tenantContext.propertyId },
          ],
        });
      }
      
      // 3. Include photos that partially match organization (for migration scenarios)
      if (tenantContext.organizationId) {
        orConditions.push({
          AND: [
            { organizationId: tenantContext.organizationId },
            { propertyId: null },
          ],
        });
        
        // 4. Also include any photos in the same organization but different property
        // (for users who moved between properties)
        orConditions.push({
          AND: [
            { organizationId: tenantContext.organizationId },
            { propertyId: { not: null } },
          ],
        });
      }
      
      // 5. Include photos that match only the property (edge case for property transfers)
      if (tenantContext.propertyId) {
        orConditions.push({
          AND: [
            { organizationId: null },
            { propertyId: tenantContext.propertyId },
          ],
        });
      }
      
      whereClause.OR = orConditions;
      console.log(`📸 Using ${orConditions.length} OR conditions for comprehensive tenant filtering`);
    } else {
      console.log('📸 No tenant context available, searching all photos for user (full legacy mode)');
      // In full legacy mode, we don't add any tenant filtering
    }

    if (photoType) {
      whereClause.photoType = photoType;
    }

    console.log('📸 Final query where clause:', JSON.stringify(whereClause, null, 2));

    try {
      const photos = await this.prisma.profilePhoto.findMany({
        where: whereClause,
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      console.log(`📸 Found ${photos.length} photos for user ${userId}`);

      // Log successful photo retrieval with context
      await this.auditService.log({
        userId: currentUser.id,
        action: 'VIEW_PROFILE_PHOTOS',
        entity: 'ProfilePhoto',
        entityId: userId,
        newData: { 
          viewedPhotosCount: photos.length, 
          photoType,
          tenantContext: tenantContext,
          targetUserFound: true,
        },
      });

      return photos;
    } catch (error) {
      console.error('❌ Error retrieving profile photos:', {
        userId,
        requestedBy: currentUser.id,
        error: error.message,
        whereClause,
        tenantContext,
      });
      
      this.logger.error('Profile photo retrieval failed', {
        context: 'ProfilePhotoService',
        method: 'getUserPhotos',
        userId,
        requestedBy: currentUser.id,
        error: error.message,
        stack: error.stack,
      });
      
      throw new InternalServerErrorException(`Failed to retrieve profile photos: ${error.message}`);
    }
  }

  /**
   * Get primary photo for a user
   */
  async getPrimaryPhoto(userId: string, currentUser: User, request: any): Promise<ProfilePhoto | null> {
    const photos = await this.getUserPhotos(userId, currentUser, request);
    return photos.find(photo => photo.isPrimary) || photos[0] || null;
  }

  /**
   * Get photo stream for serving
   */
  async getPhotoStream(
    photoId: string,
    currentUser: User,
    request?: any,
  ): Promise<{ stream: any; metadata: PhotoMetadata }> {
    // Get tenant context for security - if no request provided, use user's org/property from DB
    let tenantContext;
    if (request) {
      try {
        tenantContext = this.tenantContextService.getTenantContext(request);
      } catch (error) {
        console.warn('⚠️ No tenant context in request for photo stream, using user context:', error.message);
        tenantContext = {
          userId: currentUser.id,
          organizationId: currentUser.organizationId,
          propertyId: currentUser.propertyId,
          departmentId: currentUser.departmentId,
          userRole: currentUser.role,
        };
      }
    } else {
      // Fallback: create minimal tenant context from user data
      tenantContext = {
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        propertyId: currentUser.propertyId,
        departmentId: currentUser.departmentId,
        userRole: currentUser.role,
      };
    }
    
    // Try to find photo with flexible tenant filtering
    let photo = await this.prisma.profilePhoto.findFirst({
      where: {
        id: photoId,
        isActive: true,
        deletedAt: null,
        OR: [
          {
            // Legacy photos without tenant context
            organizationId: null,
            propertyId: null,
          },
          {
            // Photos with matching tenant context
            organizationId: tenantContext.organizationId,
            propertyId: tenantContext.propertyId,
          },
          {
            // Photos with partial tenant context (for migration scenarios)
            organizationId: tenantContext.organizationId,
            propertyId: null,
          },
        ],
      },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (!photo) {
      console.error('❌ Photo not found with flexible filtering:', {
        photoId,
        tenantContext,
        currentUserId: currentUser.id,
      });
      throw new NotFoundException('Photo not found');
    }

    // Check permissions - users can only view their own photos or photos they have admin access to
    if (currentUser.id !== photo.userId && !this.canViewUserPhotos(currentUser, photo.userId)) {
      console.error('❌ Insufficient permissions to view photo:', {
        photoId,
        photoUserId: photo.userId,
        currentUserId: currentUser.id,
      });
      throw new ForbiddenException('Insufficient permissions to view this photo');
    }

    console.log('📸 Photo access granted:', {
      photoId,
      photoUserId: photo.userId,
      currentUserId: currentUser.id,
      fileKey: photo.fileKey,
    });

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
  async deletePhoto(photoId: string, currentUser: User, request?: any): Promise<void> {
    // Get tenant context for security - if no request provided, use user's org/property from DB
    let tenantContext;
    if (request) {
      try {
        tenantContext = this.tenantContextService.getTenantContext(request);
      } catch (error) {
        console.warn('⚠️ No tenant context in request for photo deletion, using user context:', error.message);
        tenantContext = {
          userId: currentUser.id,
          organizationId: currentUser.organizationId,
          propertyId: currentUser.propertyId,
          departmentId: currentUser.departmentId,
          userRole: currentUser.role,
        };
      }
    } else {
      // Fallback: create minimal tenant context from user data
      tenantContext = {
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        propertyId: currentUser.propertyId,
        departmentId: currentUser.departmentId,
        userRole: currentUser.role,
      };
    }
    
    const photo = await this.prisma.profilePhoto.findFirst({
      where: {
        id: photoId,
        isActive: true,
        deletedAt: null,
        OR: [
          {
            // Legacy photos without tenant context
            organizationId: null,
            propertyId: null,
          },
          {
            // Photos with matching tenant context
            organizationId: tenantContext.organizationId,
            propertyId: tenantContext.propertyId,
          },
          {
            // Photos with partial tenant context
            organizationId: tenantContext.organizationId,
            propertyId: null,
          },
        ],
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
            organizationId: photo.organizationId,
            propertyId: photo.propertyId,
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
  async setPrimaryPhoto(photoId: string, currentUser: User, request?: any): Promise<ProfilePhoto> {
    // Get tenant context for security - if no request provided, use user's org/property from DB
    let tenantContext;
    if (request) {
      try {
        tenantContext = this.tenantContextService.getTenantContext(request);
      } catch (error) {
        console.warn('⚠️ No tenant context in request for setting primary photo, using user context:', error.message);
        tenantContext = {
          userId: currentUser.id,
          organizationId: currentUser.organizationId,
          propertyId: currentUser.propertyId,
          departmentId: currentUser.departmentId,
          userRole: currentUser.role,
        };
      }
    } else {
      // Fallback: create minimal tenant context from user data
      tenantContext = {
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        propertyId: currentUser.propertyId,
        departmentId: currentUser.departmentId,
        userRole: currentUser.role,
      };
    }
    
    const photo = await this.prisma.profilePhoto.findFirst({
      where: {
        id: photoId,
        isActive: true,
        deletedAt: null,
        OR: [
          {
            // Legacy photos without tenant context
            organizationId: null,
            propertyId: null,
          },
          {
            // Photos with matching tenant context
            organizationId: tenantContext.organizationId,
            propertyId: tenantContext.propertyId,
          },
          {
            // Photos with partial tenant context
            organizationId: tenantContext.organizationId,
            propertyId: null,
          },
        ],
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

    // Unset any existing primary photos for this user (handle both legacy and tenant-scoped photos)
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