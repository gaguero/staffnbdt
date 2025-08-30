import { Module } from '@nestjs/common';
import { ModuleRegistryService } from './module-registry.service';
import { ModuleRegistryController } from './module-registry.controller';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuditModule } from '../../shared/audit/audit.module';
import { PermissionModule } from '../permissions/permission.module';

@Module({
  imports: [DatabaseModule, AuditModule, PermissionModule],
  providers: [ModuleRegistryService],
  controllers: [ModuleRegistryController],
  exports: [ModuleRegistryService],
})
export class ModuleRegistryModule {}