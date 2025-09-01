import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class ConfirmLinkDto {
  @IsEnum(['confirm', 'decline'])
  action!: 'confirm' | 'decline';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  estimatedCompletion?: string;
}