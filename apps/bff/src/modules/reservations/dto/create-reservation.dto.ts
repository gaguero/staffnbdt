import { IsString, IsDateString, IsInt, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus, PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateReservationDto {
  @ApiProperty({ example: 'unit-123' })
  @IsString()
  unitId: string;

  @ApiProperty({ example: 'guest-456' })
  @IsString()
  guestId: string;

  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({ example: '2024-03-18' })
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(20)
  adults: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  children?: number = 0;

  @ApiProperty({ enum: ReservationStatus, example: ReservationStatus.CONFIRMED })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @ApiProperty({ example: 450.00 })
  @Type(() => Number)
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional({ example: 0.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  paidAmount?: number = 0;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ example: 'Credit Card' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Late checkout requested, extra towels' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ example: 'VIP guest, prefers quiet room' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Booking.com' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'ABC123DEF' })
  @IsOptional()
  @IsString()
  confirmationCode?: string;
}