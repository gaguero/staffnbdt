import {
  RoleHistoryFilter,
  RoleHistoryResponse,
  RoleHistoryAnalytics,
  HistoryExportOptions,
  ExportResult,
  RollbackOperation,
  RollbackResult,
  UserRoleHistoryProps,
  RoleAssignmentHistoryProps,
  AdminActivityHistoryProps,
} from '../types/roleHistory';
import { apiClient } from './api';

class RoleHistoryService {
  private baseURL = '/api/roles/history';

  /**
   * Get role assignment history with filtering and pagination
   */
  async getHistory(filters: RoleHistoryFilter = {}): Promise<RoleHistoryResponse> {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get(`${this.baseURL}?${params}`);
    return response.data;
  }

  /**
   * Get role assignment history for a specific user
   */
  async getUserRoleHistory(options: UserRoleHistoryProps): Promise<{
    userId: string;
    entries: any[];
    total: number;
    enableRollback: boolean;
  }> {
    const { userId, ...params } = options;
    const queryParams = new URLSearchParams();
    
    if (params.showPermissionChanges !== undefined) {
      queryParams.append('showPermissionChanges', params.showPermissionChanges.toString());
    }
    if (params.enableRollback !== undefined) {
      queryParams.append('enableRollback', params.enableRollback.toString());
    }
    if (params.maxEntries !== undefined) {
      queryParams.append('maxEntries', params.maxEntries.toString());
    }

    const response = await apiClient.get(`${this.baseURL}/user/${userId}?${queryParams}`);
    return response.data;
  }

  /**
   * Get assignment history for a specific role
   */
  async getRoleAssignmentHistory(options: RoleAssignmentHistoryProps): Promise<{
    roleId: string;
    entries: any[];
    total: number;
    userCount: number;
  }> {
    const { roleId, ...params } = options;
    const queryParams = new URLSearchParams();
    
    if (params.showUserDetails !== undefined) {
      queryParams.append('showUserDetails', params.showUserDetails.toString());
    }
    if (params.groupByTimeframe !== undefined) {
      queryParams.append('groupByTimeframe', params.groupByTimeframe.toString());
    }
    if (params.maxEntries !== undefined) {
      queryParams.append('maxEntries', params.maxEntries.toString());
    }

    const response = await apiClient.get(`${this.baseURL}/role/${roleId}/assignments?${queryParams}`);
    return response.data;
  }

  /**
   * Get administrator activity history
   */
  async getAdminActivityHistory(options: AdminActivityHistoryProps = {}): Promise<{
    adminId: string;
    entries: any[];
    total: number;
    impactMetrics?: any;
    suspiciousPatterns?: any[];
  }> {
    const { adminId, ...params } = options;
    const queryParams = new URLSearchParams();
    
    if (params.showImpactMetrics !== undefined) {
      queryParams.append('showImpactMetrics', params.showImpactMetrics.toString());
    }
    if (params.showSuspiciousActivity !== undefined) {
      queryParams.append('showSuspiciousActivity', params.showSuspiciousActivity.toString());
    }
    if (params.maxEntries !== undefined) {
      queryParams.append('maxEntries', params.maxEntries.toString());
    }

    const endpoint = adminId 
      ? `${this.baseURL}/admin/${adminId}/activity`
      : `${this.baseURL}/admin/activity`;

    const response = await apiClient.get(`${endpoint}?${queryParams}`);
    return response.data;
  }

  /**
   * Get role history analytics and trends
   */
  async getAnalytics(): Promise<RoleHistoryAnalytics> {
    const response = await apiClient.get(`${this.baseURL}/analytics`);
    return response.data;
  }

  /**
   * Get history timeline for specific timeframe
   */
  async getHistoryTimeline(timeframe: string, filters: RoleHistoryFilter = {}): Promise<{
    timeframe: string;
    timeline: any[];
    summary: any;
    total: number;
  }> {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get(`${this.baseURL}/timeline/${timeframe}?${params}`);
    return response.data;
  }

