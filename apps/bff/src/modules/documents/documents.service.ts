import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { StorageService } from '../../shared/storage/storage.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { applySoftDelete } from '../../shared/utils/soft-delete';
import { CreateDocumentDto, UpdateDocumentDto, DocumentFilterDto, UploadDocumentDto } from './dto';
import { User, Document, DocumentScope, Role } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async createUploadUrl(
    uploadDocumentDto: UploadDocumentDto,
    currentUser: User,
  ): Promise<{ uploadUrl: string; downloadUrl: string; key: string }> {
    // Validate permissions based on scope
    if (uploadDocumentDto.scope === DocumentScope.DEPARTMENT) {
      if (currentUser.role === Role.STAFF || !currentUser.departmentId) {
        throw new ForbiddenException('Only department admins can upload department documents');
      }
    } else if (uploadDocumentDto.scope === DocumentScope.GENERAL) {
      if (currentUser.role !== Role.SUPERADMIN) {
        throw new ForbiddenException('Only superadmins can upload general documents');
      }
    }

    // Generate storage key based on scope
    let prefix = '';
    switch (uploadDocumentDto.scope) {
      case DocumentScope.GENERAL:
        prefix = 'documents/general';
        break;
      case DocumentScope.DEPARTMENT:
        prefix = `documents/departments/${uploadDocumentDto.departmentId || currentUser.departmentId}`;
        break;
      case DocumentScope.USER:
        prefix = `documents/users/${uploadDocumentDto.userId || currentUser.id}`;
        break;
    }

    const key = this.storageService.generateFileKey(prefix, uploadDocumentDto.fileName);

    const presignedUrls = await this.storageService.generatePresignedUploadUrl({
      key,
      contentType: uploadDocumentDto.mimeType,
      expiresIn: 300, // 5 minutes
    });

    return presignedUrls;
  }

  async create(
    createDocumentDto: CreateDocumentDto,
    currentUser: User,
  ): Promise<Document> {
    // Validate permissions and scope consistency
    this.validateDocumentPermissions(createDocumentDto, currentUser);

    // Verify file exists in storage
    const fileExists = await this.storageService.checkFileExists(createDocumentDto.fileUrl.split('/').pop() || '');
    if (!fileExists) {
      throw new BadRequestException('File not found in storage');
    }

    const document = await this.prisma.document.create({
      data: {
        ...createDocumentDto,
        uploadedBy: currentUser.id,
        tags: createDocumentDto.tags || [],
      },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log document creation
    await this.auditService.logCreate(currentUser.id, 'Document', document.id, document);

    return document;
  }

  async findAll(
    filterDto: DocumentFilterDto,
    currentUser: User,
  ): Promise<PaginatedResponse<Document>> {
    const { limit, offset, scope, departmentId, tags, search } = filterDto;

    // Build where clause based on user permissions
    let whereClause: any = applySoftDelete({ where: {} }).where || {};

    // Apply scope-based filtering
    whereClause.OR = this.buildAccessibleScopesFilter(currentUser);

    // Apply additional filters
    if (scope) {
      whereClause.scope = scope;
    }

    if (departmentId) {
      // Ensure user can access this department
      if (currentUser.role === Role.DEPARTMENT_ADMIN && currentUser.departmentId !== departmentId) {
        throw new ForbiddenException('Cannot access documents from other departments');
      }
      whereClause.departmentId = departmentId;
    }

    if (tags && tags.length > 0) {
      whereClause.tags = {
        hasEvery: tags,
      };
    }

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where: whereClause,
        include: {
          department: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.document.count({ where: whereClause }),
    ]);

    return new PaginatedResponse(documents, total, limit, offset);
  }

  async findOne(id: string, currentUser: User): Promise<Document> {
    const document = await this.prisma.document.findFirst({
      where: applySoftDelete({ where: { id } }).where,
      include: {
        department: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check access permissions
    this.validateDocumentAccess(document, currentUser);

    // Log document view
    await this.auditService.logView(currentUser.id, 'Document', id);

    return document;
  }

  async getDownloadUrl(id: string, currentUser: User): Promise<{ downloadUrl: string }> {
    const document = await this.findOne(id, currentUser);

    const downloadUrl = await this.storageService.generatePresignedDownloadUrl(
      document.fileUrl,
      300, // 5 minutes
    );

    return { downloadUrl };
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    currentUser: User,
  ): Promise<Document> {
    const existingDocument = await this.findOne(id, currentUser);

    // Check update permissions
    if (currentUser.role === Role.STAFF && existingDocument.uploadedBy !== currentUser.id) {
      throw new ForbiddenException('Can only update documents you uploaded');
    }

    // Validate scope changes
    if (updateDocumentDto.scope && updateDocumentDto.scope !== existingDocument.scope) {
      this.validateDocumentPermissions(
        { ...existingDocument, ...updateDocumentDto } as CreateDocumentDto,
        currentUser,
      );
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        ...updateDocumentDto,
        tags: updateDocumentDto.tags || existingDocument.tags,
      },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log document update
    await this.auditService.logUpdate(
      currentUser.id,
      'Document',
      id,
      existingDocument,
      updatedDocument,
    );

    return updatedDocument;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const document = await this.findOne(id, currentUser);

    // Check delete permissions
    if (currentUser.role === Role.STAFF && document.uploadedBy !== currentUser.id) {
      throw new ForbiddenException('Can only delete documents you uploaded');
    }

    // Soft delete the document
    await this.prisma.document.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Optional: Delete from storage (commented out for safety)
    // await this.storageService.deleteFile(document.fileUrl);

    // Log document deletion
    await this.auditService.logDelete(currentUser.id, 'Document', id, document);
  }

  private validateDocumentPermissions(
    documentData: CreateDocumentDto,
    currentUser: User,
  ): void {
    switch (documentData.scope) {
      case DocumentScope.GENERAL:
        if (currentUser.role !== Role.SUPERADMIN) {
          throw new ForbiddenException('Only superadmins can manage general documents');
        }
        break;

      case DocumentScope.DEPARTMENT:
        if (currentUser.role === Role.STAFF) {
          throw new ForbiddenException('Staff cannot manage department documents');
        }
        if (
          currentUser.role === Role.DEPARTMENT_ADMIN &&
          documentData.departmentId !== currentUser.departmentId
        ) {
          throw new ForbiddenException('Cannot manage documents for other departments');
        }
        break;

      case DocumentScope.USER:
        if (
          currentUser.role === Role.STAFF &&
          documentData.userId !== currentUser.id
        ) {
          throw new ForbiddenException('Can only manage your own user documents');
        }
        break;
    }
  }

  private validateDocumentAccess(document: Document, currentUser: User): void {
    switch (document.scope) {
      case DocumentScope.GENERAL:
        // All users can access general documents
        break;

      case DocumentScope.DEPARTMENT:
        if (
          currentUser.role === Role.STAFF &&
          document.departmentId !== currentUser.departmentId
        ) {
          throw new ForbiddenException('Cannot access documents from other departments');
        }
        if (
          currentUser.role === Role.DEPARTMENT_ADMIN &&
          document.departmentId !== currentUser.departmentId
        ) {
          throw new ForbiddenException('Cannot access documents from other departments');
        }
        break;

      case DocumentScope.USER:
        if (
          currentUser.role === Role.STAFF &&
          document.userId !== currentUser.id
        ) {
          throw new ForbiddenException('Can only access your own user documents');
        }
        if (
          currentUser.role === Role.DEPARTMENT_ADMIN &&
          (document as any).user?.departmentId !== currentUser.departmentId
        ) {
          throw new ForbiddenException('Cannot access user documents from other departments');
        }
        break;
    }
  }

  private buildAccessibleScopesFilter(currentUser: User): any[] {
    const filters = [];

    // All users can access general documents
    filters.push({ scope: DocumentScope.GENERAL });

    // Department-specific access
    if (currentUser.departmentId) {
      filters.push({
        scope: DocumentScope.DEPARTMENT,
        departmentId: currentUser.departmentId,
      });
    }

    // User-specific access
    if (currentUser.role === Role.STAFF) {
      filters.push({
        scope: DocumentScope.USER,
        userId: currentUser.id,
      });
    } else if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      filters.push({
        scope: DocumentScope.USER,
        user: { departmentId: currentUser.departmentId },
      });
    } else if (currentUser.role === Role.SUPERADMIN) {
      filters.push({ scope: DocumentScope.USER });
    }

    return filters;
  }
}