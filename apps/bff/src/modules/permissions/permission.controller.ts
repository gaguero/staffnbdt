import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PermissionService } from './permission.service';
import {
  PermissionCheckDto,
  BulkPermissionCheckDto,
  GrantPermissionDto,
  RevokePermissionDto,
  AssignRoleDto,
} from './dto';
import {
  PermissionEvaluationResult,
  BulkPermissionResult,
  UserPermissionSummary,
} from './interfaces/permission.interface';

interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
    role: Role;
    departmentId?: string;
    organizationId?: string;
    propertyId?: string;
  };
}

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check a specific permission for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Permission check result',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean' },
        reason: { type: 'string' },
        source: { type: 'string', enum: ['role', 'user', 'cached', 'default'] },
        ttl: { type: 'number' },
      },
    },
  })
  async checkPermission(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body(ValidationPipe) checkDto: PermissionCheckDto,
  ): Promise<PermissionEvaluationResult> {
    const context = {
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId,
      ...checkDto.context,
    };

    return this.permissionService.evaluatePermission(
      user.sub,
      checkDto.resource,
      checkDto.action,
      checkDto.scope,
      context,
    );
  }

  @Post('check/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check multiple permissions for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Bulk permission check results',
    schema: {
      type: 'object',
      properties: {
        permissions: { type: 'object' },
        cached: { type: 'number' },
        evaluated: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async checkBulkPermissions(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body(ValidationPipe) bulkCheckDto: BulkPermissionCheckDto,
  ): Promise<BulkPermissionResult> {
    const globalContext = {
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId,
      ...bulkCheckDto.globalContext,
    };

    return this.permissionService.checkBulkPermissions(
      user.sub,
      bulkCheckDto.permissions,
      globalContext,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all permissions for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully' })
  @Roles(Role.DEPARTMENT_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN, Role.PLATFORM_ADMIN)
  async getUserPermissions(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    // TODO: Add permission check to ensure user can view target user's permissions
    const context = {
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId,
    };

    return this.permissionService.getUserPermissions(userId, context);
  }

  @Get('user/:userId/summary')
  @ApiOperation({ summary: 'Get detailed permission summary for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User permission summary retrieved successfully' })
  @Roles(Role.DEPARTMENT_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN, Role.PLATFORM_ADMIN)
  async getUserPermissionSummary(
    @Param('userId') userId: string,
  ): Promise<UserPermissionSummary> {
    return this.permissionService.getUserPermissionSummary(userId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all permissions for the current user' })
  @ApiResponse({ status: 200, description: 'Current user permissions retrieved successfully' })
  async getMyPermissions(
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    const context = {
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId,
    };

    return this.permissionService.getUserPermissions(user.sub, context);
  }

  @Get('my/summary')
  @ApiOperation({ summary: 'Get detailed permission summary for the current user' })
  @ApiResponse({ status: 200, description: 'Current user permission summary retrieved successfully' })
  async getMyPermissionSummary(
    @CurrentUser() user: AuthenticatedRequest['user'],
  ): Promise<UserPermissionSummary> {
    return this.permissionService.getUserPermissionSummary(user.sub);
  }

  @Post('grant')
  @ApiOperation({ summary: 'Grant a permission to a user' })
  @ApiResponse({ status: 201, description: 'Permission granted successfully' })
  @Roles(Role.DEPARTMENT_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN, Role.PLATFORM_ADMIN)
  async grantPermission(
    @Body(ValidationPipe) grantDto: GrantPermissionDto,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ): Promise<{ message: string }> {
    // TODO: Add permission check to ensure user can grant permissions
    await this.permissionService.grantPermission({
      ...grantDto,
      grantedBy: user.sub,
    });

    return { message: 'Permission granted successfully' };
  }

  @Post('revoke')
  @ApiOperation({ summary: 'Revoke a permission from a user' })
  @ApiResponse({ status: 200, description: 'Permission revoked successfully' })
  @Roles(Role.DEPARTMENT_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN, Role.PLATFORM_ADMIN)
  async revokePermission(
    @Body(ValidationPipe) revokeDto: RevokePermissionDto,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ): Promise<{ message: string }> {
    // TODO: Add permission check to ensure user can revoke permissions
    await this.permissionService.revokePermission({
      ...revokeDto,
      revokedBy: user.sub,
    });

    return { message: 'Permission revoked successfully' };
  }

  @Post('role/assign')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully' })
  @Roles(Role.DEPARTMENT_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN, Role.PLATFORM_ADMIN)
  async assignRole(
    @Body(ValidationPipe) assignDto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ): Promise<{ message: string }> {
    // TODO: Add permission check to ensure user can assign roles
    await this.permissionService.assignRole({
      ...assignDto,
      assignedBy: user.sub,
    });

    return { message: 'Role assigned successfully' };
  }

  @Delete('user/:userId/cache')
  @ApiOperation({ summary: 'Clear permission cache for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Permission cache cleared successfully' })
  @Roles(Role.DEPARTMENT_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN, Role.PLATFORM_ADMIN)
  async clearUserCache(
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.permissionService.clearUserPermissionCache(userId);
    return { message: 'Permission cache cleared successfully' };
  }

  @Delete('my/cache')
  @ApiOperation({ summary: 'Clear permission cache for the current user' })
  @ApiResponse({ status: 200, description: 'Permission cache cleared successfully' })
  async clearMyCache(
    @CurrentUser() user: AuthenticatedRequest['user'],
  ): Promise<{ message: string }> {
    await this.permissionService.clearUserPermissionCache(user.sub);
    return { message: 'Permission cache cleared successfully' };
  }

  @Post('user/:userId/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check a specific permission for any user (admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to check permissions for' })
  @ApiResponse({ status: 200, description: 'Permission check result' })
  @Roles(Role.DEPARTMENT_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN, Role.PLATFORM_ADMIN)
  async checkUserPermission(
    @Param('userId') userId: string,
    @Body(ValidationPipe) checkDto: PermissionCheckDto,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ): Promise<PermissionEvaluationResult> {
    // TODO: Add permission check to ensure user can check other users' permissions
    const context = {
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId,
      ...checkDto.context,
    };

    return this.permissionService.evaluatePermission(
      userId,
      checkDto.resource,
      checkDto.action,
      checkDto.scope,
      context,
    );
  }
}