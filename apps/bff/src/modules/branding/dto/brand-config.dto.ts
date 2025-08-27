import { IsOptional, IsString, IsUrl, IsHexColor, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class BrandColorsDto {
  @IsHexColor()
  primary: string;

  @IsOptional()
  @IsHexColor()
  secondary?: string;

  @IsOptional()
  @IsHexColor()
  accent?: string;

  @IsHexColor()
  background: string;

  @IsHexColor()
  surface: string;

  @IsHexColor()
  surfaceHover: string;

  @IsHexColor()
  textPrimary: string;

  @IsHexColor()
  textSecondary: string;

  @IsHexColor()
  textMuted: string;

  @IsObject()
  primaryShades: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export class BrandTypographyDto {
  @IsString()
  heading: string;

  @IsString()
  subheading: string;

  @IsString()
  body: string;
}

export class BrandAssetsDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoDarkUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;
}

export class BrandBorderRadiusDto {
  @IsString()
  sm: string;

  @IsString()
  md: string;

  @IsString()
  lg: string;

  @IsString()
  xl: string;
}

export class BrandShadowsDto {
  @IsString()
  soft: string;

  @IsString()
  medium: string;

  @IsString()
  strong: string;
}

export class BrandTransitionsDto {
  @IsString()
  fast: string;

  @IsString()
  normal: string;

  @IsString()
  slow: string;
}

export class BrandConfigDto {
  @ValidateNested()
  @Type(() => BrandColorsDto)
  colors: BrandColorsDto;

  @ValidateNested()
  @Type(() => BrandTypographyDto)
  typography: BrandTypographyDto;

  @ValidateNested()
  @Type(() => BrandAssetsDto)
  assets: BrandAssetsDto;

  @ValidateNested()
  @Type(() => BrandBorderRadiusDto)
  borderRadius: BrandBorderRadiusDto;

  @ValidateNested()
  @Type(() => BrandShadowsDto)
  shadows: BrandShadowsDto;

  @ValidateNested()
  @Type(() => BrandTransitionsDto)
  transitions: BrandTransitionsDto;
}

export class UpdateOrganizationBrandingDto {
  @ValidateNested()
  @Type(() => BrandConfigDto)
  branding: BrandConfigDto;
}

export class UpdatePropertyBrandingDto {
  @ValidateNested()
  @Type(() => BrandConfigDto)
  branding: BrandConfigDto;
}