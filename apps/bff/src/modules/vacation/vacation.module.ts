import { Module } from '@nestjs/common';
import { VacationService } from './vacation.service';
import { VacationController } from './vacation.controller';

@Module({
  providers: [VacationService],
  controllers: [VacationController],
  exports: [VacationService],
})
export class VacationModule {}