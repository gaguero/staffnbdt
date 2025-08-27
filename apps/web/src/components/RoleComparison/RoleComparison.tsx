import React, { useState } from 'react';
import {
  Squares2X2Icon,
  DocumentTextIcon,
  ChartBarIcon,
  TableCellsIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useRoleComparison } from '../../hooks/useRoleComparison';
import { useComparisonAnalytics } from '../../hooks/useComparisonAnalytics';
import { ComparisonViewState } from '../../types/roleComparison';
import RoleSelector from './RoleSelector';
import ComparisonMatrix from './ComparisonMatrix';
import ComparisonDiff from './ComparisonDiff';
import ComparisonSummary from './ComparisonSummary';
import ComparisonChart from './ComparisonChart';
import ComparisonExport from './ComparisonExport';
import LoadingSpinner from '../LoadingSpinner';

interface RoleComparisonProps {
  initialRoles?: string[];
  maxRoles?: number;
  autoAnalyze?: boolean;
  showExport?: boolean;
  showVisualizations?: boolean;
  className?: string;
}

const RoleComparison: React.FC<RoleComparisonProps> = ({
  initialRoles = [],
  maxRoles = 4,
  autoAnalyze = true,
  showExport = true,
  showVisualizations = true,
  className = '',
}) => {
  const {
    comparison,
    selectedRoles,
    availableRoles,
    isLoading,
    isAnalyzing,
    error,
    viewState,
    selectRole,
    unselectRole,
    clearSelection,
    analyzeRoles,
    setFilters,
    setView,
    canAddMore,
    hasMinimumRoles,
  } = useRoleComparison({ initialRoles, maxRoles, autoAnalyze });
  
  const analytics = comparison ? useComparisonAnalytics({
    roles: comparison.roles,
    matrix: comparison.permissionMatrix,
    metrics: comparison.metrics,
  }) : null;
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const viewTabs = [
    { id: 'summary', label: 'Summary', icon: Squares2X2Icon },
    { id: 'matrix', label: 'Matrix', icon: TableCellsIcon },
    { id: 'diff', label: 'Differences', icon: DocumentTextIcon },
    ...(showVisualizations ? [
      { id: 'charts', label: 'Charts', icon: ChartBarIcon },
    ] : []),
  ] as const;
  
  const handleViewChange = (view: ComparisonViewState['currentView']) => {
    setView(view);
  };
  
  const handleManualAnalyze = async () => {
    if (hasMinimumRoles && !isAnalyzing) {
      await analyzeRoles();
    }
  };
  
  const renderContent = () => {
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-medium text-red-900">Analysis Error</h3>
          </div>
          <p className="text-red-700 mb-4">{error.message}</p>
          <button
            onClick={handleManualAnalyze}
            disabled={!hasMinimumRoles || isAnalyzing}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Retry Analysis
          </button>
        </div>
      );
    }
    
    if (!hasMinimumRoles) {
      return (
        <div className="text-center py-12">
          <Squares2X2Icon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select Roles to Compare
          </h3>
          <p className="text-gray-500 mb-6">
            Choose at least 2 roles from the selection panel to begin comparison
          </p>
        </div>
      );
    }
    
    if (!comparison && hasMinimumRoles) {
      return (
        <div className="text-center py-12">
          <div className="mb-4">
            <LoadingSpinner size="lg" text="Analyzing roles..." />
          </div>
          <p className="text-gray-500">
            Computing permission differences and generating insights
          </p>
        </div>
      );
    }
    
    if (!comparison) return null;
    
    switch (viewState.currentView) {
      case 'summary':
        return (
          <ComparisonSummary
            roles={comparison.roles}
            metrics={comparison.metrics}
            suggestions={comparison.suggestions}
          />
        );
      
      case 'matrix':
        return (
          <ComparisonMatrix
            roles={comparison.roles}
            matrix={comparison.permissionMatrix}
          />
        );
      
      case 'diff':
        return (
          <ComparisonDiff
            roles={comparison.roles}
            differences={comparison.differences}
          />
        );
      
      case 'charts':
        return showVisualizations && analytics ? (
          <ComparisonChart
            roles={comparison.roles}
            analytics={analytics}
          />
        ) : null;
      
      default:
        return null;
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Comparison Tool</h1>
            <p className="text-gray-600 mt-1">
              Compare roles side-by-side to understand permissions, similarities, and differences
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Advanced Options Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Advanced
            </button>
            
            {/* Manual Analyze Button */}
            {!autoAnalyze && hasMinimumRoles && (
              <button
                onClick={handleManualAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <ChartBarIcon className="h-4 w-4" />
                )}
                Analyze Roles
              </button>
            )}
            
            {/* Export Button */}
            {showExport && comparison && (
              <ComparisonExport
                comparison={comparison}
                analytics={analytics}
              />
            )}
            
            {/* Clear Selection */}
            {selectedRoles.length > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        
        {/* Advanced Options Panel */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Advanced comparison options and filters will be available here...
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Selection Panel */}
        <div className="lg:col-span-1">
          <RoleSelector
            availableRoles={availableRoles}
            selectedRoles={selectedRoles}
            maxRoles={maxRoles}
            onSelectRole={selectRole}
            onUnselectRole={unselectRole}
            filters={viewState.filters}
            onFiltersChange={setFilters}
          />
        </div>
        
        {/* Main Content Panel */}
        <div className="lg:col-span-2">
          {/* View Tabs */}
          {hasMinimumRoles && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {viewTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = viewState.currentView === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleViewChange(tab.id as ComparisonViewState['currentView'])}
                        className={`
                          flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                          ${isActive
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="min-h-[400px]">
            {renderContent()}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Roles: {selectedRoles.length}/{maxRoles}</span>
            {comparison && (
              <span>Permissions: {comparison.permissionMatrix.permissions.length}</span>
            )}
            {isAnalyzing && (
              <div className="flex items-center gap-1">
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
                <span>Analyzing...</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {comparison && (
              <span>Last updated: {new Date(comparison.timestamp).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleComparison;
