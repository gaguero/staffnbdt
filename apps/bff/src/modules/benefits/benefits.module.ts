import { Module } from '@nestjs/common';
import { BenefitsService } from './benefits.service';
import { BenefitsController } from './benefits.controller';

@Module({
  providers: [BenefitsService],
  controllers: [BenefitsController],
  exports: [BenefitsService],
})
export class BenefitsModule {}