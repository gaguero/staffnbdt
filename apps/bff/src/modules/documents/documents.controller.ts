import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { DepartmentGuard } from '../../shared/guards/department.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { CreateDocumentDto, UpdateDocumentDto, DocumentFilterDto } from './dto';
import { User } from '@prisma/client';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard, DepartmentGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Audit({ action: 'UPLOAD', entity: 'Document' })
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser() currentUser: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const document = await this.documentsService.uploadDocument(file, createDocumentDto, currentUser);
    return CustomApiResponse.success(document, 'Document uploaded successfully');
  }

  @Post()
  @Audit({ action: 'CREATE', entity: 'Document' })
  @ApiOperation({ summary: 'Create a new document record' })
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser() currentUser: User,
  ) {
    const document = await this.documentsService.create(createDocumentDto, currentUser);
    return CustomApiResponse.success(document, 'Document created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all accessible documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async findAll(
    @Query() filterDto: DocumentFilterDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.documentsService.findAll(filterDto, currentUser);
    return CustomApiResponse.success(result, 'Documents retrieved successfully');
  }

  @Get(':id')
  @Audit({ action: 'VIEW', entity: 'Document' })
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const document = await this.documentsService.findOne(id, currentUser);
    return CustomApiResponse.success(document, 'Document retrieved successfully');
  }

  @Get(':id/download')
  @Audit({ action: 'DOWNLOAD', entity: 'Document' })
  @ApiOperation({ summary: 'Get download URL for document' })
  @ApiResponse({ status: 200, description: 'Download URL generated successfully' })
  async getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.documentsService.getDownloadUrl(id, currentUser);
    return CustomApiResponse.success(result, 'Download URL generated successfully');
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE', entity: 'Document' })
  @ApiOperation({ summary: 'Update document' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser() currentUser: User,
  ) {
    const document = await this.documentsService.update(id, updateDocumentDto, currentUser);
    return CustomApiResponse.success(document, 'Document updated successfully');
  }

  @Delete(':id')
  @Audit({ action: 'DELETE', entity: 'Document' })
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.documentsService.remove(id, currentUser);
    return CustomApiResponse.success(null, 'Document deleted successfully');
  }
}