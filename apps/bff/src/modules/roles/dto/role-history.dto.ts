import { IsString, IsOptional, IsDateString, IsArray, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RoleHistoryAction {
  ASSIGNED = 'ASSIGNED',
  REMOVED = 'REMOVED',
  MODIFIED = 'MODIFIED',
  EXPIRED = 'EXPIRED',
  BULK_ASSIGNED = 'BULK_ASSIGNED',
  BULK_REMOVED = 'BULK_REMOVED'
}

export enum RoleHistorySource {
  MANUAL = 'manual',
  BULK = 'bulk',
  TEMPLATE = 'template',
  MIGRATION = 'migration',
  AUTOMATED = 'automated',
  SYSTEM = 'system'
}

export enum RoleHistoryTimeRange {
  ONE_HOUR = '1h',
  TWENTY_FOUR_HOURS = '24h',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
  CUSTOM = 'custom'
}

export class RoleHistoryFilterDto {
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: RoleHistoryTimeRange, example: '7d' })
  @IsOptional()
  @IsEnum(RoleHistoryTimeRange)
  timeRange?: RoleHistoryTimeRange;

  @ApiPropertyOptional({ type: [String], example: ['user-123', 'user-456'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['role-123', 'role-456'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['admin-123', 'admin-456'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  adminIds?: string[];

  @ApiPropertyOptional({ enum: RoleHistoryAction, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleHistoryAction, { each: true })
  actions?: RoleHistoryAction[];

  @ApiPropertyOptional({ enum: RoleHistorySource, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleHistorySource, { each: true })
  sources?: RoleHistorySource[];

  @ApiPropertyOptional({ type: [String], example: ['org-123'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  organizationIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['prop-123'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['dept-123'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @ApiPropertyOptional({ example: 'john.doe' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ example: 'batch-123' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showBulkOperations?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  groupByBatch?: boolean;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 'timestamp', enum: ['timestamp', 'action', 'userName', 'roleName', 'adminName'] })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc';
}

export class CreateRoleHistoryEntryDto {
  @ApiProperty({ enum: RoleHistoryAction })
  @IsEnum(RoleHistoryAction)
  action: RoleHistoryAction;

  @ApiProperty({ example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'role-456' })
  @IsString()
  roleId: string;

  @ApiPropertyOptional({ example: 'user-role-789' })
  @IsOptional()
  @IsString()
  userRoleId?: string;

  @ApiProperty({ example: 'admin-123' })
  @IsString()
  adminId: string;

  @ApiPropertyOptional({ example: 'Temporary assignment for project' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ 
    example: { 
      source: 'manual', 
      batchId: 'batch-123', 
      operationType: 'promotion' 
    } 
  })
  context: {
    source: RoleHistorySource;
    batchId?: string;
    parentAction?: string;
    operationType?: string;
  };

  @ApiPropertyOptional({ 
    example: { 
      ipAddress: '192.168.1.100', 
      userAgent: 'Mozilla/5.0...',
      sessionId: 'session-123',
      requestId: 'req-456'
    } 
  })
  @IsOptional()
  auditTrail?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
  };
}

export class UserRoleHistoryDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showPermissionChanges?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableRollback?: boolean;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  maxEntries?: number;
}

export class RoleAssignmentHistoryDto {
  @ApiProperty({ example: 'role-123' })
  @IsString()
  roleId: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showUserDetails?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  groupByTimeframe?: boolean;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  maxEntries?: number;
}

export class AdminActivityHistoryDto {
  @ApiPropertyOptional({ example: 'admin-123' })
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showImpactMetrics?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showSuspiciousActivity?: boolean;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  maxEntries?: number;
}

export class HistoryExportDto {
  @ApiProperty({ example: 'pdf', enum: ['pdf', 'csv', 'excel', 'json'] })
  @IsString()
  format: 'pdf' | 'csv' | 'excel' | 'json';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  includePermissionChanges?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  includeAuditTrail?: boolean;

  @ApiProperty({ 
    example: { 
      from: '2024-01-01T00:00:00Z', 
      to: '2024-12-31T23:59:59Z' 
    } 
  })
  dateRange: {
    from: string;
    to: string;
  };

  @ApiPropertyOptional()
  filters?: RoleHistoryFilterDto;

  @ApiPropertyOptional({ 
    example: 'user', 
    enum: ['none', 'user', 'role', 'admin', 'batch'] 
  })
  @IsOptional()
  @IsString()
  grouping?: 'none' | 'user' | 'role' | 'admin' | 'batch';
}

export class RollbackOperationDto {
  @ApiProperty({ example: 'history-entry-123' })
  @IsString()
  historyEntryId: string;

  @ApiProperty({ example: 'Reverting accidental role assignment' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  confirmationRequired?: boolean;
}