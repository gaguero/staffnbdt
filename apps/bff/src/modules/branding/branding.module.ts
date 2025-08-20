import { Module } from '@nestjs/common';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { PermissionModule } from '../permissions/permission.module';

@Module({
  imports: [DatabaseModule, PermissionModule],
  controllers: [BrandingController],
  providers: [BrandingService],
  exports: [BrandingService],
})
export class BrandingModule {}