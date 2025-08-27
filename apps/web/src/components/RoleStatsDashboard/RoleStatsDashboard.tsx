import React, { useState, useMemo } from 'react';
import { 
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useDashboardData, useAnalyticsCalculations } from '../../hooks/useRoleAnalytics';
import { DashboardFilters } from '../../types/roleStats';
import LoadingSpinner from '../LoadingSpinner';
import ExecutiveSummary from './ExecutiveSummary';
import RoleAnalytics from './RoleAnalytics';
import PermissionAnalytics from './PermissionAnalytics';
import UserAnalytics from './UserAnalytics';
import SecurityDashboard from './SecurityDashboard';
import OptimizationPanel from './OptimizationPanel';
import TimeRangeFilter from './filters/TimeRangeFilter';
import PropertyFilter from './filters/PropertyFilter';
import RoleFilter from './filters/RoleFilter';

interface RoleStatsDashboardProps {
  className?: string;
}

type DashboardSection = 'executive' | 'roles' | 'permissions' | 'users' | 'security' | 'optimization';

const RoleStatsDashboard: React.FC<RoleStatsDashboardProps> = ({
  className = ''
}) => {
  // State management
  const [activeSection, setActiveSection] = useState<DashboardSection>('executive');
  const [filters, setFilters] = useState<DashboardFilters>({
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date(),
      preset: 'month'
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data hooks
  const {
    comprehensive,
    permissions,
    trends,
    security,
    optimization,
    realTime,
    isLoading,
    hasError,
    refetch
  } = useDashboardData(filters);

  // Analytics calculations
  const analytics = useAnalyticsCalculations(comprehensive);

  // Section definitions
  const sections = [
    {
      id: 'executive' as DashboardSection,
      name: 'Executive Summary',
      icon: ChartBarIcon,
      description: 'High-level KPIs and system health',
      badge: analytics?.healthScore ? `${Math.round(analytics.healthScore)}%` : undefined,
      badgeColor: analytics?.healthScore 
        ? analytics.healthScore >= 80 ? 'green' 
          : analytics.healthScore >= 60 ? 'yellow' 
          : 'red'
        : 'gray'
    },
    {
      id: 'roles' as DashboardSection,
      name: 'Role Analytics',
      icon: UsersIcon,
      description: 'Role usage and effectiveness',
      badge: comprehensive?.roleAnalytics?.usage?.length?.toString(),
      badgeColor: 'blue'
    },
    {
      id: 'permissions' as DashboardSection,
      name: 'Permission Analytics',
      icon: ShieldCheckIcon,
      description: 'Permission utilization and coverage',
      badge: analytics?.permissionCoverage ? `${analytics.permissionCoverage}%` : undefined,
      badgeColor: analytics?.permissionCoverage 
        ? analytics.permissionCoverage >= 80 ? 'green' 
          : analytics.permissionCoverage >= 60 ? 'yellow' 
          : 'red'
        : 'gray'
    },
    {
      id: 'users' as DashboardSection,
      name: 'User Analytics',
      icon: UsersIcon,
      description: 'User behavior and patterns',
      badge: realTime?.activeUsers?.toString(),
      badgeColor: 'purple'
    },
    {
      id: 'security' as DashboardSection,
      name: 'Security Dashboard',
      icon: ExclamationTriangleIcon,
      description: 'Risk assessment and compliance',
      badge: analytics?.riskLevel === 'high' ? 'HIGH' : analytics?.riskLevel === 'medium' ? 'MED' : 'LOW',
      badgeColor: analytics?.riskLevel === 'high' ? 'red' : analytics?.riskLevel === 'medium' ? 'yellow' : 'green'
    },
    {
      id: 'optimization' as DashboardSection,
      name: 'Optimization',
      icon: CogIcon,
      description: 'Improvement recommendations',
      badge: optimization?.length?.toString(),
      badgeColor: optimization?.length && optimization.length > 0 ? 'orange' : 'gray'
    }
  ];

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render section content
  const renderSectionContent = () => {
    const commonProps = {
      filters,
      onFiltersChange: handleFiltersChange,
    };

    switch (activeSection) {
      case 'executive':
        return (
          <ExecutiveSummary
            data={comprehensive?.executiveSummary}
            analytics={analytics}
            realTimeData={realTime}
            isLoading={isLoading}
            {...commonProps}
          />
        );
      
      case 'roles':
        return (
          <RoleAnalytics
            data={comprehensive?.roleAnalytics}
            trends={trends}
            isLoading={isLoading}
            {...commonProps}
          />
        );
      
      case 'permissions':
        return (
          <PermissionAnalytics
            data={comprehensive?.permissionAnalytics}
            permissionData={permissions}
            isLoading={isLoading}
            {...commonProps}
          />
        );
      
      case 'users':
        return (
          <UserAnalytics
            data={comprehensive?.userAnalytics}
            realTimeData={realTime}
            isLoading={isLoading}
            {...commonProps}
          />
        );
      
      case 'security':
        return (
          <SecurityDashboard
            data={comprehensive?.securityDashboard}
            securityData={security}
            analytics={analytics}
            isLoading={isLoading}
            {...commonProps}
          />
        );
      
      case 'optimization':
        return (
          <OptimizationPanel
            data={comprehensive?.optimizationRecommendations}
            optimizationData={optimization}
            analytics={analytics}
            isLoading={isLoading}
            {...commonProps}
          />
        );
      
      default:
        return <div>Section not found</div>;
    }
  };

  // Loading state
  if (isLoading && !comprehensive) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading analytics dashboard..." />
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Failed to load dashboard data</h3>
            <p className="text-red-700 mt-1">
              There was an error loading the analytics data. Please try refreshing the page.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-outline-red"
          >
            {isRefreshing ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Retry
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Statistics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for your role management system
          </p>
        </div>
        
        {/* Global controls */}
        <div className="flex items-center gap-3">
          {realTime && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live data
            </div>
          )}
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-outline"
            title="Refresh dashboard data"
          >
            <ArrowPathIcon 
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>
      </div>

      {/* Real-time alerts */}
      {analytics?.topInsights && analytics.topInsights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Key Insights</h3>
              <div className="space-y-2">
                {analytics.topInsights.slice(0, 2).map((insight, index) => (
                  <div key={index} className="text-sm text-blue-700">
                    <span className="font-medium">{insight.message}</span>
                    {insight.action && (
                      <span className="text-blue-600"> - {insight.action}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <TimeRangeFilter
            value={filters.timeRange}
            onChange={(timeRange) => handleFiltersChange({ timeRange })}
          />
          <PropertyFilter
            organizationId={filters.organizationId}
            propertyId={filters.propertyId}
            onChange={(organizationId, propertyId) => 
              handleFiltersChange({ organizationId, propertyId })
            }
          />
          <RoleFilter
            value={filters.roleTypes}
            onChange={(roleTypes) => handleFiltersChange({ roleTypes })}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <nav className="flex overflow-x-auto">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  group relative flex-shrink-0 flex flex-col items-center px-6 py-4 border-b-2 text-sm font-medium transition-colors min-w-0
                  ${isActive
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center">
                  <Icon className="h-5 w-5 mb-1" />
                  {section.badge && (
                    <span className={`
                      ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${section.badgeColor === 'green' ? 'bg-green-100 text-green-800' :
                        section.badgeColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        section.badgeColor === 'red' ? 'bg-red-100 text-red-800' :
                        section.badgeColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                        section.badgeColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                        section.badgeColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {section.badge}
                    </span>
                  )}
                </div>
                
                <span className="text-center whitespace-nowrap">{section.name}</span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {section.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {renderSectionContent()}
      </div>
    </div>
  );
};

export default RoleStatsDashboard;