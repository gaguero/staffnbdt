import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PermissionGuard } from './guards/permission.guard';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuditModule } from '../../shared/audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuditModule,
  ],
  providers: [PermissionService, PermissionGuard],
  controllers: [PermissionController],
  exports: [PermissionService, PermissionGuard],
})
export class PermissionModule {}