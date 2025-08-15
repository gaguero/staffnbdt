import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  StreamableFile,
  Header,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { createReadStream, statSync } from 'fs';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { DepartmentGuard } from '../../shared/guards/department.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { FilesService } from './files.service';
import { StorageService } from '../../shared/storage/storage.service';
import { User } from '@prisma/client';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard, DepartmentGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly storageService: StorageService,
  ) {}

  @Get('serve/:fileKey(*)')
  @Audit({ action: 'DOWNLOAD', entity: 'File' })
  @ApiOperation({ summary: 'Serve a file with authentication and authorization' })
  @ApiParam({ name: 'fileKey', description: 'The file key/path to serve' })
  @ApiResponse({ status: 200, description: 'File served successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async serveFile(
    @Param('fileKey') fileKey: string,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Decode the file key
    const decodedFileKey = decodeURIComponent(fileKey);
    
    // Check if file exists
    const fileExists = await this.storageService.checkFileExists(decodedFileKey);
    if (!fileExists) {
      throw new NotFoundException('File not found');
    }

    // Verify user has permission to access this file
    const hasPermission = await this.filesService.checkFileAccess(decodedFileKey, currentUser);
    if (!hasPermission) {
      throw new ForbiddenException('Access denied to this file');
    }

    try {
      // Get file metadata
      const fileMetadata = await this.storageService.getFileMetadata(decodedFileKey);
      
      // Create read stream
      const fileStream = this.storageService.createReadStream(decodedFileKey) as NodeJS.ReadableStream;
      
      // Set appropriate headers
      res.set({
        'Content-Type': this.getMimeType(fileMetadata.fileName),
        'Content-Length': fileMetadata.size.toString(),
        'Content-Disposition': `inline; filename="${fileMetadata.fileName}"`,
        'Cache-Control': 'private, max-age=3600',
        'Accept-Ranges': 'bytes',
      });

      // Handle range requests for video streaming
      const range = req.headers.range;
      if (range && this.isVideoFile(fileMetadata.fileName)) {
        return this.handleRangeRequest(decodedFileKey, range, res, fileMetadata);
      }

      return new StreamableFile(fileStream as any);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      txt: 'text/plain',
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  private isVideoFile(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    return videoExtensions.includes(extension || '');
  }

  private handleRangeRequest(
    fileKey: string,
    range: string,
    res: Response,
    fileMetadata: any,
  ): StreamableFile {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileMetadata.size - 1;
    
    const chunkSize = (end - start) + 1;
    const fileStream = createReadStream(fileMetadata.path, { start, end });
    
    res.status(206);
    res.set({
      'Content-Range': `bytes ${start}-${end}/${fileMetadata.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize.toString(),
      'Content-Type': this.getMimeType(fileMetadata.fileName),
    });
    
    return new StreamableFile(fileStream);
  }
}