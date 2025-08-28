import React, { useState } from 'react';
import { 
  Filter, 
  ChevronDown,
  X,
  Check
} from 'lucide-react';
import { PermissionFiltersProps } from '../../types/permissionViewer';
import { RESOURCE_ICONS, ACTION_ICONS, SCOPE_ICONS } from '../../types/permissionViewer';

export const PermissionFilters: React.FC<PermissionFiltersProps> = ({
  filter,
  onFilterChange,
  availableResources,
  availableActions,
  availableScopes,
  className = '',
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    resources: boolean;
    actions: boolean;
    scopes: boolean;
    options: boolean;
  }>({
    resources: true,
    actions: true,
    scopes: true,
    options: true,
  });

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (
    field: 'selectedResources' | 'selectedActions' | 'selectedScopes',
    value: string,
    checked: boolean
  ) => {
    const currentValues = filter[field];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    onFilterChange({ [field]: newValues });
  };

  // Clear specific filter
  const clearFilter = (field: keyof typeof filter) => {
    if (Array.isArray(filter[field])) {
      onFilterChange({ [field]: [] });
    } else {
      onFilterChange({ [field]: false });
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFilterChange({
      selectedResources: [],
      selectedActions: [],
      selectedScopes: [],
      showOnlyUserPermissions: false,
      showOnlyRolePermissions: false,
    });
  };

  // Get active filter count
  const activeFilterCount = 
    filter.selectedResources.length +
    filter.selectedActions.length +
    filter.selectedScopes.length +
    (filter.showOnlyUserPermissions ? 1 : 0) +
    (filter.showOnlyRolePermissions ? 1 : 0);

  // Render multi-select section
  const renderMultiSelectSection = (
    title: string,
    field: 'selectedResources' | 'selectedActions' | 'selectedScopes',
    options: string[],
    icons: Record<string, string>,
    sectionKey: keyof typeof expandedSections
  ) => (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-gray-700"
      >
        <div className="flex items-center space-x-2">
          <span>{title}</span>
          {filter[field].length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {filter[field].length}
            </span>
          )}
        </div>
        <ChevronDown 
          className={`h-4 w-4 transform transition-transform ${
            expandedSections[sectionKey] ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {expandedSections[sectionKey] && (
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
          {options.map(option => (
            <label
              key={option}
              className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={filter[field].includes(option)}
                onChange={(e) => handleMultiSelectChange(field, option, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-lg" title={option}>
                {icons[option as keyof typeof icons] || '📝'}
              </span>
              <span className="flex-1 text-gray-700 capitalize">{option}</span>
              <span className="text-xs text-gray-400">
                {/* Show count of permissions for this option */}
                {/* This could be enhanced to show actual counts */}
              </span>
            </label>
          ))}
          
          {options.length === 0 && (
            <div className="text-sm text-gray-500 italic p-2">
              No {title.toLowerCase()} available
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
          activeFilterCount > 0 
            ? 'bg-blue-50 border-blue-300 text-blue-700' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown 
          className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute z-40 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Filter Permissions</h3>
            <div className="flex items-center space-x-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Resources Filter */}
          {renderMultiSelectSection(
            'Resources',
            'selectedResources',
            availableResources,
            RESOURCE_ICONS,
            'resources'
          )}

          {/* Actions Filter */}
          {renderMultiSelectSection(
            'Actions',
            'selectedActions',
            availableActions,
            ACTION_ICONS,
            'actions'
          )}

          {/* Scopes Filter */}
          {renderMultiSelectSection(
            'Scopes',
            'selectedScopes',
            availableScopes,
            SCOPE_ICONS,
            'scopes'
          )}

          {/* Options Filter */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            <button
              onClick={() => toggleSection('options')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-gray-700"
            >
              <span>Options</span>
              <ChevronDown 
                className={`h-4 w-4 transform transition-transform ${
                  expandedSections.options ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {expandedSections.options && (
              <div className="mt-3 space-y-3">
                <label className="flex items-center space-x-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.showOnlyUserPermissions}
                    onChange={(e) => onFilterChange({ showOnlyUserPermissions: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">Show only my permissions</span>
                </label>

                <label className="flex items-center space-x-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.showOnlyRolePermissions}
                    onChange={(e) => onFilterChange({ showOnlyRolePermissions: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">Show only role-based permissions</span>
                </label>
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="pt-2">
              <div className="text-xs text-gray-500 mb-2">Active filters:</div>
              <div className="flex flex-wrap gap-1">
                {filter.selectedResources.map(resource => (
                  <span
                    key={`resource-${resource}`}
                    className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    <span>{RESOURCE_ICONS[resource as keyof typeof RESOURCE_ICONS] || '📝'}</span>
                    <span>{resource}</span>
                    <button
                      onClick={() => handleMultiSelectChange('selectedResources', resource, false)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                
                {filter.selectedActions.map(action => (
                  <span
                    key={`action-${action}`}
                    className="inline-flex items-center space-x-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                  >
                    <span>{ACTION_ICONS[action as keyof typeof ACTION_ICONS] || '⚡'}</span>
                    <span>{action}</span>
                    <button
                      onClick={() => handleMultiSelectChange('selectedActions', action, false)}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                
                {filter.selectedScopes.map(scope => (
                  <span
                    key={`scope-${scope}`}
                    className="inline-flex items-center space-x-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                  >
                    <span>{SCOPE_ICONS[scope as keyof typeof SCOPE_ICONS] || '🔒'}</span>
                    <span>{scope}</span>
                    <button
                      onClick={() => handleMultiSelectChange('selectedScopes', scope, false)}
                      className="hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* No Filters Message */}
          {activeFilterCount === 0 && (
            <div className="text-xs text-gray-500 text-center py-2">
              No filters applied - showing all permissions
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PermissionFilters;