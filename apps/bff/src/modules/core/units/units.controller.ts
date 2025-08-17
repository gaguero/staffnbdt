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
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, UnitFilterDto } from './dto';

@Controller('api/core/units')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Roles(Role.PLATFORM_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN)
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  @Get()
  findAll(@Query() filters: UnitFilterDto) {
    return this.unitsService.findAll(filters);
  }

  @Get('property/:propertyId')
  getUnitsByProperty(@Param('propertyId') propertyId: string) {
    return this.unitsService.getUnitsByProperty(propertyId);
  }

  @Get('available')
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
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN)
  update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
    return this.unitsService.update(id, updateUnitDto);
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
    return this.unitsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN)
  remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }
}