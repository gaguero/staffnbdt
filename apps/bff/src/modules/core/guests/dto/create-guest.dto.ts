import { IsString, IsOptional, IsEmail, IsDateString, IsObject, IsBoolean, IsEnum } from 'class-validator';
import { VipStatus } from '@prisma/client';

export class CreateGuestDto {
  @IsString()
  propertyId: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsObject()
  address?: any;

  @IsOptional()
  @IsObject()
  preferences?: any;

  @IsOptional()
  @IsEnum(VipStatus)
  vipStatus?: VipStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  blacklisted?: boolean;

  @IsOptional()
  @IsString()
  blacklistReason?: string;
}