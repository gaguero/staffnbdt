import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { R2Service } from './r2.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import { RequestTenantContext } from '../tenant/tenant-context.service';

export interface MigrationOptions {
  batchSize?: number;
  dryRun?: boolean;
  deleteAfterMigration?: boolean;
  filterByModule?: string[];
  skipExisting?: boolean;
}

export interface MigrationStats {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  totalSize: number;
  startTime: Date;
  endTime?: Date;
  errors: string[];
}

export interface FileRecord {
  localPath: string;
  r2Key: string;
  fileName: string;
  size: number;
  module: string;
  type: string;
  tenantContext: RequestTenantContext;
}

/**
 * Storage Migration Service
 * Handles migration of files from Railway local filesystem to Cloudflare R2
 */
@Injectable()
export class StorageMigrationService {
  private readonly logger = new Logger(StorageMigrationService.name);
  private readonly localStoragePath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly localStorageService: StorageService,
    private readonly r2Service: R2Service,
  ) {
    this.localStoragePath = this.configService.get('STORAGE_PATH') || '/app/storage';
    this.logger.log(`Migration service initialized - Local storage path: ${this.localStoragePath}`);
  }

  /**
   * Main migration method - migrates all files from local storage to R2
   */
  async migrateToR2(
    defaultTenantContext: RequestTenantContext,
    options: MigrationOptions = {},
  ): Promise<MigrationStats> {
    const {
      batchSize = 10,
      dryRun = false,
      deleteAfterMigration = false,
      filterByModule = [],
      skipExisting = true,
    } = options;

    const stats: MigrationStats = {
      totalFiles: 0,
      migratedFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      totalSize: 0,
      startTime: new Date(),
      errors: [],
    };

    this.logger.log(`Starting migration to R2${dryRun ? ' (DRY RUN)' : ''}`);
    this.logger.log(`Options: batchSize=${batchSize}, skipExisting=${skipExisting}, deleteAfterMigration=${deleteAfterMigration}`);

    try {
      // Scan local storage for files to migrate
      const filesToMigrate = await this.scanLocalStorage(defaultTenantContext, filterByModule);
      stats.totalFiles = filesToMigrate.length;

      this.logger.log(`Found ${stats.totalFiles} files to migrate`);

      if (dryRun) {
        this.logger.log('DRY RUN - Files that would be migrated:');
        filesToMigrate.forEach(file => {
          this.logger.log(`  ${file.localPath} -> ${file.r2Key}`);
        });
        stats.endTime = new Date();
        return stats;
      }

      // Process files in batches
      for (let i = 0; i < filesToMigrate.length; i += batchSize) {
        const batch = filesToMigrate.slice(i, i + batchSize);
        
        this.logger.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(filesToMigrate.length / batchSize)} (${batch.length} files)`);
        
        const batchPromises = batch.map(file => 
          this.migrateFile(file, skipExisting, deleteAfterMigration).then(result => {
            if (result.success) {
              stats.migratedFiles++;
              stats.totalSize += result.size || 0;
            } else if (result.skipped) {
              stats.skippedFiles++;
            } else {
              stats.failedFiles++;
              stats.errors.push(result.error || 'Unknown error');
            }
            return result;
          }).catch(error => {
            stats.failedFiles++;
            stats.errors.push(`${file.localPath}: ${error.message}`);
            this.logger.error(`Failed to migrate file: ${file.localPath}`, error);
            return { success: false, error: error.message };
          })
        );

        await Promise.all(batchPromises);
        
        // Log progress
        const progress = Math.round(((i + batch.length) / filesToMigrate.length) * 100);
        this.logger.log(`Progress: ${progress}% (${stats.migratedFiles} migrated, ${stats.failedFiles} failed, ${stats.skippedFiles} skipped)`);
      }

      stats.endTime = new Date();
      const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;

      this.logger.log(`Migration completed in ${duration}s`);
      this.logger.log(`Results: ${stats.migratedFiles} migrated, ${stats.failedFiles} failed, ${stats.skippedFiles} skipped`);
      this.logger.log(`Total size migrated: ${Math.round(stats.totalSize / 1024 / 1024 * 100) / 100} MB`);

      if (stats.errors.length > 0) {
        this.logger.warn(`Migration completed with ${stats.errors.length} errors:`);
        stats.errors.forEach(error => this.logger.warn(`  - ${error}`));
      }

      return stats;
    } catch (error) {
      stats.endTime = new Date();
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Scan local storage directory for files to migrate
   */
  private async scanLocalStorage(
    defaultTenantContext: RequestTenantContext,
    filterByModule: string[] = [],
  ): Promise<FileRecord[]> {
    const files: FileRecord[] = [];

    // Define the directory structure mapping
    const directoryMapping = {
      documents: {
        general: 'documents/general',
        departments: 'documents/departments',  
        users: 'documents/users',
      },
      payroll: {
        payslips: 'payslips',
      },
      training: {
        materials: 'training/materials',
        submissions: 'training/submissions',
      },
      profiles: {
        photos: 'profiles',
      },
      temp: {
        uploads: 'temp',
      },
    };

    for (const [module, types] of Object.entries(directoryMapping)) {
      // Skip if filtering by module and this module is not included
      if (filterByModule.length > 0 && !filterByModule.includes(module)) {
        continue;
      }

      for (const [type, localDir] of Object.entries(types)) {
        const fullPath = path.join(this.localStoragePath, localDir);
        
        try {
          const moduleFiles = await this.scanDirectory(fullPath, module, type, defaultTenantContext);
          files.push(...moduleFiles);
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            this.logger.debug(`Directory does not exist: ${fullPath}`);
          } else {
            this.logger.warn(`Failed to scan directory: ${fullPath}`, error);
          }
        }
      }
    }

    return files;
  }

  /**
   * Recursively scan a directory for files
   */
  private async scanDirectory(
    dirPath: string,
    module: string,
    type: string,
    tenantContext: RequestTenantContext,
  ): Promise<FileRecord[]> {
    const files: FileRecord[] = [];

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
        // Directory doesn't exist or can't be read
        return;
      }
    }

    for await (const filePath of walk(dirPath)) {
      try {
        const stats = await fs.stat(filePath);
        const fileName = path.basename(filePath);
        
        // Skip hidden files and system files
        if (fileName.startsWith('.') || fileName.startsWith('~')) {
          continue;
        }

        // Generate R2 key for this file
        const r2Key = this.r2Service.generateFileKey(module, type, fileName, tenantContext);

        files.push({
          localPath: filePath,
          r2Key,
          fileName,
          size: stats.size,
          module,
          type,
          tenantContext,
        });
      } catch (error) {
        this.logger.warn(`Failed to process file: ${filePath}`, error);
      }
    }

    return files;
  }

  /**
   * Migrate a single file from local storage to R2
   */
  private async migrateFile(
    file: FileRecord,
    skipExisting: boolean,
    deleteAfterMigration: boolean,
  ): Promise<{ success: boolean; skipped?: boolean; size?: number; error?: string }> {
    try {
      // Check if file already exists in R2
      if (skipExisting) {
        const exists = await this.r2Service.fileExists(file.r2Key);
        if (exists) {
          this.logger.debug(`File already exists in R2, skipping: ${file.r2Key}`);
          return { success: false, skipped: true };
        }
      }

      // Read file from local storage
      const fileBuffer = await fs.readFile(file.localPath);
      
      // Determine MIME type based on file extension
      const mimeType = this.getMimeType(file.fileName);

      // Upload to R2
      await this.r2Service.uploadFile(fileBuffer, {
        fileName: file.fileName,
        mimeType,
        tenantContext: file.tenantContext,
      });

      this.logger.debug(`Successfully migrated: ${file.localPath} -> ${file.r2Key}`);

      // Delete local file if requested
      if (deleteAfterMigration) {
        try {
          await fs.unlink(file.localPath);
          this.logger.debug(`Deleted local file: ${file.localPath}`);
        } catch (error) {
          this.logger.warn(`Failed to delete local file after migration: ${file.localPath}`, error);
          // Don't fail the migration if we can't delete the local file
        }
      }

      return { success: true, size: file.size };
    } catch (error: any) {
      this.logger.error(`Failed to migrate file: ${file.localPath}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback migration - move files back from R2 to local storage
   */
  async rollbackMigration(
    tenantContext: RequestTenantContext,
    options: { batchSize?: number; dryRun?: boolean } = {},
  ): Promise<MigrationStats> {
    const { batchSize = 10, dryRun = false } = options;

    const stats: MigrationStats = {
      totalFiles: 0,
      migratedFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      totalSize: 0,
      startTime: new Date(),
      errors: [],
    };

    this.logger.log(`Starting migration rollback${dryRun ? ' (DRY RUN)' : ''}`);

    try {
      // List all files in R2 for this tenant
      const r2Files = await this.r2Service.listFiles(tenantContext);
      stats.totalFiles = r2Files.length;

      this.logger.log(`Found ${stats.totalFiles} files to rollback`);

      if (dryRun) {
        this.logger.log('DRY RUN - Files that would be rolled back:');
        r2Files.forEach(key => {
          const localPath = this.convertR2KeyToLocalPath(key);
          this.logger.log(`  ${key} -> ${localPath}`);
        });
        stats.endTime = new Date();
        return stats;
      }

      // Process files in batches
      for (let i = 0; i < r2Files.length; i += batchSize) {
        const batch = r2Files.slice(i, i + batchSize);
        
        this.logger.log(`Processing rollback batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(r2Files.length / batchSize)} (${batch.length} files)`);
        
        const batchPromises = batch.map(async (key) => {
          try {
            // Download from R2
            const fileBuffer = await this.r2Service.downloadFile(key);
            
            // Convert R2 key to local path
            const localPath = this.convertR2KeyToLocalPath(key);
            
            // Ensure local directory exists
            const dir = path.dirname(localPath);
            await fs.mkdir(dir, { recursive: true });
            
            // Write to local storage
            await fs.writeFile(localPath, fileBuffer);
            
            // Delete from R2
            await this.r2Service.deleteFile(key);
            
            stats.migratedFiles++;
            stats.totalSize += fileBuffer.length;
            
            this.logger.debug(`Successfully rolled back: ${key} -> ${localPath}`);
            return { success: true };
          } catch (error: any) {
            stats.failedFiles++;
            stats.errors.push(`${key}: ${error.message}`);
            this.logger.error(`Failed to rollback file: ${key}`, error);
            return { success: false, error: error.message };
          }
        });

        await Promise.all(batchPromises);
        
        const progress = Math.round(((i + batch.length) / r2Files.length) * 100);
        this.logger.log(`Rollback progress: ${progress}% (${stats.migratedFiles} restored, ${stats.failedFiles} failed)`);
      }

      stats.endTime = new Date();
      const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;

      this.logger.log(`Rollback completed in ${duration}s`);
      this.logger.log(`Results: ${stats.migratedFiles} restored, ${stats.failedFiles} failed`);

      return stats;
    } catch (error) {
      stats.endTime = new Date();
      this.logger.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Verify migration integrity by comparing local and R2 files
   */
  async verifyMigration(tenantContext: RequestTenantContext): Promise<{
    totalFiles: number;
    matchingFiles: number;
    missingFiles: number;
    sizeMismatches: number;
    errors: string[];
  }> {
    const result = {
      totalFiles: 0,
      matchingFiles: 0,
      missingFiles: 0,
      sizeMismatches: 0,
      errors: [],
    };

    this.logger.log('Starting migration verification');

    try {
      // Get list of files that should have been migrated
      const originalFiles = await this.scanLocalStorage(tenantContext);
      result.totalFiles = originalFiles.length;

      for (const file of originalFiles) {
        try {
          // Check if file exists in R2
          const exists = await this.r2Service.fileExists(file.r2Key);
          
          if (!exists) {
            result.missingFiles++;
            result.errors.push(`File missing in R2: ${file.r2Key}`);
            continue;
          }

          // Get file metadata from R2
          const r2Metadata = await this.r2Service.getFileMetadata(file.r2Key);
          
          // Compare sizes
          if (r2Metadata.size !== file.size) {
            result.sizeMismatches++;
            result.errors.push(`Size mismatch for ${file.r2Key}: local=${file.size}, r2=${r2Metadata.size}`);
          } else {
            result.matchingFiles++;
          }
        } catch (error: any) {
          result.errors.push(`Verification error for ${file.r2Key}: ${error.message}`);
        }
      }

      this.logger.log(`Verification completed: ${result.matchingFiles} matching, ${result.missingFiles} missing, ${result.sizeMismatches} size mismatches`);
      
      return result;
    } catch (error) {
      this.logger.error('Verification failed:', error);
      throw error;
    }
  }

  /**
   * Convert R2 key back to local storage path for rollback
   */
  private convertR2KeyToLocalPath(r2Key: string): string {
    // Extract the file path after the tenant prefix
    const keyParts = r2Key.split('/');
    
    // Format: org/{orgId}/property/{propId}/module/type/filename
    if (keyParts.length < 6) {
      throw new Error(`Invalid R2 key format: ${r2Key}`);
    }

    const module = keyParts[4];
    const type = keyParts[5];
    const fileName = keyParts.slice(6).join('/'); // In case filename contains slashes

    // Map back to local directory structure
    const moduleTypeMapping: Record<string, Record<string, string>> = {
      documents: {
        general: 'documents/general',
        departments: 'documents/departments',
        users: 'documents/users',
      },
      payroll: {
        payslips: 'payslips',
      },
      training: {
        materials: 'training/materials',
        submissions: 'training/submissions',
      },
      profiles: {
        photos: 'profiles',
      },
      temp: {
        uploads: 'temp',
      },
    };

    const localDir = moduleTypeMapping[module]?.[type];
    if (!localDir) {
      throw new Error(`Unknown module/type combination: ${module}/${type}`);
    }

    return path.join(this.localStoragePath, localDir, fileName);
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.csv': 'text/csv',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Clean up empty directories after migration
   */
  async cleanupEmptyDirectories(): Promise<void> {
    this.logger.log('Cleaning up empty directories');

    const cleanup = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath);
        
        if (entries.length === 0) {
          await fs.rmdir(dirPath);
          this.logger.debug(`Removed empty directory: ${dirPath}`);
          
          // Recursively clean up parent directory if it becomes empty
          const parent = path.dirname(dirPath);
          if (parent !== dirPath && parent !== this.localStoragePath) {
            await cleanup(parent);
          }
        } else {
          // Check subdirectories
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);
            const stats = await fs.stat(fullPath);
            
            if (stats.isDirectory()) {
              await cleanup(fullPath);
            }
          }
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY') {
          this.logger.warn(`Failed to cleanup directory: ${dirPath}`, error);
        }
      }
    };

    await cleanup(this.localStoragePath);
    this.logger.log('Directory cleanup completed');
  }
}