import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ListBulletIcon,
  Squares2X2Icon,
  Bars3Icon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { PermissionViewerProps } from '../../types/permissionViewer';
import { usePermissionViewer } from '../../hooks/usePermissionViewer';
import PermissionSearch from './PermissionSearch';
import PermissionFilters from './PermissionFilters';
import PermissionTreeNode from './PermissionTreeNode';
import PermissionDetails from './PermissionDetails';
import PermissionExport from './PermissionExport';

export const PermissionViewer: React.FC<PermissionViewerProps> = ({
  permissions: propPermissions,
  options: propOptions,
  onPermissionSelect,
  onBulkSelect,
  onExport,
  className = '',
  height = 600,
  showToolbar = true,
  showFooter = true,
}) => {
  // State for selected permission details
  const [selectedPermissionForDetails, setSelectedPermissionForDetails] = useState<string | null>(null);

  // Initialize permission viewer hook
  const {
    treeData,
    filter,
    options,
    selection,
    isLoading,
    error,
    expandedNodes,
    currentView,
    filterOptions,
    selectedPermissions,
    updateFilter,
    updateOptions,
    toggleNode,
    selectNode,
    clearSelection,
    expandAll,
    collapseAll,
    exportPermissions,
    refresh,
  } = usePermissionViewer({
    autoLoad: !propPermissions, // Only auto-load if no permissions provided
  });

  // Use provided permissions or loaded permissions
  const displayPermissions = propPermissions || selectedPermissions;

  // Merge provided options with hook options
  const mergedOptions = useMemo(() => ({
    ...options,
    ...propOptions,
  }), [options, propOptions]);

  // Handle permission selection
  const handlePermissionSelect = useCallback((nodeId: string, permission?: any) => {
    selectNode(nodeId, permission);
    
    if (permission) {
      setSelectedPermissionForDetails(permission.id);
      onPermissionSelect?.(permission);
    }
  }, [selectNode, onPermissionSelect]);

  // Handle bulk selection callback
  React.useEffect(() => {
    if (onBulkSelect && selectedPermissions.length > 0) {
      onBulkSelect(selectedPermissions);
    }
  }, [selectedPermissions, onBulkSelect]);

  // Get search suggestions based on current data
  const searchSuggestions = useMemo(() => {
    if (!treeData || !filter.searchQuery.trim()) return [];
    
    const query = filter.searchQuery.toLowerCase();
    const suggestions = new Set<string>();
    
    // Add matching permission names
    Object.values(treeData.nodes).forEach(node => {
      if (node.type === 'permission' && node.permission) {
        const permName = `${node.permission.resource}.${node.permission.action}.${node.permission.scope}`;
        if (permName.toLowerCase().includes(query)) {
          suggestions.add(permName);
        }
      }
    });
    
    // Add matching resources, actions, scopes
    filterOptions.resources.forEach(resource => {
      if (resource.toLowerCase().includes(query)) {
        suggestions.add(resource);
      }
    });
    
    filterOptions.actions.forEach(action => {
      if (action.toLowerCase().includes(query)) {
        suggestions.add(action);
      }
    });
    
    filterOptions.scopes.forEach(scope => {
      if (scope.toLowerCase().includes(query)) {
        suggestions.add(scope);
      }
    });
    
    return Array.from(suggestions).slice(0, 10);
  }, [treeData, filter.searchQuery, filterOptions]);

  // Render tree nodes
  const renderTreeNodes = useCallback(() => {
    if (!treeData) return null;
    
    const renderNode = (nodeId: string) => {
      const node = treeData.nodes[nodeId];
      if (!node) return null;
      
      const isSelected = selection.selectedNodes.has(nodeId);
      const isExpanded = expandedNodes.has(nodeId);
      
      return (
        <div key={nodeId}>
          <PermissionTreeNode
            node={node}
            level={node.level}
            onToggle={toggleNode}
            onSelect={handlePermissionSelect}
            isSelected={isSelected}
            isExpanded={isExpanded}
            showCheckboxes={mergedOptions.multiSelect}
            showCounts={mergedOptions.showCounts}
            showDescriptions={mergedOptions.showDescriptions}
          />
          
          {isExpanded && node.children.map(childId => renderNode(childId))}
        </div>
      );
    };
    
    return treeData.rootNodes.map(nodeId => renderNode(nodeId));
  }, [treeData, selection, expandedNodes, toggleNode, handlePermissionSelect, mergedOptions]);

  // Get selected permission details
  const selectedPermissionDetails = useMemo(() => {
    if (!selectedPermissionForDetails || !treeData) return null;
    
    const node = Object.values(treeData.nodes).find(
      node => node.permission?.id === selectedPermissionForDetails
    );
    
    return node?.permission || null;
  }, [selectedPermissionForDetails, treeData]);

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Permissions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">Permission Explorer</h2>
              {treeData && (
                <span className="text-sm text-gray-500">
                  {treeData.totalPermissions} permissions
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => {/* setCurrentView('tree') */}}
                  className={`p-1 rounded ${currentView === 'tree' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="Tree View"
                >
                  <Bars3Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {/* setCurrentView('list') */}}
                  className={`p-1 rounded ${currentView === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="List View"
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {/* setCurrentView('cards') */}}
                  className={`p-1 rounded ${currentView === 'cards' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="Card View"
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
              </div>

              {/* Expand/Collapse */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={expandAll}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Expand All"
                >
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={collapseAll}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Collapse All"
                >
                  <ArrowsPointingInIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Export */}
              {mergedOptions.showExport && (
                <PermissionExport
                  permissions={displayPermissions}
                  selectedPermissions={selectedPermissions}
                  onExport={onExport || exportPermissions}
                />
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            {mergedOptions.showSearch && (
              <div className="flex-1">
                <PermissionSearch
                  searchQuery={filter.searchQuery}
                  onSearchChange={(query) => updateFilter({ searchQuery: query })}
                  suggestions={searchSuggestions}
                  isLoading={isLoading}
                />
              </div>
            )}

            {mergedOptions.showFilters && (
              <PermissionFilters
                filter={filter}
                onFilterChange={updateFilter}
                availableResources={filterOptions.resources}
                availableActions={filterOptions.actions}
                availableScopes={filterOptions.scopes}
              />
            )}
          </div>

          {/* Selection Summary */}
          {mergedOptions.multiSelect && selectedPermissions.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex" style={{ height: height - (showToolbar ? 140 : 0) - (showFooter ? 60 : 0) }}>
        {/* Tree/List Panel */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading permissions...</p>
              </div>
            </div>
          ) : !treeData || treeData.rootNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-lg font-medium mb-1">No permissions found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {renderTreeNodes()}
            </div>
          )}
        </div>

        {/* Details Panel */}
        {mergedOptions.showPermissionDetails && selectedPermissionDetails && (
          <div className="w-96 border-l border-gray-200 flex-shrink-0">
            <PermissionDetails
              permission={selectedPermissionDetails}
              onClose={() => setSelectedPermissionForDetails(null)}
              className="h-full overflow-auto"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                {treeData ? `${treeData.totalPermissions} total permissions` : 'Loading...'}
              </span>
              {Object.keys(filter.selectedResources).length > 0 && (
                <span>• Filtered</span>
              )}
              {selectedPermissions.length > 0 && (
                <span>• {selectedPermissions.length} selected</span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={refresh}
                className="text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionViewer;