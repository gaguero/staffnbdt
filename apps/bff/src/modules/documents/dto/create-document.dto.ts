import { IsString, IsEnum, IsOptional, IsNumber, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentScope } from '@prisma/client';

export class CreateDocumentDto {
  @ApiProperty({ example: 'Employee Handbook' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Updated company policies and procedures' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'documents/general/1234567890-handbook.pdf' })
  @IsOptional()
  @IsString()
  fileKey?: string;

  @ApiPropertyOptional({ example: 'https://s3.example.com/documents/handbook.pdf' })
  @IsOptional()
  @IsString()
  fileUrl?: string; // Legacy field for backward compatibility

  @ApiPropertyOptional({ example: 1024000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  fileSize?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

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

  @ApiPropertyOptional({ example: ['policy', 'handbook', 'hr'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}