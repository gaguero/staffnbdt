import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentScope } from '@prisma/client';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class DocumentFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: DocumentScope, description: 'Filter by document scope' })
  @IsOptional()
  @IsEnum(DocumentScope)
  scope?: DocumentScope;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Search in title or description' })
  @IsOptional()
  @IsString()
  search?: string;
}