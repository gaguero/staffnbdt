import { Module, Global } from '@nestjs/common';
import { PermissionService } from './services/permission.service';
import { PermissionGuard } from './guards/permission.guard';
import { RolesGuard } from './guards/roles.guard';
import { DomainEventBus } from './events/domain-event-bus.service';

@Global()
@Module({
  providers: [
    PermissionService,
    PermissionGuard,
    RolesGuard,
    DomainEventBus,
  ],
  exports: [
    PermissionService,
    PermissionGuard,
    RolesGuard,
    DomainEventBus,
  ],
})
export class SharedModule {}