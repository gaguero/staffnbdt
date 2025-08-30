import { IsOptional, IsString, IsDateString, IsDecimal } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CheckOutDto {
  @ApiPropertyOptional({ example: '2024-03-18T11:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkedOutAt?: string;

  @ApiPropertyOptional({ example: 25.00 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
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