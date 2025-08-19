import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class PropertyFilterDto {
  @ApiProperty({ required: false, example: 'hotel', description: 'Search by name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, example: 'nayara-org-123', description: 'Filter by organization ID' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty({ required: false, example: true, description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, example: 'RESORT', description: 'Filter by property type' })
  @IsOptional()
  @IsString()
  propertyType?: string;

  @ApiProperty({ required: false, example: 'America/Costa_Rica', description: 'Filter by timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false, example: 'CR', description: 'Filter by country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, example: 'name', description: 'Sort field', enum: ['name', 'propertyType', 'createdAt', 'updatedAt'] })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'propertyType' | 'createdAt' | 'updatedAt';

  @ApiProperty({ required: false, example: 'asc', description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ required: false, example: 1, description: 'Page number', minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, example: 20, description: 'Items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}