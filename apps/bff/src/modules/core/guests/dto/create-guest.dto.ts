import { IsString, IsOptional, IsEmail, IsPhoneNumber, IsDateString, IsObject } from 'class-validator';

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  ID_CARD = 'ID_CARD',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  OTHER = 'OTHER',
}

export class CreateGuestDto {
  @IsString()
  organizationId: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  documentType?: DocumentType;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsObject()
  preferences?: any;

  @IsOptional()
  @IsString()
  loyaltyNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}