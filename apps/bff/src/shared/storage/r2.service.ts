import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import * as path from 'path';
import { TenantContextService, RequestTenantContext } from '../tenant/tenant-context.service';

export interface R2FileUploadOptions {
  fileName: string;
  mimeType?: string;
  maxSize?: number;
  tenantContext?: RequestTenantContext;
}

export interface R2FileMetadata {
  key: string;
  fileName: string;
  mimeType?: string;
  size: number;
  publicUrl?: string;
  lastModified?: Date;
  tenantPath: string;
}

export interface PresignedUrls {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Cloudflare R2 Storage Service
 * Provides multi-tenant file storage with tenant-scoped paths and secure access
 */
@Injectable()
export class R2Service implements OnModuleInit {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly maxFileSize: number;
  private readonly allowedFileTypes: string[];
  private readonly region: string;
  private readonly isCustomDomain: boolean;
  constructor(
    private readonly configService: ConfigService,
    private readonly tenantContextService: TenantContextService,
  ) {
    // Cloudflare R2 configuration
    this.bucketName = this.configService.get('R2_BUCKET_NAME') || 'hoh-storage';
    this.publicUrl = this.configService.get('R2_PUBLIC_URL') || '';
    this.maxFileSize = parseInt(this.configService.get('MAX_FILE_SIZE') || '10485760'); // 10MB default
    this.allowedFileTypes = (this.configService.get('ALLOWED_FILE_TYPES') || 'pdf,jpg,jpeg,png,doc,docx,xls,xlsx,mp4,avi').split(',');
    this.region = 'auto'; // Cloudflare R2 uses 'auto' region
    
    // Detect if using custom domain (bucket-specific endpoint)
    this.isCustomDomain = this.publicUrl && !this.publicUrl.includes('r2.cloudflarestorage.com');

    // Get required R2 credentials
    const accountId = this.configService.get('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('R2_SECRET_ACCESS_KEY');
    
    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.error('R2 credentials missing - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required');
      this.logger.warn('R2 service will be unavailable - falling back to local storage');
      // Don't initialize S3Client if credentials are missing
      return;
    }

    // Initialize S3-compatible client for Cloudflare R2
    // Use R2_PUBLIC_URL as primary endpoint, fallback to account-based endpoint
    const endpoint = this.publicUrl ? this.publicUrl.replace(/\/$/, '') : `https://${accountId}.r2.cloudflarestorage.com`;
    
    this.s3Client = new S3Client({
      region: this.region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: this.isCustomDomain, // Use path-style for custom domains, virtual-hosted for R2 endpoints
    });

    this.logger.log(`R2 endpoint configured: ${endpoint}`);
    this.logger.log(`Custom domain detected: ${this.isCustomDomain}`);
    this.logger.log(`Using bucket name: ${this.bucketName}`);
    this.logger.log(`Force path style: ${this.isCustomDomain}`);

    this.logger.log(`R2 Service initialized - Bucket: ${this.bucketName}, Region: ${this.region}`);
  }

  async onModuleInit(): Promise<void> {
    // Perform health check on service initialization
    await this.healthCheck();
  }

  /**
   * Health check to verify R2 connectivity
   */
  async healthCheck(): Promise<boolean> {
    if (!this.s3Client) {
      this.logger.warn('R2 client not initialized - health check failed');
      return false;
    }
    
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1,
      });
      
      await this.s3Client.send(command);
      
