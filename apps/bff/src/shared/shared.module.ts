import { Module, Global } from '@nestjs/common';
import { PermissionService } from './services/permission.service';
import { PermissionGuard } from './guards/permission.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  providers: [
    PermissionService,
    PermissionGuard,
    RolesGuard,
  ],
  exports: [
    PermissionService,
    PermissionGuard,
    RolesGuard,
  ],
})
export class SharedModule {}