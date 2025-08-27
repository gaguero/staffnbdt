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
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleAssignmentDto,
  BulkRoleAssignmentDto,
  BulkRoleRemovalDto,
  RoleFilterDto,
  UserRoleFilterDto,
  CloneRoleDto,
  BulkCloneRoleDto,
  ClonePreviewDto
} from './dto';
import { User, Role } from '@prisma/client';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.create.organization', 'role.create.property')
  @Audit({ action: 'CREATE', entity: 'CustomRole' })
  @ApiOperation({ summary: 'Create a new custom role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Conflict - Role name already exists' })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() currentUser: User,
  ) {
    const role = await this.rolesService.create(createRoleDto, currentUser);
    return CustomApiResponse.success(role, 'Role created successfully');
  }

  @Get()
  @RequirePermission('role.read.all', 'role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async findAll(
    @Query() filterDto: RoleFilterDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.rolesService.findAll(filterDto, currentUser);
    // Return just the roles array to match frontend expectations
    return CustomApiResponse.success(result.data, 'Roles retrieved successfully');
  }

  @Get('stats')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.read.all', 'role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Get role statistics and analytics' })
  @ApiResponse({ status: 200, description: 'Role statistics retrieved successfully' })
  async getStats(@CurrentUser() currentUser: User) {
    const stats = await this.rolesService.getStats(currentUser);
    return CustomApiResponse.success(stats, 'Role statistics retrieved successfully');
  }

  @Get(':id')
  @RequirePermission('role.read.all', 'role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const role = await this.rolesService.findOne(id, currentUser);
    return CustomApiResponse.success(role, 'Role retrieved successfully');
  }

  @Patch(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.update.organization', 'role.update.property')
  @Audit({ action: 'UPDATE', entity: 'CustomRole' })
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot modify system role' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() currentUser: User,
  ) {
    const role = await this.rolesService.update(id, updateRoleDto, currentUser);
    return CustomApiResponse.success(role, 'Role updated successfully');
  }

  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.delete.organization', 'role.delete.property')
  @Audit({ action: 'DELETE', entity: 'CustomRole' })
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot delete system role or role in use' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.rolesService.remove(id, currentUser);
    return CustomApiResponse.success(null, 'Role deleted successfully');
  }
}

