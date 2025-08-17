import { IsString, IsInt, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UnitType, UnitStatus } from '@prisma/client';

export class CreateUnitDto {
  @IsString()
  propertyId: string;

  @IsString()
  unitNumber: string;

  @IsEnum(UnitType)
  unitType: UnitType;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  floor?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  bathrooms?: number;

  @IsInt()
  @Type(() => Number)
  maxOccupancy: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  size?: number;

  @IsOptional()
  @IsArray()
  amenities?: string[];

  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  dailyRate?: number;
}