import { IsOptional, IsString, IsEnum } from 'class-validator';
import { DocumentType } from './create-guest.dto';

export class GuestFilterDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  search?: string;
}