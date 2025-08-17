import { IsString, IsDateString, IsInt, IsEnum, IsDecimal, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export class CreateReservationDto {
  @IsString()
  propertyId: string;

  @IsString()
  guestId: string;

  @IsString()
  unitId: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus = ReservationStatus.PENDING;

  @IsInt()
  @Type(() => Number)
  adults: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  children?: number = 0;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  totalAmount: number;

  @IsOptional()
  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  paidAmount?: number = 0;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  createdBy: string;
}