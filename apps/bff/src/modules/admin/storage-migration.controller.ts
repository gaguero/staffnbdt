import { Controller, Post, Get, Body, Query, UseGuards, Request, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { StorageMigrationService, MigrationOptions, MigrationStats } from '../../shared/storage/storage-migration.service';
import { StorageService } from '../../shared/storage/storage.service';
import { R2Service } from '../../shared/storage/r2.service';
import { TenantContextService, RequestTenantContext } from '../../shared/tenant/tenant-context.service';
import { Role } from '@prisma/client';

class MigrationOptionsDto {
  batchSize?: number = 10;
  dryRun?: boolean = false;
  deleteAfterMigration?: boolean = false;
  filterByModule?: string[];
  skipExisting?: boolean = true;
}

class VerificationResponseDto {
  totalFiles: number;
  matchingFiles: number;
  missingFiles: number;
  sizeMismatches: number;
  errors: string[];
}

class StorageStatsDto {
  totalFiles: number;
  totalSize: number;
  filesByModule: Record<string, number>;
}

class StorageConfigDto {
  useR2: boolean;
  hybridMode: boolean;
  localPath: string;
  r2Available: boolean;
  r2Healthy?: boolean;
}

/**
 * Storage Migration Controller
 * Admin-only endpoints for managing storage migration from local to R2
 * Requires PLATFORM_ADMIN role and system.storage.manage permission
 */
@ApiTags('Admin - Storage Migration')
@ApiBearerAuth()
@Controller('admin/storage')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class StorageMigrationController {
  private readonly logger = new Logger(StorageMigrationController.name);

  constructor(
    private readonly storageMigrationService: StorageMigrationService,
    private readonly storageService: StorageService,
    private readonly r2Service: R2Service,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post('migrate/to-r2')
  @RequirePermission('system.storage.manage')
  @ApiOperation({
    summary: 'Migrate files from local storage to Cloudflare R2',
    description: 'Migrates all files from Railway local storage to Cloudflare R2 with tenant-scoped organization'
  })
  @ApiResponse({ status: 200, description: 'Migration completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid migration parameters' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiBody({ type: MigrationOptionsDto })
  async migrateToR2(
    @Request() req,
    @Body() options: MigrationOptionsDto,
  ): Promise<MigrationStats> {
    // Only platform admins can perform system-wide migrations
    const tenantContext = this.tenantContextService.getTenantContext(req);
    
    if (tenantContext.userRole !== Role.PLATFORM_ADMIN) {
      throw new BadRequestException('Only platform admins can perform system-wide storage migrations');
    }

    // Use a default tenant context for migration
    // In practice, you might want to migrate files for each tenant separately
    const defaultTenantContext: RequestTenantContext = {
      userId: tenantContext.userId,
      organizationId: tenantContext.organizationId,
      propertyId: tenantContext.propertyId,
      departmentId: tenantContext.departmentId,
      userRole: tenantContext.userRole,
    };

    this.logger.log(`Starting storage migration to R2 by user ${tenantContext.userId}`);
    this.logger.log(`Migration options: ${JSON.stringify(options)}`);

    try {
      const stats = await this.storageMigrationService.migrateToR2(defaultTenantContext, options);
      
      this.logger.log(`Migration completed: ${stats.migratedFiles} files migrated, ${stats.failedFiles} failed`);
      
      return stats;
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  @Post('rollback/from-r2')
  @RequirePermission('system.storage.manage')
  @ApiOperation({
    summary: 'Rollback migration from R2 to local storage',
    description: 'Moves files back from Cloudflare R2 to local storage and deletes R2 copies'
  })
  @ApiResponse({ status: 200, description: 'Rollback completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rollback parameters' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'batchSize', required: false, type: Number, description: 'Number of files to process in each batch' })
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean, description: 'Preview rollback without making changes' })
  async rollbackFromR2(
    @Request() req,
    @Query('batchSize') batchSize: number = 10,
    @Query('dryRun') dryRun: boolean = false,
  ): Promise<MigrationStats> {
    const tenantContext = this.tenantContextService.getTenantContext(req);
    
    if (tenantContext.userRole !== Role.PLATFORM_ADMIN) {
      throw new BadRequestException('Only platform admins can perform storage rollbacks');
    }

    this.logger.log(`Starting storage rollback from R2 by user ${tenantContext.userId}`);

    try {
      const stats = await this.storageMigrationService.rollbackMigration(
        tenantContext,
        { batchSize, dryRun }
      );
      
      this.logger.log(`Rollback completed: ${stats.migratedFiles} files restored, ${stats.failedFiles} failed`);
      
      return stats;
    } catch (error) {
      this.logger.error('Rollback failed:', error);
      throw error;
    }
  }

  @Get('verify/migration')
  @RequirePermission('system.storage.view')
  @ApiOperation({
    summary: 'Verify migration integrity',
    description: 'Compares local and R2 files to ensure migration was successful'
  })
  @ApiResponse({ status: 200, description: 'Verification results', type: VerificationResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async verifyMigration(@Request() req): Promise<VerificationResponseDto> {
    const tenantContext = this.tenantContextService.getTenantContext(req);
    
    this.logger.log(`Starting migration verification by user ${tenantContext.userId}`);

    try {
      const result = await this.storageMigrationService.verifyMigration(tenantContext);
      
      this.logger.log(`Verification completed: ${result.matchingFiles} matching, ${result.missingFiles} missing, ${result.sizeMismatches} size mismatches`);
      
      return result;
    } catch (error) {
      this.logger.error('Verification failed:', error);
      throw error;
    }
  }

  @Get('stats/tenant')
  @RequirePermission('system.storage.view')
  @ApiOperation({
    summary: 'Get tenant storage statistics',
    description: 'Retrieve storage usage statistics for the current tenant'
  })
  @ApiResponse({ status: 200, description: 'Storage statistics', type: StorageStatsDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getTenantStorageStats(@Request() req): Promise<StorageStatsDto> {
    const tenantContext = this.tenantContextService.getTenantContext(req);
    
    try {
      const stats = await this.r2Service.getTenantStorageStats(tenantContext);
      
      this.logger.log(`Retrieved storage stats for tenant ${tenantContext.organizationId}/${tenantContext.propertyId}: ${stats.totalFiles} files, ${Math.round(stats.totalSize / 1024 / 1024 * 100) / 100} MB`);
      
      return stats;
    } catch (error) {
      this.logger.error('Failed to get tenant storage stats:', error);
      throw error;
    }
  }

  @Get('config')
  @RequirePermission('system.storage.view')
  @ApiOperation({
    summary: 'Get storage configuration',
    description: 'Retrieve current storage system configuration and health status'
  })
  @ApiResponse({ status: 200, description: 'Storage configuration', type: StorageConfigDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getStorageConfig(@Request() req): Promise<StorageConfigDto> {
    const config = this.storageService.getStorageConfig();
    
    // Check R2 health if available
    let r2Healthy: boolean | undefined;
    if (config.r2Available) {
      try {
        r2Healthy = await this.r2Service.healthCheck();
      } catch (error) {
        this.logger.warn('R2 health check failed:', error);
        r2Healthy = false;
      }
    }

    return {
      ...config,
      r2Healthy,
    };
  }

  @Post('health/r2')
  @RequirePermission('system.storage.view')
  @ApiOperation({
    summary: 'Perform R2 health check',
    description: 'Test connectivity and permissions for Cloudflare R2 storage'
  })
  @ApiResponse({ status: 200, description: 'Health check result' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async performR2HealthCheck(@Request() req): Promise<{ healthy: boolean; message: string }> {
    try {
      const healthy = await this.r2Service.healthCheck();
      
      if (healthy) {
        return { healthy: true, message: 'R2 storage is healthy and accessible' };
      } else {
        return { healthy: false, message: 'R2 storage health check failed' };
      }
    } catch (error) {
      this.logger.error('R2 health check failed:', error);
      return { 
        healthy: false, 
        message: `R2 health check failed: ${error.message}` 
      };
    }
  }

  @Post('cleanup/empty-directories')
  @RequirePermission('system.storage.manage')
  @ApiOperation({
    summary: 'Clean up empty directories',
    description: 'Remove empty directories from local storage after migration'
  })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async cleanupEmptyDirectories(@Request() req): Promise<{ message: string }> {
    const tenantContext = this.tenantContextService.getTenantContext(req);
    
    if (tenantContext.userRole !== Role.PLATFORM_ADMIN) {
      throw new BadRequestException('Only platform admins can perform directory cleanup');
    }

    try {
      await this.storageMigrationService.cleanupEmptyDirectories();
      
      return { message: 'Empty directories cleaned up successfully' };
    } catch (error) {
      this.logger.error('Directory cleanup failed:', error);
      throw error;
    }
  }
}