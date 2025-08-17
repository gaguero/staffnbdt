import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class ReservationFilterDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsDateString()
  checkInDateFrom?: string;

  @IsOptional()
  @IsDateString()
  checkInDateTo?: string;

  @IsOptional()
  @IsDateString()
  checkOutDateFrom?: string;

  @IsOptional()
  @IsDateString()
  checkOutDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;
}