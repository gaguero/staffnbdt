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
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { DepartmentGuard } from '../../shared/guards/department.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { CreateUserDto, UpdateUserDto, UserFilterDto, ChangeRoleDto, ChangeStatusDto, BulkImportDto, CsvImportDto } from './dto';
import { User, Role } from '@prisma/client';
import { memoryStorage } from 'multer';

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

  @Patch(':id/role')
  @Roles(Role.SUPERADMIN)
  @Audit({ action: 'CHANGE_ROLE', entity: 'User' })
  @ApiOperation({ summary: 'Change user role (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'User role changed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid role change' })
  async changeRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.changeRole(id, changeRoleDto, currentUser);
    return CustomApiResponse.success(user, 'User role changed successfully');
  }

  @Patch(':id/status')
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @Audit({ action: 'CHANGE_STATUS', entity: 'User' })
  @ApiOperation({ summary: 'Change user status (Admin only)' })
  @ApiResponse({ status: 200, description: 'User status changed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid status change' })
  async changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.changeStatus(id, changeStatusDto, currentUser);
    return CustomApiResponse.success(user, 'User status changed successfully');
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get user permissions for current user context' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPermissions(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const permissions = await this.usersService.getUserPermissions(id, currentUser);
    return CustomApiResponse.success(permissions, 'User permissions retrieved successfully');
  }

  @Post('bulk')
  @Roles(Role.SUPERADMIN)
  @Audit({ action: 'BULK_IMPORT', entity: 'User' })
  @ApiOperation({ summary: 'Bulk import users (Superadmin only)' })
  @ApiResponse({ status: 201, description: 'Users imported successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  async bulkImport(
    @Body() bulkImportDto: BulkImportDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.usersService.bulkImport(bulkImportDto, currentUser);
    return CustomApiResponse.success(result, 'Bulk import completed');
  }

  @Post('import/csv')
  @Roles(Role.SUPERADMIN)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @Audit({ action: 'CSV_IMPORT', entity: 'User' })
  @ApiOperation({ summary: 'Import users from CSV file (Superadmin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'CSV import completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid CSV format' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() csvImportDto: CsvImportDto,
    @CurrentUser() currentUser: User,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const csvData = file.buffer.toString('utf-8');
    const result = await this.usersService.processCsvImport(
      csvData,
      csvImportDto.validateOnly || false,
      csvImportDto.sendInvitations !== false,
      currentUser,
    );

    return CustomApiResponse.success(result, 'CSV import completed');
  }

  @Get('export/csv')
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @Audit({ action: 'EXPORT', entity: 'User' })
  @ApiOperation({ summary: 'Export users to CSV (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users exported successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin required' })
  async exportCsv(
    @Query() filterDto: UserFilterDto,
    @CurrentUser() currentUser: User,
    @Res() res: Response,
  ) {
    const csvContent = await this.usersService.exportUsers(filterDto, currentUser);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  }

  @Get('export/template')
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Download CSV template for bulk import (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'CSV template downloaded successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  async getImportTemplate(@Res() res: Response) {
    const template = [
      'Email,FirstName,LastName,Role,DepartmentId,Position,PhoneNumber,HireDate',
      'john.doe@example.com,John,Doe,STAFF,dept-id-123,Software Engineer,+1234567890,2024-01-15',
      'jane.smith@example.com,Jane,Smith,DEPARTMENT_ADMIN,dept-id-456,HR Manager,+0987654321,2023-06-01',
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="user-import-template.csv"');
    res.send(template);
  }
}