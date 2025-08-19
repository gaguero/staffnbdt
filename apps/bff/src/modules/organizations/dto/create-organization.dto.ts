import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, IsArray, ValidateNested, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class OrganizationBrandingDto {
  @ApiProperty({ example: '#AA8E67', description: 'Primary brand color' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({ example: '#F5EBD7', description: 'Secondary brand color' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiProperty({ example: '#4A4A4A', description: 'Accent brand color' })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiProperty({ example: 'https://cdn.example.com/logo.png', description: 'Logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ example: 'https://cdn.example.com/favicon.ico', description: 'Favicon URL' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;
}

class OrganizationSettingsDto {
  @ApiProperty({ example: 'en', description: 'Default language code' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiProperty({ example: ['en', 'es'], description: 'Supported language codes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @ApiProperty({ example: 'default', description: 'Theme name' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiProperty({ example: { autoBackup: true }, description: 'Additional settings' })
  @IsOptional()
  @IsObject()
  additional?: Record<string, any>;
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Nayara Hotel Group', description: 'Organization name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'nayara-hotel-group', description: 'URL-friendly slug (optional, will be auto-generated)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;

  @ApiProperty({ example: 'Luxury hotel chain in Costa Rica', description: 'Organization description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'America/Costa_Rica', description: 'Primary timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 'https://nayara.com', description: 'Organization website' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: 'contact@nayara.com', description: 'Primary contact email' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty({ example: '+506 2479 1600', description: 'Primary contact phone' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ type: OrganizationSettingsDto, description: 'Organization settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationSettingsDto)
  settings?: OrganizationSettingsDto;

  @ApiProperty({ type: OrganizationBrandingDto, description: 'Brand customization settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationBrandingDto)
  branding?: OrganizationBrandingDto;

  @ApiProperty({ example: true, description: 'Whether the organization is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}