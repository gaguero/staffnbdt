import { Module } from '@nestjs/common';
import { SystemRolesService } from './system-roles.service';
import { SystemRolesController, UserRoleHistoryController } from './system-roles.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { PermissionService } from '../../shared/services/permission.service';

@Module({
  controllers: [SystemRolesController, UserRoleHistoryController],
  providers: [SystemRolesService, PrismaService, PermissionService],
  exports: [SystemRolesService]
})
export class SystemRolesModule {}