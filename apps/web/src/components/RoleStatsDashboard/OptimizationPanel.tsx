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
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import {
  CogIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { OptimizationRecommendation, DashboardFilters } from '../../types/roleStats';

interface OptimizationPanelProps {
  data?: OptimizationRecommendation[];
  optimizationData?: any;
  analytics?: any;
  isLoading: boolean;
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
}

const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  data,
  analytics,
  isLoading
}) => {
  const [viewType, setViewType] = useState<'recommendations' | 'impact' | 'roadmap'>('recommendations');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'impact' | 'effort' | 'affectedUsers'>('impact');

  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    if (!data) return [];
    
    let filtered = data;
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(rec => rec.type === filterType);
    }
    
    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'effort':
          const effortOrder = { low: 3, medium: 2, high: 1 };
          return effortOrder[b.effort] - effortOrder[a.effort];
        case 'affectedUsers':
          return b.affectedUsers - a.affectedUsers;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [data, filterType, sortBy]);

  // Recommendation types for filtering
  const recommendationTypes = useMemo(() => {
    if (!data) return [];
    const types = [...new Set(data.map(rec => rec.type))];
    return types.map(type => ({
      key: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count: data.filter(rec => rec.type === type).length
    }));
  }, [data]);

  // Impact vs Effort scatter plot data
  const impactEffortData = useMemo(() => {
    if (!data) return [];
    
    return data.map((rec, index) => ({
      id: rec.id,
      title: rec.title,
      impact: rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1,
      effort: rec.effort === 'high' ? 3 : rec.effort === 'medium' ? 2 : 1,
      affectedUsers: rec.affectedUsers,
      type: rec.type,
      color: getTypeColor(rec.type, index)
    }));
  }, [data]);

  // ROI analysis data
  const roiData = useMemo(() => {
    if (!data) return [];
    
    return data.map(rec => {
      const impactScore = rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1;
      const effortScore = rec.effort === 'high' ? 3 : rec.effort === 'medium' ? 2 : 1;
      const roi = (impactScore / effortScore) * rec.affectedUsers;
      
      return {
        title: rec.title,
        roi,
        type: rec.type,
        impact: rec.impact,
        effort: rec.effort
      };
    }).sort((a, b) => b.roi - a.roi);
  }, [data]);

  function getTypeColor(type: string, index: number): string {
    const colors: { [key: string]: string } = {
      consolidation: '#3B82F6',
      permissions: '#10B981',
      redundancy: '#F59E0B',
      security: '#EF4444',
      efficiency: '#8B5CF6',
      compliance: '#06B6D4'
    };
    return colors[type] || `hsl(${(index * 45) % 360}, 70%, 50%)`;
  }

  function getImpactIcon(impact: string) {
    switch (impact) {
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  }

  function getEffortIcon(effort: string) {
    switch (effort) {
      case 'high':
        return <span className="text-red-600">●●●</span>;
      case 'medium':
        return <span className="text-yellow-600">●●○</span>;
      case 'low':
        return <span className="text-green-600">●○○</span>;
      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LightBulbIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.length || 0}</div>
          <div className="text-sm text-gray-600">Total Recommendations</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.filter(rec => rec.impact === 'high').length || 0}
          </div>
          <div className="text-sm text-gray-600">High Impact</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.filter(rec => rec.effort === 'low').length || 0}
          </div>
          <div className="text-sm text-gray-600">Low Effort</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics?.optimizationScore ? `${Math.round(analytics.optimizationScore * 100)}%` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Optimization Score</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('recommendations')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'recommendations' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Recommendations
            </button>
            <button
              onClick={() => setViewType('impact')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'impact' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Impact Analysis
            </button>
            <button
              onClick={() => setViewType('roadmap')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'roadmap' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Implementation Roadmap
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                {recommendationTypes.map(type => (
                  <option key={type.key} value={type.key}>
                    {type.label} ({type.count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'impact' | 'effort' | 'affectedUsers')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="impact">Impact</option>
                <option value="effort">Effort</option>
                <option value="affectedUsers">Affected Users</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewType === 'recommendations' && (
        <div className="space-y-4">
          {filteredRecommendations.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Optimized!</h3>
              <p className="text-gray-600">
                No optimization recommendations at this time. Your role system is running efficiently.
              </p>
            </div>
          ) : (
            filteredRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      recommendation.type === 'security' ? 'bg-red-100' :
                      recommendation.type === 'efficiency' ? 'bg-blue-100' :
                      recommendation.type === 'consolidation' ? 'bg-purple-100' :
                      'bg-yellow-100'
                    }`}>
                      <CogIcon className={`h-5 w-5 ${
                        recommendation.type === 'security' ? 'text-red-600' :
                        recommendation.type === 'efficiency' ? 'text-blue-600' :
                        recommendation.type === 'consolidation' ? 'text-purple-600' :
                        'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {recommendation.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {recommendation.description}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          recommendation.type === 'security' ? 'bg-red-100 text-red-800' :
                          recommendation.type === 'efficiency' ? 'bg-blue-100 text-blue-800' :
                          recommendation.type === 'consolidation' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {recommendation.type}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {getImpactIcon(recommendation.impact)}
                          <span className="ml-1">{recommendation.impact} impact</span>
                        </span>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {getEffortIcon(recommendation.effort)}
                          <span className="ml-1">{recommendation.effort} effort</span>
                        </span>
                      </div>
                      
                      {/* Estimated Benefit */}
                      {recommendation.estimatedBenefit && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <div className="text-sm font-medium text-green-800 mb-1">Estimated Benefit</div>
                          <div className="text-sm text-green-700">{recommendation.estimatedBenefit}</div>
                        </div>
                      )}
                      
                      {/* Action Items */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-900 mb-2">Action Items:</div>
                        <ul className="space-y-1">
                          {recommendation.actionItems.map((item, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-600">
                              <span className="text-blue-500 mr-2">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Affected Users</div>
                    <div className="text-2xl font-bold text-gray-900">{recommendation.affectedUsers}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Affects {recommendation.affectedRoles.length} role(s)
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                      Implement
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {viewType === 'impact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Impact vs Effort Scatter Plot */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Impact vs Effort Matrix</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={impactEffortData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="effort" 
                    domain={[0.5, 3.5]}
                    ticks={[1, 2, 3]}
                    tickFormatter={(value) => value === 1 ? 'Low' : value === 2 ? 'Med' : 'High'}
                    label={{ value: 'Effort', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="impact" 
                    domain={[0.5, 3.5]}
                    ticks={[1, 2, 3]}
                    tickFormatter={(value) => value === 1 ? 'Low' : value === 2 ? 'Med' : 'High'}
                    label={{ value: 'Impact', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      name === 'effort' ? 
                        (value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High') :
                        (value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'),
                      name === 'effort' ? 'Effort' : 'Impact'
                    ]}
                    labelFormatter={() => ''}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <div className="font-medium text-gray-900">{data.title}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Impact: {data.impact === 1 ? 'Low' : data.impact === 2 ? 'Medium' : 'High'}
                            </div>
                            <div className="text-sm text-gray-600">
                              Effort: {data.effort === 1 ? 'Low' : data.effort === 2 ? 'Medium' : 'High'}
                            </div>
                            <div className="text-sm text-gray-600">
                              Users: {data.affectedUsers}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter dataKey="impact">
                    {impactEffortData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              Top-right quadrant shows high impact, low effort recommendations (quick wins)
            </div>
          </div>

          {/* ROI Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">ROI Analysis</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiData.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="title" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [Math.round(value as number), 'ROI Score']}
                  />
                  <Bar dataKey="roi" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewType === 'roadmap' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Implementation Roadmap</h3>
          
          <div className="space-y-6">
            {/* Quick Wins */}
            <div>
              <h4 className="text-md font-semibold text-green-700 mb-3">
                🚀 Quick Wins (High Impact, Low Effort)
              </h4>
              <div className="space-y-2">
                {filteredRecommendations
                  .filter(rec => rec.impact === 'high' && rec.effort === 'low')
                  .map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="font-medium text-green-800">{rec.title}</span>
                      <span className="text-sm text-green-600">{rec.affectedUsers} users</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Major Projects */}
            <div>
              <h4 className="text-md font-semibold text-blue-700 mb-3">
                📋 Major Projects (High Impact, High Effort)
              </h4>
              <div className="space-y-2">
                {filteredRecommendations
                  .filter(rec => rec.impact === 'high' && rec.effort === 'high')
                  .map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="font-medium text-blue-800">{rec.title}</span>
                      <span className="text-sm text-blue-600">{rec.affectedUsers} users</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Fill-ins */}
            <div>
              <h4 className="text-md font-semibold text-yellow-700 mb-3">
                ⚡ Fill-ins (Low Impact, Low Effort)
              </h4>
              <div className="space-y-2">
                {filteredRecommendations
                  .filter(rec => rec.impact === 'low' && rec.effort === 'low')
                  .map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="font-medium text-yellow-800">{rec.title}</span>
                      <span className="text-sm text-yellow-600">{rec.affectedUsers} users</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Questionable */}
            <div>
              <h4 className="text-md font-semibold text-red-700 mb-3">
                ❓ Questionable (Low Impact, High Effort)
              </h4>
              <div className="space-y-2">
                {filteredRecommendations
                  .filter(rec => rec.impact === 'low' && rec.effort === 'high')
                  .map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="font-medium text-red-800">{rec.title}</span>
                      <span className="text-sm text-red-600">{rec.affectedUsers} users</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizationPanel;