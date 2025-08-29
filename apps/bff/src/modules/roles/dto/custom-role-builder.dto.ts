import { 
  IsString, 
  IsOptional, 
  IsArray, 
  IsBoolean, 
  IsEnum, 
  IsObject, 
  IsInt,
  Min,
  Max,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class UIRestrictionDto {
  @ApiPropertyOptional({ 
    example: ['inventory', 'maintenance'], 
    description: 'Array of module IDs to hide from this role' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hiddenModules?: string[];

  @ApiPropertyOptional({ 
    example: ['user.create', 'payroll.delete'], 
    description: 'Array of feature IDs to hide from this role' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hiddenFeatures?: string[];

  @ApiPropertyOptional({ 
    example: ['user.salary', 'user.personalInfo'], 
    description: 'Array of field paths that should be read-only for this role' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readOnlyFields?: string[];
}

export class RoleTemplateDto {
  @ApiProperty({ example: 'Front Desk Manager' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Manages front desk operations and guest services' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    enum: UserType, 
    example: UserType.INTERNAL, 
    description: 'Type of users this role template is designed for' 
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ 
    example: ['front-desk', 'guest-services', 'reservations'], 
    description: 'Recommended modules for this role template' 
  })
  @IsArray()
  @IsString({ each: true })
  recommendedModules: string[];

  @ApiProperty({ 
    example: ['guest.read.property', 'reservation.create.property', 'unit.read.property'], 
    description: 'Base permissions for this role template' 
  })
  @IsArray()
  @IsString({ each: true })
  basePermissions: string[];

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  defaultPriority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => UIRestrictionDto)
  defaultRestrictions?: UIRestrictionDto;
}

export class CustomRoleBuilderDto {
  @ApiProperty({ example: 'Custom Guest Relations Coordinator' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Coordinates guest relations and handles special requests' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    enum: UserType, 
    example: UserType.INTERNAL, 
    description: 'Type of users this role applies to' 
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ 
    example: ['guest-services', 'housekeeping', 'front-desk'], 
    description: 'Array of module IDs this role can access' 
  })
  @IsArray()
  @IsString({ each: true })
  allowedModules: string[];

  @ApiProperty({ 
    example: ['guest.read.property', 'task.create.department', 'unit.read.property'], 
    description: 'Array of specific permission IDs to grant to this role' 
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => UIRestrictionDto)
  uiRestrictions?: UIRestrictionDto;

  @ApiPropertyOptional({ example: 'org-123' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'prop-456' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ 
    example: { 
      category: 'guest-services', 
      department: 'front-office',
      canWorkRemotely: false,
      requiresCertification: true
    } 
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CloneRoleOptionsDto {
  @ApiProperty({ example: 'Cloned Guest Services Manager' })
  @IsString()
  newName: string;

  @ApiPropertyOptional({ example: 'Cloned version with modified permissions' })
  @IsOptional()
  @IsString()
  newDescription?: string;

  @ApiPropertyOptional({ example: 'prop-789' })
  @IsOptional()
  @IsString()
  targetPropertyId?: string;

  @ApiPropertyOptional({ example: 'org-456' })
  @IsOptional()
  @IsString()
  targetOrganizationId?: string;

  @ApiPropertyOptional({ 
    example: ['inventory.read.property'], 
    description: 'Additional permissions to grant to the cloned role' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalPermissions?: string[];

  @ApiPropertyOptional({ 
    example: ['payroll.read.department'], 
    description: 'Permissions to remove from the cloned role' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removePermissions?: string[];

  @ApiPropertyOptional({ 
    example: ['maintenance'], 
    description: 'Additional modules to grant access to' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalModules?: string[];

  @ApiPropertyOptional({ 
    example: ['hr'], 
    description: 'Modules to remove access from' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeModules?: string[];
}