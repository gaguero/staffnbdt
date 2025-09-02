import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CheckOutDto {
  @ApiPropertyOptional({ example: '2024-03-18T11:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkedOutAt?: string;

  @ApiPropertyOptional({ example: 25.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  additionalCharges?: number;

  @ApiPropertyOptional({ example: 'Mini bar consumption, late checkout fee' })
  @IsOptional()
  @IsString()
  additionalChargesDescription?: string;

  @ApiPropertyOptional({ example: 'Guest satisfied, no issues' })
  @IsOptional()
  @IsString()
  notes?: string;
}