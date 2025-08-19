import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

export class AssignUserToPropertyDto {
  @ApiProperty({ example: 'user-id-123', description: 'User ID to assign' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'PROPERTY_MANAGER', description: 'Role to assign to user in property' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: 'dept-id-789', description: 'Department ID to assign user to (optional)' })
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class AssignUsersToPropertyDto {
  @ApiProperty({ type: [AssignUserToPropertyDto], description: 'Users to assign to property' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignUserToPropertyDto)
  assignments: AssignUserToPropertyDto[];
}

export class RemoveUserFromPropertyDto {
  @ApiProperty({ example: 'user-id-123', description: 'User ID to remove from property' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'prop-id-456', description: 'Target property ID to move user to (optional, must be in same organization)' })
  @IsOptional()
  @IsString()
  targetPropertyId?: string;
}