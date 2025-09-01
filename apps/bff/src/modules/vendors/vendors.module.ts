import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { TenantModule } from '../../shared/tenant/tenant.module';

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}


