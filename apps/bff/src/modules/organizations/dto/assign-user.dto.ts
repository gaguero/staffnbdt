import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

export class AssignUserToOrganizationDto {
  @ApiProperty({ example: 'user-id-123', description: 'User ID to assign' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'ORGANIZATION_ADMIN', description: 'Role to assign to user in organization' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class AssignUsersToOrganizationDto {
  @ApiProperty({ type: [AssignUserToOrganizationDto], description: 'Users to assign to organization' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignUserToOrganizationDto)
  assignments: AssignUserToOrganizationDto[];
}

export class RemoveUserFromOrganizationDto {
  @ApiProperty({ example: 'user-id-123', description: 'User ID to remove from organization' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'org-id-456', description: 'Target organization ID to move user to (optional)' })
  @IsOptional()
  @IsString()
  targetOrganizationId?: string;
}