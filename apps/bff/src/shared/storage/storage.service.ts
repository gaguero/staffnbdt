import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

export interface PresignedUrlOptions {
  key: string;
  contentType?: string;
  expiresIn?: number; // seconds
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: AWS.S3;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get('S3_BUCKET') || 'staffnbdt-storage';

    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get('S3_SECRET_KEY'),
      region: this.configService.get('S3_REGION') || 'us-east-1',
      signatureVersion: 'v4',
    });

    this.logger.log(`Storage service initialized with bucket: ${this.bucketName}`);
  }

  async generatePresignedUploadUrl(options: PresignedUrlOptions): Promise<PresignedUploadUrl> {
    const { key, contentType, expiresIn = 300 } = options; // 5 minutes default

    try {
      const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn,
      });

      const downloadUrl = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      });

      return {
        uploadUrl,
        downloadUrl,
        key,
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for key: ${key}`, error);
      throw new Error('Failed to generate upload URL');
    }
  }

  async generatePresignedDownloadUrl(key: string, expiresIn = 300): Promise<string> {
    try {
      return await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      });
    } catch (error) {
      this.logger.error(`Failed to generate download URL for key: ${key}`, error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise();

      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw new Error('Failed to delete file');
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await this.s3.copyObject({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      }).promise();

      this.logger.log(`File copied from ${sourceKey} to ${destinationKey}`);
    } catch (error) {
      this.logger.error(`Failed to copy file from ${sourceKey} to ${destinationKey}`, error);
      throw new Error('Failed to copy file');
    }
  }

  async checkFileExists(key: string): Promise<boolean> {
    try {
      await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  generateFileKey(prefix: string, fileName: string, userId?: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (userId) {
      return `${prefix}/${userId}/${timestamp}-${sanitizedFileName}`;
    }
    
    return `${prefix}/${timestamp}-${sanitizedFileName}`;
  }
}