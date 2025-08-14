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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { DepartmentGuard } from '../../shared/guards/department.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './dto';
import { User, Role } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, DepartmentGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPERADMIN)
  @Audit({ action: 'CREATE', entity: 'User' })
  @ApiOperation({ summary: 'Create a new user (Superadmin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.create(createUserDto, currentUser);
    return CustomApiResponse.success(user, 'User created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (with role-based filtering)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Query() filterDto: UserFilterDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.usersService.findAll(filterDto, currentUser);
    return CustomApiResponse.success(result, 'Users retrieved successfully');
  }

  @Get('stats')
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getStats(@CurrentUser() currentUser: User) {
    const stats = await this.usersService.getUserStats(currentUser);
    return CustomApiResponse.success(stats, 'User statistics retrieved successfully');
  }

  @Get('department/:departmentId')
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @ApiOperation({ summary: 'Get users by department (Admin only)' })
  @ApiResponse({ status: 200, description: 'Department users retrieved successfully' })
  async getUsersByDepartment(
    @Param('departmentId') departmentId: string,
    @CurrentUser() currentUser: User,
  ) {
    const users = await this.usersService.getUsersByDepartment(departmentId, currentUser);
    return CustomApiResponse.success(users, 'Department users retrieved successfully');
  }

  @Get(':id')
  @Audit({ action: 'VIEW', entity: 'User' })
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.findOne(id, currentUser);
    return CustomApiResponse.success(user, 'User retrieved successfully');
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE', entity: 'User' })
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.update(id, updateUserDto, currentUser);
    return CustomApiResponse.success(user, 'User updated successfully');
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN)
  @Audit({ action: 'DELETE', entity: 'User' })
  @ApiOperation({ summary: 'Delete user (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.usersService.remove(id, currentUser);
    return CustomApiResponse.success(null, 'User deleted successfully');
  }

  @Post(':id/restore')
  @Roles(Role.SUPERADMIN)
  @Audit({ action: 'RESTORE', entity: 'User' })
  @ApiOperation({ summary: 'Restore deleted user (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.restore(id, currentUser);
    return CustomApiResponse.success(user, 'User restored successfully');
  }
}