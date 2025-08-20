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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ProfileService } from './profile.service';
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
} from './dto';
import { profilePhotoConfig, idDocumentConfig } from './config/multer.config';
import { User, Role } from '@prisma/client';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Profile photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file' })
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
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
      const result = await this.profileService.uploadProfilePhoto(
        currentUser.id,
        file,
        currentUser,
      );
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

      const { stream, metadata } = await this.profileService.getProfilePhotoStream(userId, currentUser);
      
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
    @Res() res: Response,
  ) {
    return this.getProfilePhoto(currentUser.id, currentUser, res);
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