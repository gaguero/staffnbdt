import api from './api';
import {
  CloneConfiguration,
  CloneBatchConfig,
  ClonePreview,
  RoleLineage,
  CloneTemplate
} from '../types/roleDuplication';
import {
  ComprehensiveRoleAnalytics,
  DashboardFilters,
  ExportOptions
} from '../types/roleStats';

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: Permission[];
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  role: Role;
  assignedAt: Date;
  assignedBy: string;
}

export interface RoleAssignment {
  userId: string;
  roleId: string;
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
}

export interface CreateRoleInput {
  name: string;
  description: string;
  level: number;
  permissions: string[]; // Permission IDs
}

export interface UpdateRoleInput extends Partial<CreateRoleInput> {}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class RoleService {
  // Role Management
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await api.get('/roles?includeSystemRoles=true');
    return response.data;
  }

  async getRole(id: string): Promise<ApiResponse<Role>> {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  }

  async createRole(role: CreateRoleInput): Promise<ApiResponse<Role>> {
    const response = await api.post('/roles', role);
    return response.data;
  }

  async updateRole(id: string, role: UpdateRoleInput): Promise<ApiResponse<Role>> {
    const response = await api.patch(`/roles/${id}`, role);
    return response.data;
  }

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  }

  // Permission Management
  async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    const response = await api.get('/permissions');
    return response.data;
  }

  async getPermissionsByResource(): Promise<ApiResponse<Record<string, Permission[]>>> {
    const response = await api.get('/permissions/by-resource');
    return response.data;
  }

  // User Role Assignments
  async getUserRoles(userId?: string): Promise<ApiResponse<UserRole[]>> {
    const params = userId ? `?userId=${userId}` : '';
    const response = await api.get(`/user-roles${params}`);
    return response.data;
  }

  async assignRole(assignment: RoleAssignment): Promise<ApiResponse<UserRole>> {
    const response = await api.post('/user-roles', assignment);
    return response.data;
  }

  async removeUserRole(userRoleId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/user-roles/${userRoleId}`);
    return response.data;
  }

  async updateUserRole(userRoleId: string, assignment: Partial<RoleAssignment>): Promise<ApiResponse<UserRole>> {
    const response = await api.patch(`/user-roles/${userRoleId}`, assignment);
    return response.data;
  }

  // Bulk Operations
  async bulkAssignRoles(assignments: RoleAssignment[]): Promise<ApiResponse<UserRole[]>> {
    const response = await api.post('/user-roles/bulk', { assignments });
    return response.data;
  }

  async bulkRemoveRoles(userRoleIds: string[]): Promise<ApiResponse<void>> {
    const response = await api.delete('/user-roles/bulk', { data: { userRoleIds } });
    return response.data;
  }

  // Role Analytics
  async getRoleStats(): Promise<ApiResponse<{
    totalRoles: number;
    totalAssignments: number;
    assignmentsByRole: Record<string, number>;
    assignmentsByLevel: Record<string, number>;
    recentAssignments: UserRole[];
  }>> {
    const response = await api.get('/roles/stats');
    return response.data;
  }

  // Comprehensive Role Analytics
  async getComprehensiveAnalytics(filters?: DashboardFilters): Promise<ApiResponse<ComprehensiveRoleAnalytics>> {
    const params = new URLSearchParams();
    if (filters?.timeRange) {
      params.append('startDate', filters.timeRange.start.toISOString());
      params.append('endDate', filters.timeRange.end.toISOString());
    }
    if (filters?.organizationId) {
      params.append('organizationId', filters.organizationId);
    }
    if (filters?.propertyId) {
      params.append('propertyId', filters.propertyId);
    }
    if (filters?.roleTypes) {
      params.append('roleTypes', filters.roleTypes.join(','));
    }
    if (filters?.departments) {
      params.append('departments', filters.departments.join(','));
    }
    
    const response = await api.get(`/roles/analytics?${params.toString()}`);
    return response.data;
  }

  // Permission Usage Analytics
  async getPermissionAnalytics(filters?: DashboardFilters): Promise<ApiResponse<{
    usage: Array<{
      permissionId: string;
      resource: string;
      action: string;
      scope: string;
      usageCount: number;
      rolesUsingIt: number;
      lastUsed: Date;
    }>;
    coverage: any;
    gaps: string[];
  }>> {
    const params = new URLSearchParams();
    if (filters?.timeRange) {
      params.append('startDate', filters.timeRange.start.toISOString());
      params.append('endDate', filters.timeRange.end.toISOString());
    }
    
    const response = await api.get(`/permissions/analytics?${params.toString()}`);
    return response.data;
  }

  // Assignment Trends
  async getAssignmentTrends(filters?: DashboardFilters): Promise<ApiResponse<Array<{
    date: string;
    assignments: number;
    revocations: number;
    modifications: number;
    netChange: number;
  }>>> {
    const params = new URLSearchParams();
    if (filters?.timeRange) {
      params.append('startDate', filters.timeRange.start.toISOString());
      params.append('endDate', filters.timeRange.end.toISOString());
    }
    
    const response = await api.get(`/roles/trends?${params.toString()}`);
    return response.data;
  }

  // Security Metrics
  async getSecurityMetrics(filters?: DashboardFilters): Promise<ApiResponse<{
    overPrivilegedUsers: number;
    underPrivilegedUsers: number;
    redundantRoles: number;
    orphanedPermissions: number;
    riskScore: number;
    complianceScore: number;
  }>> {
    const params = new URLSearchParams();
    if (filters?.organizationId) {
      params.append('organizationId', filters.organizationId);
    }
    
    const response = await api.get(`/roles/security-metrics?${params.toString()}`);
    return response.data;
  }

  // Optimization Recommendations
  async getOptimizationRecommendations(filters?: DashboardFilters): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    impact: string;
    effort: string;
    affectedRoles: string[];
    affectedUsers: number;
    estimatedBenefit: string;
    actionItems: string[];
  }>>> {
    const params = new URLSearchParams();
    if (filters?.organizationId) {
      params.append('organizationId', filters.organizationId);
    }
    
    const response = await api.get(`/roles/optimization?${params.toString()}`);
    return response.data;
  }

  // Export Dashboard Data
  async exportDashboardData(options: ExportOptions): Promise<Blob> {
    const response = await api.post('/roles/export', options, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Permission Checking
  async checkUserPermissions(userId: string, permissions: { resource: string; action: string; scope?: string }[]): Promise<ApiResponse<{
    results: Record<string, boolean>;
    summary: {
      total: number;
      granted: number;
      denied: number;
    };
  }>> {
    const response = await api.post(`/users/${userId}/check-permissions`, { permissions });
    return response.data;
  }

  // Real-time Statistics
  async getRealTimeStats(): Promise<ApiResponse<{
    activeUsers: number;
    recentAssignments: number;
    systemLoad: number;
    alertsCount: number;
  }>> {
    const response = await api.get('/roles/realtime-stats');
    return response.data;
  }

  // Role Templates
  async getRoleTemplates(): Promise<ApiResponse<{
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
  }[]>> {
    const response = await api.get('/roles/templates');
    return response.data;
  }

  async createRoleFromTemplate(templateId: string, customizations: Partial<CreateRoleInput>): Promise<ApiResponse<Role>> {
    const response = await api.post(`/roles/from-template/${templateId}`, customizations);
    return response.data;
  }
}

export const roleService = new RoleService();
// Role cloning service extension
export const roleCloneService = {
  /**
   * Clone a single role with configuration
   */
  async cloneRole(config: CloneConfiguration): Promise<Role> {
    try {
      const response = await api.post('/roles/clone', config);
      return response.data;
    } catch (error) {
      console.error('Error cloning role:', error);
      throw error;
    }
  },

  /**
   * Batch clone multiple roles
   */
  async batchCloneRoles(config: CloneBatchConfig): Promise<Role[]> {
    try {
      const response = await api.post('/roles/batch-clone', config);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error batch cloning roles:', error);
      throw error;
    }
  },

  /**
   * Generate clone preview
   */
  async generateClonePreview(config: CloneConfiguration): Promise<ClonePreview> {
    try {
      const response = await api.post('/roles/clone-preview', config);
      return response.data;
    } catch (error) {
      console.error('Error generating clone preview:', error);
      throw error;
    }
  },

  /**
   * Get role lineage tree
   */
  async getRoleLineage(roleId: string): Promise<{
    lineage: RoleLineage;
    ancestors: RoleLineage[];
    descendants: RoleLineage[];
    siblings: RoleLineage[];
    tree: RoleLineage;
  }> {
    try {
      const response = await api.get(`/roles/${roleId}/lineage`);
      return response.data;
    } catch (error) {
      console.error('Error fetching role lineage:', error);
      throw error;
    }
  },

  /**
   * Get cloning templates
   */
  async getCloneTemplates(): Promise<CloneTemplate[]> {
    try {
      const response = await api.get('/roles/clone-templates');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching clone templates:', error);
      return [];
    }
  },

  /**
   * Save clone template
   */
  async saveCloneTemplate(template: Omit<CloneTemplate, 'id' | 'createdAt' | 'usage'>): Promise<CloneTemplate> {
    try {
      const response = await api.post('/roles/clone-templates', template);
      return response.data;
    } catch (error) {
      console.error('Error saving clone template:', error);
      throw error;
    }
  }
};

// User Role Management Service
export const userRoleService = {
  // Get user role assignments with filters
  async getUserRoles(filters?: {
    userId?: string;
    roleId?: string;
    includeExpired?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<UserRole[]>> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.roleId) params.append('roleId', filters.roleId);
    if (filters?.includeExpired !== undefined) params.append('includeExpired', String(filters.includeExpired));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));
    
    const response = await api.get(`/user-roles?${params.toString()}`);
    return response.data;
  },

  // Assign role to user
  async assignRole(assignment: {
    userId: string;
    roleId: string;
    expiresAt?: string;
    conditions?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<UserRole>> {
    const response = await api.post('/user-roles', assignment);
    return response.data;
  },

  // Remove user role assignment
  async removeUserRole(userRoleId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/user-roles/${userRoleId}`);
    return response.data;
  },

  // Bulk assign roles
  async bulkAssignRoles(assignments: {
    assignments: Array<{
      userId: string;
      roleId: string;
      expiresAt?: string;
      conditions?: Record<string, any>;
      metadata?: Record<string, any>;
    }>;
  }): Promise<ApiResponse<{
    successful: number;
    failed: number;
    errors: string[];
    assignments: UserRole[];
  }>> {
    const response = await api.post('/user-roles/bulk', assignments);
    return response.data;
  },

  // Bulk remove role assignments
  async bulkRemoveRoles(data: {
    userRoleIds: string[];
  }): Promise<ApiResponse<{
    successful: number;
    failed: number;
    errors: string[];
  }>> {
    const response = await api.delete('/user-roles/bulk', { data });
    return response.data;
  },

  // Get available roles for assignment
  async getAvailableRoles(filters?: {
    userId?: string;
    includeSystem?: boolean;
    includeAssignable?: boolean;
  }): Promise<ApiResponse<Role[]>> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.includeSystem !== undefined) params.append('includeSystem', String(filters.includeSystem));
    if (filters?.includeAssignable !== undefined) params.append('includeAssignable', String(filters.includeAssignable));
    
    const response = await api.get(`/roles?${params.toString()}`);
    return response.data;
  },

  // Validate role assignment
  async validateRoleAssignment(userId: string, roleId: string): Promise<ApiResponse<{
    isValid: boolean;
    conflicts: string[];
    warnings: string[];
    recommendations: string[];
  }>> {
    const response = await api.post('/user-roles/validate', { userId, roleId });
    return response.data;
  }
};

// Export enhanced role service with cloning and user management capabilities
export const enhancedRoleService = {
  ...roleService,
  ...roleCloneService,
  ...userRoleService
};

export default roleService;