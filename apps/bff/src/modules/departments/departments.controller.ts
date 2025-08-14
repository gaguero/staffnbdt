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