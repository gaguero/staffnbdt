import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { CreateReservationDto, UpdateReservationDto, ReservationFilterDto, CheckInDto, CheckOutDto } from './dto';
import { User } from '@prisma/client';

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @RequirePermission('reservation.create.property')
  @Audit({ action: 'CREATE', entity: 'Reservation' })
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Unit not available or validation error' })
  @ApiResponse({ status: 404, description: 'Unit or guest not found' })
  async create(
    @Body() createReservationDto: CreateReservationDto,
    @CurrentUser() currentUser: User,
  ) {
    const reservation = await this.reservationsService.create(createReservationDto, currentUser);
    return CustomApiResponse.success(reservation, 'Reservation created successfully');
  }

  @Get()
  @RequirePermission('reservation.read.property')
  @ApiOperation({ summary: 'Get all reservations with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Reservations retrieved successfully' })
  async findAll(
    @Query() filterDto: ReservationFilterDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.reservationsService.findAll(filterDto, currentUser);
    return CustomApiResponse.success(result, 'Reservations retrieved successfully');
  }

  @Get('stats')
  @RequirePermission('reservation.read.property')
  @ApiOperation({ summary: 'Get reservation statistics' })
  @ApiResponse({ status: 200, description: 'Reservation statistics retrieved successfully' })
  async getStats(@CurrentUser() currentUser: User) {
    const stats = await this.reservationsService.getReservationStats(currentUser);
    return CustomApiResponse.success(stats, 'Reservation statistics retrieved successfully');
  }

  @Get('conflicts/:unitId')
  @RequirePermission('reservation.read.property')
  @ApiOperation({ summary: 'Check for reservation conflicts on a unit' })
  @ApiResponse({ status: 200, description: 'Conflict check completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid date range' })
  async checkConflicts(
    @Param('unitId') unitId: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
    @Query('excludeReservationId') excludeReservationId: string | undefined,
    @CurrentUser() currentUser: User,
  ) {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      throw new Error('Check-out date must be after check-in date');
    }

    const conflict = await this.reservationsService.checkReservationConflict(
      unitId,
      checkIn,
      checkOut,
      currentUser,
      excludeReservationId,
    );
    
    return CustomApiResponse.success(conflict, 'Conflict check completed successfully');
  }

  @Get(':id')
  @RequirePermission('reservation.read.property')
  @Audit({ action: 'VIEW', entity: 'Reservation' })
  @ApiOperation({ summary: 'Get reservation by ID with full details' })
  @ApiResponse({ status: 200, description: 'Reservation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const reservation = await this.reservationsService.findOne(id, currentUser);
    return CustomApiResponse.success(reservation, 'Reservation retrieved successfully');
  }

  @Patch(':id')
  @RequirePermission('reservation.update.property')
  @Audit({ action: 'UPDATE', entity: 'Reservation' })
  @ApiOperation({ summary: 'Update reservation details' })
  @ApiResponse({ status: 200, description: 'Reservation updated successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation error or conflict' })
  async update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @CurrentUser() currentUser: User,
  ) {
    const reservation = await this.reservationsService.update(id, updateReservationDto, currentUser);
    return CustomApiResponse.success(reservation, 'Reservation updated successfully');
  }

  @Post(':id/cancel')
  @RequirePermission('reservation.update.property')
  @Audit({ action: 'CANCEL', entity: 'Reservation' })
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot cancel this reservation' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: User,
  ) {
    const reservation = await this.reservationsService.cancel(id, reason, currentUser);
    return CustomApiResponse.success(reservation, 'Reservation cancelled successfully');
  }

  @Post(':id/check-in')
  @RequirePermission('reservation.update.property')
  @Audit({ action: 'CHECK_IN', entity: 'Reservation' })
  @ApiOperation({ summary: 'Check in a confirmed reservation' })
  @ApiResponse({ status: 200, description: 'Guest checked in successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot check in this reservation' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async checkIn(
    @Param('id') id: string,
    @Body() checkInDto: CheckInDto,
    @CurrentUser() currentUser: User,
  ) {
    const reservation = await this.reservationsService.checkIn(id, checkInDto, currentUser);
    return CustomApiResponse.success(reservation, 'Guest checked in successfully');
  }

  @Post(':id/check-out')
  @RequirePermission('reservation.update.property')
  @Audit({ action: 'CHECK_OUT', entity: 'Reservation' })
  @ApiOperation({ summary: 'Check out a guest and finalize the reservation' })
  @ApiResponse({ status: 200, description: 'Guest checked out successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot check out this reservation' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async checkOut(
    @Param('id') id: string,
    @Body() checkOutDto: CheckOutDto,
    @CurrentUser() currentUser: User,
  ) {
    const reservation = await this.reservationsService.checkOut(id, checkOutDto, currentUser);
    return CustomApiResponse.success(reservation, 'Guest checked out successfully');
  }
}