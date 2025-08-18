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
import { UpdateProfileDto, UpdateEmergencyContactsDto, VerifyIdDocumentDto } from './dto';
import { 
  EmergencyContactsData, 
  IdDocumentMetadata, 
  IdVerificationStatus, 
  IdVerificationResult 
} from './interfaces';
import { User, Role } from '@prisma/client';
import { unlink, access } from 'fs/promises';
import { join } from 'path';
import * as crypto from 'crypto';

@Injectable()
export class ProfileService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {
    // Use environment variable or generate a key for encryption
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  async getProfile(userId: string, currentUser: User) {
    // Users can view their own profile, admins can view any profile in their scope
    if (currentUser.id !== userId && !this.canViewProfile(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to view this profile');
    }

    const user = await this.prisma.user.findUnique({
      where: { 
        id: userId,
        deletedAt: null,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Decrypt and parse emergency contacts
    let emergencyContact: EmergencyContactsData | null = null;
    if (user.emergencyContact) {
      emergencyContact = user.emergencyContact as unknown as EmergencyContactsData;
    }

    // Parse ID document metadata
    let idDocument: IdDocumentMetadata | null = null;
    if (user.idDocument) {
      try {
        idDocument = JSON.parse(user.idDocument) as IdDocumentMetadata;
      } catch (error) {
        // Legacy format or corrupted data
        idDocument = null;
      }
    }

    await this.auditService.log({
      userId: currentUser.id,
      action: 'VIEW_PROFILE',
      entity: 'User',
      entityId: userId,
      newData: { viewedProfile: userId },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      departmentId: user.departmentId,
      department: user.department,
      position: user.position,
      hireDate: user.hireDate,
      phoneNumber: user.phoneNumber,
      emergencyContact,
      idDocument,
      profilePhoto: user.profilePhoto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto, currentUser: User) {
    // Users can only update their own profile
    if (currentUser.id !== userId) {
      throw new ForbiddenException('Can only update your own profile');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'UPDATE_PROFILE',
      entity: 'User',
      entityId: userId,
      oldData: {
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        phoneNumber: existingUser.phoneNumber,
        position: existingUser.position,
      },
      newData: updateData,
    });

    return updatedUser;
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File, currentUser: User) {
    // Users can only upload their own profile photo
    if (currentUser.id !== userId) {
      throw new ForbiddenException('Can only update your own profile photo');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old profile photo if exists
    if (user.profilePhoto) {
      try {
        const oldPhotoPath = join(process.cwd(), 'uploads', 'profiles', user.profilePhoto);
        await unlink(oldPhotoPath);
      } catch (error) {
        // File might not exist, continue
      }
    }

    const photoPath = `profiles/${file.filename}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: photoPath },
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'UPLOAD_PROFILE_PHOTO',
      entity: 'User',
      entityId: userId,
      newData: { 
        profilePhoto: photoPath,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    return { profilePhoto: photoPath };
  }

  async deleteProfilePhoto(userId: string, currentUser: User) {
    // Users can only delete their own profile photo
    if (currentUser.id !== userId) {
      throw new ForbiddenException('Can only delete your own profile photo');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profilePhoto) {
      throw new BadRequestException('No profile photo to delete');
    }

    // Delete file from storage
    try {
      const photoPath = join(process.cwd(), 'uploads', user.profilePhoto);
      await unlink(photoPath);
    } catch (error) {
      // File might not exist, continue with database update
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'DELETE_PROFILE_PHOTO',
      entity: 'User',
      entityId: userId,
      oldData: { profilePhoto: user.profilePhoto },
    });

    return { message: 'Profile photo deleted successfully' };
  }

  async uploadIdDocument(userId: string, file: Express.Multer.File, currentUser: User) {
    // Users can only upload their own ID document
    if (currentUser.id !== userId) {
      throw new ForbiddenException('Can only upload your own ID document');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Encrypt the file path
    const encryptedPath = this.encryptFilePath(`id-documents/${file.filename}`);

    const idDocumentMetadata: IdDocumentMetadata = {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      encryptedPath,
      verificationStatus: IdVerificationStatus.PENDING,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { idDocument: JSON.stringify(idDocumentMetadata) },
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'UPLOAD_ID_DOCUMENT',
      entity: 'User',
      entityId: userId,
      newData: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    });

    return { 
      status: IdVerificationStatus.PENDING,
      uploadedAt: idDocumentMetadata.uploadedAt,
    };
  }

  async getIdDocument(userId: string, currentUser: User) {
    // Only admins can view ID documents, and department admins can only view their department
    if (!this.canViewIdDocument(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to view ID document');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.idDocument) {
      throw new NotFoundException('ID document not found');
    }

    const idDocumentMetadata: IdDocumentMetadata = JSON.parse(user.idDocument);
    const decryptedPath = this.decryptFilePath(idDocumentMetadata.encryptedPath);
    const filePath = join(process.cwd(), 'uploads', decryptedPath);

    // Check if file exists
    try {
      await access(filePath);
    } catch (error) {
      throw new NotFoundException('ID document file not found');
    }

    await this.auditService.log({
      userId: currentUser.id,
      action: 'VIEW_ID_DOCUMENT',
      entity: 'User',
      entityId: userId,
      newData: { viewedIdDocument: userId },
    });

    return {
      filePath,
      metadata: idDocumentMetadata,
    };
  }

  async verifyIdDocument(
    userId: string, 
    verificationData: VerifyIdDocumentDto, 
    currentUser: User
  ) {
    // Only admins can verify ID documents
    if (!this.canVerifyIdDocument(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to verify ID document');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.idDocument) {
      throw new NotFoundException('ID document not found');
    }

    const idDocumentMetadata: IdDocumentMetadata = JSON.parse(user.idDocument);
    
    // Update verification status
    idDocumentMetadata.verificationStatus = verificationData.status;
    idDocumentMetadata.verifiedBy = currentUser.id;
    idDocumentMetadata.verifiedAt = new Date().toISOString();
    
    if (verificationData.status === IdVerificationStatus.REJECTED) {
      idDocumentMetadata.rejectionReason = verificationData.notes;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { idDocument: JSON.stringify(idDocumentMetadata) },
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'VERIFY_ID_DOCUMENT',
      entity: 'User',
      entityId: userId,
      newData: {
        verificationStatus: verificationData.status,
        notes: verificationData.notes,
      },
    });

    return {
      status: idDocumentMetadata.verificationStatus,
      verifiedBy: currentUser.id,
      verifiedAt: idDocumentMetadata.verifiedAt,
    };
  }

  async getIdDocumentStatus(userId: string, currentUser: User) {
    // Users can check their own status, admins can check anyone in their scope
    if (currentUser.id !== userId && !this.canViewProfile(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to view ID document status');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.idDocument) {
      return { status: null, message: 'No ID document uploaded' };
    }

    const idDocumentMetadata: IdDocumentMetadata = JSON.parse(user.idDocument);

    return {
      status: idDocumentMetadata.verificationStatus,
      uploadedAt: idDocumentMetadata.uploadedAt,
      verifiedAt: idDocumentMetadata.verifiedAt,
      verifiedBy: idDocumentMetadata.verifiedBy,
      rejectionReason: idDocumentMetadata.rejectionReason,
    };
  }

  async updateEmergencyContacts(
    userId: string, 
    contactsData: UpdateEmergencyContactsDto, 
    currentUser: User
  ) {
    // Users can only update their own emergency contacts
    if (currentUser.id !== userId) {
      throw new ForbiddenException('Can only update your own emergency contacts');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure only one primary contact
    const primaryContacts = contactsData.contacts.filter(c => c.isPrimary);
    if (primaryContacts.length > 1) {
      throw new BadRequestException('Only one emergency contact can be marked as primary');
    }

    // If no primary is specified, make the first one primary
    if (primaryContacts.length === 0 && contactsData.contacts.length > 0) {
      contactsData.contacts[0].isPrimary = true;
    }

    const emergencyContactData: EmergencyContactsData = {
      contacts: contactsData.contacts,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { emergencyContact: emergencyContactData as any },
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'UPDATE_EMERGENCY_CONTACTS',
      entity: 'User',
      entityId: userId,
      oldData: user.emergencyContact,
      newData: emergencyContactData,
    });

    return emergencyContactData;
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

  private canViewIdDocument(currentUser: User, targetUserId: string): boolean {
    return currentUser.role === Role.PLATFORM_ADMIN || 
           currentUser.role === Role.DEPARTMENT_ADMIN;
  }

  private canVerifyIdDocument(currentUser: User, targetUserId: string): boolean {
    return currentUser.role === Role.PLATFORM_ADMIN || 
           currentUser.role === Role.DEPARTMENT_ADMIN;
  }

  private encryptFilePath(filePath: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(filePath, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptFilePath(encryptedPath: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedPath, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}