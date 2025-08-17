import { IsString, IsInt, IsOptional, IsEnum, IsDecimal, IsBoolean, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum UnitType {
  STANDARD = 'STANDARD',
  SUITE = 'SUITE',
  DELUXE = 'DELUXE',
  PRESIDENTIAL = 'PRESIDENTIAL',
  VILLA = 'VILLA',
  CABIN = 'CABIN',
  APARTMENT = 'APARTMENT',
}

export enum UnitStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  CLEANING = 'CLEANING',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
}

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