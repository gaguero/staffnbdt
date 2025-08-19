import { Module, Global } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantContextService } from './tenant-context.service';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantGuard } from '../guards/tenant.guard';
import { DatabaseModule } from '../database/database.module';

/**
 * Global module for tenant-related services
 * This module provides tenant context, validation, and security services throughout the application
 */
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    TenantService,
    TenantContextService,
    TenantInterceptor,
    TenantGuard,
  ],
  exports: [
    TenantService,
    TenantContextService,
    TenantInterceptor,
    TenantGuard,
  ],
})
export class TenantModule {}