import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
  @ApiPropertyOptional({ example: '2024-03-15T14:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkedInAt?: string;

  @ApiPropertyOptional({ example: 'Guest arrived early, room was ready' })
  @IsOptional()
  @IsString()
  notes?: string;
}