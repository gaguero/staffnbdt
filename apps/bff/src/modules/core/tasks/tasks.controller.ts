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
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto';

@Controller('api/core/tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll(@Query() filters: TaskFilterDto) {
    return this.tasksService.findAll(filters);
  }

  @Get('user/:userId')
  getTasksByUser(
    @Param('userId') userId: string,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.tasksService.getTasksByUser(userId, propertyId);
  }

  @Get('department/:departmentId')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  getTasksByDepartment(@Param('departmentId') departmentId: string) {
    return this.tasksService.getTasksByDepartment(departmentId);
  }

  @Get('overdue')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  getOverdueTasks(@Query('propertyId') propertyId?: string) {
    return this.tasksService.getOverdueTasks(propertyId);
  }

  @Get('statistics/:propertyId')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  getTaskStatistics(@Param('propertyId') propertyId: string) {
    return this.tasksService.getTaskStatistics(propertyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('completedBy') completedBy?: string,
  ) {
    return this.tasksService.updateStatus(id, status, completedBy);
  }

  @Put(':id/assign')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  assignTask(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string,
    @Body('assignedBy') assignedBy: string,
  ) {
    return this.tasksService.assignTask(id, assignedToId, assignedBy);
  }

  @Delete(':id')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}