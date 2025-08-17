import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { TaskType, TaskPriority, TaskStatus } from './create-task.dto';

export class TaskFilterDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(TaskType)
  taskType?: TaskType;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  relatedEntity?: string;

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;
}