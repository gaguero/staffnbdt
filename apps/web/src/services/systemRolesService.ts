import axios from 'axios';

export interface SystemRoleInfo {
  role: string;
  name: string;
  description: string;
  level: number;
  userType: 'INTERNAL' | 'CLIENT' | 'VENDOR';
  capabilities: string[];
  userCount: number;
  assignable: boolean;
}

export interface SystemRoleAssignment {
  userId: string;
  role: string;
  reason?: string;
}

export interface RolePermissionPreview {
  role: string;
  roleInfo: {
    name: string;
    description: string;
    level: number;
    userType: string;
    capabilities: string[];
  };
  permissions: string[];
}

export interface UserRoleHistory {
  id: string;
  userId: string;
  action: string;
  oldData: any;
  newData: any;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface RoleStatistics {
  totalUsers: number;
  roleDistribution: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  recentRoleChanges: number;
}

class SystemRolesService {
  private baseURL = '/api';

  /**
   * Get all system roles with assignability information
   */
  async getAllSystemRoles(): Promise<SystemRoleInfo[]> {
    try {
      const response = await axios.get(`${this.baseURL}/system-roles`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching system roles:', error);
      throw error;
    }
  }

  /**
   * Get information about a specific system role
   */
  async getSystemRoleInfo(role: string): Promise<SystemRoleInfo> {
    try {
      const response = await axios.get(`${this.baseURL}/system-roles/${role}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching system role info:', error);
      throw error;
    }
  }

  /**
   * Get all users with a specific system role
   */
  async getUsersByRole(role: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/system-roles/${role}/users`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  /**
   * Preview permissions for a system role
   */
  async previewRolePermissions(role: string): Promise<RolePermissionPreview> {
    try {
      const response = await axios.get(`${this.baseURL}/system-roles/${role}/permissions`);
      return response.data.data;
    } catch (error) {
      console.error('Error previewing role permissions:', error);
      throw error;
    }
  }

  /**
   * Assign system role to user
   */
  async assignSystemRole(assignment: SystemRoleAssignment): Promise<any> {
    try {
      const response = await axios.post(`${this.baseURL}/system-roles/assign`, assignment);
      return response.data.data;
    } catch (error) {
      console.error('Error assigning system role:', error);
      throw error;
    }
  }

  /**
   * Bulk assign system roles to multiple users
   */
  async bulkAssignSystemRoles(assignments: SystemRoleAssignment[], reason?: string): Promise<{
    successful: any[];
    failed: Array<{ userId: string; error: string }>;
  }> {
    try {
      const response = await axios.post(`${this.baseURL}/system-roles/assign/bulk`, {
        assignments,
        reason
      });
      return response.data.data;
    } catch (error) {
      console.error('Error bulk assigning system roles:', error);
      throw error;
    }
  }

  /**
   * Get role statistics and analytics
   */
  async getRoleStatistics(): Promise<RoleStatistics> {
    try {
      const response = await axios.get(`${this.baseURL}/system-roles/statistics`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching role statistics:', error);
      throw error;
    }
  }

  /**
   * Get role assignment history for a user
   */
  async getUserRoleHistory(userId: string): Promise<UserRoleHistory[]> {
    try {
      const response = await axios.get(`${this.baseURL}/users/${userId}/role-history`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching user role history:', error);
      throw error;
    }
  }

  /**
   * Get user's current effective permissions
   */
  async getUserPermissions(userId: string): Promise<{
    userId: string;
    systemRole: string;
    roleInfo: any;
    permissions: string[];
    customRoles: any[];
    lastUpdated: string;
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/users/${userId}/permissions`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }

  /**
   * Refresh user permissions cache
   */
  async refreshUserPermissions(userId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseURL}/users/${userId}/permissions/refresh`);
      return response.data.data;
    } catch (error) {
      console.error('Error refreshing user permissions:', error);
      throw error;
    }
  }

  /**
   * Change user's system role (enhanced version)
   */
  async changeUserRole(userId: string, role: string, reason?: string): Promise<any> {
    try {
      const response = await axios.patch(`${this.baseURL}/users/${userId}/role`, {
        role,
        reason
      });
      return response.data.data;
    } catch (error) {
      console.error('Error changing user role:', error);
      throw error;
    }
  }
}

export const systemRolesService = new SystemRolesService();
export default systemRolesService;