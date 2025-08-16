import { IsEnum, IsOptional, IsString, IsBoolean, Transform } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class UserFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: Role, description: 'Filter by user role' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Search in name, email, or position' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Include inactive (soft-deleted) users' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeInactive?: boolean;
}