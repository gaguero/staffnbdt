import { Module } from '@nestjs/common';
import { ModuleSubscriptionsController } from './module-subscriptions.controller';
import { ModuleRegistryModule } from '../module-registry/module-registry.module';

@Module({
  imports: [ModuleRegistryModule],
  controllers: [ModuleSubscriptionsController],
  providers: [],
  exports: [],
})
export class ModuleSubscriptionsModule {}