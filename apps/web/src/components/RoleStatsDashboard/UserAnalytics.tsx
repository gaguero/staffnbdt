import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { UserBehaviorMetrics, DashboardFilters } from '../../types/roleStats';

interface UserAnalyticsProps {
  data?: UserBehaviorMetrics;
  realTimeData?: {
    activeUsers: number;
    recentAssignments: number;
    systemLoad: number;
    alertsCount: number;
  };
  isLoading: boolean;
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
}

const UserAnalytics: React.FC<UserAnalyticsProps> = ({
  data,
  realTimeData,
  isLoading
}) => {
  const [viewType, setViewType] = useState<'behavior' | 'patterns' | 'satisfaction'>('behavior');

  // Process assignment patterns for heatmap
  const assignmentHeatmapData = useMemo(() => {
    if (!data?.assignmentPatterns) return [];
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return days.map(day => {
      const dayData = { day };
      hours.forEach(hour => {
        const pattern = data.assignmentPatterns.find(p => 
          p.dayOfWeek === days.indexOf(day) && p.timeOfDay === hour
        );
        dayData[`hour${hour}`] = pattern ? pattern.assignmentCount : 0;
      });
      return dayData;
    });
  }, [data?.assignmentPatterns]);

  // Most active assigners chart data
  const assignersChartData = useMemo(() => {
    return data?.mostActiveAssigners?.map(assigner => ({
      name: assigner.name,
      assignments: assigner.assignmentsCount,
      avgTime: assigner.avgTimeToAssign
    })) || [];
  }, [data?.mostActiveAssigners]);

  // Role popularity data
  const rolePopularityData = useMemo(() => {
    return data?.rolePopularity?.map((role, index) => ({
      ...role,
      fill: `hsl(${(index * 45) % 360}, 70%, 50%)`
    })) || [];
  }, [data?.rolePopularity]);

  // Statistics calculations
  const stats = useMemo(() => {
    if (!data) return { totalAssigners: 0, avgAssignmentTime: 0, topRole: 'N/A', fulfillmentRate: 0 };
    
    const totalAssigners = data.mostActiveAssigners?.length || 0;
    const avgAssignmentTime = data.mostActiveAssigners?.length > 0 
      ? Math.round(data.mostActiveAssigners.reduce((sum, a) => sum + a.avgTimeToAssign, 0) / totalAssigners)
      : 0;
    
    const topRole = data.rolePopularity?.length > 0 
      ? data.rolePopularity[0].roleName 
      : 'N/A';
    
    const avgFulfillmentRate = data.rolePopularity?.length > 0
      ? Math.round(data.rolePopularity.reduce((sum, r) => sum + r.fulfillmentRate, 0) / data.rolePopularity.length)
      : 0;

    return {
      totalAssigners,
      avgAssignmentTime,
      topRole,
      fulfillmentRate: avgFulfillmentRate
    };
  }, [data]);

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
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{realTimeData?.activeUsers || 0}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserPlusIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalAssigners}</div>
          <div className="text-sm text-gray-600">Active Assigners</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.avgAssignmentTime}h</div>
          <div className="text-sm text-gray-600">Avg Assignment Time</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.fulfillmentRate}%</div>
          <div className="text-sm text-gray-600">Fulfillment Rate</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewType('behavior')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'behavior' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            User Behavior
          </button>
          <button
            onClick={() => setViewType('patterns')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'patterns' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Assignment Patterns
          </button>
          <button
            onClick={() => setViewType('satisfaction')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'satisfaction' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Role Popularity
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewType === 'behavior' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Active Assigners */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Most Active Assigners</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignersChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value, name) => [
                      value,
                      name === 'assignments' ? 'Assignments' : 'Avg Time (hours)'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="assignments" fill="#3B82F6" name="Assignments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assignment Time vs Count Scatter */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Assignment Efficiency</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={assignersChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="avgTime" 
                    name="Avg Time (hours)"
                    label={{ value: 'Average Time (hours)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="assignments" 
                    name="Assignments"
                    label={{ value: 'Assignments', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      value,
                      name === 'assignments' ? 'Assignments' : 'Avg Time (hours)'
                    ]}
                    labelFormatter={(label) => `User: ${label}`}
                  />
                  <Scatter dataKey="assignments" fill="#10B981" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewType === 'patterns' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Assignment Activity Heatmap</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Shows when role assignments are most commonly made throughout the week
            </p>
          </div>
          
          {/* Custom Heatmap */}
          <div className="space-y-2">
            <div className="flex text-xs text-gray-500 mb-2">
              <div className="w-12"></div>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="w-6 text-center">
                  {i % 6 === 0 ? i : ''}
                </div>
              ))}
            </div>
            
            {assignmentHeatmapData.map((dayData, dayIndex) => {
              const maxCount = Math.max(...Object.values(dayData).slice(1) as number[]);
              
              return (
                <div key={dayData.day} className="flex items-center">
                  <div className="w-12 text-xs text-gray-700 text-right pr-2">
                    {dayData.day}
                  </div>
                  <div className="flex">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const count = dayData[`hour${hour}`] as number || 0;
                      const intensity = maxCount > 0 ? count / maxCount : 0;
                      
                      return (
                        <div
                          key={hour}
                          className="w-6 h-6 border border-gray-200 cursor-pointer hover:border-gray-400"
                          style={{
                            backgroundColor: intensity > 0 
                              ? `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`
                              : '#f9fafb'
                          }}
                          title={`${dayData.day} ${hour}:00 - ${count} assignments`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Less activity</span>
            <div className="flex space-x-1">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map(intensity => (
                <div
                  key={intensity}
                  className="w-3 h-3 border border-gray-200"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`
                  }}
                />
              ))}
            </div>
            <span>More activity</span>
          </div>
        </div>
      )}

      {viewType === 'satisfaction' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Role Popularity Pie Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Role Request Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rolePopularityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ roleName, requestCount }) => `${roleName}: ${requestCount}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="requestCount"
                  >
                    {rolePopularityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fulfillment Rate Bar Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Role Fulfillment Rates</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rolePopularityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="roleName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Fulfillment Rate']}
                  />
                  <Bar 
                    dataKey="fulfillmentRate" 
                    fill="#10B981"
                    name="Fulfillment Rate (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Table */}
      {data?.mostActiveAssigners && data.mostActiveAssigners.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">User Activity Details</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Assignments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Time to Assign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.mostActiveAssigners.map((assigner, index) => {
                  const efficiency = assigner.avgTimeToAssign < 2 ? 'High' : 
                                   assigner.avgTimeToAssign < 8 ? 'Medium' : 'Low';
                  const efficiencyColor = efficiency === 'High' ? 'text-green-600 bg-green-100' :
                                        efficiency === 'Medium' ? 'text-yellow-600 bg-yellow-100' :
                                        'text-red-600 bg-red-100';
                  
                  return (
                    <tr key={assigner.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {assigner.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {assigner.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assigner.assignmentsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assigner.avgTimeToAssign} hours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${efficiencyColor}`}>
                          {efficiency}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAnalytics;