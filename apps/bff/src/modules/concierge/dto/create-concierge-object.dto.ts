import { IsArray, IsDateString, IsEnum, IsOptional, IsString, ValidateNested, IsObject, IsNumber, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export enum AttributeFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  JSON = 'json',
  RELATIONSHIP = 'relationship',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  QUANTITY = 'quantity',
  MONEY = 'money',
  FILE = 'file',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  LOCATION = 'location',
  RICHTEXT = 'richtext',
  TIME = 'time',
  DURATION = 'duration',
  PERCENTAGE = 'percentage',
  RATING = 'rating'
}

export class ConciergeAttributeDto {
  @IsString()
  fieldKey!: string;

  @IsEnum(AttributeFieldType)
  fieldType!: AttributeFieldType;

  @IsOptional()
  @IsString()
  stringValue?: string;

  @IsOptional()
  @IsNumber()
  numberValue?: number;

  @IsOptional()
  booleanValue?: boolean;

  @IsOptional()
  @IsDateString()
  dateValue?: string;

  @IsOptional()
  @IsObject()
  jsonValue?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  relationshipValue?: string;

  @IsOptional()
  @IsString()
  selectValue?: string;

  @IsOptional()
  @IsString()
  fileValue?: string;

  @IsOptional()
  @IsString()
  quantityUnit?: string;

  @IsOptional()
  @IsNumber()
  moneyValue?: number;

  @IsOptional()
  @IsString()
  moneyCurrency?: string;
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


