import React, { useState } from 'react';
import {
  BarChart3 as ChartBarIcon,
  Database as CircleStackIcon,
  Map as MapIcon,
  Grid3x3 as TableCellsIcon,
} from 'lucide-react';
import { RoleComparisonData } from '../../types/roleComparison';
import { type UseComparisonAnalyticsReturn } from '../../hooks/useComparisonAnalytics';
import VennDiagramChart from './charts/VennDiagramChart';
import HeatmapChart from './charts/HeatmapChart';
import NetworkChart from './charts/NetworkChart';
import StatisticalChart from './charts/StatisticalChart';

interface ComparisonChartProps {
  roles: RoleComparisonData[];
  analytics: UseComparisonAnalyticsReturn;
  className?: string;
}

type ChartType = 'venn' | 'heatmap' | 'network' | 'stats';

const ComparisonChart: React.FC<ComparisonChartProps> = ({
  roles,
  analytics,
  className = '',
}) => {
  const [activeChart, setActiveChart] = useState<ChartType>('stats');
  
  const chartOptions = [
    {
      id: 'stats' as ChartType,
      label: 'Statistics',
      icon: ChartBarIcon,
      description: 'Statistical analysis and metrics',
      available: true,
    },
    {
      id: 'venn' as ChartType,
      label: 'Venn Diagram',
      icon: CircleStackIcon,
      description: 'Permission overlap visualization',
      available: !!analytics.vennDiagramData && roles.length <= 3,
    },
    {
      id: 'heatmap' as ChartType,
      label: 'Heatmap',
      icon: TableCellsIcon,
      description: 'Permission coverage by category',
      available: !!analytics.heatmapData,
    },
    {
      id: 'network' as ChartType,
      label: 'Network Graph',
      icon: MapIcon,
      description: 'Role relationships and connections',
      available: !!analytics.networkGraphData,
    },
  ];
  
  const availableCharts = chartOptions.filter(option => option.available);
  
  const renderChart = () => {
    switch (activeChart) {
      case 'venn':
        return analytics.vennDiagramData ? (
          <VennDiagramChart 
            data={analytics.vennDiagramData} 
            roles={roles} 
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <CircleStackIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <div>Venn diagram only available for 2-3 roles</div>
          </div>
        );
      
      case 'heatmap':
        return analytics.heatmapData ? (
          <HeatmapChart 
            data={analytics.heatmapData} 
            roles={roles} 
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <TableCellsIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <div>Heatmap data not available</div>
          </div>
        );
      
      case 'network':
        return analytics.networkGraphData ? (
          <NetworkChart 
            data={analytics.networkGraphData} 
            roles={roles} 
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MapIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <div>Network graph data not available</div>
          </div>
        );
      
      case 'stats':
      default:
        return (
          <StatisticalChart 
            statistics={analytics.statisticalSummary}
            categoryAnalysis={analytics.categoryAnalysis}
            roles={roles} 
          />
        );
    }
  };
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Visual Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">
              Interactive charts and visualizations
            </p>
          </div>
        </div>
        
        {/* Chart Tabs */}
        <div className="mt-4">
          <nav className="flex space-x-1" aria-label="Chart types">
            {availableCharts.map(chart => {
              const Icon = chart.icon;
              const isActive = activeChart === chart.id;
              
              return (
                <button
                  key={chart.id}
                  onClick={() => setActiveChart(chart.id)}
                  className={`
                    group relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={chart.description}
                >
                  <Icon className="h-4 w-4" />
                  {chart.label}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {chart.description}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Chart Content */}
      <div className="p-6">
        {renderChart()}
      </div>
      
      {/* Chart Info */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="text-xs text-gray-500">
          {activeChart === 'venn' && 'Shows permission overlaps between selected roles'}
          {activeChart === 'heatmap' && 'Displays permission coverage intensity by category'}
          {activeChart === 'network' && 'Visualizes relationships between roles and permissions'}
          {activeChart === 'stats' && 'Statistical analysis of role permissions and similarities'}
        </div>
      </div>
    </div>
  );
};

export default ComparisonChart;
