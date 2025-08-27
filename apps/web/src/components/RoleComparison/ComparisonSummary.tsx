import React from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { RoleComparisonData, ComparisonMetrics, ComparisonSuggestion } from '../../types/roleComparison';
import RoleBadge from '../RoleBadge';

interface ComparisonSummaryProps {
  roles: RoleComparisonData[];
  metrics: ComparisonMetrics;
  suggestions: ComparisonSuggestion[];
  className?: string;
}

const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  roles,
  metrics,
  suggestions,
  className = '',
}) => {
  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };
  
  const getSimilarityLabel = (score: number) => {
    if (score >= 0.8) return 'Very Similar';
    if (score >= 0.6) return 'Moderately Similar';
    if (score >= 0.4) return 'Somewhat Similar';
    return 'Very Different';
  };
  
  const getImpactIcon = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <LightBulbIcon className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };
  
  const topSuggestions = suggestions.slice(0, 3);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Permissions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Permissions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalPermissions}</p>
            </div>
          </div>
        </div>
        
        {/* Shared Permissions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Shared Permissions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.sharedPermissions}</p>
              <p className="text-xs text-gray-400">
                {metrics.totalPermissions > 0 
                  ? `${((metrics.sharedPermissions / metrics.totalPermissions) * 100).toFixed(1)}% of total`
                  : '0% of total'
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Unique Permissions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Unique Permissions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.uniquePermissions}</p>
              <p className="text-xs text-gray-400">
                Across {roles.length} roles
              </p>
            </div>
          </div>
        </div>
        
        {/* Similarity Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${getSimilarityColor(metrics.similarityScore)}`}>
              {Math.round(metrics.similarityScore * 100)}%
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Similarity</p>
              <p className="text-lg font-bold text-gray-900">{getSimilarityLabel(metrics.similarityScore)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Role Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Role Details</h3>
        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <RoleBadge 
                  role={role.isSystemRole ? (role.systemRole || role.name) : role.name}
                  isCustomRole={!role.isSystemRole}
                  size="md"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{role.name}</h4>
                  {role.description && (
                    <p className="text-sm text-gray-500">{role.description}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{role.permissions.length}</div>
                <div className="text-xs text-gray-500">permissions</div>
                {role.userCount !== undefined && (
                  <div className="text-xs text-gray-400 mt-1">{role.userCount} users</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Permission Categories */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(metrics.permissionsByCategory).map(([category, count]) => (
            <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{category}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Coverage Gap</span>
              <span className="text-sm font-medium text-gray-900">
                {(metrics.coverageGap * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${metrics.coverageGap * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Percentage of permissions not shared by all roles
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Permission Density</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.permissionDensity.toFixed(1)} avg
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, (metrics.permissionDensity / 50) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Average number of permissions per role
            </p>
          </div>
        </div>
      </div>
      
      {/* Top Suggestions */}
      {topSuggestions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Recommendations</h3>
          <div className="space-y-4">
            {topSuggestions.map((suggestion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getImpactIcon(suggestion.impact)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(suggestion.impact)}`}>
                        {suggestion.impact} impact
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {suggestion.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    <div className="text-xs text-gray-500">
                      Affects {suggestion.affectedRoles.length} role{suggestion.affectedRoles.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {suggestions.length > 3 && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-500">
                  {suggestions.length - 3} more recommendation{suggestions.length - 3 !== 1 ? 's' : ''} available
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonSummary;
