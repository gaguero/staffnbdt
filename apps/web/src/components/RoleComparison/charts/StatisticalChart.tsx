import React from 'react';
import {
  ChartBarIcon,
  ScaleIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { RoleComparisonData } from '../../../types/roleComparison';
import RoleBadge from '../../RoleBadge';

interface StatisticalSummary {
  meanPermissions: number;
  medianPermissions: number;
  permissionVariance: number;
  maxSimilarity: number;
  minSimilarity: number;
  averageSimilarity: number;
  entropyScore: number;
}

interface CategoryAnalysis {
  categoryOverlap: Record<string, number>;
  categoryDiversity: Record<string, number>;
  criticalGaps: Array<{
    category: string;
    missingRoles: string[];
    impact: 'high' | 'medium' | 'low';
  }>;
}

interface StatisticalChartProps {
  statistics: StatisticalSummary;
  categoryAnalysis: CategoryAnalysis;
  roles: RoleComparisonData[];
  className?: string;
}

const StatisticalChart: React.FC<StatisticalChartProps> = ({
  statistics,
  categoryAnalysis,
  roles,
  className = '',
}) => {
  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
    }
  };
  
  const formatNumber = (num: number, decimals = 2) => {
    return Number(num.toFixed(decimals));
  };
  
  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Core Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalculatorIcon className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Mean Permissions</h4>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formatNumber(statistics.meanPermissions, 1)}
          </div>
          <div className="text-sm text-blue-600">
            Average per role
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ScaleIcon className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">Median Permissions</h4>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {formatNumber(statistics.medianPermissions, 0)}
          </div>
          <div className="text-sm text-green-600">
            Middle value
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium text-purple-900">Variance</h4>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {formatNumber(statistics.permissionVariance, 1)}
          </div>
          <div className="text-sm text-purple-600">
            Permission spread
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            <h4 className="font-medium text-orange-900">Entropy Score</h4>
          </div>
          <div className="text-2xl font-bold text-orange-900">
            {formatNumber(statistics.entropyScore, 2)}
          </div>
          <div className="text-sm text-orange-600">
            Diversity measure
          </div>
        </div>
      </div>
      
      {/* Similarity Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Similarity Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatPercentage(statistics.maxSimilarity)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Highest Similarity</div>
            <div className="text-xs text-gray-500 mt-1">Most similar role pair</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatPercentage(statistics.averageSimilarity)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Average Similarity</div>
            <div className="text-xs text-gray-500 mt-1">Overall comparison</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {formatPercentage(statistics.minSimilarity)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Lowest Similarity</div>
            <div className="text-xs text-gray-500 mt-1">Most different role pair</div>
          </div>
        </div>
        
        {/* Similarity Interpretation */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Interpretation</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {statistics.averageSimilarity > 0.8 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full" />
                <span>Very high similarity - consider role consolidation</span>
              </div>
            )}
            {statistics.averageSimilarity >= 0.6 && statistics.averageSimilarity <= 0.8 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                <span>Moderate similarity - review for optimization opportunities</span>
              </div>
            )}
            {statistics.averageSimilarity < 0.6 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span>Low similarity - well-differentiated roles</span>
              </div>
            )}
            {statistics.permissionVariance > 100 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-orange-500 rounded-full" />
                <span>High variance - significant differences in permission counts</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Role Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Distribution</h3>
        <div className="space-y-3">
          {roles.map(role => {
            const permissionCount = role.permissions.length;
            const percentage = statistics.meanPermissions > 0 
              ? (permissionCount / (statistics.meanPermissions * roles.length)) * 100
              : 0;
            
            return (
              <div key={role.id} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <RoleBadge 
                    role={role.isSystemRole ? (role.systemRole || role.name) : role.name}
                    isCustomRole={!role.isSystemRole}
                    size="sm"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{role.name}</span>
                    <span className="text-gray-600">{permissionCount} permissions</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Category Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Analysis</h3>
        
        {/* Category Overlap */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Category Overlap</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(categoryAnalysis.categoryOverlap).map(([category, overlap]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">
                  {formatPercentage(overlap)}
                </div>
                <div className="text-sm text-gray-600 capitalize">{category}</div>
                <div className="text-xs text-gray-500">roles have this</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Critical Gaps */}
        {categoryAnalysis.criticalGaps.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Critical Gaps</h4>
            <div className="space-y-3">
              {categoryAnalysis.criticalGaps.map((gap, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(gap.impact)}`}>
                    {gap.impact}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 capitalize">{gap.category}</div>
                    <div className="text-sm text-gray-600">
                      Missing from {gap.missingRoles.length} role{gap.missingRoles.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticalChart;
