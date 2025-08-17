import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { VipStatus } from '@prisma/client';

export class GuestFilterDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(VipStatus)
  vipStatus?: VipStatus;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsBoolean()
  blacklisted?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}