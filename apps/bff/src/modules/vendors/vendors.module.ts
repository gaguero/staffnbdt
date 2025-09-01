import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorNotificationProcessor } from './processors/vendor-notification.processor';
import { VendorEventHandler } from './handlers/vendor-event.handler';
import { DatabaseModule } from '../../shared/database/database.module';
import { TenantModule } from '../../shared/tenant/tenant.module';
import { DomainEventBus } from '../../shared/events/domain-event-bus.service';
import { ModuleRegistryModule } from '../module-registry/module-registry.module';

@Module({
  imports: [DatabaseModule, TenantModule, ModuleRegistryModule],
  controllers: [VendorsController],
  providers: [
    VendorsService,
    VendorNotificationProcessor,
    VendorEventHandler,
    DomainEventBus,
  ],
  exports: [VendorsService, VendorNotificationProcessor],
})
export class VendorsModule {}


