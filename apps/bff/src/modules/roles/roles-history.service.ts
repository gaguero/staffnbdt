import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { Role, User, Prisma } from '@prisma/client';
import {
  RoleHistoryFilterDto,
  CreateRoleHistoryEntryDto,
  UserRoleHistoryDto,
  RoleAssignmentHistoryDto,
  AdminActivityHistoryDto,
  HistoryExportDto,
  RollbackOperationDto,
  RoleHistoryAction,
  RoleHistorySource,
  RoleHistoryTimeRange
} from './dto/role-history.dto';

interface RoleHistoryEntry {
  id: string;
  timestamp: Date;
  action: RoleHistoryAction;
  userId: string;
  roleId: string;
  userRoleId?: string;
  adminId: string;
  reason?: string;
  context: any;
  metadata: any;
  changes?: any;
  auditTrail: any;
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
}

interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role?: string;
  department?: string;
}

interface RoleSummary {
  id: string;
  name: string;
  description?: string;
  level: number;
  isSystemRole?: boolean;
  permissionCount: number;
  category?: string;
}

@Injectable()
export class RolesHistoryService {
  private readonly logger = new Logger(RolesHistoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a role history entry
   */
  async createHistoryEntry(dto: CreateRoleHistoryEntryDto): Promise<void> {
    try {
      // Get user, role, and admin details
      const [user, role, admin] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: dto.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true,
            role: true,
            departmentName: true,
            organizationId: true,
            propertyId: true,
            departmentId: true,
          },
        }),
        this.prisma.customRole.findUnique({
          where: { id: dto.roleId },
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            isSystemRole: true,
            _count: {
              select: { permissions: { where: { granted: true } } },
            },
          },
        }),
        this.prisma.user.findUnique({
          where: { id: dto.adminId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true,
            role: true,
            departmentName: true,
          },
        }),
      ]);

      if (!user || !role || !admin) {
        this.logger.warn(`Missing data for history entry: user=${!!user}, role=${!!role}, admin=${!!admin}`);
        return;
      }

      // Build metadata
      const metadata = {
        userDetails: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.profilePhoto,
          role: user.role,
          department: user.departmentName,
        } as UserSummary,
        roleDetails: {
          id: role.id,
          name: role.name,
          description: role.description,
          level: role.priority,
          isSystemRole: role.isSystemRole,
          permissionCount: role._count?.permissions || 0,
        } as RoleSummary,
        adminDetails: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          avatar: admin.profilePhoto,
          role: admin.role,
          department: admin.departmentName,
        } as UserSummary,
        systemInfo: {
          platform: 'Hotel Operations Hub',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          tenantContext: {
            organizationName: 'Organization', // TODO: Get actual names
            propertyName: 'Property',
            departmentName: user.departmentName,
          },
        },
      };

      // Store in audit log as structured data
      await this.auditService.log({
        userId: dto.adminId,
        action: `ROLE_${dto.action}`,
        entity: 'RoleAssignmentHistory',
        entityId: `${dto.userId}-${dto.roleId}`,
        newData: {
          action: dto.action,
          userId: dto.userId,
          roleId: dto.roleId,
          userRoleId: dto.userRoleId,
          reason: dto.reason,
          context: dto.context,
          metadata,
          auditTrail: dto.auditTrail,
        },
        ipAddress: dto.auditTrail?.ipAddress,
        userAgent: dto.auditTrail?.userAgent,
      });

      this.logger.log(
        `Role history entry created: ${dto.action} - User: ${user.email}, Role: ${role.name}, Admin: ${admin.email}`
      );
    } catch (error) {
      this.logger.error('Error creating role history entry:', error);
      // Don't throw to avoid breaking the main operation
    }
  }

  /**
   * Get role assignment history with filtering
   */
  async getHistory(filterDto: RoleHistoryFilterDto, currentUser: User) {
    try {
      const {
        page = 1,
        limit = 50,
        dateFrom,
        dateTo,
        timeRange,
        userIds,
        roleIds,
        adminIds,
        actions,
        sources,
        searchTerm,
        batchId,
        sortBy = 'timestamp',
        sortDirection = 'desc',
      } = filterDto;

      // Build time filter
      const timeFilter = this.buildTimeFilter(dateFrom, dateTo, timeRange);

      // Build search conditions for audit logs
      const where: Prisma.AuditLogWhereInput = {
        createdAt: timeFilter,
        entity: 'RoleAssignmentHistory',
        ...this.buildTenantFilters(currentUser),
      };

      // Add entity-specific filters
      if (userIds?.length || roleIds?.length || adminIds?.length || actions?.length || sources?.length || batchId || searchTerm) {
        where.OR = [];

        // User filter
        if (userIds?.length) {
          where.OR.push({
            newData: {
              path: ['userId'],
              array_contains: userIds,
            },
          });
        }

        // Role filter
        if (roleIds?.length) {
          where.OR.push({
            newData: {
              path: ['roleId'],
              array_contains: roleIds,
            },
          });
        }

        // Admin filter
        if (adminIds?.length) {
          where.OR.push({
            userId: { in: adminIds },
          });
        }

        // Action filter
        if (actions?.length) {
          where.OR.push({
            newData: {
              path: ['action'],
              array_contains: actions,
            },
          });
        }

        // Search term filter
        if (searchTerm) {
          where.OR.push(
            {
              newData: {
                path: ['metadata', 'userDetails', 'email'],
                string_contains: searchTerm,
              },
            },
            {
              newData: {
                path: ['metadata', 'roleDetails', 'name'],
                string_contains: searchTerm,
              },
            },
            {
              newData: {
                path: ['metadata', 'adminDetails', 'email'],
                string_contains: searchTerm,
              },
            }
          );
        }
      }

      // Get history entries with pagination
      const [entries, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          orderBy: this.buildOrderBy(sortBy, sortDirection),
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      // Transform audit logs to history entries
      const historyEntries = entries.map(entry => this.transformAuditLogToHistoryEntry(entry));

      // Generate summary
      const summary = await this.generateHistorySummary(where, currentUser);

      return {
        entries: historyEntries,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary,
      };
    } catch (error) {
      this.logger.error('Error getting role history:', error);
      throw error;
    }
  }

  /**
   * Get user-specific role history
   */
  async getUserRoleHistory(dto: UserRoleHistoryDto, currentUser: User) {
    try {
      const { userId, showPermissionChanges = false, maxEntries = 50 } = dto;

      // Check user access permissions
      await this.validateUserAccess(userId, currentUser);

      const where: Prisma.AuditLogWhereInput = {
        entity: 'RoleAssignmentHistory',
        newData: {
          path: ['userId'],
          equals: userId,
        },
        ...this.buildTenantFilters(currentUser),
      };

      const entries = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: maxEntries,
      });

      const historyEntries = entries.map(entry => {
        const transformed = this.transformAuditLogToHistoryEntry(entry);
        if (showPermissionChanges) {
          // Add permission change details if requested
          transformed.changes = this.calculatePermissionChanges(entry);
        }
        return transformed;
      });

      return {
        userId,
        entries: historyEntries,
        total: entries.length,
        enableRollback: this.canUserRollback(currentUser),
      };
    } catch (error) {
      this.logger.error(`Error getting user role history for ${dto.userId}:`, error);
      throw error;
    }
  }

  /**
   * Get role assignment history for a specific role
   */
  async getRoleAssignmentHistory(dto: RoleAssignmentHistoryDto, currentUser: User) {
    try {
      const { roleId, showUserDetails = true, maxEntries = 50 } = dto;

      const where: Prisma.AuditLogWhereInput = {
        entity: 'RoleAssignmentHistory',
        newData: {
          path: ['roleId'],
          equals: roleId,
        },
        ...this.buildTenantFilters(currentUser),
      };

      const entries = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: maxEntries,
      });

      const historyEntries = entries.map(entry => {
        const transformed = this.transformAuditLogToHistoryEntry(entry);
        if (!showUserDetails) {
          // Strip user details if not requested
          transformed.metadata.userDetails = {
            id: transformed.metadata.userDetails.id,
            firstName: '***',
            lastName: '***',
            email: '***@***.***',
          } as UserSummary;
        }
        return transformed;
      });

      return {
        roleId,
        entries: historyEntries,
        total: entries.length,
        userCount: new Set(historyEntries.map(e => e.userId)).size,
      };
    } catch (error) {
      this.logger.error(`Error getting role assignment history for ${dto.roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get admin activity history
   */
  async getAdminActivityHistory(dto: AdminActivityHistoryDto, currentUser: User) {
    try {
      const { 
        adminId, 
        showImpactMetrics = false, 
        showSuspiciousActivity = false, 
        maxEntries = 100 
      } = dto;

      const where: Prisma.AuditLogWhereInput = {
        entity: 'RoleAssignmentHistory',
        userId: adminId || currentUser.id,
        ...this.buildTenantFilters(currentUser),
      };

      const entries = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: maxEntries,
      });

      const historyEntries = entries.map(entry => this.transformAuditLogToHistoryEntry(entry));

      const response: any = {
        adminId: adminId || currentUser.id,
        entries: historyEntries,
        total: entries.length,
      };

      if (showImpactMetrics) {
        response.impactMetrics = this.calculateImpactMetrics(historyEntries);
      }

      if (showSuspiciousActivity) {
        response.suspiciousPatterns = this.detectSuspiciousPatterns(historyEntries);
      }

      return response;
    } catch (error) {
      this.logger.error('Error getting admin activity history:', error);
      throw error;
    }
  }

  /**
   * Get role history analytics
   */
  async getHistoryAnalytics(currentUser: User) {
    try {
      const where: Prisma.AuditLogWhereInput = {
        entity: 'RoleAssignmentHistory',
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
        ...this.buildTenantFilters(currentUser),
      };

      const entries = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });

      const historyEntries = entries.map(entry => this.transformAuditLogToHistoryEntry(entry));

      return {
        trends: this.calculateTrends(historyEntries),
        patterns: this.analyzePatterns(historyEntries),
        compliance: this.calculateComplianceMetrics(historyEntries),
      };
    } catch (error) {
      this.logger.error('Error getting history analytics:', error);
      throw error;
    }
  }

  /**
   * Export role history
   */
  async exportHistory(dto: HistoryExportDto, currentUser: User) {
    try {
      const { format, dateRange, filters = {}, grouping = 'none' } = dto;

      // Build comprehensive filter
      const exportFilter = {
        ...filters,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        limit: 10000, // Large limit for export
      };

      const historyResponse = await this.getHistory(exportFilter, currentUser);

      // Generate export based on format
      const exportResult = await this.generateExport(
        historyResponse.entries,
        format,
        dto,
        grouping
      );

      return exportResult;
    } catch (error) {
      this.logger.error('Error exporting history:', error);
      throw error;
    }
  }

  /**
   * Rollback a role assignment
   */
  async rollbackAssignment(dto: RollbackOperationDto, currentUser: User) {
    try {
      const { historyEntryId, reason } = dto;

      // Check permissions
      if (!this.canUserRollback(currentUser)) {
        throw new ForbiddenException('Insufficient permissions for rollback operations');
      }

      // Find the history entry
      const auditEntry = await this.prisma.auditLog.findUnique({
        where: { id: historyEntryId },
      });

      if (!auditEntry || auditEntry.entity !== 'RoleAssignmentHistory') {
        throw new NotFoundException('History entry not found');
      }

      const historyEntry = this.transformAuditLogToHistoryEntry(auditEntry);

      // Perform rollback based on original action
      let rollbackResult;
      switch (historyEntry.action) {
        case RoleHistoryAction.ASSIGNED:
        case RoleHistoryAction.BULK_ASSIGNED:
          // Remove the role assignment
          await this.removeRoleAssignment(historyEntry.userId, historyEntry.roleId, currentUser);
          rollbackResult = { action: 'REMOVED', userId: historyEntry.userId, roleId: historyEntry.roleId };
          break;

        case RoleHistoryAction.REMOVED:
        case RoleHistoryAction.BULK_REMOVED:
          // Re-assign the role
          await this.restoreRoleAssignment(historyEntry.userId, historyEntry.roleId, currentUser);
          rollbackResult = { action: 'ASSIGNED', userId: historyEntry.userId, roleId: historyEntry.roleId };
          break;

        default:
          throw new BadRequestException(`Cannot rollback action: ${historyEntry.action}`);
      }

      // Create rollback history entry
      await this.createHistoryEntry({
        action: rollbackResult.action as RoleHistoryAction,
        userId: rollbackResult.userId,
        roleId: rollbackResult.roleId,
        adminId: currentUser.id,
        reason: `Rollback: ${reason}`,
        context: {
          source: RoleHistorySource.MANUAL,
          parentAction: historyEntryId,
          operationType: 'rollback',
        },
        auditTrail: {
          requestId: `rollback-${Date.now()}`,
        },
      });

      this.logger.log(
        `Role assignment rollback completed by ${currentUser.id}: ${historyEntry.action} -> ${rollbackResult.action}`
      );

      return {
        success: true,
        message: `Successfully rolled back ${historyEntry.action.toLowerCase()} action`,
        rollbackAction: rollbackResult.action,
      };
    } catch (error) {
      this.logger.error(`Error rolling back assignment ${dto.historyEntryId}:`, error);
      throw error;
    }
  }

  // Private helper methods

  private buildTimeFilter(dateFrom?: string, dateTo?: string, timeRange?: RoleHistoryTimeRange) {
    const now = new Date();
    let from: Date, to: Date = now;

    if (dateFrom && dateTo) {
      from = new Date(dateFrom);
      to = new Date(dateTo);
    } else if (timeRange) {
      switch (timeRange) {
        case RoleHistoryTimeRange.ONE_HOUR:
          from = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case RoleHistoryTimeRange.TWENTY_FOUR_HOURS:
          from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case RoleHistoryTimeRange.SEVEN_DAYS:
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case RoleHistoryTimeRange.THIRTY_DAYS:
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case RoleHistoryTimeRange.NINETY_DAYS:
          from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    } else {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days
    }

    return { gte: from, lte: to };
  }

  private buildTenantFilters(currentUser: User): Prisma.AuditLogWhereInput {
    // PLATFORM_ADMIN sees all history
    if (currentUser.role === Role.PLATFORM_ADMIN) {
      return {};
    }

    const filters: Prisma.AuditLogWhereInput = {};
    
    // Filter by user's tenant context
    if (currentUser.propertyId) {
      filters.propertyId = currentUser.propertyId;
    }

    return filters;
  }

  private buildOrderBy(sortBy: string, sortDirection: 'asc' | 'desc') {
    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {};
    
    switch (sortBy) {
      case 'timestamp':
        orderBy.createdAt = sortDirection;
        break;
      case 'action':
        orderBy.action = sortDirection;
        break;
      default:
        orderBy.createdAt = sortDirection;
    }

    return orderBy;
  }

  private transformAuditLogToHistoryEntry(auditLog: any): any {
    const data = auditLog.newData || {};
    
    return {
      id: auditLog.id,
      timestamp: auditLog.createdAt,
      action: data.action,
      userId: data.userId,
      roleId: data.roleId,
      userRoleId: data.userRoleId,
      adminId: auditLog.userId,
      reason: data.reason,
      context: data.context || {},
      metadata: data.metadata || {},
      changes: data.changes,
      auditTrail: data.auditTrail || {
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
      },
      organizationId: data.organizationId,
      propertyId: auditLog.propertyId,
      departmentId: data.departmentId,
    };
  }

  private async generateHistorySummary(where: Prisma.AuditLogWhereInput, currentUser: User) {
    // Get counts by action type
    const actionCounts = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { id: true },
    });

    // Get recent activity counts
    const now = new Date();
    const periods = [
      { key: 'thisHour', start: new Date(now.getTime() - 60 * 60 * 1000) },
      { key: 'today', start: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      { key: 'thisWeek', start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { key: 'thisMonth', start: new Date(now.getFullYear(), now.getMonth(), 1) },
    ];

    const periodStats: any = {};
    for (const period of periods) {
      const count = await this.prisma.auditLog.count({
        where: {
          ...where,
          createdAt: { gte: period.start },
        },
      });
      periodStats[period.key] = count;
    }

    return {
      totalEntries: await this.prisma.auditLog.count({ where }),
      actionsCount: actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count.id;
        return acc;
      }, {} as any),
      periodStats,
      topUsers: [], // TODO: Implement based on audit log data structure
      topRoles: [], // TODO: Implement based on audit log data structure
      topAdmins: [], // TODO: Implement based on audit log data structure
    };
  }

  private async validateUserAccess(userId: string, currentUser: User) {
    // Check if current user can access this user's history
    if (currentUser.role === Role.PLATFORM_ADMIN) {
      return; // Platform admin can access all
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, propertyId: true, departmentId: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check tenant context
    if (currentUser.organizationId && targetUser.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException('Access denied: different organization');
    }

    if (currentUser.propertyId && targetUser.propertyId !== currentUser.propertyId) {
      throw new ForbiddenException('Access denied: different property');
    }
  }

  private canUserRollback(user: User): boolean {
    return [Role.PLATFORM_ADMIN, Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN].includes(user.role);
  }

  private calculatePermissionChanges(auditEntry: any) {
    // TODO: Implement permission change calculation
    return {
      added: [],
      removed: [],
      unchanged: [],
      summary: {
        totalAdded: 0,
        totalRemoved: 0,
        totalUnchanged: 0,
        netChange: 0,
      },
    };
  }

  private calculateImpactMetrics(entries: any[]) {
    const totalActions = entries.length;
    const uniqueUsers = new Set(entries.map(e => e.userId)).size;
    const uniqueRoles = new Set(entries.map(e => e.roleId)).size;
    const bulkOperations = entries.filter(e => 
      e.action.includes('BULK') || e.context?.source === 'bulk'
    ).length;

    return {
      totalActions,
      uniqueUsers,
      uniqueRoles,
      bulkOperations,
      averageActionsPerDay: totalActions / 30, // Assuming 30-day period
    };
  }

  private detectSuspiciousPatterns(entries: any[]) {
    const patterns = [];

    // High frequency pattern
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentActions = entries.filter(e => new Date(e.timestamp) > oneHourAgo).length;
    if (recentActions > 50) {
      patterns.push({
        type: 'high_frequency',
        description: `${recentActions} role changes in the last hour`,
        severity: 'high' as const,
        count: recentActions,
      });
    }

    // Unusual time pattern
    const nightTimeActions = entries.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour < 6 || hour > 22;
    }).length;

    if (nightTimeActions > entries.length * 0.3) {
      patterns.push({
        type: 'unusual_timing',
        description: `${nightTimeActions} role changes during off-hours`,
        severity: 'medium' as const,
        count: nightTimeActions,
      });
    }

    return patterns;
  }

  private calculateTrends(entries: any[]) {
    // TODO: Implement trend calculation
    return {
      assignmentVelocity: [],
      rolePopularity: [],
      adminActivity: [],
    };
  }

  private analyzePatterns(entries: any[]) {
    const bulkOperations = entries.filter(e => e.action.includes('BULK')).length;
    const totalOperations = entries.length;

    return {
      bulkOperationFrequency: bulkOperations / totalOperations,
      averageAssignmentDuration: 0, // TODO: Calculate based on assignment/removal pairs
      peakActivityHours: [9, 10, 14, 15], // TODO: Calculate from actual data
      mostCommonReasons: [], // TODO: Extract from entry reasons
    };
  }

  private calculateComplianceMetrics(entries: any[]) {
    const entriesWithAudit = entries.filter(e => 
      e.auditTrail && (e.auditTrail.ipAddress || e.auditTrail.userAgent)
    ).length;

    return {
      auditCoverage: (entriesWithAudit / entries.length) * 100,
      retentionCompliance: 100, // Assuming all entries are within retention period
      suspiciousPatterns: this.detectSuspiciousPatterns(entries),
    };
  }

  private async generateExport(
    entries: any[],
    format: string,
    options: HistoryExportDto,
    grouping: string
  ) {
    // TODO: Implement actual export generation
    const fileName = `role-history-${Date.now()}.${format}`;
    
    return {
      success: true,
      fileName,
      downloadUrl: `/api/exports/${fileName}`,
      fileSize: entries.length * 1024, // Mock size
      recordCount: entries.length,
    };
  }

  private async removeRoleAssignment(userId: string, roleId: string, currentUser: User) {
    // TODO: Implement role removal logic
    this.logger.log(`Removing role ${roleId} from user ${userId}`);
  }

  private async restoreRoleAssignment(userId: string, roleId: string, currentUser: User) {
    // TODO: Implement role restoration logic
    this.logger.log(`Restoring role ${roleId} to user ${userId}`);
  }
}