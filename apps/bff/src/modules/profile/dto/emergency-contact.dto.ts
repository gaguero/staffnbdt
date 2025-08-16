import { IsString, IsEmail, IsOptional, IsBoolean, ValidateNested, IsArray, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EmergencyContactDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of emergency contact' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Spouse', description: 'Relationship to the employee' })
  @IsString()
  relationship: string;

  @ApiProperty({ example: '+507 6000-0000', description: 'Phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'john.doe@email.com', description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '123 Main St, Panama City', description: 'Address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: true, description: 'Whether this is the primary emergency contact', required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateEmergencyContactsDto {
  @ApiProperty({ 
    type: [EmergencyContactDto], 
    description: 'Array of emergency contacts (max 3)',
    maxItems: 3,
    minItems: 1 
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  contacts: EmergencyContactDto[];
}