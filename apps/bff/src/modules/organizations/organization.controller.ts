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
import { ModuleRegistryService } from '../module-registry/module-registry.service';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly moduleRegistryService: ModuleRegistryService,
  ) {}

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

  // Module management endpoints for organizations

  @Get(':id/modules')
  @RequirePermission('module.read.organization')
  @ApiOperation({ summary: 'Get module subscriptions for organization' })
  @ApiResponse({ status: 200, description: 'Organization module subscriptions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this organization' })
  async getOrganizationModules(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    // Verify user has access to this organization
    await this.organizationService.findOne(id, currentUser);
    
    const moduleStatus = await this.moduleRegistryService.getOrganizationModuleStatus(id);
    return CustomApiResponse.success(moduleStatus, 'Organization module subscriptions retrieved successfully');
  }

  @Post(':id/modules/:moduleId/enable')
  @RequirePermission('module.manage.organization')
  @Audit({ action: 'ENABLE_MODULE', entity: 'Organization' })
  @ApiOperation({ summary: 'Enable a module for organization' })
  @ApiResponse({ status: 200, description: 'Module enabled for organization successfully' })
  @ApiResponse({ status: 404, description: 'Organization or module not found' })
  @ApiResponse({ status: 400, description: 'Module has unmet dependencies' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async enableModuleForOrganization(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @CurrentUser() currentUser: User,
  ) {
    // Verify user has access to this organization
    await this.organizationService.findOne(id, currentUser);
    
    await this.moduleRegistryService.enableModule(id, moduleId);
    return CustomApiResponse.success(null, 'Module enabled for organization successfully');
  }

  @Post(':id/modules/:moduleId/disable')
  @RequirePermission('module.manage.organization')
  @Audit({ action: 'DISABLE_MODULE', entity: 'Organization' })
  @ApiOperation({ summary: 'Disable a module for organization' })
  @ApiResponse({ status: 200, description: 'Module disabled for organization successfully' })
  @ApiResponse({ status: 404, description: 'Module subscription not found' })
  @ApiResponse({ status: 400, description: 'Cannot disable system module' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async disableModuleForOrganization(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @CurrentUser() currentUser: User,
  ) {
    // Verify user has access to this organization
    await this.organizationService.findOne(id, currentUser);
    
    await this.moduleRegistryService.disableModule(id, moduleId);
    return CustomApiResponse.success(null, 'Module disabled for organization successfully');
  }

  @Get(':id/modules/enabled')
  @RequirePermission('module.read.organization')
  @ApiOperation({ summary: 'Get enabled modules for organization' })
  @ApiResponse({ status: 200, description: 'Enabled modules retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this organization' })
  async getEnabledModulesForOrganization(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    // Verify user has access to this organization
    await this.organizationService.findOne(id, currentUser);
    
    const enabledModules = await this.moduleRegistryService.getEnabledModules(id);
    return CustomApiResponse.success(enabledModules, 'Enabled modules retrieved successfully');
  }
}