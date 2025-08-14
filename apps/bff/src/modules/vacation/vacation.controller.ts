import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VacationService } from './vacation.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { User } from '@prisma/client';

@ApiTags('Vacation')
@Controller('vacation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VacationController {
  constructor(private readonly vacationService: VacationService) {}

  @Post()
  @ApiOperation({ summary: 'Create vacation request' })
  async create(@Body() createVacationDto: any, @CurrentUser() currentUser: User) {
    const vacation = await this.vacationService.create(createVacationDto, currentUser);
    return CustomApiResponse.success(vacation, 'Vacation request created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get vacation requests' })
  async findAll(@Query() filterDto: any, @CurrentUser() currentUser: User) {
    const result = await this.vacationService.findAll(filterDto, currentUser);
    return CustomApiResponse.success(result, 'Vacation requests retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vacation request by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const vacation = await this.vacationService.findOne(id, currentUser);
    return CustomApiResponse.success(vacation, 'Vacation request retrieved successfully');
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve vacation request' })
  async approve(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const vacation = await this.vacationService.approve(id, currentUser);
    return CustomApiResponse.success(vacation, 'Vacation request approved successfully');
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject vacation request' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: User,
  ) {
    const vacation = await this.vacationService.reject(id, reason, currentUser);
    return CustomApiResponse.success(vacation, 'Vacation request rejected successfully');
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel vacation request' })
  async cancel(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const vacation = await this.vacationService.cancel(id, currentUser);
    return CustomApiResponse.success(vacation, 'Vacation request cancelled successfully');
  }
}