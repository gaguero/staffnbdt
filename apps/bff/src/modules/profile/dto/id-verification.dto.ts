import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IdVerificationStatus } from '../interfaces/id-document.interface';

export class VerifyIdDocumentDto {
  @ApiProperty({ 
    enum: IdVerificationStatus, 
    example: IdVerificationStatus.VERIFIED,
    description: 'Verification status' 
  })
  @IsEnum(IdVerificationStatus)
  status: IdVerificationStatus;

  @ApiProperty({ 
    example: 'Document verified successfully', 
    description: 'Verification notes',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class IdDocumentStatusDto {
  @ApiProperty({ 
    enum: IdVerificationStatus, 
    example: IdVerificationStatus.PENDING,
    description: 'Current verification status' 
  })
  status: IdVerificationStatus;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00.000Z', 
    description: 'Upload date',
    required: false 
  })
  uploadedAt?: string;

  @ApiProperty({ 
    example: '2024-01-20T15:45:00.000Z', 
    description: 'Verification date',
    required: false 
  })
  verifiedAt?: string;

  @ApiProperty({ 
    example: 'admin123', 
    description: 'ID of admin who verified',
    required: false 
  })
  verifiedBy?: string;

  @ApiProperty({ 
    example: 'Document does not meet requirements', 
    description: 'Rejection reason if rejected',
    required: false 
  })
  rejectionReason?: string;
}