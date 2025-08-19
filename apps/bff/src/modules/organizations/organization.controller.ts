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
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { 
  CreateOrganizationDto, 
  UpdateOrganizationDto, 
  OrganizationFilterDto,
  OrganizationResponseDto,
  AssignUsersToOrganizationDto,
  RemoveUserFromOrganizationDto
} from './dto';
import { User } from '@prisma/client';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @RequirePermission('organization.create.platform')
  @Audit({ action: 'CREATE', entity: 'Organization' })
  @ApiOperation({ summary: 'Create a new organization (Platform Admin only)' })
  @ApiResponse({ status: 201, description: 'Organization created successfully', type: OrganizationResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Platform Admin required' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or slug already exists' })
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() currentUser: User,
  ) {
    const organization = await this.organizationService.create(createOrganizationDto, currentUser);
    return CustomApiResponse.success(organization, 'Organization created successfully');
  }

  @Get()
  @RequirePermission('organization.read.platform')
  @ApiOperation({ summary: 'Get all organizations with filtering (Platform Admin only)' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Platform Admin required' })
  async findAll(
    @Query() filterDto: OrganizationFilterDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.organizationService.findAll(filterDto, currentUser);
    return CustomApiResponse.success(result, 'Organizations retrieved successfully');
  }

  @Get(':id')
  @RequirePermission('organization.read.platform', 'organization.read.organization')
  @Audit({ action: 'VIEW', entity: 'Organization' })
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully', type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this organization' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const organization = await this.organizationService.findOne(id, currentUser);
    return CustomApiResponse.success(organization, 'Organization retrieved successfully');
  }

  @Patch(':id')
  @RequirePermission('organization.update.platform', 'organization.update.organization')
  @Audit({ action: 'UPDATE', entity: 'Organization' })
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully', type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @CurrentUser() currentUser: User,
  ) {
    const organization = await this.organizationService.update(id, updateOrganizationDto, currentUser);
    return CustomApiResponse.success(organization, 'Organization updated successfully');
  }

  @Delete(':id')
  @RequirePermission('organization.delete.platform')
  @Audit({ action: 'DELETE', entity: 'Organization' })
  @ApiOperation({ summary: 'Soft delete organization (Platform Admin only)' })
  @ApiResponse({ status: 200, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Platform Admin required' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot delete organization with existing users or properties' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.organizationService.remove(id, currentUser);
    return CustomApiResponse.success(null, 'Organization deleted successfully');
  }

  @Get(':id/properties')
  @RequirePermission('property.read.platform', 'property.read.organization')
  @ApiOperation({ summary: 'Get properties in organization' })
  @ApiResponse({ status: 200, description: 'Properties retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this organization' })
  async getProperties(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const properties = await this.organizationService.getProperties(id, currentUser);
    return CustomApiResponse.success(properties, 'Properties retrieved successfully');
  }

  @Get(':id/users')
  @RequirePermission('user.read.platform', 'user.read.organization')
  @ApiOperation({ summary: 'Get users in organization' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this organization' })
  async getUsers(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const users = await this.organizationService.getUsers(id, currentUser);
    return CustomApiResponse.success(users, 'Users retrieved successfully');
  }

  @Post(':id/users/assign')
  @RequirePermission('user.assign.platform', 'user.assign.organization')
  @Audit({ action: 'ASSIGN_USERS', entity: 'Organization' })
  @ApiOperation({ summary: 'Assign users to organization' })
  @ApiResponse({ status: 200, description: 'Users assigned successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async assignUsers(
    @Param('id') id: string,
    @Body() assignUsersDto: AssignUsersToOrganizationDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.organizationService.assignUsers(id, assignUsersDto, currentUser);
    return CustomApiResponse.success(result, 'Users assigned successfully');
  }

  @Delete(':id/users/:userId')
  @RequirePermission('user.remove.platform', 'user.remove.organization')
  @Audit({ action: 'REMOVE_USER', entity: 'Organization' })
  @ApiOperation({ summary: 'Remove user from organization' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  @ApiResponse({ status: 404, description: 'Organization or user not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot remove user' })
  async removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() removeUserDto: RemoveUserFromOrganizationDto,
    @CurrentUser() currentUser: User,
  ) {
    // Inject userId into DTO
    removeUserDto.userId = userId;
    const result = await this.organizationService.removeUser(id, removeUserDto, currentUser);
    return CustomApiResponse.success(result, 'User removed successfully');
  }
}