import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { Role } from '@prisma/client';

// Local enum until Prisma generates the types
enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export class InvitationFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by invitation status',
    enum: InvitationStatus,
  })
  @IsOptional()
  @IsEnum(InvitationStatus)
  status?: InvitationStatus;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: Role,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Search by email',
  })
  @IsOptional()
  @IsString()
  search?: string;
}