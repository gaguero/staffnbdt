import { IsString, IsDateString, IsInt, IsEnum, IsDecimal, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ReservationStatus } from '@prisma/client';

export class CreateReservationDto {
  @IsString()
  propertyId: string;

  @IsString()
  guestId: string;

  @IsString()
  unitId: string;

  @IsOptional()
  @IsString()
  reservationNumber?: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsInt()
  @Type(() => Number)
  adults: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  children?: number;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  totalAmount: number;

  @IsOptional()
  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  paidAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  createdBy: string;
}