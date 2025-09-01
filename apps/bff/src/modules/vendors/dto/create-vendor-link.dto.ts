import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateVendorLinkDto {
  @IsString()
  vendorId!: string;

  @IsString()
  objectId!: string;

  @IsString()
  objectType!: string;

  @IsOptional()
  @IsString()
  policyRef?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}