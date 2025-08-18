import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { User, Role, DocumentScope } from '@prisma/client';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkFileAccess(fileKey: string, currentUser: User): Promise<boolean> {
    try {
      // First, try to find the file in the documents table
      const document = await this.prisma.document.findFirst({
        where: {
          OR: [
            { fileKey },
            { fileUrl: fileKey }, // Backwards compatibility for existing records
          ],
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              departmentId: true,
            },
          },
        },
      });

      if (document) {
        return this.checkDocumentAccess(document, currentUser);
      }

      // If not found in documents, check if it's a payslip or training material
      // Parse the file key to determine access rules
      return await this.checkFilePathAccess(fileKey, currentUser);
    } catch (error) {
      this.logger.error(`Error checking file access for ${fileKey}:`, error);
      return false;
    }
  }

  private checkDocumentAccess(document: any, currentUser: User): boolean {
    switch (document.scope) {
      case DocumentScope.GENERAL:
        // All users can access general documents
        return true;

      case DocumentScope.DEPARTMENT:
        if (currentUser.role === Role.PLATFORM_ADMIN) {
          return true;
        }
        if (currentUser.role === Role.DEPARTMENT_ADMIN || currentUser.role === Role.STAFF) {
          return document.departmentId === currentUser.departmentId;
        }
        return false;

      case DocumentScope.USER:
        if (currentUser.role === Role.PLATFORM_ADMIN) {
          return true;
        }
        if (currentUser.role === Role.DEPARTMENT_ADMIN) {
          // Department admin can access files of users in their department
          return document.user?.departmentId === currentUser.departmentId;
        }
        if (currentUser.role === Role.STAFF) {
          // Staff can only access their own files
          return document.userId === currentUser.id;
        }
        return false;

      default:
        return false;
    }
  }

  private async checkFilePathAccess(fileKey: string, currentUser: User): Promise<boolean> {
    // Parse the file path to determine access rules
    const pathParts = fileKey.split('/');
    
    if (pathParts.length < 2) {
      return false;
    }

    const category = pathParts[0];
    const subcategory = pathParts[1];

    switch (category) {
      case 'documents':
        return await this.checkDocumentPathAccess(pathParts, currentUser);
      
      case 'payslips':
        return await this.checkPayslipPathAccess(pathParts, currentUser);
      
      case 'training':
        return await this.checkTrainingPathAccess(pathParts, currentUser);
      
      default:
        // Unknown file category, deny access
        this.logger.warn(`Unknown file category: ${category} in path: ${fileKey}`);
        return false;
    }
  }

  private async checkDocumentPathAccess(pathParts: string[], currentUser: User): Promise<boolean> {
    if (pathParts.length < 3) {
      return false;
    }

    const scope = pathParts[1]; // general, departments, users

    switch (scope) {
      case 'general':
        return true; // All users can access general documents

      case 'departments':
        if (pathParts.length < 4) {
          return false;
        }
        const departmentId = pathParts[2];
        
        if (currentUser.role === Role.PLATFORM_ADMIN) {
          return true;
        }
        
        return currentUser.departmentId === departmentId;

      case 'users':
        if (pathParts.length < 4) {
          return false;
        }
        const userId = pathParts[2];
        
        if (currentUser.role === Role.PLATFORM_ADMIN) {
          return true;
        }
        
        if (currentUser.role === Role.STAFF) {
          return currentUser.id === userId;
        }
        
        if (currentUser.role === Role.DEPARTMENT_ADMIN) {
          // Check if the user belongs to the same department
          return await this.checkUserDepartmentAccess(userId, currentUser);
        }
        
        return false;

      default:
        return false;
    }
  }

  private async checkPayslipPathAccess(pathParts: string[], currentUser: User): Promise<boolean> {
    // Payslip path format: payslips/{userId}/YYYY-MM/payslip.pdf
    if (pathParts.length < 3) {
      return false;
    }

    const userId = pathParts[1];

    if (currentUser.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    if (currentUser.role === Role.STAFF) {
      // Staff can only access their own payslips
      return currentUser.id === userId;
    }

    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      // Department admin can access payslips of users in their department
      return await this.checkUserDepartmentAccess(userId, currentUser);
    }

    return false;
  }

  private async checkTrainingPathAccess(pathParts: string[], currentUser: User): Promise<boolean> {
    // Training path formats:
    // - training/materials/{trainingId}/content.mp4
    // - training/submissions/{userId}/{trainingId}/submission.pdf
    
    if (pathParts.length < 3) {
      return false;
    }

    const trainingType = pathParts[1]; // materials, submissions

    switch (trainingType) {
      case 'materials':
        // All users can access training materials (authorization handled by training module)
        return true;

      case 'submissions':
        if (pathParts.length < 4) {
          return false;
        }
        const submissionUserId = pathParts[2];
        
        if (currentUser.role === Role.PLATFORM_ADMIN) {
          return true;
        }
        
        if (currentUser.role === Role.STAFF) {
          return currentUser.id === submissionUserId;
        }
        
        if (currentUser.role === Role.DEPARTMENT_ADMIN) {
          return await this.checkUserDepartmentAccess(submissionUserId, currentUser);
        }
        
        return false;

      default:
        return false;
    }
  }

  private async checkUserDepartmentAccess(userId: string, currentUser: User): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true },
      });

      if (!user) {
        return false;
      }

      return user.departmentId === currentUser.departmentId;
    } catch (error) {
      this.logger.error(`Error checking user department access for ${userId}:`, error);
      return false;
    }
  }
}