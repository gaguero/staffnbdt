import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}