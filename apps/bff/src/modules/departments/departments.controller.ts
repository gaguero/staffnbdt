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
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { DepartmentGuard } from '../../shared/guards/department.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';
import { User, Role } from '@prisma/client';

@ApiTags('Departments')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard, DepartmentGuard)
@ApiBearerAuth()
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.SUPERADMIN)
  @Audit({ action: 'CREATE', entity: 'Department' })
  @ApiOperation({ summary: 'Create a new department (Superadmin only)' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser() currentUser: User,
  ) {
    const department = await this.departmentsService.create(createDepartmentDto, currentUser);
    return CustomApiResponse.success(department, 'Department created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments (with role-based filtering)' })
  @ApiResponse({ status: 200, description: 'Departments retrieved successfully' })
  async findAll(@CurrentUser() currentUser: User) {
    const departments = await this.departmentsService.findAll(currentUser);
    return CustomApiResponse.success(departments, 'Departments retrieved successfully');
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get departments in hierarchical tree structure' })
  @ApiResponse({ status: 200, description: 'Department hierarchy retrieved successfully' })
  async getHierarchy(@CurrentUser() currentUser: User) {
    const hierarchy = await this.departmentsService.getHierarchy(currentUser);
    return CustomApiResponse.success(hierarchy, 'Department hierarchy retrieved successfully');
  }

  @Get('dropdown')
  @ApiOperation({ summary: 'Get departments for dropdown selection' })
  @ApiResponse({ status: 200, description: 'Dropdown departments retrieved successfully' })
  async getDropdownDepartments(@CurrentUser() currentUser: User) {
    const departments = await this.departmentsService.getDepartmentsForDropdown(currentUser);
    return CustomApiResponse.success(departments, 'Dropdown departments retrieved successfully');
  }

  @Get('dropdown/:excludeId')
  @ApiOperation({ summary: 'Get departments for dropdown selection excluding specified department and its descendants' })
  @ApiResponse({ status: 200, description: 'Dropdown departments retrieved successfully' })
  async getDropdownDepartmentsWithExclusion(
    @Param('excludeId') excludeId: string,
    @CurrentUser() currentUser: User,
  ) {
    const departments = await this.departmentsService.getDepartmentsForDropdown(currentUser, excludeId);
    return CustomApiResponse.success(departments, 'Dropdown departments retrieved successfully');
  }

  @Get('search')
  @ApiOperation({ summary: 'Search departments by name or description' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async search(
    @Query('q') query: string,
    @CurrentUser() currentUser: User,
  ) {
    const departments = await this.departmentsService.searchDepartments(query, currentUser);
    return CustomApiResponse.success(departments, 'Search results retrieved successfully');
  }

  @Get(':id')
  @Audit({ action: 'VIEW', entity: 'Department' })
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, description: 'Department retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const department = await this.departmentsService.findOne(id, currentUser);
    return CustomApiResponse.success(department, 'Department retrieved successfully');
  }

  @Get(':id/ancestors')
  @ApiOperation({ summary: 'Get department ancestors (parent chain)' })
  @ApiResponse({ status: 200, description: 'Department ancestors retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async getAncestors(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const ancestors = await this.departmentsService.getAncestors(id, currentUser);
    return CustomApiResponse.success(ancestors, 'Department ancestors retrieved successfully');
  }

  @Get(':id/descendants')
  @ApiOperation({ summary: 'Get department descendants (all sub-departments)' })
  @ApiResponse({ status: 200, description: 'Department descendants retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async getDescendants(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const descendants = await this.departmentsService.getDescendants(id, currentUser);
    return CustomApiResponse.success(descendants, 'Department descendants retrieved successfully');
  }

  @Get('stats/overall')
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get overall departments statistics (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'Overall statistics retrieved successfully' })
  async getOverallStats(@CurrentUser() currentUser: User) {
    const stats = await this.departmentsService.getOverallStats(currentUser);
    return CustomApiResponse.success(stats, 'Overall statistics retrieved successfully');
  }

  @Get(':id/stats')
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @ApiOperation({ summary: 'Get department statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Department statistics retrieved successfully' })
  async getStats(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const stats = await this.departmentsService.getDepartmentStats(id, currentUser);
    return CustomApiResponse.success(stats, 'Department statistics retrieved successfully');
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN)
  @Audit({ action: 'UPDATE', entity: 'Department' })
  @ApiOperation({ summary: 'Update department (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentUser() currentUser: User,
  ) {
    const department = await this.departmentsService.update(id, updateDepartmentDto, currentUser);
    return CustomApiResponse.success(department, 'Department updated successfully');
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN)
  @Audit({ action: 'DELETE', entity: 'Department' })
  @ApiOperation({ summary: 'Delete department (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin required' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.departmentsService.remove(id, currentUser);
    return CustomApiResponse.success(null, 'Department deleted successfully');
  }
}