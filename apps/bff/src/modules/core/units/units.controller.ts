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
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, UnitFilterDto } from './dto';

@Controller('api/core/units')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @RequirePermission('unit.create.property')
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  @Get()
  @RequirePermission('unit.read.property')
  findAll(@Query() filters: UnitFilterDto) {
    return this.unitsService.findAll(filters);
  }

  @Get('property/:propertyId')
  @RequirePermission('unit.read.property')
  getUnitsByProperty(@Param('propertyId') propertyId: string) {
    return this.unitsService.getUnitsByProperty(propertyId);
  }

  @Get('available')
  @RequirePermission('unit.read.property')
  getAvailableUnits(
    @Query('propertyId') propertyId: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
  ) {
    return this.unitsService.getAvailableUnits(
      propertyId,
      new Date(checkInDate),
      new Date(checkOutDate),
    );
  }

  @Get(':id')
  @RequirePermission('unit.read.property')
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('unit.update.property')
  update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
    return this.unitsService.update(id, updateUnitDto);
  }

  @Put(':id/status')
  @RequirePermission('unit.update.property')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.unitsService.updateStatus(id, status);
  }

  @Delete(':id')
  @RequirePermission('unit.delete.property')
  remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }
}