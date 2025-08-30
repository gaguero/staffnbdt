import { IsString, IsOptional, IsInt, IsArray, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class CreateRoleDto {
  @ApiProperty({ example: 'Guest Services Manager' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Manages guest services and customer satisfaction' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 500, description: 'Priority level (higher = more important)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  priority?: number;

  @ApiPropertyOptional({ example: ['perm-123', 'perm-456'], description: 'Array of permission IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ example: 'org-123', description: 'Organization ID for organization-level roles' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'prop-456', description: 'Property ID for property-level roles' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ 
    enum: UserType, 
    example: UserType.INTERNAL, 
    description: 'Type of users this role applies to' 
  })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional({ 
    example: ['hr', 'inventory', 'maintenance'], 
    description: 'Array of module IDs this role can access' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedModules?: string[];

  @ApiPropertyOptional({ 
    example: { 
      category: 'management', 
      department: 'housekeeping',
      externalAccess: true,
      crossOrgAccess: false
    } 
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}