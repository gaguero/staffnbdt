import React from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { AnalyticsMetrics, DashboardFilters } from '../../types/roleStats';

interface ExecutiveSummaryProps {
  data?: AnalyticsMetrics;
  analytics?: any;
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

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  data,
  analytics,
  realTimeData,
  isLoading
}) => {
  // Calculate health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // KPI Cards data
  const kpiCards = [
    {
      title: 'System Health Score',
      value: analytics?.healthScore ? `${Math.round(analytics.healthScore)}%` : 'N/A',
      change: '+2.1%',
      trend: 'up',
      icon: CheckCircleIcon,
      color: analytics?.healthScore ? getHealthScoreColor(analytics.healthScore) : 'text-gray-600 bg-gray-100',
      description: 'Overall system effectiveness'
    },
    {
      title: 'Role Coverage',
      value: data ? `${Math.round(data.roleCoverage * 100)}%` : 'N/A',
      change: '+5.3%',
      trend: 'up',
      icon: UserGroupIcon,
      color: 'text-blue-600 bg-blue-100',
      description: 'Users with appropriate roles'
    },
    {
      title: 'Permission Utilization',
      value: data ? `${Math.round(data.permissionUtilization * 100)}%` : 'N/A',
      change: '-1.2%',
      trend: 'down',
      icon: ShieldCheckIcon,
      color: 'text-purple-600 bg-purple-100',
      description: 'Active vs inactive permissions'
    },
    {
      title: 'Security Score',
      value: data ? `${Math.round(data.securityScore * 100)}%` : 'N/A',
      change: '+0.8%',
      trend: 'up',
      icon: ExclamationTriangleIcon,
      color: data?.securityScore && data.securityScore >= 0.8 
        ? 'text-green-600 bg-green-100' 
        : data?.securityScore && data.securityScore >= 0.6
        ? 'text-yellow-600 bg-yellow-100'
        : 'text-red-600 bg-red-100',
      description: 'Risk assessment score'
    }
  ];

  // Real-time metrics
  const realTimeMetrics = [
    {
      label: 'Active Users',
      value: realTimeData?.activeUsers || 0,
      icon: '👥',
      color: 'text-green-600'
    },
    {
      label: 'Recent Assignments',
      value: realTimeData?.recentAssignments || 0,
      icon: '📋',
      color: 'text-blue-600'
    },
    {
      label: 'System Load',
      value: `${realTimeData?.systemLoad || 0}%`,
      icon: '⚡',
      color: realTimeData?.systemLoad && realTimeData.systemLoad > 80 ? 'text-red-600' : 'text-green-600'
    },
    {
      label: 'Active Alerts',
      value: realTimeData?.alertsCount || 0,
      icon: '🚨',
      color: realTimeData?.alertsCount && realTimeData.alertsCount > 0 ? 'text-red-600' : 'text-gray-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUpIcon : TrendingDownIcon;
          
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center text-sm ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="h-4 w-4 mr-1" />
                  {kpi.change}
                </div>
              </div>
              
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {kpi.value}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {kpi.title}
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                {kpi.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Real-time Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Real-time Status</h3>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live data
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {realTimeMetrics.map((metric, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-1">{metric.icon}</div>
              <div className={`text-xl font-bold ${metric.color} mb-1`}>
                {metric.value}
              </div>
              <div className="text-xs text-gray-600">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      {analytics?.topInsights && analytics.topInsights.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-3">
            {analytics.topInsights.map((insight: any, index: number) => (
              <div 
                key={index} 
                className={`flex items-start p-3 rounded-lg ${
                  insight.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                  'bg-blue-50 border-l-4 border-blue-400'
                }`}
              >
                <div className={`mr-3 ${
                  insight.type === 'error' ? 'text-red-600' :
                  insight.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {insight.type === 'error' ? '🔴' : insight.type === 'warning' ? '🟡' : '🔵'}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    insight.type === 'error' ? 'text-red-800' :
                    insight.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {insight.message}
                  </div>
                  {insight.action && (
                    <div className={`text-sm mt-1 ${
                      insight.type === 'error' ? 'text-red-700' :
                      insight.type === 'warning' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      Recommended: {insight.action}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Efficiency */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Role Efficiency</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Active Roles</span>
              <span>{analytics?.roleEfficiency || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (analytics?.roleEfficiency || 0) >= 80 ? 'bg-green-500' :
                  (analytics?.roleEfficiency || 0) >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${analytics?.roleEfficiency || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Percentage of roles actively assigned to users
          </div>
        </div>

        {/* Assignment Velocity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assignment Velocity</h3>
            <TrendingUpIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="mb-4">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analytics?.assignmentVelocity || 0}
            </div>
            <div className="text-sm text-gray-600">
              assignments per day
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Average daily role assignments over selected period
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="btn btn-outline text-sm py-2">
            📊 View Detailed Reports
          </button>
          <button className="btn btn-outline text-sm py-2">
            🔍 Run Security Audit
          </button>
          <button className="btn btn-outline text-sm py-2">
            ⚡ Optimize Roles
          </button>
          <button className="btn btn-outline text-sm py-2">
            📈 Export Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;