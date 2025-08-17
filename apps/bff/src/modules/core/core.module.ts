import { Module } from '@nestjs/common';
import { UnitsModule } from './units/units.module';
import { GuestsModule } from './guests/guests.module';
import { ReservationsModule } from './reservations/reservations.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    UnitsModule,
    GuestsModule,
    ReservationsModule,
    TasksModule,
  ],
  exports: [
    UnitsModule,
    GuestsModule,
    ReservationsModule,
    TasksModule,
  ],
})
export class CoreModule {}