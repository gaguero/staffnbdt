import { Module } from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { RoomTypesController } from './room-types.controller';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [RoomTypesController],
  providers: [RoomTypesService],
})
export class RoomTypesModule {}