      this.logger.log('R2 health check passed');
      return true;
    } catch (error) {
      this.logger.error('R2 health check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate tenant-scoped file path for multi-tenant isolation
   * Format: /org/{orgId}/property/{propId}/module/{type}/
   */
  generateTenantPath(
    tenantContext: RequestTenantContext,
    module: string,
    type: string,
    fileName?: string,
  ): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedFileName = fileName ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_') : '';
    
    let basePath = `org/${tenantContext.organizationId}/property/${tenantContext.propertyId}/${module}`;
    
    // For profiles module, add user-specific path
    if (module === 'profiles') {
      basePath = `${basePath}/users/${tenantContext.userId}/${type}`;
    } else {
      basePath = `${basePath}/${type}`;
      
      if (tenantContext.departmentId) {
        basePath = `${basePath}/dept/${tenantContext.departmentId}`;
      }
    }
    
    return fileName 
      ? `${basePath}/${timestamp}-${randomString}-${sanitizedFileName}`
      : basePath;
  }

  /**
   * Generate unique file key with tenant context
   */
  generateFileKey(
    module: string,
    type: string,
    fileName: string,
    tenantContext: RequestTenantContext,
  ): string {
    return this.generateTenantPath(tenantContext, module, type, fileName);
  }

  /**
   * Validate file before upload
   */
  private validateFile(fileName: string, fileSize: number): void {
    // Validate file size
    if (fileSize > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
    }
    
    // Validate file type
    const fileExtension = path.extname(fileName).toLowerCase().slice(1);
    if (!this.allowedFileTypes.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} is not allowed. Allowed types: ${this.allowedFileTypes.join(', ')}`);
    }
  }

  /**
   * Upload file buffer to R2 with tenant context
   */
  async uploadFile(
    fileBuffer: Buffer,
    options: R2FileUploadOptions,
  ): Promise<R2FileMetadata> {
    if (!this.s3Client) {
      throw new Error('R2 service is not properly configured - missing credentials');
    }
    
    const { fileName, mimeType, tenantContext } = options;
    
    if (!tenantContext) {
      throw new Error('Tenant context is required for file uploads');
    }

    // Validate file
    this.validateFile(fileName, fileBuffer.length);

    // Generate tenant-scoped key
    const key = this.generateFileKey('documents', 'general', fileName, tenantContext);
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType || 'application/octet-stream',
        Metadata: {
          'tenant-org': tenantContext.organizationId,
          'tenant-property': tenantContext.propertyId,
          'tenant-department': tenantContext.departmentId || '',
          'original-name': fileName,
          'uploaded-by': tenantContext.userId,
          'upload-timestamp': new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        fileName,
        mimeType,
        size: fileBuffer.length,
        publicUrl: this.publicUrl ? `${this.publicUrl}/${key}` : undefined,
        tenantPath: this.generateTenantPath(tenantContext, 'documents', 'general'),
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${fileName}`, error);
      throw new Error('Failed to upload file to R2');
    }
  }

  /**
   * Upload file stream to R2 with tenant context
   */
  async uploadFileStream(
    fileStream: Readable,
    options: R2FileUploadOptions,
  ): Promise<R2FileMetadata> {
    const { fileName, mimeType, tenantContext } = options;
    
    if (!tenantContext) {
      throw new Error('Tenant context is required for file uploads');
    }

    // Generate tenant-scoped key
    const key = this.generateFileKey('documents', 'general', fileName, tenantContext);
    
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fileStream,
          ContentType: mimeType || 'application/octet-stream',
          Metadata: {
            'tenant-org': tenantContext.organizationId,
            'tenant-property': tenantContext.propertyId,
            'tenant-department': tenantContext.departmentId || '',
            'original-name': fileName,
            'uploaded-by': tenantContext.userId,
            'upload-timestamp': new Date().toISOString(),
          },
        },
      });

      const result = await upload.done();
      
      // Get file size from the upload result
      const headResult = await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));

      this.logger.log(`File stream uploaded successfully: ${key}`);

      return {
        key,
        fileName,
        mimeType,
        size: headResult.ContentLength || 0,
        publicUrl: this.publicUrl ? `${this.publicUrl}/${key}` : undefined,
        tenantPath: this.generateTenantPath(tenantContext, 'documents', 'general'),
        lastModified: headResult.LastModified,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file stream: ${fileName}`, error);
      throw new Error('Failed to upload file stream to R2');
    }
  }

  /**
   * Download file from R2 with tenant validation
   */
  async downloadFile(key: string, request?: any): Promise<Buffer> {
    if (!this.s3Client) {
      throw new Error('R2 service is not properly configured - missing credentials');
    }
    
    try {
      // Validate tenant access if request context is available
      if (request) {
        this.validateTenantAccess(key, request);
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('File body is empty');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body as Readable;
      
      for await (const chunk of reader) {
        chunks.push(chunk);
      }

      this.logger.debug(`File downloaded successfully: ${key}`);
      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Failed to download file: ${key}`, error);
      throw new Error('File not found or access denied');
    }
  }

  /**
   * Get readable stream for file
   */
  async getFileStream(key: string, request?: any): Promise<Readable> {
    if (!this.s3Client) {
      throw new Error('R2 service is not properly configured - missing credentials');
    }
    
    try {
      // Validate tenant access if request context is available
      if (request) {
        this.validateTenantAccess(key, request);
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('File body is empty');
      }

      this.logger.debug(`File stream created successfully: ${key}`);
      return response.Body as Readable;
    } catch (error) {
      this.logger.error(`Failed to get file stream: ${key}`, error);
      throw new Error('File not found or access denied');
    }
  }

  /**
   * Delete file from R2 with tenant validation
   */
  async deleteFile(key: string, request?: any): Promise<void> {
    try {
      // Validate tenant access if request context is available
      if (request) {
        this.validateTenantAccess(key, request);
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw new Error('Failed to delete file or access denied');
    }
  }

  /**
   * Copy file within R2 with tenant validation
   */
  async copyFile(sourceKey: string, destinationKey: string, request?: any): Promise<void> {
    try {
      // Validate tenant access for both source and destination
      if (request) {
        this.validateTenantAccess(sourceKey, request);
        this.validateTenantAccess(destinationKey, request);
      }

      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      });

      await this.s3Client.send(command);
      
      this.logger.log(`File copied successfully from ${sourceKey} to ${destinationKey}`);
    } catch (error) {
      this.logger.error(`Failed to copy file from ${sourceKey} to ${destinationKey}`, error);
      throw new Error('Failed to copy file');
    }
  }

  /**
   * Check if file exists with tenant validation
   */
  async fileExists(key: string, request?: any): Promise<boolean> {
    try {
      // Validate tenant access if request context is available
      if (request) {
        this.validateTenantAccess(key, request);
      }

      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));

      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      this.logger.error(`Error checking file existence: ${key}`, error);
      throw new Error('Error checking file existence');
    }
  }

  /**
   * Get file metadata with tenant validation
   */
  async getFileMetadata(key: string, request?: any): Promise<R2FileMetadata> {
    try {
      // Validate tenant access if request context is available
      if (request) {
        this.validateTenantAccess(key, request);
      }

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      this.logger.debug(`Retrieved file metadata: ${key}`);

      return {
        key,
        fileName: response.Metadata?.['original-name'] || path.basename(key),
        mimeType: response.ContentType,
        size: response.ContentLength || 0,
        publicUrl: this.publicUrl ? `${this.publicUrl}/${key}` : undefined,
        lastModified: response.LastModified,
        tenantPath: path.dirname(key),
      };
    } catch (error) {
      this.logger.error(`Failed to get file metadata: ${key}`, error);
      throw new Error('File not found or access denied');
    }
  }

  /**
   * List files in tenant-scoped directory
   */
  async listFiles(tenantContext: RequestTenantContext, module?: string, type?: string): Promise<string[]> {
    try {
      const prefix = module && type 
        ? this.generateTenantPath(tenantContext, module, type)
        : `org/${tenantContext.organizationId}/property/${tenantContext.propertyId}/`;

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
      });

      const response = await this.s3Client.send(command);
      
      const files = response.Contents?.map(obj => obj.Key!) || [];
      
      this.logger.debug(`Listed ${files.length} files with prefix: ${prefix}`);
      return files;
    } catch (error) {
      this.logger.error('Failed to list files', error);
      throw new Error('Failed to list files');
    }
  }

  /**
   * Generate presigned upload URL
   */
  async generatePresignedUploadUrl(
    fileName: string,
    mimeType: string,
    tenantContext: RequestTenantContext,
    module: string = 'documents',
    type: string = 'general',
    expiresIn: number = 300,
  ): Promise<PresignedUrls> {
    try {
      const key = this.generateFileKey(module, type, fileName, tenantContext);
      
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: mimeType,
        Metadata: {
          'tenant-org': tenantContext.organizationId,
          'tenant-property': tenantContext.propertyId,
          'tenant-department': tenantContext.departmentId || '',
          'original-name': fileName,
          'uploaded-by': tenantContext.userId,
        },
      });

      const downloadCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, uploadCommand, { expiresIn });
      const downloadUrl = await getSignedUrl(this.s3Client, downloadCommand, { expiresIn });

      this.logger.debug(`Generated presigned URLs for: ${key}`);

      return {
        uploadUrl,
        downloadUrl,
        key,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URLs for: ${fileName}`, error);
      throw new Error('Failed to generate presigned URLs');
    }
  }

  /**
   * Generate presigned download URL
   */
  async generatePresignedDownloadUrl(
    key: string,
    request?: any,
    expiresIn: number = 300,
  ): Promise<string> {
    try {
      // Validate tenant access if request context is available
      if (request) {
        this.validateTenantAccess(key, request);
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      this.logger.debug(`Generated presigned download URL for: ${key}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned download URL for: ${key}`, error);
      throw new Error('Failed to generate presigned download URL');
    }
  }

  /**
   * Validate tenant access to a file based on key path
   */
  private validateTenantAccess(key: string, request: any): void {
    const tenantContext = this.tenantContextService.getTenantContextSafe(request);
    
    if (!tenantContext) {
      throw new Error('No tenant context available for access validation');
    }

    // Extract organization and property from the key
    const keyParts = key.split('/');
    
    if (keyParts.length < 4 || keyParts[0] !== 'org' || keyParts[2] !== 'property') {
      throw new Error('Invalid file path format');
    }

    const fileOrgId = keyParts[1];
    const filePropId = keyParts[3];

    // Validate organization access
    if (!this.tenantContextService.validateOrganizationAccess(fileOrgId, request)) {
      throw new Error('Access denied: insufficient organization permissions');
    }

    // Validate property access
    if (!this.tenantContextService.validatePropertyAccess(filePropId, request)) {
      throw new Error('Access denied: insufficient property permissions');
    }

    // For department-scoped files, validate department access
    if (keyParts.length > 6 && keyParts[4] === 'dept') {
      const fileDeptId = keyParts[5];
      if (!this.tenantContextService.validateDepartmentAccess(fileDeptId, request)) {
        throw new Error('Access denied: insufficient department permissions');
      }
    }
  }

  /**
   * Get tenant-scoped statistics
   */
  async getTenantStorageStats(tenantContext: RequestTenantContext): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByModule: Record<string, number>;
  }> {
    try {
      const prefix = `org/${tenantContext.organizationId}/property/${tenantContext.propertyId}/`;
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      let totalFiles = 0;
      let totalSize = 0;
      const filesByModule: Record<string, number> = {};

      let continuationToken: string | undefined;

      do {
        const response = await this.s3Client.send(new ListObjectsV2Command({
          ...command.input,
          ContinuationToken: continuationToken,
        }));

        if (response.Contents) {
          for (const object of response.Contents) {
            totalFiles++;
            totalSize += object.Size || 0;

            // Extract module from key path
            const keyParts = object.Key!.split('/');
            if (keyParts.length > 4) {
              const module = keyParts[4];
              filesByModule[module] = (filesByModule[module] || 0) + 1;
            }
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      this.logger.debug(`Storage stats for tenant ${tenantContext.organizationId}/${tenantContext.propertyId}: ${totalFiles} files, ${totalSize} bytes`);

      return {
        totalFiles,
        totalSize,
        filesByModule,
      };
    } catch (error) {
      this.logger.error('Failed to get tenant storage stats', error);
      throw new Error('Failed to get storage statistics');
    }
  }
}