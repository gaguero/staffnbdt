import { Module } from '@nestjs/common';
import { StorageMigrationController } from './storage-migration.controller';
import { StorageModule } from '../../shared/storage/storage.module';
import { PermissionModule } from '../permissions/permission.module';
import { TenantModule } from '../../shared/tenant/tenant.module';

/**
 * Admin Module
 * Contains admin-only controllers and services for system management
 * All endpoints require elevated permissions (PLATFORM_ADMIN role)
 */
@Module({
  imports: [
    StorageModule,
    PermissionModule,
    TenantModule,
  ],
  controllers: [
    StorageMigrationController,
  ],
  providers: [],
  exports: [],
})
export class AdminModule {}