import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Role, UserType } from '@prisma/client';
import { IdVerificationStatus } from './interfaces';

describe('ProfileController', () => {
  let controller: ProfileController;
  let profileService: any;

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.STAFF,
    userType: UserType.INTERNAL,
    externalOrganization: null,
    accessPortal: 'staff',
    departmentId: 'dept1',
    position: 'Developer',
    hireDate: new Date(),
    phoneNumber: '+507 6000-0000',
    emergencyContact: null,
    idDocument: null,
    profilePhoto: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    organizationId: 'org1',
    propertyId: 'prop1',
    password: null,
  };

  const mockProfileResponse = {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: mockUser.role,
    departmentId: mockUser.departmentId,
    department: { id: 'dept1', name: 'IT' },
    position: mockUser.position,
    hireDate: mockUser.hireDate,
    phoneNumber: mockUser.phoneNumber,
    emergencyContact: null,
    idDocument: null,
    profilePhoto: null,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    const mockProfileService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      uploadProfilePhoto: jest.fn(),
      deleteProfilePhoto: jest.fn(),
      uploadIdDocument: jest.fn(),
      getIdDocument: jest.fn(),
      verifyIdDocument: jest.fn(),
      getIdDocumentStatus: jest.fn(),
      updateEmergencyContacts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
        {
          provide: 'PermissionService',
          useValue: {
            hasPermission: jest.fn().mockReturnValue(true),
            checkPermission: jest.fn().mockReturnValue(true),
            getUserPermissions: jest.fn().mockReturnValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    profileService = module.get(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      profileService.getProfile.mockResolvedValue(mockProfileResponse);

      const result = await controller.getProfile(mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfileResponse);
      expect(result.message).toBe('Profile retrieved successfully');
      expect(profileService.getProfile).toHaveBeenCalledWith(mockUser.id, mockUser);
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should update profile successfully', async () => {
      const updatedProfile = { 
        ...mockProfileResponse, 
        ...updateData,
        deletedAt: null
      };
      profileService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(updateData, mockUser);

      expect(result.success).toBe(true);
      expect(result.data.firstName).toBe(updateData.firstName);
      expect(result.message).toBe('Profile updated successfully');
      expect(profileService.updateProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateData,
        mockUser,
      );
    });
  });

  describe('uploadProfilePhoto', () => {
    const mockFile = {
      filename: 'profile_123.jpg',
      originalname: 'profile.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      path: 'uploads/profiles/profile_123.jpg',
    } as Express.Multer.File;

    const mockRequest = {
      user: mockUser,
      body: {},
      headers: {},
    } as any;

    it('should upload profile photo successfully', async () => {
      const uploadResult = { profilePhoto: 'profiles/profile_123.jpg' };
      profileService.uploadProfilePhoto.mockResolvedValue(uploadResult);

      const result = await controller.uploadProfilePhoto(mockFile, mockUser, mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(uploadResult);
      expect(result.message).toBe('Profile photo uploaded successfully');
      expect(profileService.uploadProfilePhoto).toHaveBeenCalledWith(
        mockUser.id,
        mockFile,
        mockUser,
      );
    });
  });

  describe('deleteProfilePhoto', () => {
    it('should delete profile photo successfully', async () => {
      const deleteResult = { message: 'Profile photo deleted successfully' };
      profileService.deleteProfilePhoto.mockResolvedValue(deleteResult);

      const result = await controller.deleteProfilePhoto(mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(deleteResult);
      expect(result.message).toBe('Profile photo deleted successfully');
      expect(profileService.deleteProfilePhoto).toHaveBeenCalledWith(
        mockUser.id,
        mockUser,
      );
    });
  });

  describe('updateEmergencyContacts', () => {
    const contactsData = {
      contacts: [
        {
          name: 'Emergency Contact',
          relationship: 'Spouse',
          phoneNumber: '+507 6000-2222',
          isPrimary: true,
        },
      ],
    };

    it('should update emergency contacts successfully', async () => {
      const updateResult = {
        contacts: contactsData.contacts,
        updatedAt: new Date().toISOString(),
      };
      profileService.updateEmergencyContacts.mockResolvedValue(updateResult);

      const result = await controller.updateEmergencyContacts(contactsData, mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updateResult);
      expect(result.message).toBe('Emergency contacts updated successfully');
      expect(profileService.updateEmergencyContacts).toHaveBeenCalledWith(
        mockUser.id,
        contactsData,
        mockUser,
      );
    });
  });

  describe('getIdDocumentStatus', () => {
    it('should return ID document status', async () => {
      const statusResult = {
        status: IdVerificationStatus.PENDING,
        uploadedAt: new Date().toISOString(),
        verifiedAt: undefined,
        verifiedBy: undefined,
        rejectionReason: undefined,
      };
      profileService.getIdDocumentStatus.mockResolvedValue(statusResult);

      const result = await controller.getIdDocumentStatus(mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(statusResult);
      expect(result.message).toBe('ID document status retrieved successfully');
      expect(profileService.getIdDocumentStatus).toHaveBeenCalledWith(
        mockUser.id,
        mockUser,
      );
    });

    it('should return no ID document uploaded status', async () => {
      const statusResult = {
        status: null,
        message: 'No ID document uploaded',
      };
      profileService.getIdDocumentStatus.mockResolvedValue(statusResult);

      const result = await controller.getIdDocumentStatus(mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(statusResult);
      expect(result.message).toBe('ID document status retrieved successfully');
    });
  });
});