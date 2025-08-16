import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStatusDto {
  @ApiProperty({ example: true, description: 'Active status - true for active, false for inactive' })
  @IsBoolean()
  isActive: boolean;
}