import React from 'react';
import { HeatmapData, RoleComparisonData } from '../../../types/roleComparison';
import RoleBadge from '../../RoleBadge';

interface HeatmapChartProps {
  data: HeatmapData;
  roles: RoleComparisonData[];
  className?: string;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  roles,
  className = '',
}) => {
  const getHeatmapColor = (value: number) => {
    if (value === 0) return 'bg-gray-100 text-gray-500';
    if (value <= 0.2) return 'bg-red-100 text-red-800';
    if (value <= 0.4) return 'bg-orange-100 text-orange-800';
    if (value <= 0.6) return 'bg-yellow-100 text-yellow-800';
    if (value <= 0.8) return 'bg-green-100 text-green-800';
    return 'bg-green-200 text-green-900';
  };
  
  const getIntensityBar = (value: number) => {
    const percentage = Math.round(value * 100);
    return (
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
        <div 
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Permission Coverage Heatmap</h3>
          <div className="text-sm text-gray-500">Coverage intensity by category</div>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600">Coverage:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded" title="0% - No coverage" />
            <span>0%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-100 rounded" title="1-20% - Very low" />
            <span>20%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-100 rounded" title="21-40% - Low" />
            <span>40%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-100 rounded" title="41-60% - Medium" />
            <span>60%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-100 rounded" title="61-80% - High" />
            <span>80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-200 rounded" title="81-100% - Complete" />
            <span>100%</span>
          </div>
        </div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Role / Category
                </th>
                {data.columns.map(category => (
                  <th key={category} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    <div className="capitalize">{category}</div>
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {data.rows.map((roleName, rowIndex) => {
                const role = roles.find(r => r.name === roleName);
                
                return (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-gray-200">
                      <div className="flex items-center">
                        {role ? (
                          <RoleBadge 
                            role={role.isSystemRole ? (role.systemRole || role.name) : role.name}
                            isCustomRole={!role.isSystemRole}
                            size="sm"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{roleName}</span>
                        )}
                      </div>
                    </td>
                    
                    {data.values[rowIndex].map((value, colIndex) => {
                      const category = data.columns[colIndex];
                      const colorClass = getHeatmapColor(value);
                      const percentage = Math.round(value * 100);
                      
                      return (
                        <td 
                          key={colIndex} 
                          className={`px-3 py-3 text-center ${colorClass} border border-gray-200`}
                          title={`${roleName} has ${percentage}% coverage in ${category}`}
                        >
                          <div className="text-sm font-medium">
                            {percentage}%
                          </div>
                          {getIntensityBar(value)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Category Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.columns.map((category, colIndex) => {
          const categoryValues = data.values.map(row => row[colIndex]);
          const averageCoverage = categoryValues.reduce((sum, val) => sum + val, 0) / categoryValues.length;
          const maxCoverage = Math.max(...categoryValues);
          const minCoverage = Math.min(...categoryValues);
          
          return (
            <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 capitalize mb-3">{category}</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Coverage:</span>
                  <span className="font-medium">{Math.round(averageCoverage * 100)}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Highest:</span>
                  <span className="font-medium text-green-600">{Math.round(maxCoverage * 100)}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Lowest:</span>
                  <span className="font-medium text-red-600">{Math.round(minCoverage * 100)}%</span>
                </div>
                
                <div className="pt-2">
                  {getIntensityBar(averageCoverage)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Insights */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Coverage Insights</h3>
        <div className="space-y-3">
          {data.columns.map((category, colIndex) => {
            const categoryValues = data.values.map(row => row[colIndex]);
            const averageCoverage = categoryValues.reduce((sum, val) => sum + val, 0) / categoryValues.length;
            const variance = categoryValues.reduce((sum, val) => sum + Math.pow(val - averageCoverage, 2), 0) / categoryValues.length;
            
            let insight = '';
            let color = 'text-gray-600';
            
            if (averageCoverage === 0) {
              insight = 'No roles have permissions in this category';
              color = 'text-red-600';
            } else if (averageCoverage < 0.2) {
              insight = 'Very low coverage across all roles';
              color = 'text-red-600';
            } else if (averageCoverage < 0.5) {
              insight = 'Moderate coverage with room for improvement';
              color = 'text-yellow-600';
            } else if (variance > 0.2) {
              insight = 'Inconsistent coverage between roles';
              color = 'text-orange-600';
            } else {
              insight = 'Good, consistent coverage across roles';
              color = 'text-green-600';
            }
            
            return (
              <div key={category} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="font-medium text-gray-900 capitalize">{category}</span>
                <span className={`text-sm ${color}`}>{insight}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
