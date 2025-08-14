import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentScope } from '@prisma/client';

export class UploadDocumentDto {
  @ApiProperty({ example: 'document.pdf' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 1024000 })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({ enum: DocumentScope, example: DocumentScope.GENERAL })
  @IsEnum(DocumentScope)
  scope: DocumentScope;

  @ApiPropertyOptional({ example: 'dept-123' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'user-456' })
  @IsOptional()
  @IsString()
  userId?: string;
}