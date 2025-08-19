import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, IsArray, ValidateNested, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

enum PropertyType {
  HOTEL = 'HOTEL',
  RESORT = 'RESORT',
  HOSTEL = 'HOSTEL',
  APARTMENT = 'APARTMENT',
  VILLA = 'VILLA',
  OTHER = 'OTHER'
}

class PropertyBrandingDto {
  @ApiProperty({ example: true, description: 'Whether to inherit branding from organization' })
  @IsOptional()
  @IsBoolean()
  inherit?: boolean;

  @ApiProperty({ example: '#AA8E67', description: 'Primary brand color (overrides organization)' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({ example: '#F5EBD7', description: 'Secondary brand color (overrides organization)' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiProperty({ example: '#4A4A4A', description: 'Accent brand color (overrides organization)' })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiProperty({ example: 'https://cdn.example.com/property-logo.png', description: 'Property-specific logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ example: 'https://cdn.example.com/property-favicon.ico', description: 'Property-specific favicon URL' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;
}

class PropertySettingsDto {
  @ApiProperty({ example: ['HR', 'FRONT_DESK', 'HOUSEKEEPING'], description: 'Enabled modules for this property' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];

  @ApiProperty({ example: ['Front Desk', 'Housekeeping'], description: 'Default departments to create' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultDepartments?: string[];

  @ApiProperty({ example: { checkInTime: '15:00' }, description: 'Additional property settings' })
  @IsOptional()
  @IsObject()
  additional?: Record<string, any>;
}

class PropertyAddressDto {
  @ApiProperty({ example: '123 Hotel Street', description: 'Street address line 1' })
  @IsOptional()
  @IsString()
  line1?: string;

  @ApiProperty({ example: 'Suite 456', description: 'Street address line 2' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'San José', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'San José', description: 'State or province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '10101', description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 'CR', description: 'Country code (ISO 3166-1 alpha-2)' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class CreatePropertyDto {
  @ApiProperty({ example: 'nayara-gardens-hotel', description: 'Organization ID that owns this property' })
  @IsString()
  organizationId: string;

  @ApiProperty({ example: 'Nayara Gardens Hotel', description: 'Property name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'nayara-gardens-hotel', description: 'URL-friendly slug (optional, will be auto-generated)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;

  @ApiProperty({ example: 'Luxury eco-resort in Costa Rica', description: 'Property description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'RESORT', description: 'Type of property', enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiProperty({ example: 'America/Costa_Rica', description: 'Property timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 'https://nayara.com/gardens', description: 'Property website' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: 'info@nayara-gardens.com', description: 'Property contact email' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty({ example: '+506 2479 1600', description: 'Property contact phone' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ type: PropertyAddressDto, description: 'Property address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyAddressDto)
  address?: PropertyAddressDto;

  @ApiProperty({ type: PropertySettingsDto, description: 'Property settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PropertySettingsDto)
  settings?: PropertySettingsDto;

  @ApiProperty({ type: PropertyBrandingDto, description: 'Brand customization settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyBrandingDto)
  branding?: PropertyBrandingDto;

  @ApiProperty({ example: true, description: 'Whether the property is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}