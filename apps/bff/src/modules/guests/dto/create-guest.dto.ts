import { IsString, IsEmail, IsOptional, IsDateString, IsObject, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VipStatus } from '@prisma/client';

export class CreateGuestDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'American' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'AB123456' })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional({ 
    example: { 
      street: '123 Main St', 
      city: 'New York', 
      state: 'NY', 
      zipCode: '10001',
      country: 'USA' 
    }
  })
  @IsOptional()
  @IsObject()
  address?: Record<string, any>;

  @ApiPropertyOptional({ 
    example: { 
      roomType: 'Suite', 
      bedType: 'King', 
      specialRequests: ['Late checkout', 'Extra towels'] 
    }
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiProperty({ enum: VipStatus, example: VipStatus.STANDARD })
  @IsEnum(VipStatus)
  vipStatus: VipStatus;

  @ApiPropertyOptional({ example: 'Regular guest, prefers quiet rooms' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  blacklisted?: boolean;

  @ApiPropertyOptional({ example: 'Reason for blacklisting if applicable' })
  @IsOptional()
  @IsString()
  blacklistReason?: string;
}