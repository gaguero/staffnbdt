import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Email address to send invitation to',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Role to assign to the invited user',
    enum: Role,
    example: Role.STAFF,
  })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({
    description: 'Department ID (required for DEPARTMENT_ADMIN and STAFF roles)',
    example: 'cuid123',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Optional message to include in the invitation email',
    example: 'Welcome to the team! Please complete your profile setup.',
  })
  @IsOptional()
  @IsString()
  message?: string;
}