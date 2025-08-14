import AWS from 'aws-sdk';
import { Logger } from './logger.service';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
}

export interface FileMetadata {
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy?: string;
  tags?: Record<string, string>;
}

export class StorageService {
  private readonly logger = new Logger('StorageService');
  private readonly s3: AWS.S3;
  private readonly bucket: string;

  constructor() {
    // Configure AWS S3 or S3-compatible storage (like Cloudflare R2)
    this.s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT, // For Cloudflare R2 or other S3-compatible services
      s3ForcePathStyle: !!process.env.S3_ENDPOINT, // Required for some S3-compatible services
    });

    this.bucket = process.env.S3_BUCKET || 'staffnbdt-storage';

    this.logger.info(`Storage service initialized with bucket: ${this.bucket}`);
  }

  async uploadFile(
    file: Buffer,
    metadata: FileMetadata,
    folder = 'uploads'
  ): Promise<UploadResult> {
    try {
      const fileExtension = extname(metadata.originalName);
      const key = `${folder}/${uuidv4()}${fileExtension}`;

      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: metadata.mimeType,
        Metadata: {
          'original-name': metadata.originalName,
          'uploaded-by': metadata.uploadedBy || 'system',
          'upload-timestamp': new Date().toISOString(),
          ...(metadata.tags || {}),
        },
      };

      const result = await this.s3.upload(uploadParams).promise();

      this.logger.info(`File uploaded successfully`, {
        key,
        size: metadata.size,
        originalName: metadata.originalName,
      });

      return {
        key,
        url: result.Location,
        size: metadata.size,
        mimeType: metadata.mimeType,
      };

    } catch (error) {
      this.logger.error('Failed to upload file:', error, {
        originalName: metadata.originalName,
        size: metadata.size,
      });
      throw error;
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      const result = await this.s3.getObject(params).promise();
      
      if (!result.Body) {
        throw new Error('File body is empty');
      }

      this.logger.debug(`File downloaded successfully`, { key });

      return result.Body as Buffer;

    } catch (error) {
      this.logger.error('Failed to download file:', error, { key });
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
      
      this.logger.info(`File deleted successfully`, { key });

    } catch (error) {
      this.logger.error('Failed to delete file:', error, { key });
      throw error;
    }
  }

  async getPresignedUploadUrl(
    fileName: string,
    mimeType: string,
    folder = 'uploads',
    expiresIn = 300 // 5 minutes
  ): Promise<PresignedUrlResult> {
    try {
      const fileExtension = extname(fileName);
      const key = `${folder}/${uuidv4()}${fileExtension}`;

      const uploadParams = {
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
        Expires: expiresIn,
      };

      const uploadUrl = this.s3.getSignedUrl('putObject', uploadParams);
      const downloadUrl = this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      });

      this.logger.debug(`Generated presigned URLs`, { key, fileName });

      return { uploadUrl, downloadUrl, key };

    } catch (error) {
      this.logger.error('Failed to generate presigned URLs:', error, { fileName });
      throw error;
    }
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 300): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      };

      const url = this.s3.getSignedUrl('getObject', params);
      
      this.logger.debug(`Generated presigned download URL`, { key });

      return url;

    } catch (error) {
      this.logger.error('Failed to generate presigned download URL:', error, { key });
      throw error;
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const params: AWS.S3.CopyObjectRequest = {
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      };

      await this.s3.copyObject(params).promise();
      
      this.logger.info(`File copied successfully`, { sourceKey, destinationKey });

    } catch (error) {
      this.logger.error('Failed to copy file:', error, { sourceKey, destinationKey });
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.headObject({
        Bucket: this.bucket,
        Key: key,
      }).promise();

      return true;

    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      
      this.logger.error('Error checking file existence:', error, { key });
      throw error;
    }
  }

  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const result = await this.s3.headObject({
        Bucket: this.bucket,
        Key: key,
      }).promise();

      this.logger.debug(`Retrieved file metadata`, { key });

      return result;

    } catch (error) {
      this.logger.error('Failed to get file metadata:', error, { key });
      throw error;
    }
  }

  // Helper methods for specific file types
  async uploadDocument(
    file: Buffer,
    originalName: string,
    mimeType: string,
    uploadedBy: string
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      originalName,
      size: file.length,
      mimeType,
      uploadedBy,
      tags: { type: 'document' },
    }, 'documents');
  }

  async uploadPayslip(
    file: Buffer,
    fileName: string,
    userId: string,
    period: string
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      originalName: fileName,
      size: file.length,
      mimeType: 'application/pdf',
      tags: { type: 'payslip', userId, period },
    }, 'payslips');
  }

  async uploadTrainingAsset(
    file: Buffer,
    originalName: string,
    mimeType: string,
    sessionId: string
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      originalName,
      size: file.length,
      mimeType,
      tags: { type: 'training', sessionId },
    }, 'training');
  }

  async uploadProfilePhoto(
    file: Buffer,
    originalName: string,
    mimeType: string,
    userId: string
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      originalName,
      size: file.length,
      mimeType,
      tags: { type: 'profile', userId },
    }, 'profiles');
  }
}