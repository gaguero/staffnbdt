import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class ChangeRoleDto {
  @ApiProperty({ enum: Role, example: Role.STAFF, description: 'New role for the user' })
  @IsEnum(Role)
  role: Role;
}