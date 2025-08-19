import { IsString, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionCheckDto {
  @ApiProperty({
    description: 'Resource type to check permission for',
    example: 'user',
  })
  @IsString()
  resource: string;

  @ApiProperty({
    description: 'Action to check permission for',
    example: 'create',
  })
  @IsString()
  action: string;

  @ApiProperty({
    description: 'Scope of the permission',
    example: 'department',
  })
  @IsString()
  scope: string;

  @ApiPropertyOptional({
    description: 'Additional context for permission evaluation',
    example: { resourceId: 'user123', departmentId: 'dept456' },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class BulkPermissionCheckDto {
  @ApiProperty({
    description: 'Array of permissions to check',
    type: [PermissionCheckDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionCheckDto)
  permissions: PermissionCheckDto[];

  @ApiPropertyOptional({
    description: 'Global context applied to all permission checks',
    example: { propertyId: 'prop123' },
  })
  @IsOptional()
  @IsObject()
  globalContext?: Record<string, any>;
}

export class GrantPermissionDto {
  @ApiProperty({
    description: 'User ID to grant permission to',
    example: 'user123',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Permission ID to grant',
    example: 'perm456',
  })
  @IsString()
  permissionId: string;

  @ApiPropertyOptional({
    description: 'Additional conditions for the permission',
    example: { timeRestricted: true, startTime: '09:00', endTime: '17:00' },
  })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Permission expiration date',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata for the permission grant',
    example: { reason: 'Temporary access for project' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RevokePermissionDto {
  @ApiProperty({
    description: 'User ID to revoke permission from',
    example: 'user123',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Permission ID to revoke',
    example: 'perm456',
  })
  @IsString()
  permissionId: string;

  @ApiPropertyOptional({
    description: 'Reason for revoking the permission',
    example: 'Access no longer needed',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the permission revocation',
    example: { urgency: 'high' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AssignRoleDto {
  @ApiProperty({
    description: 'User ID to assign role to',
    example: 'user123',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Role ID to assign',
    example: 'role456',
  })
  @IsString()
  roleId: string;

  @ApiPropertyOptional({
    description: 'Role assignment expiration date',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Additional conditions for the role assignment',
    example: { departmentRestricted: true, allowedDepartments: ['hr', 'finance'] },
  })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata for the role assignment',
    example: { assignmentType: 'temporary', project: 'quarterly-review' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}