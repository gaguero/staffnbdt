import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsUUID, IsArray, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnableModuleDto {
  @ApiProperty({
    description: 'Module ID to enable',
    example: 'concierge'
  })
  @IsString()
  moduleId: string;

  @ApiProperty({
    description: 'Optional settings for the module',
    required: false
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class DisableModuleDto {
  @ApiProperty({
    description: 'Module ID to disable',
    example: 'concierge'
  })
  @IsString()
  moduleId: string;

  @ApiProperty({
    description: 'Reason for disabling the module',
    required: false
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ModuleStatusDto {
  @ApiProperty({ description: 'Module ID' })
  moduleId: string;

  @ApiProperty({ description: 'Whether the module is enabled' })
  isEnabled: boolean;

  @ApiProperty({ description: 'When the module was enabled', required: false })
  enabledAt?: Date | null;

  @ApiProperty({ description: 'When the module was disabled', required: false })
  disabledAt?: Date | null;

  @ApiProperty({ description: 'Module settings', required: false })
  settings?: Record<string, any>;
}

export class PropertyModuleOverrideDto {
  @ApiProperty({ description: 'Property ID' })
  propertyId: string;

  @ApiProperty({ description: 'Module ID' })
  moduleId: string;

  @ApiProperty({ description: 'Whether the module is enabled for this property' })
  isEnabled: boolean;

  @ApiProperty({ description: 'When the override was set', required: false })
  enabledAt?: Date | null;

  @ApiProperty({ description: 'When the override was disabled', required: false })
  disabledAt?: Date | null;

  @ApiProperty({ description: 'Property-specific module settings', required: false })
  settings?: Record<string, any>;
}

export class ModuleStatusDetailDto {
  @ApiProperty({ description: 'Module ID' })
  moduleId: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Effective enablement status' })
  isEnabled: boolean;

  @ApiProperty({ description: 'Organization-level enablement status' })
  orgLevelEnabled: boolean;

  @ApiProperty({ 
    description: 'Property-level override (null if no override)',
    required: false 
  })
  propertyLevelOverride: boolean | null;

  @ApiProperty({ description: 'Effective status after applying precedence rules' })
  effectiveStatus: boolean;

  @ApiProperty({ 
    description: 'Source of the effective status',
    enum: ['property', 'organization', 'none']
  })
  precedenceSource: 'property' | 'organization' | 'none';
}

export class AvailableModuleDto {
  @ApiProperty({ description: 'Module ID' })
  moduleId: string;

  @ApiProperty({ description: 'Module name' })
  name: string;

  @ApiProperty({ description: 'Module category' })
  category: string;

  @ApiProperty({ description: 'Module description', required: false })
  description?: string;

  @ApiProperty({ description: 'Whether this is a system module that cannot be disabled' })
  isSystemModule: boolean;
}

export class OrganizationModuleStatusDto {
  @ApiProperty({ 
    description: 'Organization-level module subscriptions',
    type: [ModuleStatusDto]
  })
  organizationModules: ModuleStatusDto[];

  @ApiProperty({ 
    description: 'Property-level module overrides',
    type: [PropertyModuleOverrideDto]
  })
  propertyOverrides: PropertyModuleOverrideDto[];

  @ApiProperty({ 
    description: 'All available modules in the system',
    type: [AvailableModuleDto]
  })
  availableModules: AvailableModuleDto[];
}

export class BulkModuleActionDto {
  @ApiProperty({
    description: 'Array of module IDs to perform action on',
    type: [String],
    example: ['concierge', 'vendors', 'hr']
  })
  @IsArray()
  @IsString({ each: true })
  moduleIds: string[];

  @ApiProperty({
    description: 'Action to perform',
    enum: ['enable', 'disable']
  })
  @IsString()
  action: 'enable' | 'disable';

  @ApiProperty({
    description: 'Settings to apply to all modules',
    required: false
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiProperty({
    description: 'Reason for bulk action',
    required: false
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ModuleSubscriptionFilterDto {
  @ApiProperty({
    description: 'Filter by organization ID',
    required: false
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({
    description: 'Filter by property ID',
    required: false
  })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiProperty({
    description: 'Filter by module ID',
    required: false
  })
  @IsOptional()
  @IsString()
  moduleId?: string;

  @ApiProperty({
    description: 'Filter by enabled status',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isEnabled?: boolean;

  @ApiProperty({
    description: 'Include organization-level subscriptions',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeOrganization?: boolean = true;

  @ApiProperty({
    description: 'Include property-level overrides',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeProperties?: boolean = true;
}

export class ModuleDependencyValidationDto {
  @ApiProperty({ description: 'Module ID' })
  moduleId: string;

  @ApiProperty({ description: 'Whether all dependencies are met' })
  isValid: boolean;

  @ApiProperty({ description: 'List of missing dependencies', type: [String] })
  missingDependencies: string[];

  @ApiProperty({ description: 'List of satisfied dependencies', type: [String] })
  satisfiedDependencies: string[];

  @ApiProperty({ description: 'Validation message' })
  message: string;
}