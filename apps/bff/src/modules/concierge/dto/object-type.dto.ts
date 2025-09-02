import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateObjectTypeDto {
  @IsString()
  name!: string;

  @IsObject()
  fieldsSchema!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  validations?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  uiHints?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsObject()
  templateMetadata?: Record<string, unknown>;
}

export class UpdateObjectTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  fieldsSchema?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  validations?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  uiHints?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  templateMetadata?: Record<string, unknown>;
}

export class ObjectTypeHierarchyResponseDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsBoolean()
  isTemplate!: boolean;

  @IsOptional()
  @IsObject()
  parent?: {
    id: string;
    name: string;
    isTemplate: boolean;
  };

  @IsArray()
  children!: {
    id: string;
    name: string;
    isTemplate: boolean;
  }[];

  @IsObject()
  fieldsSchema!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  templateMetadata?: Record<string, unknown>;
}