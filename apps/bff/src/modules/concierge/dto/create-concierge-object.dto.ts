import { IsArray, IsDateString, IsEnum, IsOptional, IsString, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ConciergeAttributeDto {
  @IsString()
  fieldKey!: string;

  @IsString()
  fieldType!: string; // 'text' | 'number' | 'boolean' | 'date' | 'json'

  @IsOptional()
  @IsString()
  stringValue?: string;

  @IsOptional()
  numberValue?: number;

  @IsOptional()
  booleanValue?: boolean;

  @IsOptional()
  @IsDateString()
  dateValue?: string;

  @IsOptional()
  @IsObject()
  jsonValue?: Record<string, unknown>;
}

export class CreateConciergeObjectDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  assignments?: unknown;

  @IsOptional()
  files?: unknown;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConciergeAttributeDto)
  attributes?: ConciergeAttributeDto[];
}


