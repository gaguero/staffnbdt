import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum TaskType {
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
  GUEST_REQUEST = 'GUEST_REQUEST',
  INVENTORY = 'INVENTORY',
  INSPECTION = 'INSPECTION',
  DELIVERY = 'DELIVERY',
  SETUP = 'SETUP',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  OTHER = 'OTHER',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

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