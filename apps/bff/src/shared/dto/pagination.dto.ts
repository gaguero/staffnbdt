import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Number of items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
    description: 'Number of items to skip',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset?: number = 0;
}

export class PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrevious: boolean;

  constructor(data: T[], total: number, limit: number, offset: number) {
    this.data = data;
    this.total = total;
    this.limit = limit;
    this.offset = offset;
    this.hasNext = offset + limit < total;
    this.hasPrevious = offset > 0;
  }
}