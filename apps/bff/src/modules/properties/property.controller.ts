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
import { PropertyService } from './property.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { 
  CreatePropertyDto, 
  UpdatePropertyDto, 
  PropertyFilterDto,
  PropertyResponseDto,
  AssignUsersToPropertyDto,
  RemoveUserFromPropertyDto
} from './dto';
import { User } from '@prisma/client';

@ApiTags('Properties')
@Controller('properties')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @RequirePermission('property.create.platform', 'property.create.organization')
  @Audit({ action: 'CREATE', entity: 'Property' })
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, description: 'Property created successfully', type: PropertyResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or slug already exists' })
  @ApiResponse({ status: 404, description: 'Organization not found or inactive' })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser() currentUser: User,
  ) {
    const property = await this.propertyService.create(createPropertyDto, currentUser);
    return CustomApiResponse.success(property, 'Property created successfully');
  }

  @Get()
  @RequirePermission('property.read.platform', 'property.read.organization', 'property.read.property')
  @ApiOperation({ summary: 'Get user\'s accessible properties with filtering' })
  @ApiResponse({ status: 200, description: 'Properties retrieved successfully' })
  async findAll(
    @Query() filterDto: PropertyFilterDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.propertyService.findAll(filterDto, currentUser);
    return CustomApiResponse.success(result, 'Properties retrieved successfully');
  }

  @Get(':id')
  @RequirePermission('property.read.platform', 'property.read.organization', 'property.read.property')
  @Audit({ action: 'VIEW', entity: 'Property' })
  @ApiOperation({ summary: 'Get property by ID' })
  @ApiResponse({ status: 200, description: 'Property retrieved successfully', type: PropertyResponseDto })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this property' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const property = await this.propertyService.findOne(id, currentUser);
    return CustomApiResponse.success(property, 'Property retrieved successfully');
  }

  @Patch(':id')
  @RequirePermission('property.update.platform', 'property.update.organization', 'property.update.property')
  @Audit({ action: 'UPDATE', entity: 'Property' })
  @ApiOperation({ summary: 'Update property' })
  @ApiResponse({ status: 200, description: 'Property updated successfully', type: PropertyResponseDto })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() currentUser: User,
  ) {
    const property = await this.propertyService.update(id, updatePropertyDto, currentUser);
    return CustomApiResponse.success(property, 'Property updated successfully');
  }

  @Delete(':id')
  @RequirePermission('property.delete.platform', 'property.delete.organization')
  @Audit({ action: 'DELETE', entity: 'Property' })
  @ApiOperation({ summary: 'Soft delete property' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot delete property with existing users or departments' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.propertyService.remove(id, currentUser);
    return CustomApiResponse.success(null, 'Property deleted successfully');
  }

  @Get(':id/users')
  @RequirePermission('user.read.platform', 'user.read.organization', 'user.read.property')
  @ApiOperation({ summary: 'Get users in property' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this property' })
  async getUsers(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const users = await this.propertyService.getUsers(id, currentUser);
    return CustomApiResponse.success(users, 'Users retrieved successfully');
  }

  @Get(':id/departments')
  @RequirePermission('department.read.platform', 'department.read.organization', 'department.read.property')
  @ApiOperation({ summary: 'Get departments in property' })
  @ApiResponse({ status: 200, description: 'Departments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this property' })
  async getDepartments(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const departments = await this.propertyService.getDepartments(id, currentUser);
    return CustomApiResponse.success(departments, 'Departments retrieved successfully');
  }

  @Post(':id/users/assign')
  @RequirePermission('user.assign.platform', 'user.assign.organization', 'user.assign.property')
  @Audit({ action: 'ASSIGN_USERS', entity: 'Property' })
  @ApiOperation({ summary: 'Assign users to property' })
  @ApiResponse({ status: 200, description: 'Users assigned successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async assignUsers(
    @Param('id') id: string,
    @Body() assignUsersDto: AssignUsersToPropertyDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.propertyService.assignUsers(id, assignUsersDto, currentUser);
    return CustomApiResponse.success(result, 'Users assigned successfully');
  }

  @Delete(':id/users/:userId')
  @RequirePermission('user.remove.platform', 'user.remove.organization', 'user.remove.property')
  @Audit({ action: 'REMOVE_USER', entity: 'Property' })
  @ApiOperation({ summary: 'Remove user from property' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  @ApiResponse({ status: 404, description: 'Property or user not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot remove user' })
  async removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() removeUserDto: RemoveUserFromPropertyDto,
    @CurrentUser() currentUser: User,
  ) {
    // Inject userId into DTO
    removeUserDto.userId = userId;
    const result = await this.propertyService.removeUser(id, removeUserDto, currentUser);
    return CustomApiResponse.success(result, 'User removed successfully');
  }
}