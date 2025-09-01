import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsObject()
  policies?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  performance?: Record<string, unknown>;
}