import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { RolesHistoryService } from './roles-history.service';
import {
  RoleHistoryFilterDto,
  UserRoleHistoryDto,
  RoleAssignmentHistoryDto,
  AdminActivityHistoryDto,
  HistoryExportDto,
  RollbackOperationDto,
} from './dto/role-history.dto';

@ApiTags('Role Assignment History')
@Controller('roles/history')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class RolesHistoryController {
  constructor(private readonly historyService: RolesHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get role assignment history with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Role history retrieved successfully' })
  @RequirePermission('role.read.history')
  async getHistory(
    @Query() filterDto: RoleHistoryFilterDto,
    @Request() req: any,
  ) {
    return this.historyService.getHistory(filterDto, req.user);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get role assignment history for a specific user' })
  @ApiResponse({ status: 200, description: 'User role history retrieved successfully' })
  @RequirePermission(['role.read.history', 'user.read.own'])
  async getUserRoleHistory(
    @Param('userId') userId: string,
    @Query() dto: Omit<UserRoleHistoryDto, 'userId'>,
    @Request() req: any,
  ) {
    const userHistoryDto: UserRoleHistoryDto = { ...dto, userId };
    return this.historyService.getUserRoleHistory(userHistoryDto, req.user);
  }

  @Get('role/:roleId/assignments')
  @ApiOperation({ summary: 'Get assignment history for a specific role' })
  @ApiResponse({ status: 200, description: 'Role assignment history retrieved successfully' })
  @RequirePermission('role.read.history')
  async getRoleAssignmentHistory(
    @Param('roleId') roleId: string,
    @Query() dto: Omit<RoleAssignmentHistoryDto, 'roleId'>,
    @Request() req: any,
  ) {
    const roleHistoryDto: RoleAssignmentHistoryDto = { ...dto, roleId };
    return this.historyService.getRoleAssignmentHistory(roleHistoryDto, req.user);
  }

  @Get('admin/:adminId/activity')
  @ApiOperation({ summary: 'Get administrator activity history' })
  @ApiResponse({ status: 200, description: 'Admin activity history retrieved successfully' })
  @RequirePermission(['role.read.history', 'audit.read'])
  async getAdminActivityHistory(
    @Param('adminId') adminId: string,
    @Query() dto: Omit<AdminActivityHistoryDto, 'adminId'>,
    @Request() req: any,
  ) {
    const adminHistoryDto: AdminActivityHistoryDto = { ...dto, adminId };
    return this.historyService.getAdminActivityHistory(adminHistoryDto, req.user);
  }

  @Get('admin/activity')
  @ApiOperation({ summary: 'Get current user administrator activity history' })
  @ApiResponse({ status: 200, description: 'Current admin activity history retrieved successfully' })
  @RequirePermission('role.read.history')
  async getCurrentAdminActivity(
    @Query() dto: AdminActivityHistoryDto,
    @Request() req: any,
  ) {
    return this.historyService.getAdminActivityHistory(dto, req.user);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get role assignment history analytics and trends' })
  @ApiResponse({ status: 200, description: 'History analytics retrieved successfully' })
  @RequirePermission(['role.read.history', 'analytics.read'])
  async getHistoryAnalytics(@Request() req: any) {
    return this.historyService.getHistoryAnalytics(req.user);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export role assignment history in various formats' })
  @ApiResponse({ status: 200, description: 'History export initiated successfully' })
  @RequirePermission(['role.read.history', 'export.create'])
  @HttpCode(HttpStatus.OK)
  async exportHistory(
    @Body() exportDto: HistoryExportDto,
    @Request() req: any,
  ) {
    return this.historyService.exportHistory(exportDto, req.user);
  }

  @Post('rollback')
  @ApiOperation({ summary: 'Rollback a role assignment operation' })
  @ApiResponse({ status: 200, description: 'Role assignment rollback completed successfully' })
  @RequirePermission(['role.rollback', 'role.assign.organization'])
  @HttpCode(HttpStatus.OK)
  async rollbackAssignment(
    @Body() rollbackDto: RollbackOperationDto,
    @Request() req: any,
  ) {
    return this.historyService.rollbackAssignment(rollbackDto, req.user);
  }

  @Get('timeline/:timeframe')
  @ApiOperation({ summary: 'Get role assignment history timeline for specific timeframe' })
  @ApiResponse({ status: 200, description: 'History timeline retrieved successfully' })
  @RequirePermission('role.read.history')
  async getHistoryTimeline(
    @Param('timeframe') timeframe: string,
    @Query() filterDto: RoleHistoryFilterDto,
    @Request() req: any,
  ) {
    // Set timeframe in filter and return grouped timeline data
    const timelineFilter = {
      ...filterDto,
      timeRange: timeframe as any,
      groupByBatch: true,
    };
    
    const historyData = await this.historyService.getHistory(timelineFilter, req.user);
    
    // Transform into timeline format
    const timeline = this.groupEntriesForTimeline(historyData.entries);
    
    return {
      timeframe,
      timeline,
      summary: historyData.summary,
      total: historyData.total,
    };
  }

  @Get('bulk-operations')
  @ApiOperation({ summary: 'Get history of bulk role assignment operations' })
  @ApiResponse({ status: 200, description: 'Bulk operations history retrieved successfully' })
  @RequirePermission('role.read.history')
  async getBulkOperationsHistory(
    @Query() filterDto: RoleHistoryFilterDto,
    @Request() req: any,
  ) {
    const bulkFilter = {
      ...filterDto,
      showBulkOperations: true,
      actions: ['BULK_ASSIGNED', 'BULK_REMOVED'] as any[],
    };
    
    return this.historyService.getHistory(bulkFilter, req.user);
  }

  @Get('compliance-report')
  @ApiOperation({ summary: 'Get compliance report for role assignment history' })
  @ApiResponse({ status: 200, description: 'Compliance report generated successfully' })
  @RequirePermission(['role.read.history', 'audit.read', 'compliance.read'])
  async getComplianceReport(@Request() req: any) {
    const analytics = await this.historyService.getHistoryAnalytics(req.user);
    
    return {
      reportType: 'Role Assignment Compliance',
      generatedAt: new Date(),
      generatedBy: {
        id: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
      },
      compliance: analytics.compliance,
      recommendations: this.generateComplianceRecommendations(analytics.compliance),
      auditTrail: true,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search role assignment history with advanced filters' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @RequirePermission('role.read.history')
  async searchHistory(
    @Query() filterDto: RoleHistoryFilterDto,
    @Request() req: any,
  ) {
    // Enhanced search with relevance scoring
    const results = await this.historyService.getHistory(filterDto, req.user);
    
    return {
      ...results,
      searchTerm: filterDto.searchTerm,
      searchResults: true,
      relevanceScored: true,
    };
  }

  // Private helper methods

  private groupEntriesForTimeline(entries: any[]) {
    const groups = new Map();
    
    entries.forEach(entry => {
      const batchKey = entry.context?.batchId || entry.id;
      if (!groups.has(batchKey)) {
        groups.set(batchKey, {
          groupKey: batchKey,
          timestamp: entry.timestamp,
          entries: [],
          summary: {
            action: entry.action,
            affectedUsers: new Set(),
            affectedRoles: new Set(),
            adminName: `${entry.metadata?.adminDetails?.firstName} ${entry.metadata?.adminDetails?.lastName}`,
          },
        });
      }
      
      const group = groups.get(batchKey);
      group.entries.push(entry);
      group.summary.affectedUsers.add(entry.userId);
      group.summary.affectedRoles.add(entry.roleId);
    });
    
    // Convert sets to counts
    return Array.from(groups.values()).map(group => ({
      ...group,
      summary: {
        ...group.summary,
        affectedUsers: group.summary.affectedUsers.size,
        affectedRoles: group.summary.affectedRoles.size,
      },
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private generateComplianceRecommendations(compliance: any) {
    const recommendations = [];
    
    if (compliance.auditCoverage < 95) {
      recommendations.push({
        type: 'audit_coverage',
        priority: 'high',
        message: 'Improve audit trail coverage for role assignments',
        action: 'Ensure all role assignment operations include IP address and user agent information',
      });
    }
    
    if (compliance.suspiciousPatterns?.length > 0) {
      recommendations.push({
        type: 'suspicious_activity',
        priority: 'high',
        message: 'Review suspicious role assignment patterns',
        action: 'Investigate flagged patterns and implement additional monitoring if needed',
      });
    }
    
    if (compliance.retentionCompliance < 100) {
      recommendations.push({
        type: 'retention_policy',
        priority: 'medium',
        message: 'Implement automated retention policy enforcement',
        action: 'Set up automated archival and deletion of old audit records',
      });
    }
    
    return recommendations;
  }
}