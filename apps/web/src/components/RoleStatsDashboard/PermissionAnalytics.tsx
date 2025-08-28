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
  Cell,
  PieChart,
  Pie,
  Treemap
} from 'recharts';
import {
  Shield as ShieldCheckIcon,
  AlertCircle as ExclamationCircleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon
} from 'lucide-react';
import { PermissionUsageData, HeatmapData, DashboardFilters } from '../../types/roleStats';

interface PermissionAnalyticsProps {
  data?: {
    usage: PermissionUsageData[];
    coverage: HeatmapData;
    gaps: string[];
  };
  permissionData?: any;
  isLoading: boolean;
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
}

const PermissionAnalytics: React.FC<PermissionAnalyticsProps> = ({
  data,
  isLoading,
  filters: _filters,
  onFiltersChange: _onFiltersChange,
  permissionData: _permissionData
}) => {
  const [viewType, setViewType] = useState<'usage' | 'coverage' | 'gaps'>('usage');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [intensityFilter, setIntensityFilter] = useState<string>('all');

  // Colors for different intensities
  const intensityColors = {
    high: '#10B981',
    medium: '#F59E0B', 
    low: '#6B7280',
    unused: '#EF4444'
  };

  // Process permission usage data
  const processedUsageData = useMemo(() => {
    if (!data?.usage) return [];
    
    return data.usage
      .filter(permission => {
        if (resourceFilter !== 'all' && permission.resource !== resourceFilter) return false;
        if (intensityFilter !== 'all' && permission.intensity !== intensityFilter) return false;
        return true;
      })
      .sort((a, b) => b.usageCount - a.usageCount);
  }, [data?.usage, resourceFilter, intensityFilter]);

  // Get unique resources for filtering
  const resources = useMemo(() => {
    if (!data?.usage) return [];
    return [...new Set(data.usage.map(p => p.resource))];
  }, [data?.usage]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data?.usage) return { total: 0, used: 0, unused: 0, coverage: 0 };
    
    const total = data.usage.length;
    const used = data.usage.filter(p => p.usageCount > 0).length;
    const unused = total - used;
    const coverage = total > 0 ? Math.round((used / total) * 100) : 0;

    return { total, used, unused, coverage };
  }, [data?.usage]);

  // Prepare data for resource distribution chart
  const resourceDistribution = useMemo(() => {
    if (!data?.usage) return [];
    
    const distribution = data.usage.reduce((acc, permission) => {
      const resource = permission.resource;
      if (!acc[resource]) {
        acc[resource] = { resource, total: 0, used: 0, unused: 0 };
      }
      acc[resource].total += 1;
      if (permission.usageCount > 0) {
        acc[resource].used += 1;
      } else {
        acc[resource].unused += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(distribution);
  }, [data?.usage]);

  // Prepare intensity distribution for pie chart
  const intensityDistribution = useMemo(() => {
    if (!data?.usage) return [];
    
    const distribution = data.usage.reduce((acc, permission) => {
      const intensity = permission.intensity;
      acc[intensity] = (acc[intensity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([intensity, count]) => ({
      name: intensity,
      value: count,
      fill: intensityColors[intensity as keyof typeof intensityColors] || '#6B7280'
    }));
  }, [data?.usage]);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!data?.coverage?.matrix) return [];
    
    return data.coverage.matrix.map(item => ({
      ...item,
      color: item.value > 80 ? '#10B981' :
             item.value > 60 ? '#F59E0B' :
             item.value > 40 ? '#F97316' :
             '#EF4444'
    }));
  }, [data?.coverage]);

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
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Permissions</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.used}</div>
          <div className="text-sm text-gray-600">Active Permissions</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.unused}</div>
          <div className="text-sm text-gray-600">Unused Permissions</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.coverage}%</div>
          <div className="text-sm text-gray-600">Coverage Rate</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('usage')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'usage' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Usage Analysis
            </button>
            <button
              onClick={() => setViewType('coverage')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'coverage' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Coverage Heatmap
            </button>
            <button
              onClick={() => setViewType('gaps')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'gaps' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Permission Gaps
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Resources</option>
                {resources.map(resource => (
                  <option key={resource} value={resource}>{resource}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intensity</label>
              <select
                value={intensityFilter}
                onChange={(e) => setIntensityFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Intensities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="unused">Unused</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewType === 'usage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resource Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Permission Distribution by Resource</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="resource" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="used" stackId="a" fill="#10B981" name="Used" />
                  <Bar dataKey="unused" stackId="a" fill="#EF4444" name="Unused" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Intensity Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Usage Intensity Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intensityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {intensityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewType === 'coverage' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Permission Coverage Heatmap</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={heatmapData}
                dataKey="value"
                stroke="#fff"
                fill="#8884d8"
              />
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span>High Coverage (80%+)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span>Medium Coverage (60-80%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
              <span>Low Coverage (40-60%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span>Poor Coverage (&lt;40%)</span>
            </div>
          </div>
        </div>
      )}

      {viewType === 'gaps' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Permission Gaps Analysis</h3>
          
          {data?.gaps && data.gaps.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <h4 className="text-sm font-medium text-yellow-800">
                    Found {data.gaps.length} permission gaps
                  </h4>
                </div>
                <p className="text-sm text-yellow-700">
                  These permissions may be missing from your role definitions, potentially limiting user functionality.
                </p>
              </div>

              <div className="space-y-3">
                {data.gaps.map((gap, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">{gap}</div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Permission Gaps Found</h4>
              <p className="text-gray-600">
                Your permission coverage looks complete. All critical permissions appear to be assigned.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Permission Usage Table */}
      {viewType === 'usage' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Permission Usage Details</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles Using
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intensity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedUsageData.map((permission) => (
                  <tr key={permission.permissionId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {permission.action}.{permission.scope}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {permission.resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {permission.usageCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {permission.rolesUsingIt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        permission.intensity === 'high' ? 'bg-green-100 text-green-800' :
                        permission.intensity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        permission.intensity === 'low' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {permission.intensity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permission.lastUsed ? new Date(permission.lastUsed).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionAnalytics;