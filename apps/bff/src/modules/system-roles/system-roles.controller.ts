import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemRolesService, SystemRoleAssignmentDto, BulkSystemRoleAssignmentDto } from './system-roles.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { Role, User } from '@prisma/client';

@ApiTags('System Roles')
@Controller('system-roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth()
export class SystemRolesController {
  constructor(private readonly systemRolesService: SystemRolesService) {}

  @Get()
  @RequirePermission('role.read.platform', 'role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Get all system roles with assignability information' })
  @ApiResponse({ status: 200, description: 'System roles retrieved successfully' })
  async getAllSystemRoles(@CurrentUser() currentUser: User) {
    const roles = await this.systemRolesService.getAllSystemRoles(currentUser);
    return CustomApiResponse.success(roles, 'System roles retrieved successfully');
  }

  @Get(':role')
  @RequirePermission('role.read.platform', 'role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Get information about a specific system role' })
  @ApiResponse({ status: 200, description: 'System role information retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role' })
  async getSystemRoleInfo(
    @Param('role') role: Role,
    @CurrentUser() currentUser: User,
  ) {
    const roleInfo = await this.systemRolesService.getSystemRoleInfo(role, currentUser);
    return CustomApiResponse.success(roleInfo, 'System role information retrieved successfully');
  }

  @Get(':role/users')
  @RequirePermission('user.read.platform', 'user.read.organization', 'user.read.property')
  @ApiOperation({ summary: 'Get all users with a specific system role' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsersByRole(
    @Param('role') role: Role,
    @CurrentUser() currentUser: User,
  ) {
    const users = await this.systemRolesService.getUsersByRole(role, currentUser);
    return CustomApiResponse.success(users, `Users with role ${role} retrieved successfully`);
  }

  @Get(':role/permissions')
  @RequirePermission('role.read.platform', 'role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Preview permissions for a system role' })
  @ApiResponse({ status: 200, description: 'Role permissions retrieved successfully' })
  async previewRolePermissions(@Param('role') role: Role) {
    const preview = await this.systemRolesService.previewRolePermissions(role);
    return CustomApiResponse.success(preview, 'Role permissions retrieved successfully');
  }

  @Post('assign')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN, Role.PROPERTY_MANAGER)
  @RequirePermission('role.assign.platform', 'role.assign.organization', 'role.assign.property')
  @Audit({ action: 'SYSTEM_ROLE_ASSIGNMENT', entity: 'User' })
  @ApiOperation({ summary: 'Assign system role to user' })
  @ApiResponse({ status: 200, description: 'System role assigned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges to assign this role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid role assignment' })
  async assignSystemRole(
    @Body() assignment: SystemRoleAssignmentDto,
    @CurrentUser() currentUser: User,
  ) {
    const updatedUser = await this.systemRolesService.assignSystemRole(assignment, currentUser);
    return CustomApiResponse.success(
      updatedUser,
      `System role ${assignment.role} assigned to user successfully`
    );
  }

  @Post('assign/bulk')
  @Roles(Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN)
  @RequirePermission('role.assign.platform', 'role.assign.organization', 'role.assign.property')
  @Audit({ action: 'BULK_SYSTEM_ROLE_ASSIGNMENT', entity: 'User' })
  @ApiOperation({ summary: 'Bulk assign system roles to multiple users' })
  @ApiResponse({ status: 200, description: 'Bulk system role assignment completed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
  async bulkAssignSystemRoles(
    @Body() bulkAssignment: BulkSystemRoleAssignmentDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.systemRolesService.bulkAssignSystemRoles(bulkAssignment, currentUser);
    return CustomApiResponse.success(
      result,
      `Bulk assignment completed: ${result.successful.length} successful, ${result.failed.length} failed`
    );
  }

  @Get('statistics')
  @RequirePermission('role.read.platform', 'role.read.organization', 'role.read.property')
  @ApiOperation({ summary: 'Get role statistics and analytics' })
  @ApiResponse({ status: 200, description: 'Role statistics retrieved successfully' })
  async getRoleStatistics(@CurrentUser() currentUser: User) {
    const stats = await this.systemRolesService.getRoleStatistics(currentUser);
    return CustomApiResponse.success(stats, 'Role statistics retrieved successfully');
  }
}

@ApiTags('User Role History')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth()
export class UserRoleHistoryController {
  constructor(private readonly systemRolesService: SystemRolesService) {}

  @Get(':id/role-history')
  @RequirePermission('user.read.platform', 'user.read.organization', 'user.read.property', 'user.read.own')
  @ApiOperation({ summary: 'Get role assignment history for a user' })
  @ApiResponse({ status: 200, description: 'Role history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getUserRoleHistory(
    @Param('id') userId: string,
    @CurrentUser() currentUser: User,
  ) {
    const history = await this.systemRolesService.getUserRoleHistory(userId, currentUser);
    return CustomApiResponse.success(history, 'User role history retrieved successfully');
  }
}