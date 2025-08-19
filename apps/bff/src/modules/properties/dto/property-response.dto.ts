import { ApiProperty } from '@nestjs/swagger';

export class PropertyAddressResponseDto {
  @ApiProperty()
  line1?: string;

  @ApiProperty()
  line2?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  state?: string;

  @ApiProperty()
  postalCode?: string;

  @ApiProperty()
  country?: string;
}

export class PropertyBrandingResponseDto {
  @ApiProperty()
  inherit?: boolean;

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

export class PropertySettingsResponseDto {
  @ApiProperty()
  modules?: string[];

  @ApiProperty()
  defaultDepartments?: string[];

  @ApiProperty()
  additional?: Record<string, any>;
}

export class PropertyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  propertyType?: string;

  @ApiProperty()
  timezone?: string;

  @ApiProperty()
  website?: string;

  @ApiProperty()
  contactEmail?: string;

  @ApiProperty()
  contactPhone?: string;

  @ApiProperty({ type: PropertyAddressResponseDto })
  address?: PropertyAddressResponseDto;

  @ApiProperty({ type: PropertySettingsResponseDto })
  settings?: PropertySettingsResponseDto;

  @ApiProperty({ type: PropertyBrandingResponseDto })
  branding?: PropertyBrandingResponseDto;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  organization?: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiProperty({ required: false })
  _count?: {
    users: number;
    departments: number;
  };
}