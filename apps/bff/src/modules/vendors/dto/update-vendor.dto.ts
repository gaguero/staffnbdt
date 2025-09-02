import { IsString, IsEmail, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsObject()
  policies?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  performance?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}