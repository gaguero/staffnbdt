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

  @ApiProperty({ example: 'documents/general/1234567890-handbook.pdf' })
  @IsString()
  fileUrl: string;

  @ApiProperty({ example: 1024000 })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  mimeType: string;

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