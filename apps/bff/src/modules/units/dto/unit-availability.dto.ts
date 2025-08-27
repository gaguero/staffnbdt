import { IsDateString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UnitAvailabilityDto {
  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({ example: '2024-03-18' })
  @IsDateString()
  checkOutDate: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  adults?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  children?: number;
}