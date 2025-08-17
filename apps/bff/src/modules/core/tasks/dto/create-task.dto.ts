import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TaskType, TaskPriority, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  propertyId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskType)
  taskType: TaskType;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus = TaskStatus.PENDING;

  @IsOptional()
  @IsString()
  relatedEntity?: string;

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  metadata?: any;

  @IsString()
  createdBy: string;
}