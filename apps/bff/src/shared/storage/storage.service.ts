import { Injectable, Logger, OnModuleInit, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { createReadStream, createWriteStream, ReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform, Readable } from 'stream';
import { R2Service } from './r2.service';
import { TenantContextService, RequestTenantContext } from '../tenant/tenant-context.service';

export interface FileUploadOptions {
  fileName: string;
  mimeType?: string;
  maxSize?: number;
  tenantContext?: RequestTenantContext;
  module?: string;
  type?: string;
}

export interface FileMetadata {
  key: string;
  fileName: string;
  mimeType?: string;
  size: number;
  path: string;
  publicUrl?: string;
  lastModified?: Date;
  tenantPath?: string;
}

/**
 * Enhanced Storage Service with Cloudflare R2 integration
 * Supports hybrid mode (R2 + local) and fallback capabilities
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly storagePath: string;
  private readonly maxFileSize: number;
  private readonly allowedFileTypes: string[];
  private readonly useR2: boolean;
  private readonly hybridMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly r2Service?: R2Service,
    @Optional() private readonly tenantContextService?: TenantContextService,
  ) {
    // Use Railway volume mount path or fallback to local storage
    this.storagePath = this.configService.get('STORAGE_PATH') || '/app/storage';
    this.maxFileSize = parseInt(this.configService.get('MAX_FILE_SIZE') || '10485760'); // 10MB default
    this.allowedFileTypes = (this.configService.get('ALLOWED_FILE_TYPES') || 'pdf,jpg,jpeg,png,doc,docx,xls,xlsx,mp4,avi').split(',');
    
    // Storage strategy configuration
    this.useR2 = this.configService.get('STORAGE_USE_R2') === 'true';
    this.hybridMode = this.configService.get('STORAGE_HYBRID_MODE') === 'true';

    this.logger.log(`Storage service initialized - Local path: ${this.storagePath}, R2: ${this.useR2}, Hybrid: ${this.hybridMode}`);
    
    // Initialize local directories if needed
    if (!this.useR2 || this.hybridMode) {
      this.initializeStorageDirectories();
    }
  }

  async onModuleInit(): Promise<void> {
    // Perform health checks on module initialization
    if (this.useR2 && this.r2Service) {
      const r2Healthy = await this.r2Service.healthCheck();
      if (!r2Healthy) {
        this.logger.warn('R2 service health check failed - falling back to local storage');
        // Could implement fallback logic here
      }
    }
  }

  private async initializeStorageDirectories(): Promise<void> {
    const directories = [
      path.join(this.storagePath, 'documents', 'general'),
      path.join(this.storagePath, 'documents', 'departments'),
      path.join(this.storagePath, 'documents', 'users'),
      path.join(this.storagePath, 'payslips'),
      path.join(this.storagePath, 'training', 'materials'),
      path.join(this.storagePath, 'training', 'submissions'),
      path.join(this.storagePath, 'temp'),
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        this.logger.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  generateFileKey(prefix: string, fileName: string, userId?: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (userId) {
      return `${prefix}/${userId}/${timestamp}-${randomString}-${sanitizedFileName}`;
    }
    
    return `${prefix}/${timestamp}-${randomString}-${sanitizedFileName}`;
  }

  async saveFile(
    fileBuffer: Buffer,
    options: FileUploadOptions & { key?: string }
  ): Promise<FileMetadata> {
    const { key, fileName, mimeType, tenantContext, module = 'documents', type = 'general' } = options;
    
    // Determine storage strategy
    if (this.useR2 && this.r2Service && tenantContext) {
      // Use R2 storage with tenant context
      const r2Result = await this.r2Service.uploadFile(fileBuffer, {
        fileName,
        mimeType,
        tenantContext,
      });
      
      // Also save locally if in hybrid mode
      if (this.hybridMode && key) {
        try {
          await this.saveFileLocal(fileBuffer, { key, fileName, mimeType });
        } catch (error) {
          this.logger.warn('Failed to save file locally in hybrid mode:', error);
        }
      }
      
      return {
        key: r2Result.key,
        fileName: r2Result.fileName,
        mimeType: r2Result.mimeType,
        size: r2Result.size,
        path: r2Result.key, // R2 key serves as path
        publicUrl: r2Result.publicUrl,
        tenantPath: r2Result.tenantPath,
      };
    } else {
      // Fall back to local storage
      if (!key) {
        throw new Error('Key is required for local storage');
      }
      return this.saveFileLocal(fileBuffer, { key, fileName, mimeType });
    }
  }

  private async saveFileLocal(
    fileBuffer: Buffer,
    options: { key: string; fileName: string; mimeType?: string }
  ): Promise<FileMetadata> {
    const { key, fileName, mimeType } = options;
    const filePath = path.join(this.storagePath, key);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Validate file size
    if (fileBuffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
    }
    
    // Validate file type
    const fileExtension = path.extname(fileName).toLowerCase().slice(1);
    if (!this.allowedFileTypes.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} is not allowed`);
    }
    
    // Save file
    await fs.writeFile(filePath, fileBuffer);
    
    this.logger.log(`File saved locally: ${key}`);
    
    return {
      key,
      fileName,
      mimeType,
      size: fileBuffer.length,
      path: filePath,
    };
  }

  async saveFileStream(
    fileStream: Readable,
    options: FileUploadOptions & { key?: string }
  ): Promise<FileMetadata> {
    const { key, fileName, mimeType, tenantContext, module = 'documents', type = 'general' } = options;
    
    // Determine storage strategy
    if (this.useR2 && this.r2Service && tenantContext) {
      // Use R2 storage with tenant context
      const r2Result = await this.r2Service.uploadFileStream(fileStream, {
        fileName,
        mimeType,
        tenantContext,
      });
      
      return {
        key: r2Result.key,
        fileName: r2Result.fileName,
        mimeType: r2Result.mimeType,
        size: r2Result.size,
        path: r2Result.key, // R2 key serves as path
        publicUrl: r2Result.publicUrl,
        lastModified: r2Result.lastModified,
        tenantPath: r2Result.tenantPath,
      };
    } else {
      // Fall back to local storage
      if (!key) {
        throw new Error('Key is required for local storage');
      }
      return this.saveFileStreamLocal(fileStream, { key, fileName, mimeType });
    }
  }

  private async saveFileStreamLocal(
    fileStream: Readable,
    options: { key: string; fileName: string; mimeType?: string }
  ): Promise<FileMetadata> {
    const { key, fileName, mimeType } = options;
    const filePath = path.join(this.storagePath, key);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Validate file type
    const fileExtension = path.extname(fileName).toLowerCase().slice(1);
    if (!this.allowedFileTypes.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} is not allowed`);
    }
    
    // Create write stream
    const writeStream = createWriteStream(filePath);
    
    // Track file size
    let fileSize = 0;
    const maxFileSize = this.maxFileSize; // Capture this.maxFileSize in closure
    const transformStream = new Transform({
      transform(chunk, encoding, callback) {
        fileSize += chunk.length;
        if (fileSize > maxFileSize) {
          callback(new Error(`File size exceeds maximum allowed size of ${maxFileSize} bytes`));
        } else {
          callback(null, chunk);
        }
      }
    });
    
    // Save file using pipeline
    await pipeline(fileStream, transformStream, writeStream);
    
    this.logger.log(`File stream saved locally: ${key}`);
    
    return {
      key,
      fileName,
      mimeType,
      size: fileSize,
      path: filePath,
    };
  }

  async getFile(key: string, request?: any): Promise<Buffer> {
    // Try R2 first if configured
    if (this.useR2 && this.r2Service) {
      try {
        return await this.r2Service.downloadFile(key, request);
      } catch (error) {
        // If R2 fails and we're in hybrid mode, try local storage
        if (this.hybridMode) {
          this.logger.warn('R2 download failed, trying local storage:', error);
        } else {
          throw error;
        }
      }
    }
    
    // Fall back to or use local storage
    const filePath = path.join(this.storagePath, key);
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      return fileBuffer;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('File not found');
      }
      throw error;
    }
  }

  async createReadStream(key: string, request?: any): Promise<Readable> {
    // Try R2 first if configured
    if (this.useR2 && this.r2Service) {
      try {
        return await this.r2Service.getFileStream(key, request);
      } catch (error) {
        // If R2 fails and we're in hybrid mode, try local storage
        if (this.hybridMode) {
          this.logger.warn('R2 stream failed, trying local storage:', error);
        } else {
          throw error;
        }
      }
    }
    
    // Fall back to or use local storage
    const filePath = path.join(this.storagePath, key);
    return createReadStream(filePath);
  }

  async deleteFile(key: string, request?: any): Promise<void> {
    let r2Success = false;
    let localSuccess = false;
    let lastError: Error | null = null;
    
    // Try R2 first if configured
    if (this.useR2 && this.r2Service) {
      try {
        await this.r2Service.deleteFile(key, request);
        r2Success = true;
        this.logger.log(`File deleted from R2: ${key}`);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn('Failed to delete from R2:', error);
      }
    }
    
    // Also try local storage if in hybrid mode or if R2 is not configured
    if (!this.useR2 || this.hybridMode) {
      const filePath = path.join(this.storagePath, key);
      
      try {
        await fs.unlink(filePath);
        localSuccess = true;
        this.logger.log(`File deleted locally: ${key}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.logger.debug(`Local file not found for deletion: ${key}`);
        } else {
          lastError = error as Error;
          this.logger.warn(`Failed to delete local file: ${key}`, error);
        }
      }
    }
    
    // Consider success if at least one storage deleted the file
    if (!r2Success && !localSuccess && lastError) {
      throw new Error(`Failed to delete file: ${lastError.message}`);
    }
  }

  async copyFile(sourceKey: string, destinationKey: string, request?: any): Promise<void> {
    // Try R2 first if configured
    if (this.useR2 && this.r2Service) {
      try {
        await this.r2Service.copyFile(sourceKey, destinationKey, request);
        this.logger.log(`File copied in R2 from ${sourceKey} to ${destinationKey}`);
        
        // If hybrid mode, also copy locally
        if (this.hybridMode) {
          try {
            await this.copyFileLocal(sourceKey, destinationKey);
          } catch (error) {
            this.logger.warn('Failed to copy file locally in hybrid mode:', error);
          }
        }
        return;
      } catch (error) {
        // If R2 fails and we're in hybrid mode, try local storage
        if (this.hybridMode) {
          this.logger.warn('R2 copy failed, trying local storage:', error);
        } else {
          throw error;
        }
      }
    }
    
    // Fall back to local storage
    await this.copyFileLocal(sourceKey, destinationKey);
  }

  private async copyFileLocal(sourceKey: string, destinationKey: string): Promise<void> {
    const sourcePath = path.join(this.storagePath, sourceKey);
    const destPath = path.join(this.storagePath, destinationKey);
    
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    await fs.mkdir(destDir, { recursive: true });
    
    try {
      await fs.copyFile(sourcePath, destPath);
      this.logger.log(`File copied locally from ${sourceKey} to ${destinationKey}`);
    } catch (error) {
      this.logger.error(`Failed to copy file locally from ${sourceKey} to ${destinationKey}`, error);
      throw new Error('Failed to copy file');
    }
  }

  async checkFileExists(key: string, request?: any): Promise<boolean> {
    // Try R2 first if configured
    if (this.useR2 && this.r2Service) {
      try {
        return await this.r2Service.fileExists(key, request);
      } catch (error) {
        // If R2 fails and we're in hybrid mode, try local storage
        if (this.hybridMode) {
          this.logger.debug('R2 exists check failed, trying local storage:', error);
        } else {
          return false;
        }
      }
    }
    
    // Fall back to local storage
    const filePath = path.join(this.storagePath, key);
    
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileMetadata(key: string, request?: any): Promise<FileMetadata> {
    // Try R2 first if configured
    if (this.useR2 && this.r2Service) {
      try {
        const r2Metadata = await this.r2Service.getFileMetadata(key, request);
        return {
          key: r2Metadata.key,
          fileName: r2Metadata.fileName,
          mimeType: r2Metadata.mimeType,
          size: r2Metadata.size,
          path: r2Metadata.key, // R2 key serves as path
          publicUrl: r2Metadata.publicUrl,
          lastModified: r2Metadata.lastModified,
          tenantPath: r2Metadata.tenantPath,
        };
      } catch (error) {
        // If R2 fails and we're in hybrid mode, try local storage
        if (this.hybridMode) {
          this.logger.warn('R2 metadata failed, trying local storage:', error);
        } else {
          throw error;
        }
      }
    }
    
    // Fall back to local storage
    const filePath = path.join(this.storagePath, key);
    
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      
      return {
        key,
        fileName,
        size: stats.size,
        path: filePath,
        lastModified: stats.mtime,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('File not found');
      }
      throw error;
    }
  }

  async listFiles(prefix: string, tenantContext?: RequestTenantContext): Promise<string[]> {
    // Try R2 first if configured and tenant context is available
    if (this.useR2 && this.r2Service && tenantContext) {
      try {
        return await this.r2Service.listFiles(tenantContext);
      } catch (error) {
        // If R2 fails and we're in hybrid mode, try local storage
        if (this.hybridMode) {
          this.logger.warn('R2 list failed, trying local storage:', error);
        } else {
          throw error;
        }
      }
    }
    
    // Fall back to local storage
    return this.listFilesLocal(prefix);
  }

  private async listFilesLocal(prefix: string): Promise<string[]> {
    const dirPath = path.join(this.storagePath, prefix);
    const files: string[] = [];
    
    async function* walk(dir: string): AsyncGenerator<string> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            yield* walk(fullPath);
          } else {
            yield fullPath;
          }
        }
      } catch (error) {
        // Directory doesn't exist, return empty
        return;
      }
    }
    
    for await (const file of walk(dirPath)) {
      // Convert absolute path to relative key
      const key = path.relative(this.storagePath, file).replace(/\\/g, '/');
      files.push(key);
    }
    
    return files;
  }

  // Enhanced presigned URL methods with R2 support
  async generatePresignedUploadUrl(
    fileName: string,
    mimeType: string,
    tenantContext?: RequestTenantContext,
    module: string = 'documents',
    type: string = 'general',
    expiresIn: number = 300,
  ): Promise<{ uploadUrl: string; downloadUrl: string; key: string; expiresIn: number }> {
    // Use R2 presigned URLs if available and tenant context provided
    if (this.useR2 && this.r2Service && tenantContext) {
      return await this.r2Service.generatePresignedUploadUrl(
        fileName,
        mimeType,
        tenantContext,
        module,
        type,
        expiresIn,
      );
    }
    
    // Fall back to legacy behavior for backward compatibility
    const key = this.generateFileKey('documents', fileName);
    this.logger.warn('generatePresignedUploadUrl called without R2 - using fallback endpoints');
    return {
      uploadUrl: '/api/documents/upload',
      downloadUrl: `/api/files/serve/${encodeURIComponent(key)}`,
      key,
      expiresIn,
    };
  }

  async generatePresignedDownloadUrl(key: string, request?: any, expiresIn: number = 300): Promise<string> {
    // Use R2 presigned URLs if available
    if (this.useR2 && this.r2Service) {
      try {
        return await this.r2Service.generatePresignedDownloadUrl(key, request, expiresIn);
      } catch (error) {
        this.logger.warn('R2 presigned URL failed, using fallback:', error);
      }
    }
    
    // Fall back to serving endpoint
    return `/api/files/serve/${encodeURIComponent(key)}`;
  }

  /**
   * Get storage configuration status
   */
  getStorageConfig(): {
    useR2: boolean;
    hybridMode: boolean;
    localPath: string;
    r2Available: boolean;
  } {
    return {
      useR2: this.useR2,
      hybridMode: this.hybridMode,
      localPath: this.storagePath,
      r2Available: !!this.r2Service,
    };
  }

  /**
   * Create tenant-aware file key with proper organization
   */
  generateTenantFileKey(
    module: string,
    type: string,
    fileName: string,
    tenantContext: RequestTenantContext,
  ): string {
    if (this.useR2 && this.r2Service) {
      return this.r2Service.generateFileKey(module, type, fileName, tenantContext);
    } else {
      // Legacy format for local storage
      return this.generateFileKey(module, fileName, tenantContext.userId);
    }
  }
}