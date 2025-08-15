import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { createReadStream, createWriteStream, ReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform, Readable } from 'stream';

export interface FileUploadOptions {
  fileName: string;
  mimeType?: string;
  maxSize?: number;
}

export interface FileMetadata {
  key: string;
  fileName: string;
  mimeType?: string;
  size: number;
  path: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storagePath: string;
  private readonly maxFileSize: number;
  private readonly allowedFileTypes: string[];

  constructor(private readonly configService: ConfigService) {
    // Use Railway volume mount path or fallback to local storage
    this.storagePath = this.configService.get('STORAGE_PATH') || '/a';
    this.maxFileSize = parseInt(this.configService.get('MAX_FILE_SIZE') || '10485760'); // 10MB default
    this.allowedFileTypes = (this.configService.get('ALLOWED_FILE_TYPES') || 'pdf,jpg,jpeg,png,doc,docx,xls,xlsx,mp4,avi').split(',');

    this.logger.log(`Storage service initialized with path: ${this.storagePath}`);
    this.initializeStorageDirectories();
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
    options: FileUploadOptions & { key: string }
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
    
    this.logger.log(`File saved: ${key}`);
    
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
    options: FileUploadOptions & { key: string }
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
    
    this.logger.log(`File stream saved: ${key}`);
    
    return {
      key,
      fileName,
      mimeType,
      size: fileSize,
      path: filePath,
    };
  }

  async getFile(key: string): Promise<Buffer> {
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

  createReadStream(key: string): ReadStream {
    const filePath = path.join(this.storagePath, key);
    return createReadStream(filePath);
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.storagePath, key);
    
    try {
      await fs.unlink(filePath);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`File not found for deletion: ${key}`);
        return;
      }
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw new Error('Failed to delete file');
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    const sourcePath = path.join(this.storagePath, sourceKey);
    const destPath = path.join(this.storagePath, destinationKey);
    
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    await fs.mkdir(destDir, { recursive: true });
    
    try {
      await fs.copyFile(sourcePath, destPath);
      this.logger.log(`File copied from ${sourceKey} to ${destinationKey}`);
    } catch (error) {
      this.logger.error(`Failed to copy file from ${sourceKey} to ${destinationKey}`, error);
      throw new Error('Failed to copy file');
    }
  }

  async checkFileExists(key: string): Promise<boolean> {
    const filePath = path.join(this.storagePath, key);
    
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    const filePath = path.join(this.storagePath, key);
    
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      
      return {
        key,
        fileName,
        size: stats.size,
        path: filePath,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('File not found');
      }
      throw error;
    }
  }

  async listFiles(prefix: string): Promise<string[]> {
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

  // Backwards compatibility methods (will be removed after refactoring is complete)
  async generatePresignedUploadUrl(options: any): Promise<any> {
    // This method is no longer needed with direct file uploads
    // Return a mock response for now to prevent crashes
    this.logger.warn('generatePresignedUploadUrl called - this method is deprecated with local storage');
    return {
      uploadUrl: '/api/documents/upload',
      downloadUrl: `/api/files/serve/${options.key}`,
      key: options.key,
    };
  }

  async generatePresignedDownloadUrl(key: string, expiresIn = 300): Promise<string> {
    // With local storage, we'll use JWT tokens for temporary access
    // For now, return the serving endpoint
    return `/api/files/serve/${encodeURIComponent(key)}`;
  }
}