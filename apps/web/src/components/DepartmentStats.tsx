import React, { useState, useEffect } from 'react';
import { Department } from '../services/departmentService';
import { userService } from '../services/userService';
import LoadingSpinner from './LoadingSpinner';
import PermissionGate from './PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import toast from 'react-hot-toast';

interface DepartmentStatsData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentJoins: number; // Users joined in last 30 days
  pendingInvitations: number;
  averageUsersPerDepartment: number;
  topPerformingDepartments: Array<{
    id: string;
    name: string;
    userCount: number;
    activeUserCount: number;
  }>;
  usersByRole: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  growthTrend: Array<{
    month: string;
    newUsers: number;
    totalUsers: number;
  }>;
}

interface DepartmentStatsProps {
  department?: Department;
  className?: string;
  compact?: boolean; // For smaller widgets
}

const DepartmentStats: React.FC<DepartmentStatsProps> = ({
  department,
  className = '',
  compact = false,
}) => {
  const [stats, setStats] = useState<DepartmentStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadStats();
  }, [department, timeframe]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Mock API calls - replace with actual service calls
      // const response = await analyticsService.getDepartmentStats(department?.id, timeframe);
      
      // Get all users to calculate statistics
      const usersResponse = await userService.getUsers({
        departmentId: department?.id,
        includeInactive: true,
      });
      const users = usersResponse.data?.data || [];

      // Calculate statistics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalUsers = users.length;
      const activeUsers = users.filter(user => !user.deletedAt).length;
      const inactiveUsers = totalUsers - activeUsers;
      const recentJoins = users.filter(user => 
        new Date(user.createdAt) >= thirtyDaysAgo && !user.deletedAt
      ).length;

      // Mock additional stats
      const mockStats: DepartmentStatsData = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        recentJoins,
        pendingInvitations: 3, // Mock data
        averageUsersPerDepartment: department ? totalUsers : 12.5, // Mock data
        topPerformingDepartments: department ? [] : [
          { id: '1', name: 'Human Resources', userCount: 25, activeUserCount: 24 },
          { id: '2', name: 'Engineering', userCount: 45, activeUserCount: 44 },
          { id: '3', name: 'Sales', userCount: 18, activeUserCount: 16 },
          { id: '4', name: 'Marketing', userCount: 12, activeUserCount: 12 },
          { id: '5', name: 'Finance', userCount: 8, activeUserCount: 7 },
        ],
        usersByRole: [
          { role: 'STAFF', count: Math.floor(totalUsers * 0.7), percentage: 70 },
          { role: 'DEPARTMENT_ADMIN', count: Math.floor(totalUsers * 0.2), percentage: 20 },
          { role: 'PROPERTY_MANAGER', count: Math.floor(totalUsers * 0.08), percentage: 8 },
          { role: 'ORGANIZATION_ADMIN', count: Math.floor(totalUsers * 0.02), percentage: 2 },
        ],
        growthTrend: [
          { month: 'Jan', newUsers: 8, totalUsers: 45 },
          { month: 'Feb', newUsers: 12, totalUsers: 57 },
          { month: 'Mar', newUsers: 15, totalUsers: 72 },
          { month: 'Apr', newUsers: 6, totalUsers: 78 },
          { month: 'May', newUsers: 9, totalUsers: 87 },
          { month: 'Jun', newUsers: totalUsers - 87, totalUsers: totalUsers },
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load department statistics:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role: string): string => {
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getGrowthPercentage = (): number => {
    if (!stats || stats.growthTrend.length < 2) return 0;
    const lastMonth = stats.growthTrend[stats.growthTrend.length - 1];
    const previousMonth = stats.growthTrend[stats.growthTrend.length - 2];
    if (previousMonth.totalUsers === 0) return 0;
    return ((lastMonth.totalUsers - previousMonth.totalUsers) / previousMonth.totalUsers) * 100;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading statistics..." />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">No data available</h3>
          <p className="text-gray-600">Unable to load statistics at this time</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-charcoal flex items-center">
            <span className="mr-2">📊</span>
            {department ? `${department.name} Stats` : 'Department Overview'}
          </h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-warm-gold w-full sm:w-auto"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="1y">1 year</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.activeUsers}</div>
            <div className="text-xs text-blue-800">Active Users</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.recentJoins}</div>
            <div className="text-xs text-green-800">New This Month</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate 
      commonPermission={COMMON_PERMISSIONS.MANAGE_DEPARTMENT}
      fallback={
        <div className="text-center p-8 text-gray-500">
          <div className="text-4xl mb-3">🔒</div>
          <p>You don't have permission to view department statistics.</p>
        </div>
      }
    >
      <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-lg">📊</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-charcoal">
              {department ? `${department.name} Statistics` : 'Department Analytics'}
            </h2>
            <p className="text-gray-600">
              {department ? 'Performance metrics for this department' : 'Overview of all departments'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Timeframe:</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-warm-gold"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
              <p className="text-xs text-green-600">
                ↗ {getGrowthPercentage().toFixed(1)}% growth
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
              <p className="text-xs text-gray-500">
                {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-xl">🆕</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-3xl font-bold text-orange-600">{stats.recentJoins}</p>
              <p className="text-xs text-gray-500">Recently joined</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-xl">📧</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Invites</p>
              <p className="text-3xl font-bold text-purple-600">{stats.pendingInvitations}</p>
              <p className="text-xs text-gray-500">Awaiting response</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
            <span className="mr-2">👔</span>
            Users by Role
          </h3>
          <div className="space-y-3">
            {stats.usersByRole.map((roleData) => (
              <div key={roleData.role} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-warm-gold rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {formatRole(roleData.role)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-warm-gold h-2 rounded-full"
                      style={{ width: `${roleData.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8">
                    {roleData.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Growth Trend
          </h3>
          <div className="space-y-2">
            {stats.growthTrend.map((monthData, index) => (
              <div key={monthData.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-8">{monthData.month}</span>
                <div className="flex-1 mx-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${(monthData.totalUsers / Math.max(...stats.growthTrend.map(m => m.totalUsers))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {monthData.totalUsers}
                  </div>
                  {monthData.newUsers > 0 && (
                    <div className="text-xs text-green-600">
                      +{monthData.newUsers}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Departments (only show if not viewing specific department) */}
      {!department && stats.topPerformingDepartments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
            <span className="mr-2">🏆</span>
            Top Performing Departments
          </h3>
          <div className="space-y-3">
            {stats.topPerformingDepartments.map((dept, index) => (
              <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal">{dept.name}</h4>
                    <p className="text-sm text-gray-600">
                      {dept.activeUserCount} active of {dept.userCount} total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{dept.userCount}</div>
                  <div className="text-xs text-green-600">
                    {((dept.activeUserCount / dept.userCount) * 100).toFixed(0)}% active
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
          <span className="mr-2">📋</span>
          Activity Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600 mb-1">
              {stats.averageUsersPerDepartment.toFixed(1)}
            </div>
            <div className="text-sm text-blue-800">
              {department ? 'Users in Department' : 'Avg Users/Dept'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600 mb-1">
              {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-green-800">Active Rate</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600 mb-1">
              {stats.recentJoins}
            </div>
            <div className="text-sm text-orange-800">Growth Rate</div>
          </div>
        </div>
      </div>
      </div>
    </PermissionGate>
  );
};

export default DepartmentStats;