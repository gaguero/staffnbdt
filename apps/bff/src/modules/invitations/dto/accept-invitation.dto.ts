import { IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+507 6123-4567',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Job position/title',
    example: 'Software Engineer',
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact information as JSON',
    example: { name: 'Jane Doe', phone: '+507 6123-4567', relationship: 'Spouse' },
  })
  @IsOptional()
  emergencyContact?: any;
}