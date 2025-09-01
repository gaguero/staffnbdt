import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class ChangeRoleDto {
  @ApiProperty({ enum: Role, example: Role.STAFF, description: 'New role for the user' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ description: 'Reason for role change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}