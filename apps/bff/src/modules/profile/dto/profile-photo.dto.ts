import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';
import { PhotoType } from '@prisma/client';

export class UploadProfilePhotoDto {
  @ApiProperty({ 
    enum: PhotoType,
    description: 'Type of profile photo',
    default: PhotoType.FORMAL,
    example: PhotoType.FORMAL
  })
  @IsEnum(PhotoType)
  @IsOptional()
  photoType?: PhotoType = PhotoType.FORMAL;

  @ApiProperty({ 
    description: 'Set this photo as primary profile photo',
    default: false,
    example: true
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;

  @ApiProperty({ 
    description: 'Optional description for the photo',
    maxLength: 255,
    required: false,
    example: 'Professional headshot for employee directory'
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

export class ProfilePhotoResponseDto {
  @ApiProperty({ description: 'Photo ID', example: 'cm123abc456def' })
  id: string;

  @ApiProperty({ description: 'User ID', example: 'cm456def789ghi' })
  userId: string;

  @ApiProperty({ description: 'File key in storage', example: 'org/org123/property/prop456/profiles/users/user789/FORMAL/2024-photo.jpg' })
  fileKey: string;

  @ApiProperty({ description: 'Original file name', example: 'profile-photo.jpg' })
  fileName: string;

  @ApiProperty({ description: 'MIME type', example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes', example: 204800 })
  size: number;

  @ApiProperty({ 
    enum: PhotoType,
    description: 'Type of profile photo',
    example: PhotoType.FORMAL
  })
  photoType: PhotoType;

  @ApiProperty({ description: 'Whether photo is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Whether this is the primary photo', example: true })
  isPrimary: boolean;

  @ApiProperty({ description: 'Optional description', example: 'Professional headshot', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Upload timestamp', example: '2024-08-20T10:30:00.000Z' })
  uploadedAt: Date;

  @ApiProperty({ description: 'Created timestamp', example: '2024-08-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated timestamp', example: '2024-08-20T10:30:00.000Z' })
  updatedAt: Date;
}

export class UserPhotosResponseDto {
  @ApiProperty({ 
    type: [ProfilePhotoResponseDto],
    description: 'Array of user photos organized by type'
  })
  photos: ProfilePhotoResponseDto[];

  @ApiProperty({ 
    description: 'Photo counts by type',
    example: {
      FORMAL: 1,
      CASUAL: 1,
      UNIFORM: 0,
      FUNNY: 1
    }
  })
  photosByType: Record<PhotoType, number>;

  @ApiProperty({ 
    description: 'Primary photo (used for profile display)',
    nullable: true,
    type: ProfilePhotoResponseDto
  })
  primaryPhoto: ProfilePhotoResponseDto | null;
}

export class SetPrimaryPhotoDto {
  @ApiProperty({ 
    description: 'Photo ID to set as primary',
    example: 'cm123abc456def'
  })
  @IsString()
  photoId: string;
}

export class PhotoTypeInfoDto {
  @ApiProperty({ 
    enum: PhotoType,
    description: 'Photo type',
    example: PhotoType.FORMAL
  })
  type: PhotoType;

  @ApiProperty({ 
    description: 'Display name for the photo type',
    example: 'Formal'
  })
  displayName: string;

  @ApiProperty({ 
    description: 'Description of when to use this photo type',
    example: 'Professional headshot for employee directory and formal communications'
  })
  description: string;

  @ApiProperty({ 
    description: 'Whether user has a photo of this type',
    example: true
  })
  hasPhoto: boolean;

  @ApiProperty({ 
    description: 'URL to view the photo if it exists',
    nullable: true,
    example: '/api/profile/photo/user123/FORMAL'
  })
  photoUrl: string | null;
}

export class PhotoTypesResponseDto {
  @ApiProperty({ 
    type: [PhotoTypeInfoDto],
    description: 'Information about all photo types and their status'
  })
  photoTypes: PhotoTypeInfoDto[];
}