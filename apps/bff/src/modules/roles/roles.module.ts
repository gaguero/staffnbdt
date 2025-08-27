import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RolesService } from './roles.service';
import { RolesHistoryService } from './roles-history.service';
import { RolesController, UserRolesController } from './roles.controller';
import { RolesHistoryController } from './roles-history.controller';
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
  providers: [
    RolesService,
    RolesHistoryService,
  ],
  controllers: [RolesController, UserRolesController, RolesHistoryController],
  exports: [RolesService, RolesHistoryService],
})
export class RolesModule {}