import { IsString, IsInt, IsOptional, IsEnum, IsDecimal, IsBoolean, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UnitType, UnitStatus } from '@prisma/client';

export class CreateUnitDto {
  @IsString()
  propertyId: string;

  @IsString()
  unitNumber: string;

  @IsEnum(UnitType)
  unitType: UnitType;

  @IsString()
  floor: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus = UnitStatus.AVAILABLE;

  @IsOptional()
  @IsArray()
  features?: any[];

  @IsInt()
  @Type(() => Number)
  maxOccupancy: number;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  baseRate: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}