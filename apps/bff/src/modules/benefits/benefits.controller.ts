import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BenefitsService } from './benefits.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RequirePermission, PERMISSIONS } from '../../shared/decorators/require-permission.decorator';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { User, Role } from '@prisma/client';

@ApiTags('Benefits')
@Controller('benefits')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth()
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get()
  @RequirePermission('benefit.read.organization', 'benefit.read.property', 'benefit.read.own')
  @ApiOperation({ summary: 'Get all commercial benefits' })
  async findAll(
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Query('category') category: string,
  ) {
    const result = await this.benefitsService.findAll(limit, offset, category);
    return CustomApiResponse.success(result, 'Benefits retrieved successfully');
  }

  @Get(':id')
  @RequirePermission('benefit.read.organization', 'benefit.read.property', 'benefit.read.own')
  @ApiOperation({ summary: 'Get benefit by ID' })
  async findOne(@Param('id') id: string) {
    const benefit = await this.benefitsService.findOne(id);
    return CustomApiResponse.success(benefit, 'Benefit retrieved successfully');
  }

  @Post()
  @Roles(Role.PLATFORM_ADMIN)  // Backwards compatibility
  @RequirePermission('benefit.create.organization')
  @ApiOperation({ summary: 'Create new benefit (Superadmin only)' })
  async create(@Body() createBenefitDto: any, @CurrentUser() currentUser: User) {
    const benefit = await this.benefitsService.create(createBenefitDto, currentUser);
    return CustomApiResponse.success(benefit, 'Benefit created successfully');
  }

  @Patch(':id')
  @Roles(Role.PLATFORM_ADMIN)  // Backwards compatibility
  @RequirePermission('benefit.update.organization')
  @ApiOperation({ summary: 'Update benefit (Superadmin only)' })
  async update(
    @Param('id') id: string,
    @Body() updateBenefitDto: any,
    @CurrentUser() currentUser: User,
  ) {
    const benefit = await this.benefitsService.update(id, updateBenefitDto, currentUser);
    return CustomApiResponse.success(benefit, 'Benefit updated successfully');
  }

  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN)  // Backwards compatibility
  @RequirePermission('benefit.update.organization')
  @ApiOperation({ summary: 'Delete benefit (Superadmin only)' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    await this.benefitsService.remove(id, currentUser);
    return CustomApiResponse.success(null, 'Benefit deleted successfully');
  }
}