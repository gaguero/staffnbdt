import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum EntityType {
  GUEST = 'guest',
  RESERVATION = 'reservation',
  UNIT = 'unit',
  VENDOR = 'vendor',
  CONCIERGE_OBJECT = 'concierge_object',
  USER = 'user'
}

export class RelationshipSearchDto {
  @IsEnum(EntityType)
  entityType!: EntityType;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean = false;

  @IsOptional()
  @IsObject()
  additionalFilters?: Record<string, any>;
}

export class BulkCreateObjectsDto {
  @IsString()
  objectType!: string;

  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  count!: number;

  @IsOptional()
  @IsObject()
  defaultAttributes?: Record<string, any>;

  @IsOptional()
  @IsObject()
  assignments?: Record<string, any>;
}

export class ObjectTimelineDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class TestPlaybookDto {
  @IsString()
  playbookId!: string;

  @IsString()
  trigger!: string;

  @IsOptional()
  @IsObject()
  testData?: Record<string, any>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  dryRun?: boolean = true;
}