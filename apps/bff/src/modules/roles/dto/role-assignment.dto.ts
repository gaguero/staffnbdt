import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleAssignmentDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'role-456' })
  @IsString()
  roleId: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'Role expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: { reason: 'Temporary assignment for project' } })
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ example: { assignmentReason: 'Project lead assignment' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BulkRoleAssignmentDto {
  @ApiProperty({ type: [RoleAssignmentDto] })
  @IsArray()
  assignments: RoleAssignmentDto[];
}

export class BulkRoleRemovalDto {
  @ApiProperty({ example: ['assignment-123', 'assignment-456'] })
  @IsArray()
  @IsString({ each: true })
  userRoleIds: string[];
}