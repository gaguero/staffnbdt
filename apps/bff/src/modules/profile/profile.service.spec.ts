import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { StorageService } from '../../shared/storage/storage.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('ProfileService', () => {
  let service: ProfileService;
  let prismaService: any;
  let auditService: any;
  let storageService: any;

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.STAFF,
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
  };

  const mockAdmin = {
    ...mockUser,
    id: 'admin1',
    role: Role.DEPARTMENT_ADMIN,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockAuditService = {
      log: jest.fn(),
    };

    const mockStorageService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prismaService = module.get(PrismaService);
    auditService = module.get(AuditService);
    storageService = module.get(StorageService);

    // Set test encryption key
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile when user requests own profile', async () => {
      const userWithDepartment = {
        ...mockUser,
        department: { id: 'dept1', name: 'IT' },
      };
      
      prismaService.user.findUnique.mockResolvedValue(userWithDepartment);

      const result = await service.getProfile(mockUser.id, mockUser);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id, deletedAt: null },
        include: { department: { select: { id: true, name: true } } },
      });
      expect(auditService.log).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'VIEW_PROFILE',
        entity: 'User',
        entityId: mockUser.id,
        newData: { viewedProfile: mockUser.id },
      });
    });

    it('should throw ForbiddenException when staff user tries to view another profile', async () => {
      await expect(
        service.getProfile('other-user-id', mockUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any profile', async () => {
      const userWithDepartment = {
        ...mockUser,
        department: { id: 'dept1', name: 'IT' },
      };
      
      prismaService.user.findUnique.mockResolvedValue(userWithDepartment);

      const result = await service.getProfile(mockUser.id, mockAdmin);

      expect(result.id).toBe(mockUser.id);
      expect(prismaService.user.findUnique).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getProfile(mockUser.id, mockUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '+507 6000-1111',
    };

    it('should update user profile when user updates own profile', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        ...updateData,
      });

      const result = await service.updateProfile(mockUser.id, updateData, mockUser);

      expect(result.firstName).toBe(updateData.firstName);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData,
      });
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user tries to update another profile', async () => {
      await expect(
        service.updateProfile('other-user-id', updateData, mockUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(mockUser.id, updateData, mockUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEmergencyContacts', () => {
    const contactsData = {
      contacts: [
        {
          name: 'Emergency Contact',
          relationship: 'Spouse',
          phoneNumber: '+507 6000-2222',
          email: 'emergency@example.com',
          isPrimary: true,
        },
      ],
    };

    it('should update emergency contacts', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.updateEmergencyContacts(
        mockUser.id,
        contactsData,
        mockUser,
      );

      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].name).toBe('Emergency Contact');
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user tries to update another user emergency contacts', async () => {
      await expect(
        service.updateEmergencyContacts('other-user-id', contactsData, mockUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});