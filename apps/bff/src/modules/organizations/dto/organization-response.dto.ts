import { ApiProperty } from '@nestjs/swagger';

export class OrganizationBrandingResponseDto {
  @ApiProperty()
  primaryColor?: string;

  @ApiProperty()
  secondaryColor?: string;

  @ApiProperty()
  accentColor?: string;

  @ApiProperty()
  logoUrl?: string;

  @ApiProperty()
  faviconUrl?: string;
}

export class OrganizationSettingsResponseDto {
  @ApiProperty()
  defaultLanguage?: string;

  @ApiProperty()
  supportedLanguages?: string[];

  @ApiProperty()
  theme?: string;

  @ApiProperty()
  additional?: Record<string, any>;
}

export class OrganizationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  timezone?: string;

  @ApiProperty()
  website?: string;

  @ApiProperty()
  contactEmail?: string;

  @ApiProperty()
  contactPhone?: string;

  @ApiProperty({ type: OrganizationSettingsResponseDto })
  settings?: OrganizationSettingsResponseDto;

  @ApiProperty({ type: OrganizationBrandingResponseDto })
  branding?: OrganizationBrandingResponseDto;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  _count?: {
    properties: number;
    users: number;
  };
}