import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { Role } from '@prisma/client';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, UpdateReservationDto, ReservationFilterDto } from './dto';

@Controller('api/core/reservations')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @RequirePermission('reservation.create.property')
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  @RequirePermission('reservation.read.property')
  findAll(@Query() filters: ReservationFilterDto) {
    return this.reservationsService.findAll(filters);
  }

  @Get('arrivals/today')
  @RequirePermission('reservation.read.property')
  getTodaysArrivals(@Query('propertyId') propertyId: string) {
    return this.reservationsService.getTodaysArrivals(propertyId);
  }

  @Get('departures/today')
  @RequirePermission('reservation.read.property')
  getTodaysDepartures(@Query('propertyId') propertyId: string) {
    return this.reservationsService.getTodaysDepartures(propertyId);
  }

  @Get(':id')
  @RequirePermission('reservation.read.property')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('reservation.update.property')
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Put(':id/status')
  @RequirePermission('reservation.update.property')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.reservationsService.updateStatus(id, status);
  }

  @Put(':id/check-in')
  @RequirePermission('reservation.update.property')
  checkIn(
    @Param('id') id: string,
    @Body('checkedInBy') checkedInBy: string,
  ) {
    return this.reservationsService.checkIn(id, checkedInBy);
  }

  @Put(':id/check-out')
  @RequirePermission('reservation.update.property')
  checkOut(
    @Param('id') id: string,
    @Body('checkedOutBy') checkedOutBy: string,
  ) {
    return this.reservationsService.checkOut(id, checkedOutBy);
  }

  @Delete(':id')
  @RequirePermission('reservation.delete.property')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}