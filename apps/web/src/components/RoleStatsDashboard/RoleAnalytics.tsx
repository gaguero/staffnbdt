import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  BarChart3 as ChartBarIcon,
  Users as UserGroupIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Eye as EyeIcon
} from 'lucide-react';
import { RoleUsageData, AssignmentTrendData, DashboardFilters } from '../../types/roleStats';

interface RoleAnalyticsProps {
  data?: {
    usage: RoleUsageData[];
    trends: AssignmentTrendData[];
    distribution: Record<string, number>;
  };
  trends?: AssignmentTrendData[];
  isLoading: boolean;
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
}

const RoleAnalytics: React.FC<RoleAnalyticsProps> = ({
  data,
  trends,
  isLoading
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('bar');
  const [sortBy, setSortBy] = useState<'userCount' | 'level' | 'permissions'>('userCount');

  // Colors for charts
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Prepare role usage data for charts
  const roleUsageChartData = data?.usage?.map((role, index) => ({
    name: role.roleName,
    userCount: role.userCount,
    permissions: role.permissions,
    level: role.level,
    fill: colors[index % colors.length]
  })) || [];

  // Sort data based on selected criteria
  const sortedRoleData = [...roleUsageChartData].sort((a, b) => {
    switch (sortBy) {
      case 'userCount':
        return b.userCount - a.userCount;
      case 'level':
        return b.level - a.level;
      case 'permissions':
        return b.permissions - a.permissions;
      default:
        return b.userCount - a.userCount;
    }
  });

  // Prepare trend data
  const trendChartData = trends?.map(trend => ({
    date: new Date(trend.date).toLocaleDateString(),
    assignments: trend.assignments,
    revocations: trend.revocations,
    netChange: trend.netChange
  })) || [];

  // Calculate statistics
  const totalRoles = roleUsageChartData.length;
  const activeRoles = roleUsageChartData.filter(role => role.userCount > 0).length;
  const mostUsedRole = roleUsageChartData.reduce((max, role) => 
    role.userCount > max.userCount ? role : max, { userCount: 0, name: 'None' });
  
  const averageAssignments = roleUsageChartData.length > 0 
    ? Math.round(roleUsageChartData.reduce((sum, role) => sum + role.userCount, 0) / totalRoles)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalRoles}</div>
          <div className="text-sm text-gray-600">Total Roles</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeRoles}</div>
          <div className="text-sm text-gray-600">Active Roles</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{averageAssignments}</div>
          <div className="text-sm text-gray-600">Avg Assignments</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <EyeIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 truncate" title={mostUsedRole.name}>
            {mostUsedRole.name}
          </div>
          <div className="text-sm text-gray-600">Most Used Role</div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'pie' | 'bar' | 'line')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'userCount' | 'level' | 'permissions')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="userCount">User Count</option>
                <option value="level">Role Level</option>
                <option value="permissions">Permissions</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Role Usage Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Role Usage Distribution</h3>
          <div className="text-sm text-gray-500">
            Sorted by {sortBy.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={sortedRoleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="userCount"
                >
                  {sortedRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : chartType === 'bar' ? (
              <BarChart data={sortedRoleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value,
                    name === 'userCount' ? 'Users' : 
                    name === 'permissions' ? 'Permissions' : 
                    name === 'level' ? 'Level' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="userCount" fill="#3B82F6" name="Users" />
                <Bar dataKey="permissions" fill="#10B981" name="Permissions" />
              </BarChart>
            ) : (
              <LineChart data={sortedRoleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="userCount" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="permissions" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assignment Trends */}
      {trendChartData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Assignment Trends</h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="assignments" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                  name="Assignments"
                />
                <Area 
                  type="monotone" 
                  dataKey="revocations" 
                  stackId="1" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.6}
                  name="Revocations"
                />
                <Line 
                  type="monotone" 
                  dataKey="netChange" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Net Change"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Role Details Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Role Details</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.usage?.map((role, index) => (
                <tr key={role.roleId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></div>
                      <div className="text-sm font-medium text-gray-900">
                        {role.roleName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Level {role.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {role.userCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {role.permissions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center ${
                      role.trend === 'up' ? 'text-green-600' :
                      role.trend === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {role.trend === 'up' ? (
                        <TrendingUpIcon className="h-4 w-4 mr-1" />
                      ) : role.trend === 'down' ? (
                        <TrendingDownIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <div className="h-4 w-4 mr-1 bg-gray-400 rounded-full"></div>
                      )}
                      <span className="text-xs font-medium capitalize">{role.trend}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(role.lastAssignment).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleAnalytics;