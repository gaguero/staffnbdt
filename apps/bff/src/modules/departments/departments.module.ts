import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { TenantModule } from '../../shared/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  providers: [DepartmentsService],
  controllers: [DepartmentsController],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}