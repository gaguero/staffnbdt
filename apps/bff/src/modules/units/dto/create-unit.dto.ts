import { IsString, IsEnum, IsOptional, IsInt, IsDecimal, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitType, UnitStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateUnitDto {
  @ApiProperty({ example: '101' })
  @IsString()
  unitNumber: string;

  @ApiProperty({ enum: UnitType, example: UnitType.STANDARD })
  @IsEnum(UnitType)
  unitType: UnitType;

  @ApiPropertyOptional({ example: 'Building A' })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  floor?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  bedrooms: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  bathrooms: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(20)
  maxOccupancy: number;

  @ApiPropertyOptional({ example: 45.5 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  size?: number;

  @ApiPropertyOptional({ example: ['WiFi', 'Air Conditioning', 'Mini Bar'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({ enum: UnitStatus, example: UnitStatus.AVAILABLE })
  @IsEnum(UnitStatus)
  status: UnitStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Luxury suite with ocean view' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Recently renovated' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 150.00 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  dailyRate?: number;
}