@ApiTags('User Roles')
@Controller('user-roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth()
export class UserRolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('role.read.all', 'role.read.organization', 'role.read.property', 'role.read.department')
  @ApiOperation({ summary: 'Get user role assignments' })
  @ApiResponse({ status: 200, description: 'User roles retrieved successfully' })
  async getUserRoles(
    @Query() filterDto: UserRoleFilterDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.rolesService.getUserRoles(filterDto, currentUser);
    // Return just the user roles array to match frontend expectations
    return CustomApiResponse.success(result.data, 'User roles retrieved successfully');
  }

  @Post()
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN, Role.PROPERTY_MANAGER)
  @RequirePermission('role.assign.organization', 'role.assign.property', 'role.assign.department')
  @Audit({ action: 'CREATE', entity: 'UserCustomRole' })
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async assignRole(
    @Body() assignmentDto: RoleAssignmentDto,
    @CurrentUser() currentUser: User,
  ) {
    const assignment = await this.rolesService.assignRole(assignmentDto, currentUser);
    return CustomApiResponse.success(assignment, 'Role assigned successfully');
  }

  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN, Role.PROPERTY_MANAGER)
  @RequirePermission('role.assign.organization', 'role.assign.property', 'role.assign.department')
  @Audit({ action: 'DELETE', entity: 'UserCustomRole' })
  @ApiOperation({ summary: 'Remove role assignment from user' })
  @ApiResponse({ status: 200, description: 'Role assignment removed successfully' })
  @ApiResponse({ status: 404, description: 'Role assignment not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot remove system role assignment' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async removeUserRole(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.rolesService.removeUserRole(id, currentUser);
    return CustomApiResponse.success(null, 'Role assignment removed successfully');
  }

  @Post('bulk')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.assign.organization', 'role.assign.property')
  @Audit({ action: 'BULK_ASSIGN', entity: 'UserCustomRole' })
  @ApiOperation({ summary: 'Bulk assign roles to users' })
  @ApiResponse({ status: 201, description: 'Bulk role assignment completed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async bulkAssignRoles(
    @Body() bulkDto: BulkRoleAssignmentDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.rolesService.bulkAssignRoles(bulkDto, currentUser);
    return CustomApiResponse.success(result, 'Bulk role assignment completed');
  }

  @Delete('bulk')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.assign.organization', 'role.assign.property')
  @Audit({ action: 'BULK_REMOVE', entity: 'UserCustomRole' })
  @ApiOperation({ summary: 'Bulk remove role assignments' })
  @ApiResponse({ status: 200, description: 'Bulk role removal completed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async bulkRemoveRoles(
    @Body() bulkDto: BulkRoleRemovalDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.rolesService.bulkRemoveRoles(bulkDto, currentUser);
    return CustomApiResponse.success(result, 'Bulk role removal completed');
  }

  /**
   * Clone a role
   */
  @Post('clone')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.create.organization', 'role.create.property')
  @Audit({ action: 'CLONE', entity: 'CustomRole' })
  @ApiOperation({ summary: 'Clone an existing role' })
  @ApiResponse({ status: 201, description: 'Role cloned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid clone configuration' })
  @ApiResponse({ status: 404, description: 'Source role not found' })
  async cloneRole(
    @Body() cloneRoleDto: CloneRoleDto,
    @CurrentUser() user: User,
  ) {
    const clonedRole = await this.rolesService.cloneRole(cloneRoleDto, user);
    return CustomApiResponse.success(clonedRole, 'Role cloned successfully');
  }

  /**
   * Batch clone roles
   */
  @Post('batch-clone')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.create.organization', 'role.create.property')
  @Audit({ action: 'BATCH_CLONE', entity: 'CustomRole' })
  @ApiOperation({ summary: 'Clone multiple roles in batch' })
  @ApiResponse({ status: 201, description: 'Roles cloned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid batch configuration' })
  async batchCloneRoles(
    @Body() bulkCloneDto: BulkCloneRoleDto,
    @CurrentUser() user: User,
  ) {
    const clonedRoles = await this.rolesService.batchCloneRoles(bulkCloneDto, user);
    return CustomApiResponse.success(clonedRoles, 'Roles cloned successfully');
  }

  /**
   * Generate clone preview
   */
  @Post('clone-preview')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Generate preview of role clone' })
  @ApiResponse({ status: 200, description: 'Clone preview generated successfully' })
  @ApiResponse({ status: 404, description: 'Source role not found' })
  async generateClonePreview(
    @Body() previewDto: ClonePreviewDto,
    @CurrentUser() user: User,
  ) {
    const preview = await this.rolesService.generateClonePreview(previewDto, user);
    return CustomApiResponse.success(preview, 'Clone preview generated successfully');
  }

  /**
   * Get role lineage
   */
  @Get(':id/lineage')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN, Role.PROPERTY_MANAGER)
  @RequirePermission('role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Get role lineage tree' })
  @ApiResponse({ status: 200, description: 'Role lineage retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleLineage(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    const lineage = await this.rolesService.getRoleLineage(id, user);
    return CustomApiResponse.success(lineage, 'Role lineage retrieved successfully');
  }

  /**
   * Get clone templates
   */
  @Get('clone-templates')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Get available clone templates' })
  @ApiResponse({ status: 200, description: 'Clone templates retrieved successfully' })
  async getCloneTemplates(@CurrentUser() user: User) {
    const templates = await this.rolesService.getCloneTemplates(user);
    return CustomApiResponse.success(templates, 'Clone templates retrieved successfully');
  }

  /**
   * Save clone template
   */
  @Post('clone-templates')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.create.organization', 'role.create.property')
  @Audit({ action: 'CREATE', entity: 'CloneTemplate' })
  @ApiOperation({ summary: 'Save a clone template' })
  @ApiResponse({ status: 201, description: 'Clone template saved successfully' })
  async saveCloneTemplate(
    @Body() template: any, // Define proper DTO
    @CurrentUser() user: User,
  ) {
    const savedTemplate = await this.rolesService.saveCloneTemplate(template, user);
    return CustomApiResponse.success(savedTemplate, 'Clone template saved successfully');
  }
}