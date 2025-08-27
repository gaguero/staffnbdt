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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { CreateUnitDto, UpdateUnitDto, UnitFilterDto, UnitAvailabilityDto } from './dto';
import { User, UnitStatus } from '@prisma/client';

@ApiTags('Units')
@Controller('units')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @RequirePermission('unit.create.property')
  @Audit({ action: 'CREATE', entity: 'Unit' })
  @ApiOperation({ summary: 'Create a new unit/room' })
  @ApiResponse({ status: 201, description: 'Unit created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Unit number already exists' })
  async create(
    @Body() createUnitDto: CreateUnitDto,
    @CurrentUser() currentUser: User,
  ) {
    const unit = await this.unitsService.create(createUnitDto, currentUser);
    return CustomApiResponse.success(unit, 'Unit created successfully');
  }

  @Get()
  @RequirePermission('unit.read.property')
  @ApiOperation({ summary: 'Get all units with filtering' })
  @ApiResponse({ status: 200, description: 'Units retrieved successfully' })
  async findAll(
    @Query() filterDto: UnitFilterDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.unitsService.findAll(filterDto, currentUser);
    return CustomApiResponse.success(result, 'Units retrieved successfully');
  }

  @Get('stats')
  @RequirePermission('unit.read.property')
  @ApiOperation({ summary: 'Get unit statistics' })
  @ApiResponse({ status: 200, description: 'Unit statistics retrieved successfully' })
  async getStats(@CurrentUser() currentUser: User) {
    const stats = await this.unitsService.getUnitStats(currentUser);
    return CustomApiResponse.success(stats, 'Unit statistics retrieved successfully');
  }

  @Get('availability')
  @RequirePermission('unit.read.property')
  @ApiOperation({ summary: 'Check unit availability for given dates' })
  @ApiResponse({ status: 200, description: 'Unit availability checked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid date range' })
  async checkAvailability(
    @Query() availabilityDto: UnitAvailabilityDto,
    @CurrentUser() currentUser: User,
  ) {
    const availability = await this.unitsService.checkAvailability(availabilityDto, currentUser);
    return CustomApiResponse.success(availability, 'Unit availability retrieved successfully');
  }

  @Get('available')
  @RequirePermission('unit.read.property')
  @ApiOperation({ summary: 'Get available units for given dates' })
  @ApiResponse({ status: 200, description: 'Available units retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid date range' })
  async getAvailableUnits(
    @Query() availabilityDto: UnitAvailabilityDto,
    @CurrentUser() currentUser: User,
  ) {
    const units = await this.unitsService.getAvailableUnits(availabilityDto, currentUser);
    return CustomApiResponse.success(units, 'Available units retrieved successfully');
  }

  @Get(':id')
  @RequirePermission('unit.read.property')
  @Audit({ action: 'VIEW', entity: 'Unit' })
  @ApiOperation({ summary: 'Get unit by ID with reservations' })
  @ApiResponse({ status: 200, description: 'Unit retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const unit = await this.unitsService.findOne(id, currentUser);
    return CustomApiResponse.success(unit, 'Unit retrieved successfully');
  }

  @Patch(':id')
  @RequirePermission('unit.update.property')
  @Audit({ action: 'UPDATE', entity: 'Unit' })
  @ApiOperation({ summary: 'Update unit' })
  @ApiResponse({ status: 200, description: 'Unit updated successfully' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitDto,
    @CurrentUser() currentUser: User,
  ) {
    const unit = await this.unitsService.update(id, updateUnitDto, currentUser);
    return CustomApiResponse.success(unit, 'Unit updated successfully');
  }

  @Patch(':id/status')
  @RequirePermission('unit.update.property')
  @Audit({ action: 'UPDATE_STATUS', entity: 'Unit' })
  @ApiOperation({ summary: 'Update unit status' })
  @ApiResponse({ status: 200, description: 'Unit status updated successfully' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: UnitStatus,
    @CurrentUser() currentUser: User,
  ) {
    const unit = await this.unitsService.updateStatus(id, status, currentUser);
    return CustomApiResponse.success(unit, 'Unit status updated successfully');
  }

  @Delete(':id')
  @RequirePermission('unit.delete.property')
  @Audit({ action: 'DELETE', entity: 'Unit' })
  @ApiOperation({ summary: 'Delete unit (soft delete)' })
  @ApiResponse({ status: 200, description: 'Unit deleted successfully' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot delete unit with active reservations' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.unitsService.remove(id, currentUser);
    return CustomApiResponse.success(null, 'Unit deleted successfully');
  }

  @Post(':id/restore')
  @RequirePermission('unit.update.property')
  @Audit({ action: 'RESTORE', entity: 'Unit' })
  @ApiOperation({ summary: 'Restore deleted unit' })
  @ApiResponse({ status: 200, description: 'Unit restored successfully' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const unit = await this.unitsService.restore(id, currentUser);
    return CustomApiResponse.success(unit, 'Unit restored successfully');
  }
}