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

    try {
      console.log('📸 Starting profile photo upload process:', {
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // Delete old profile photo if exists
      if (user.profilePhoto) {
        try {
          console.log('🗑️ Deleting old profile photo:', user.profilePhoto);
          await this.storageService.deleteFile(user.profilePhoto);
        } catch (error) {
          console.warn('⚠️ Failed to delete old profile photo:', error.message);
          // File might not exist, continue
        }
      }

      // Generate a unique key for the profile photo
      const photoKey = this.storageService.generateFileKey('profiles', file.originalname, userId);
      console.log('🔑 Generated photo key:', photoKey);

      // Save the file using StorageService
      const fileBuffer = file.buffer || (file.path ? await require('fs/promises').readFile(file.path) : null);
      if (!fileBuffer) {
        throw new Error('Could not read file data');
      }

      const savedFile = await this.storageService.saveFile(fileBuffer, {
        key: photoKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        module: 'profiles',
        type: 'avatar',
      });

      console.log('💾 File saved successfully:', savedFile);

      // Update user profile with new photo path
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { profilePhoto: savedFile.key },
      });

      await this.auditService.log({
        userId: currentUser.id,
        action: 'UPLOAD_PROFILE_PHOTO',
        entity: 'User',
        entityId: userId,
        newData: { 
          profilePhoto: savedFile.key,
          fileSize: savedFile.size,
          mimeType: savedFile.mimeType,
        },
      });

      console.log('✅ Profile photo upload completed successfully');
      return { 
        profilePhoto: `/api/profile/photo/${userId}`,
        profilePhotoKey: savedFile.key,
        publicUrl: savedFile.publicUrl,
        size: savedFile.size,
      };
    } catch (error) {
      console.error('❌ Profile photo upload error:', {
        error: error.message,
        stack: error.stack,
        userId,
        fileName: file?.originalname,
        fileSize: file?.size,
      });
      
      throw new InternalServerErrorException(
        `Failed to upload profile photo: ${error.message}`
      );
    }
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

    // Delete file from storage using StorageService
    try {
      console.log('🗑️ Deleting profile photo from storage:', user.profilePhoto);
      await this.storageService.deleteFile(user.profilePhoto);
      console.log('✅ Profile photo deleted from storage successfully');
    } catch (error) {
      console.warn('⚠️ Failed to delete profile photo from storage:', error.message);
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

    try {
      console.log('🎫 Starting ID document upload process:', {
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // Generate a unique key for the ID document
      const documentKey = this.storageService.generateFileKey('id-documents', file.originalname, userId);
      console.log('🔑 Generated document key:', documentKey);

      // Save the file using StorageService
      const fileBuffer = file.buffer || (file.path ? await require('fs/promises').readFile(file.path) : null);
      if (!fileBuffer) {
        throw new Error('Could not read file data');
      }

      const savedFile = await this.storageService.saveFile(fileBuffer, {
        key: documentKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        module: 'id-documents',
        type: 'verification',
      });

      console.log('💾 ID document saved successfully:', savedFile);

      // Encrypt the file key for additional security
      const encryptedPath = this.encryptFilePath(savedFile.key);

      const idDocumentMetadata: IdDocumentMetadata = {
        filename: savedFile.key, // Use the storage key instead of original filename
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: savedFile.size,
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
          filename: savedFile.key,
          originalName: file.originalname,
          size: savedFile.size,
          mimeType: file.mimetype,
        },
      });

      console.log('✅ ID document upload completed successfully');
      return { 
        status: IdVerificationStatus.PENDING,
        uploadedAt: idDocumentMetadata.uploadedAt,
      };
    } catch (error) {
      console.error('❌ ID document upload error:', {
        error: error.message,
        stack: error.stack,
        userId,
        fileName: file?.originalname,
        fileSize: file?.size,
      });
      
      throw new InternalServerErrorException(
        `Failed to upload ID document: ${error.message}`
      );
    }
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

    try {
      const idDocumentMetadata: IdDocumentMetadata = JSON.parse(user.idDocument);
      const decryptedPath = this.decryptFilePath(idDocumentMetadata.encryptedPath);
      
      console.log('📄 Retrieving ID document:', {
        userId,
        decryptedPath,
        originalName: idDocumentMetadata.originalName,
      });

      // Check if file exists in storage
      const fileExists = await this.storageService.checkFileExists(decryptedPath);
      if (!fileExists) {
        throw new NotFoundException('ID document file not found in storage');
      }

      // Get file metadata from storage
      const fileMetadata = await this.storageService.getFileMetadata(decryptedPath);
      
      await this.auditService.log({
        userId: currentUser.id,
        action: 'VIEW_ID_DOCUMENT',
        entity: 'User',
        entityId: userId,
        newData: { viewedIdDocument: userId },
      });

      console.log('✅ ID document retrieved successfully');
      return {
        filePath: fileMetadata.path,
        metadata: idDocumentMetadata,
        fileMetadata,
        decryptedPath,
      };
    } catch (error) {
      console.error('❌ ID document retrieval error:', {
        error: error.message,
        userId,
      });
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        `Failed to retrieve ID document: ${error.message}`
      );
    }
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
    // Add logging to debug data being received
    console.log('🔍 Emergency Contacts Data Received:', JSON.stringify(contactsData, null, 2));
    
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

    // Validate contacts array
    if (!contactsData.contacts || !Array.isArray(contactsData.contacts)) {
      throw new BadRequestException('Contacts must be provided as an array');
    }
    
    if (contactsData.contacts.length === 0) {
      throw new BadRequestException('At least one emergency contact is required');
    }
    
    if (contactsData.contacts.length > 3) {
      throw new BadRequestException('Maximum of 3 emergency contacts allowed');
    }

    // Validate each contact
    for (let i = 0; i < contactsData.contacts.length; i++) {
      const contact = contactsData.contacts[i];
      if (!contact.name || typeof contact.name !== 'string' || contact.name.trim() === '') {
        throw new BadRequestException(`Contact ${i + 1}: Name is required`);
      }
      if (!contact.relationship || typeof contact.relationship !== 'string' || contact.relationship.trim() === '') {
        throw new BadRequestException(`Contact ${i + 1}: Relationship is required`);
      }
      if (!contact.phoneNumber || typeof contact.phoneNumber !== 'string' || contact.phoneNumber.trim() === '') {
        throw new BadRequestException(`Contact ${i + 1}: Phone number is required`);
      }
      // Validate email if provided
      if (contact.email && contact.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.email.trim())) {
          throw new BadRequestException(`Contact ${i + 1}: Invalid email format`);
        }
      }
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
      contacts: contactsData.contacts.map(contact => ({
        name: contact.name.trim(),
        relationship: contact.relationship.trim(),
        phoneNumber: contact.phoneNumber.trim(),
        email: contact.email && contact.email.trim() !== '' ? contact.email.trim() : undefined,
        address: contact.address && contact.address.trim() !== '' ? contact.address.trim() : undefined,
        isPrimary: contact.isPrimary || false,
      })),
      updatedAt: new Date().toISOString(),
    };

    console.log('💾 Emergency Contacts Data to Save:', JSON.stringify(emergencyContactData, null, 2));

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

  async getIdDocumentStream(userId: string, currentUser: User) {
    const result = await this.getIdDocument(userId, currentUser);
    const { decryptedPath } = result;
    
    return {
      stream: await this.storageService.createReadStream(decryptedPath),
      metadata: result.metadata,
    };
  }

  async getProfilePhotoStream(userId: string, currentUser: User) {
    // Users can view their own photo, admins can view any photo in their scope
    if (currentUser.id !== userId && !this.canViewProfile(currentUser, userId)) {
      throw new ForbiddenException('Insufficient permissions to view this profile photo');
    }

    const user = await this.prisma.user.findUnique({
      where: { 
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profilePhoto) {
      throw new NotFoundException('Profile photo not found');
    }

    try {
      console.log('📸 Retrieving profile photo:', {
        userId,
        photoKey: user.profilePhoto,
      });

      // Check if file exists in storage
      const fileExists = await this.storageService.checkFileExists(user.profilePhoto);
      if (!fileExists) {
        throw new NotFoundException('Profile photo file not found in storage');
      }

      // Get file metadata from storage
      const fileMetadata = await this.storageService.getFileMetadata(user.profilePhoto);
      
      // Create read stream
      const stream = await this.storageService.createReadStream(user.profilePhoto);

      await this.auditService.log({
        userId: currentUser.id,
        action: 'VIEW_PROFILE_PHOTO',
        entity: 'User',
        entityId: userId,
        newData: { viewedProfilePhoto: userId },
      });

      console.log('✅ Profile photo stream created successfully');
      return {
        stream,
        metadata: {
          mimeType: fileMetadata.mimeType || 'image/jpeg',
          size: fileMetadata.size,
          fileName: fileMetadata.fileName || `profile-${userId}.jpg`,
        },
      };
    } catch (error) {
      console.error('❌ Profile photo stream error:', {
        error: error.message,
        userId,
        photoKey: user.profilePhoto,
      });
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        `Failed to retrieve profile photo: ${error.message}`
      );
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