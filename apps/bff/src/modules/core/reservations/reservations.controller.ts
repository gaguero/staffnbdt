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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, UpdateReservationDto, ReservationFilterDto } from './dto';

@Controller('api/core/reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  findAll(@Query() filters: ReservationFilterDto) {
    return this.reservationsService.findAll(filters);
  }

  @Get('arrivals/today')
  getTodaysArrivals(@Query('propertyId') propertyId: string) {
    return this.reservationsService.getTodaysArrivals(propertyId);
  }

  @Get('departures/today')
  getTodaysDepartures(@Query('propertyId') propertyId: string) {
    return this.reservationsService.getTodaysDepartures(propertyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Put(':id/status')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.reservationsService.updateStatus(id, status);
  }

  @Put(':id/check-in')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  checkIn(
    @Param('id') id: string,
    @Body('checkedInBy') checkedInBy: string,
  ) {
    return this.reservationsService.checkIn(id, checkedInBy);
  }

  @Put(':id/check-out')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  checkOut(
    @Param('id') id: string,
    @Body('checkedOutBy') checkedOutBy: string,
  ) {
    return this.reservationsService.checkOut(id, checkedOutBy);
  }

  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN)
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}