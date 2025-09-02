import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CloneTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  fieldsSchema?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateTemplateDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class RateTemplateDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;
}

export class TemplateFiltersDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class TemplateMarketplaceResponseDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsNumber()
  rating!: number;

  @IsNumber()
  ratingCount!: number;

  @IsNumber()
  usageCount!: number;

  @IsOptional()
  @IsString()
  author?: string;

  @IsString()
  version!: string;

  @IsBoolean()
  isSystem!: boolean;

  @IsNumber()
  fieldCount!: number;

  @IsBoolean()
  hasChildren!: boolean;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class TemplateAnalyticsResponseDto {
  @IsNumber()
  totalTemplates!: number;

  @IsNumber()
  myTemplates!: number;

  @IsNumber()
  totalClones!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PopularTemplateDto)
  popularTemplates!: PopularTemplateDto[];
}

export class PopularTemplateDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsNumber()
  usageCount!: number;

  @IsNumber()
  rating!: number;
}