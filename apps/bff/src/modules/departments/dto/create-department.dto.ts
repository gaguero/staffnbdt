import { IsString, IsOptional, MinLength, MaxLength, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDepartmentDto {
  @ApiProperty({ 
    example: 'Human Resources',
    description: 'Department name (must be unique)',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ 
    example: 'Manages employee relations, hiring, and company policies',
    description: 'Department description',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ 
    example: 'Main Building - 2nd Floor',
    description: 'Department physical location'
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ 
    example: 250000,
    description: 'Annual department budget'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional({ 
    example: 'cuid123456789',
    description: 'ID of the department manager'
  })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}