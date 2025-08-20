import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { R2Service } from './r2.service';
import { StorageMigrationService } from './storage-migration.service';
import { TenantModule } from '../tenant/tenant.module';

@Global()
@Module({
  imports: [ConfigModule, TenantModule],
  providers: [StorageService, R2Service, StorageMigrationService],
  exports: [StorageService, R2Service, StorageMigrationService],
})
export class StorageModule {}