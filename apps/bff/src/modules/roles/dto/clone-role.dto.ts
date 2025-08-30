import { IsString, IsEnum, IsOptional, IsObject, IsArray, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CloneType {
  FULL = 'full',
  PERMISSIONS = 'permissions',
  TEMPLATE = 'template',
  PARTIAL = 'partial',
  HIERARCHY = 'hierarchy'
}

export class CloneMetadataDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  level: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class PermissionFiltersDto {
  @IsArray()
  @IsString({ each: true })
  includeCategories: string[];

  @IsArray()
  @IsString({ each: true })
  excludeCategories: string[];

  @IsArray()
  @IsString({ each: true })
  includeScopes: string[];

  @IsArray()
  @IsString({ each: true })
  excludeScopes: string[];

  @IsArray()
  @IsString({ each: true })
  customSelections: string[];
}

export class InheritanceRulesDto {
  @IsBoolean()
  copyUserAssignments: boolean;

  @IsBoolean()
  adjustLevel: boolean;

  @IsBoolean()
  autoSuggestLevel: boolean;
}

export class CloneRoleDto {
  @IsString()
  sourceRoleId: string;

  @IsEnum(CloneType)
  cloneType: CloneType;

  @ValidateNested()
  @Type(() => CloneMetadataDto)
  newMetadata: CloneMetadataDto;

  @ValidateNested()
  @Type(() => PermissionFiltersDto)
  permissionFilters: PermissionFiltersDto;

  @IsOptional()
  @IsObject()
  scopeAdjustments?: Record<string, string>;

  @IsOptional()
  @IsObject()
  conditions?: any;

  @IsBoolean()
  preserveLineage: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => InheritanceRulesDto)
  inheritanceRules?: InheritanceRulesDto;
}

export class BulkCloneVariationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  adjustments?: any;
}

export class BulkCloneRoleDto {
  @IsArray()
  @IsString({ each: true })
  sourceRoles: string[];

  @IsEnum(['variations', 'departments', 'properties', 'regions'])
  batchType: 'variations' | 'departments' | 'properties' | 'regions';

  @IsString()
  namePattern: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCloneVariationDto)
  variations: BulkCloneVariationDto[];

  @IsOptional()
  @IsObject()
  globalAdjustments?: any;
}

export class ClonePreviewDto {
  @IsString()
  sourceRoleId: string;

  @IsEnum(CloneType)
  cloneType: CloneType;

  @ValidateNested()
  @Type(() => CloneMetadataDto)
  newMetadata: CloneMetadataDto;

  @ValidateNested()
  @Type(() => PermissionFiltersDto)
  permissionFilters: PermissionFiltersDto;

  @IsOptional()
  @IsObject()
  scopeAdjustments?: Record<string, string>;

  @IsBoolean()
  preserveLineage: boolean;
}
