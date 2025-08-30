import { IsOptional, IsEnum, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus, PaymentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class ReservationFilterDto {
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ enum: ReservationStatus })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsDateString()
  checkInDateFrom?: string;

  @ApiPropertyOptional({ example: '2024-03-31' })
  @IsOptional()
  @IsDateString()
  checkInDateTo?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsDateString()
  checkOutDateFrom?: string;

  @ApiPropertyOptional({ example: '2024-03-31' })
  @IsOptional()
  @IsDateString()
  checkOutDateTo?: string;

  @ApiPropertyOptional({ example: 'unit-123' })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional({ example: 'guest-456' })
  @IsOptional()
  @IsString()
  guestId?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiPropertyOptional({ example: '101' })
  @IsOptional()
  @IsString()
  unitNumber?: string;

  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString()
  confirmationCode?: string;

  @ApiPropertyOptional({ example: 'Booking.com' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'checkInDate' })
  @IsOptional()
  @IsString()
  sortBy?: 'checkInDate' | 'checkOutDate' | 'createdAt' | 'totalAmount';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}