  /**
   * Get bulk operations history
   */
  async getBulkOperationsHistory(filters: RoleHistoryFilter = {}): Promise<RoleHistoryResponse> {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get(`${this.baseURL}/bulk-operations?${params}`);
    return response.data;
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(): Promise<{
    reportType: string;
    generatedAt: Date;
    generatedBy: any;
    compliance: any;
    recommendations: any[];
    auditTrail: boolean;
  }> {
    const response = await apiClient.get(`${this.baseURL}/compliance-report`);
    return response.data;
  }

  /**
   * Search role assignment history
   */
  async searchHistory(filters: RoleHistoryFilter): Promise<RoleHistoryResponse & {
    searchTerm?: string;
    searchResults: boolean;
    relevanceScored: boolean;
  }> {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get(`${this.baseURL}/search?${params}`);
    return response.data;
  }

  /**
   * Export role assignment history
   */
  async exportHistory(options: HistoryExportOptions): Promise<ExportResult> {
    const response = await apiClient.post(`${this.baseURL}/export`, options, {
      responseType: 'json',
    });
    return response.data;
  }

  /**
   * Rollback a role assignment operation
   */
  async rollbackAssignment(operation: RollbackOperation): Promise<RollbackResult> {
    const response = await apiClient.post(`${this.baseURL}/rollback`, operation);
    return response.data;
  }

  /**
   * Stream real-time history updates (using Server-Sent Events)
   */
  createHistoryStream(filters: RoleHistoryFilter = {}) {
    const params = this.buildQueryParams(filters);
    const eventSource = new EventSource(`${this.baseURL}/stream?${params}`);
    
    return {
      eventSource,
      onUpdate: (callback: (entry: any) => void) => {
        eventSource.addEventListener('history-update', (event) => {
          const data = JSON.parse(event.data);
          callback(data);
        });
      },
      onError: (callback: (error: Event) => void) => {
        eventSource.onerror = callback;
      },
      close: () => {
        eventSource.close();
      },
    };
  }

  /**
   * Get history statistics for dashboard widgets
   */
  async getHistoryStats(timeRange: string = '24h'): Promise<{
    totalActions: number;
    assignmentsCount: number;
    removalsCount: number;
    bulkOperationsCount: number;
    uniqueUsers: number;
    uniqueRoles: number;
    topActions: Array<{ action: string; count: number }>;
    hourlyActivity: Array<{ hour: number; count: number }>;
  }> {
    const response = await apiClient.get(`${this.baseURL}/stats?timeRange=${timeRange}`);
    return response.data;
  }

  /**
   * Validate history filters
   */
  validateFilters(filters: RoleHistoryFilter): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Date range validation
    if (filters.dateFrom && filters.dateTo) {
      if (filters.dateFrom > filters.dateTo) {
        errors.push('Start date must be before end date');
      }
      
      const daysDiff = (filters.dateTo.getTime() - filters.dateFrom.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        warnings.push('Large date ranges may impact performance');
      }
    }

    // Entity limits
    if (filters.userIds && filters.userIds.length > 50) {
      warnings.push('Large number of users selected may impact performance');
    }

    if (filters.roleIds && filters.roleIds.length > 50) {
      warnings.push('Large number of roles selected may impact performance');
    }

    // Page validation
    if (filters.page && filters.page < 1) {
      errors.push('Page number must be greater than 0');
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 1000)) {
      errors.push('Limit must be between 1 and 1000');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters: RoleHistoryFilter): string {
    const params = new URLSearchParams();

    // Date filters
    if (filters.dateFrom) {
      params.append('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      params.append('dateTo', filters.dateTo.toISOString());
    }
    if (filters.timeRange) {
      params.append('timeRange', filters.timeRange);
    }

    // Entity filters
    if (filters.userIds && filters.userIds.length > 0) {
      filters.userIds.forEach(id => params.append('userIds', id));
    }
    if (filters.roleIds && filters.roleIds.length > 0) {
      filters.roleIds.forEach(id => params.append('roleIds', id));
    }
    if (filters.adminIds && filters.adminIds.length > 0) {
      filters.adminIds.forEach(id => params.append('adminIds', id));
    }

    // Action filters
    if (filters.actions && filters.actions.length > 0) {
      filters.actions.forEach(action => params.append('actions', action));
    }
    if (filters.sources && filters.sources.length > 0) {
      filters.sources.forEach(source => params.append('sources', source));
    }

    // Tenant filters
    if (filters.organizationIds && filters.organizationIds.length > 0) {
      filters.organizationIds.forEach(id => params.append('organizationIds', id));
    }
    if (filters.propertyIds && filters.propertyIds.length > 0) {
      filters.propertyIds.forEach(id => params.append('propertyIds', id));
    }
    if (filters.departmentIds && filters.departmentIds.length > 0) {
      filters.departmentIds.forEach(id => params.append('departmentIds', id));
    }

    // Search
    if (filters.searchTerm) {
      params.append('searchTerm', filters.searchTerm);
    }

    // Bulk operation filters
    if (filters.batchId) {
      params.append('batchId', filters.batchId);
    }
    if (filters.showBulkOperations !== undefined) {
      params.append('showBulkOperations', filters.showBulkOperations.toString());
    }
    if (filters.groupByBatch !== undefined) {
      params.append('groupByBatch', filters.groupByBatch.toString());
    }

    // Pagination
    if (filters.page !== undefined) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit !== undefined) {
      params.append('limit', filters.limit.toString());
    }

    // Sorting
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters.sortDirection) {
      params.append('sortDirection', filters.sortDirection);
    }

    return params.toString();
  }
}

export const roleHistoryService = new RoleHistoryService();