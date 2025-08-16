import { IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class BulkImportUserDto extends CreateUserDto {
  @ApiPropertyOptional({
    description: 'Send invitation email to user',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendInvitation?: boolean;
}

export class BulkImportDto {
  @ApiProperty({
    description: 'Array of users to import',
    type: [BulkImportUserDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportUserDto)
  users: BulkImportUserDto[];

  @ApiPropertyOptional({
    description: 'Validate only without creating users',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean;
}

export class BulkImportResultDto {
  @ApiProperty({ description: 'Number of users successfully imported' })
  successCount: number;

  @ApiProperty({ description: 'Number of users that failed to import' })
  failureCount: number;

  @ApiProperty({ description: 'Array of successfully imported users' })
  successful: any[];

  @ApiProperty({ description: 'Array of failed imports with reasons' })
  failed: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

export class CsvImportDto {
  @ApiPropertyOptional({
    description: 'Validate only without creating users',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Send invitation emails to imported users',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendInvitations?: boolean;
}