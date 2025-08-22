import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { ProfileService } from './profile.service';
import { ProfilePhotoService } from './profile-photo.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RequirePermission, PERMISSIONS } from '../../shared/decorators/require-permission.decorator';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { 
  UpdateProfileDto, 
  UpdateEmergencyContactsDto, 
  VerifyIdDocumentDto,
  ProfileResponseDto,
  IdDocumentStatusDto,
  UploadProfilePhotoDto,
  ProfilePhotoResponseDto,
  UserPhotosResponseDto,
  PhotoTypesResponseDto,
  SetPrimaryPhotoDto,
} from './dto';
import { profilePhotoConfig, idDocumentConfig } from './config/multer.config';
import { User, Role, PhotoType } from '@prisma/client';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly profilePhotoService: ProfilePhotoService,
  ) {}

  @Get()
  @RequirePermission('user.read.own')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileResponseDto })
  async getProfile(@CurrentUser() currentUser: User) {
    const profile = await this.profileService.getProfile(currentUser.id, currentUser);
    return CustomApiResponse.success(profile, 'Profile retrieved successfully');
  }

  @Get(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.DEPARTMENT_ADMIN)  // Backwards compatibility
  @RequirePermission('user.read.all', 'user.read.organization', 'user.read.property', 'user.read.department')
  @Audit({ action: 'VIEW_PROFILE', entity: 'User' })
  @ApiOperation({ summary: 'Get user profile by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfileById(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const profile = await this.profileService.getProfile(id, currentUser);
    return CustomApiResponse.success(profile, 'Profile retrieved successfully');
  }

  @Put()
  @RequirePermission('user.update.own')
  @Audit({ action: 'UPDATE_PROFILE', entity: 'User' })
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() currentUser: User,
  ) {
    const updatedProfile = await this.profileService.updateProfile(
      currentUser.id,
      updateProfileDto,
      currentUser,
    );
    return CustomApiResponse.success(updatedProfile, 'Profile updated successfully');
  }

  @Post('photo')
  @RequirePermission('user.update.own')
  @UseInterceptors(FileInterceptor('photo', profilePhotoConfig))
  @Audit({ action: 'UPLOAD_PROFILE_PHOTO', entity: 'User' })
  @ApiOperation({ summary: 'Upload profile photo (legacy endpoint)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Profile photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file' })
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
    @Req() request: Request,
  ) {
    console.log('📸 Profile photo upload request:', {
      userId: currentUser.id,
      file: file ? {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        filename: file.filename,
        path: file.path,
      } : null,
    });

    if (!file) {
      console.error('❌ No file uploaded in profile photo endpoint');
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Use new ProfilePhotoService for multiple photo support
      const profilePhoto = await this.profilePhotoService.uploadPhoto(
        currentUser.id,
        file,
        currentUser,
        request,
        { photoType: PhotoType.FORMAL, isPrimary: true }, // Legacy endpoint defaults to FORMAL
      );
      
      const result = {
        profilePhoto: `/api/profile/photo/${currentUser.id}`,
        profilePhotoKey: profilePhoto.fileKey,
        size: profilePhoto.size,
        photoId: profilePhoto.id,
      };
      
      console.log('✅ Profile photo uploaded successfully:', result);
      return CustomApiResponse.success(result, 'Profile photo uploaded successfully');
    } catch (error) {
      console.error('❌ Profile photo upload failed:', {
        error: error.message,
        stack: error.stack,
        userId: currentUser.id,
        fileName: file?.filename,
      });
      throw error;
    }
  }

  @Delete('photo')
  @RequirePermission('user.update.own')
  @Audit({ action: 'DELETE_PROFILE_PHOTO', entity: 'User' })
  @ApiOperation({ summary: 'Delete profile photo' })
  @ApiResponse({ status: 200, description: 'Profile photo deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - No photo to delete' })
  async deleteProfilePhoto(@CurrentUser() currentUser: User) {
    const result = await this.profileService.deleteProfilePhoto(currentUser.id, currentUser);
    return CustomApiResponse.success(result, 'Profile photo deleted successfully');
  }

  @Post('id')
  @RequirePermission('user.update.own')
  @UseInterceptors(FileInterceptor('idDocument', idDocumentConfig))
  @Audit({ action: 'UPLOAD_ID_DOCUMENT', entity: 'User' })
  @ApiOperation({ summary: 'Upload ID document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'ID document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file' })
  async uploadIdDocument(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const result = await this.profileService.uploadIdDocument(
      currentUser.id,
      file,
      currentUser,
    );
    return CustomApiResponse.success(result, 'ID document uploaded successfully');
  }

  @Get('id/:userId')
  @Roles(Role.PLATFORM_ADMIN, Role.DEPARTMENT_ADMIN)  // Backwards compatibility
  @RequirePermission('user.read.all', 'user.read.organization', 'user.read.property', 'user.read.department')
  @Audit({ action: 'VIEW_ID_DOCUMENT', entity: 'User' })
  @ApiOperation({ summary: 'Get ID document (Admin only)' })
  @ApiResponse({ status: 200, description: 'ID document retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 404, description: 'ID document not found' })
  async getIdDocument(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
    @Res() res: Response,
  ) {
    try {
      const { stream, metadata } = await this.profileService.getIdDocumentStream(userId, currentUser);
      
      console.log('📄 Serving ID document:', {
        userId,
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        size: metadata.size,
      });
      
      // Set headers
      res.setHeader('Content-Type', metadata.mimeType);
      res.setHeader('Content-Length', metadata.size);
      res.setHeader('Content-Disposition', `inline; filename="${metadata.originalName}"`);
      
      // Stream the file
      stream.pipe(res);
      console.log('✅ ID document served successfully');
    } catch (error) {
      console.error('❌ Failed to serve ID document:', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  @Post('id/:userId/verify')
  @Roles(Role.PLATFORM_ADMIN, Role.DEPARTMENT_ADMIN)  // Backwards compatibility
  @RequirePermission('user.update.all', 'user.update.organization', 'user.update.property', 'user.update.department')
  @Audit({ action: 'VERIFY_ID_DOCUMENT', entity: 'User' })
  @ApiOperation({ summary: 'Verify ID document (Admin only)' })
  @ApiResponse({ status: 200, description: 'ID document verification updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 404, description: 'ID document not found' })
  async verifyIdDocument(
    @Param('userId') userId: string,
    @Body() verifyIdDocumentDto: VerifyIdDocumentDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.profileService.verifyIdDocument(
      userId,
      verifyIdDocumentDto,
      currentUser,
    );
    return CustomApiResponse.success(result, 'ID document verification updated successfully');
  }

  @Get('id/status')
  @RequirePermission('user.read.own')
  @ApiOperation({ summary: 'Get ID document verification status' })
  @ApiResponse({ status: 200, description: 'ID document status retrieved successfully', type: IdDocumentStatusDto })
  async getIdDocumentStatus(@CurrentUser() currentUser: User) {
    const status = await this.profileService.getIdDocumentStatus(currentUser.id, currentUser);
    return CustomApiResponse.success(status, 'ID document status retrieved successfully');
  }

  @Get('id/:userId/status')
  @Roles(Role.PLATFORM_ADMIN, Role.DEPARTMENT_ADMIN)  // Backwards compatibility
  @RequirePermission('user.read.all', 'user.read.organization', 'user.read.property', 'user.read.department')
  @ApiOperation({ summary: 'Get ID document verification status for user (Admin only)' })
  @ApiResponse({ status: 200, description: 'ID document status retrieved successfully', type: IdDocumentStatusDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getIdDocumentStatusForUser(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
  ) {
    const status = await this.profileService.getIdDocumentStatus(userId, currentUser);
    return CustomApiResponse.success(status, 'ID document status retrieved successfully');
  }

  @Get('photo/:userId')
  @RequirePermission('user.read.own', 'user.read.all', 'user.read.organization', 'user.read.property', 'user.read.department')
  @Audit({ action: 'VIEW_PROFILE_PHOTO', entity: 'User' })
  @ApiOperation({ summary: 'Get user profile photo' })
  @ApiResponse({ status: 200, description: 'Profile photo retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile photo not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getProfilePhoto(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    try {
      console.log('📸 Profile photo request:', {
        userId,
        requestedBy: currentUser.id,
        isOwnPhoto: currentUser.id === userId,
      });

      // Check if user can access this photo
      if (currentUser.id !== userId && !this.canViewProfile(currentUser, userId)) {
        throw new ForbiddenException('Insufficient permissions to view this profile photo');
      }

      // Get primary photo for the user
      const primaryPhoto = await this.profilePhotoService.getPrimaryPhoto(userId, currentUser, request);
      
      if (!primaryPhoto) {
        throw new NotFoundException('No profile photo found for this user');
      }
      
      const { stream, metadata } = await this.profilePhotoService.getPhotoStream(primaryPhoto.id, currentUser, request);
      
      console.log('📸 Serving profile photo:', {
        userId,
        mimeType: metadata.mimeType,
        size: metadata.size,
      });
      
      // Set headers
      res.setHeader('Content-Type', metadata.mimeType || 'image/jpeg');
      res.setHeader('Content-Length', metadata.size.toString());
      res.setHeader('Content-Disposition', `inline; filename="profile-${userId}.jpg"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      
      // Stream the file
      stream.pipe(res);
      console.log('✅ Profile photo served successfully');
    } catch (error) {
      console.error('❌ Failed to serve profile photo:', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  @Get('photo')
  @RequirePermission('user.read.own')
  @ApiOperation({ summary: 'Get current user profile photo' })
  @ApiResponse({ status: 200, description: 'Profile photo retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile photo not found' })
  async getCurrentUserProfilePhoto(
    @CurrentUser() currentUser: User,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    return this.getProfilePhoto(currentUser.id, currentUser, request, res);
  }

  @Post('emergency-contacts')
  @RequirePermission('user.update.own')
  @Audit({ action: 'UPDATE_EMERGENCY_CONTACTS', entity: 'User' })
  @ApiOperation({ summary: 'Update emergency contacts' })
  @ApiResponse({ status: 200, description: 'Emergency contacts updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid contacts data' })
  async updateEmergencyContacts(
    @Body() updateEmergencyContactsDto: UpdateEmergencyContactsDto,
    @CurrentUser() currentUser: User,
  ) {
    console.log('🔍 Emergency contacts endpoint hit by user:', currentUser.id);
    console.log('🔍 Raw request body:', JSON.stringify(updateEmergencyContactsDto, null, 2));
    
    try {
      const result = await this.profileService.updateEmergencyContacts(
        currentUser.id,
        updateEmergencyContactsDto,
        currentUser,
      );
      console.log('✅ Emergency contacts updated successfully');
      return CustomApiResponse.success(result, 'Emergency contacts updated successfully');
    } catch (error) {
      console.error('❌ Emergency contacts update failed:', error.message);
      throw error;
    }
  }

  // === NEW MULTI-PHOTO ENDPOINTS ===

  @Post('photos/upload/:photoType')
  @RequirePermission('user.update.own')
  @UseInterceptors(FileInterceptor('photo', profilePhotoConfig))
  @Audit({ action: 'UPLOAD_PROFILE_PHOTO', entity: 'ProfilePhoto' })
  @ApiOperation({ summary: 'Upload photo by type (FORMAL, CASUAL, UNIFORM, FUNNY)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully', type: ProfilePhotoResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file or photo type' })
  async uploadPhotoByType(
    @Param('photoType') photoType: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadProfilePhotoDto,
    @CurrentUser() currentUser: User,
    @Req() request: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate photo type
    if (!Object.values(PhotoType).includes(photoType as PhotoType)) {
      throw new BadRequestException(`Invalid photo type. Must be one of: ${Object.values(PhotoType).join(', ')}`);
    }

    try {
      const profilePhoto = await this.profilePhotoService.uploadPhoto(
        currentUser.id,
        file,
        currentUser,
        request,
        {
          photoType: photoType as PhotoType,
          isPrimary: uploadDto.isPrimary || false,
          description: uploadDto.description,
        },
      );

      return CustomApiResponse.success(profilePhoto, `${photoType} photo uploaded successfully`);
    } catch (error) {
      console.error(`❌ ${photoType} photo upload failed:`, error);
      throw error;
    }
  }

  @Get('photos')
  @RequirePermission('user.read.own')
  @ApiOperation({ summary: 'Get all photos for current user' })
  @ApiResponse({ status: 200, description: 'User photos retrieved successfully', type: UserPhotosResponseDto })
  async getCurrentUserPhotos(
    @CurrentUser() currentUser: User,
    @Req() request: Request,
  ) {
    console.log('📸 GET /api/profile/photos - User:', currentUser.id, `(${currentUser.email})`);
    
    try {
      // Validate user context
      if (!currentUser || !currentUser.id) {
        console.error('❌ Invalid user context in getCurrentUserPhotos');
        throw new UnauthorizedException('Invalid user session');
      }

      // Additional debug info for troubleshooting
      console.log('👤 User context in getCurrentUserPhotos:', {
        userId: currentUser.id,
        email: currentUser.email,
        organizationId: currentUser.organizationId,
        propertyId: currentUser.propertyId,
        role: currentUser.role,
      });

      const photos = await this.profilePhotoService.getUserPhotos(currentUser.id, currentUser, request);
      
      const photosByType = {
        [PhotoType.FORMAL]: 0,
        [PhotoType.CASUAL]: 0,
        [PhotoType.UNIFORM]: 0,
        [PhotoType.FUNNY]: 0,
      };

      photos.forEach(photo => {
        photosByType[photo.photoType]++;
      });

      const primaryPhoto = photos.find(photo => photo.isPrimary) || null;

      const result = {
        photos,
        photosByType,
        primaryPhoto,
      };

      console.log(`✅ Profile photos retrieved successfully for ${currentUser.email}: ${photos.length} photos`);
      return CustomApiResponse.success(result, 'User photos retrieved successfully');
      
    } catch (error) {
      console.error('❌ Failed to get user photos:', {
        error: error.message,
        userId: currentUser?.id || 'unknown',
        userEmail: currentUser?.email || 'unknown',
        errorType: error.constructor.name,
      });
      
      // Re-throw with proper error handling
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        message: 'Failed to retrieve profile photos',
        details: 'Please try again or contact support if the issue persists.'
      });
    }
  }

  @Get('photos/:userId')
  @Roles(Role.PLATFORM_ADMIN, Role.DEPARTMENT_ADMIN)
  @RequirePermission('user.read.all', 'user.read.organization', 'user.read.property', 'user.read.department')
  @ApiOperation({ summary: 'Get all photos for user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User photos retrieved successfully', type: UserPhotosResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPhotos(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
    @Req() request: Request,
  ) {
    const photos = await this.profilePhotoService.getUserPhotos(userId, currentUser, request);
    
    const photosByType = {
      [PhotoType.FORMAL]: 0,
      [PhotoType.CASUAL]: 0,
      [PhotoType.UNIFORM]: 0,
      [PhotoType.FUNNY]: 0,
    };

    photos.forEach(photo => {
      photosByType[photo.photoType]++;
    });

    const primaryPhoto = photos.find(photo => photo.isPrimary) || null;

    const result = {
      photos,
      photosByType,
      primaryPhoto,
    };

    return CustomApiResponse.success(result, 'User photos retrieved successfully');
  }

  @Get('photo-types')
  @RequirePermission('user.read.own')
  @ApiOperation({ summary: 'Get photo types and their status for current user' })
  @ApiResponse({ status: 200, description: 'Photo types retrieved successfully', type: PhotoTypesResponseDto })
  async getPhotoTypes(
    @CurrentUser() currentUser: User,
    @Req() request: Request,
  ) {
    const photos = await this.profilePhotoService.getUserPhotos(currentUser.id, currentUser, request);
    
    const photoTypeDescriptions = {
      [PhotoType.FORMAL]: {
        displayName: 'Formal',
        description: 'Professional headshot for employee directory and formal communications',
      },
      [PhotoType.CASUAL]: {
        displayName: 'Casual',
        description: 'Relaxed photo for team building and social interactions',
      },
      [PhotoType.UNIFORM]: {
        displayName: 'Uniform',
        description: 'Photo in work uniform or professional attire for operational use',
      },
      [PhotoType.FUNNY]: {
        displayName: 'Fun',
        description: 'Lighthearted photo for team activities and informal communications',
      },
    };

    const photoTypes = Object.values(PhotoType).map(type => {
      const photo = photos.find(p => p.photoType === type);
      return {
        type,
        displayName: photoTypeDescriptions[type].displayName,
        description: photoTypeDescriptions[type].description,
        hasPhoto: !!photo,
        photoUrl: photo ? `/api/profile/photo/${currentUser.id}/${type}` : null,
      };
    });

    return CustomApiResponse.success({ photoTypes }, 'Photo types retrieved successfully');
  }

  @Get('photo/:userId/:photoType')
  @RequirePermission('user.read.own', 'user.read.all', 'user.read.organization', 'user.read.property', 'user.read.department')
  @ApiOperation({ summary: 'Get specific photo type for user' })
  @ApiResponse({ status: 200, description: 'Photo retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async getPhotoByType(
    @Param('userId') userId: string,
    @Param('photoType') photoType: string,
    @CurrentUser() currentUser: User,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    // Validate photo type
    if (!Object.values(PhotoType).includes(photoType as PhotoType)) {
      throw new BadRequestException(`Invalid photo type. Must be one of: ${Object.values(PhotoType).join(', ')}`);
    }

    // Check permissions
    if (currentUser.id !== userId && !this.canViewProfile(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to view this photo');
    }

    try {
      const photos = await this.profilePhotoService.getUserPhotos(userId, currentUser, request, photoType as PhotoType);
      
      if (!photos.length) {
        throw new NotFoundException(`No ${photoType} photo found for this user`);
      }

      const photo = photos[0]; // Get the photo of this type
      const { stream, metadata } = await this.profilePhotoService.getPhotoStream(photo.id, currentUser, request);
      
      // Set headers
      res.setHeader('Content-Type', metadata.mimeType || 'image/jpeg');
      res.setHeader('Content-Length', metadata.size.toString());
      res.setHeader('Content-Disposition', `inline; filename="${photoType}-${userId}.jpg"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      
      // Stream the file
      stream.pipe(res);
    } catch (error) {
      console.error(`❌ Failed to serve ${photoType} photo:`, error);
      throw error;
    }
  }

  @Put('photos/primary/:photoId')
  @RequirePermission('user.update.own')
  @Audit({ action: 'SET_PRIMARY_PHOTO', entity: 'ProfilePhoto' })
  @ApiOperation({ summary: 'Set photo as primary' })
  @ApiResponse({ status: 200, description: 'Primary photo updated successfully', type: ProfilePhotoResponseDto })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async setPrimaryPhoto(
    @Param('photoId') photoId: string,
    @CurrentUser() currentUser: User,
    @Req() request: Request,
  ) {
    const updatedPhoto = await this.profilePhotoService.setPrimaryPhoto(photoId, currentUser, request);
    return CustomApiResponse.success(updatedPhoto, 'Primary photo updated successfully');
  }

  @Delete('photos/:photoId')
  @RequirePermission('user.update.own')
  @Audit({ action: 'DELETE_PROFILE_PHOTO', entity: 'ProfilePhoto' })
  @ApiOperation({ summary: 'Delete specific photo' })
  @ApiResponse({ status: 200, description: 'Photo deleted successfully' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async deleteSpecificPhoto(
    @Param('photoId') photoId: string,
    @CurrentUser() currentUser: User,
    @Req() request: Request,
  ) {
    await this.profilePhotoService.deletePhoto(photoId, currentUser, request);
    return CustomApiResponse.success(null, 'Photo deleted successfully');
  }

  private canViewProfile(currentUser: User, targetUserId: string): boolean {
    if (currentUser.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      // Department admins can view profiles in their department
      // This would need to be checked against the target user's department
      return true; // Simplified for now
    }

    return currentUser.id === targetUserId;
  }
}