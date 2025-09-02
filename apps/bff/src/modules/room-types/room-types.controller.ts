import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoomTypesService } from './room-types.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { User } from '@prisma/client';

@ApiTags('Room Types')
@Controller('room-types')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class RoomTypesController {
  constructor(private readonly service: RoomTypesService) {}

  @Post()
  @RequirePermission('unit_type.create.property')
  @Audit({ action: 'CREATE', entity: 'RoomType' })
  @ApiOperation({ summary: 'Create room type' })
  async create(@Body() dto: any, @CurrentUser() currentUser: User) {
    const rt = await this.service.create(dto, currentUser);
    return CustomApiResponse.success(rt, 'Room type created');
  }

  @Get()
  @RequirePermission('unit_type.read.property')
  @ApiOperation({ summary: 'List room types (property-scoped)' })
  async findAll(@CurrentUser() currentUser: User) {
    const list = await this.service.findAll(currentUser);
    return CustomApiResponse.success(list, 'Room types retrieved');
  }

  @Patch(':id')
  @RequirePermission('unit_type.update.property')
  @Audit({ action: 'UPDATE', entity: 'RoomType' })
  @ApiOperation({ summary: 'Update room type' })
  async update(@Param('id') id: string, @Body() dto: any, @CurrentUser() currentUser: User) {
    const rt = await this.service.update(id, dto, currentUser);
    return CustomApiResponse.success(rt, 'Room type updated');
  }

  @Delete(':id')
  @RequirePermission('unit_type.delete.property')
  @Audit({ action: 'DELETE', entity: 'RoomType' })
  @ApiOperation({ summary: 'Soft-delete room type (set inactive)' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const rt = await this.service.remove(id, currentUser);
    return CustomApiResponse.success(rt, 'Room type disabled');
  }
}


