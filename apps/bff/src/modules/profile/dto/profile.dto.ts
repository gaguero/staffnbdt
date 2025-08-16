import { IsString, IsOptional, IsPhoneNumber, IsDateString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmergencyContactsData } from '../interfaces/emergency-contact.interface';
import { IdDocumentMetadata } from '../interfaces/id-document.interface';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John', description: 'First name', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ example: '+507 6000-0000', description: 'Phone number', required: false })
  @IsOptional()
  @IsPhoneNumber('PA')
  phoneNumber?: string;

  @ApiProperty({ example: 'Software Engineer', description: 'Job position', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;
}

export class ProfileResponseDto {
  @ApiProperty({ example: 'cluid123', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'john.doe@company.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  lastName: string;

  @ApiProperty({ example: 'STAFF', description: 'User role' })
  role: string;

  @ApiProperty({ example: 'dept123', description: 'Department ID', required: false })
  departmentId?: string;

  @ApiProperty({ example: 'Software Engineer', description: 'Job position', required: false })
  position?: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z', description: 'Hire date', required: false })
  hireDate?: string;

  @ApiProperty({ example: '+507 6000-0000', description: 'Phone number', required: false })
  phoneNumber?: string;

  @ApiProperty({ description: 'Emergency contacts data', required: false })
  emergencyContact?: EmergencyContactsData;

  @ApiProperty({ description: 'ID document metadata', required: false })
  idDocument?: IdDocumentMetadata;

  @ApiProperty({ example: 'profiles/profile_uuid.jpg', description: 'Profile photo path', required: false })
  profilePhoto?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Created at' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-20T15:45:00.000Z', description: 'Updated at' })
  updatedAt: string;
}