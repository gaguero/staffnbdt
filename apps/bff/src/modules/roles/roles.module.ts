import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RolesService } from './roles.service';
import { RolesController, UserRolesController } from './roles.controller';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuditModule } from '../../shared/audit/audit.module';
import { PermissionModule } from '../permissions/permission.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuditModule,
    PermissionModule,
  ],
  providers: [RolesService],
  controllers: [RolesController, UserRolesController],
  exports: [RolesService],
})
export class RolesModule {}