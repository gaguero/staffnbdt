import React, { useState, useCallback } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { SearchFilters, PERMISSION_CATEGORIES } from '../../types/permissionSearch';

interface PermissionSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onReset: () => void;
  className?: string;
  compact?: boolean;
}

const AVAILABLE_RESOURCES = [
  'user', 'document', 'vacation', 'training', 'payslip', 'task',
  'unit', 'reservation', 'guest', 'permission', 'role', 'audit',
  'organization', 'property', 'department'
];

const AVAILABLE_ACTIONS = [
  'create', 'read', 'update', 'delete', 'approve', 'reject',
  'assign', 'revoke', 'grant', 'export', 'import'
];

const AVAILABLE_SCOPES = [
  'own', 'department', 'property', 'organization', 'platform'
];

export const PermissionSearchFilters: React.FC<PermissionSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  className = '',
  compact = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const handleMultiSelect = useCallback((key: keyof SearchFilters, value: string) => {
    const currentValues = filters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ [key]: newValues });
  }, [filters, onFiltersChange]);

  const handleToggle = useCallback((key: keyof SearchFilters) => {
    onFiltersChange({ [key]: !filters[key] });
  }, [filters, onFiltersChange]);

  const hasActiveFilters = 
    filters.resources.length > 0 ||
    filters.actions.length > 0 ||
    filters.scopes.length > 0 ||
    filters.categories.length > 0 ||
    !filters.includeSystemPermissions ||
    !filters.includeConditionalPermissions;

  if (compact) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </h4>
          
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Categories */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Categories</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.values(PERMISSION_CATEGORIES).map(category => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.name)}
                    onChange={() => handleMultiSelect('categories', category.name)}
                    className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-xs text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Options */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.includeSystemPermissions}
                  onChange={() => handleToggle('includeSystemPermissions')}
                  className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-xs text-gray-700">System Permissions</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.includeConditionalPermissions}
                  onChange={() => handleToggle('includeConditionalPermissions')}
                  className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-xs text-gray-700">Conditional Permissions</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Advanced Filters
            {hasActiveFilters && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {[
                  filters.resources.length && `${filters.resources.length} resources`,
                  filters.actions.length && `${filters.actions.length} actions`,
                  filters.scopes.length && `${filters.scopes.length} scopes`,
                  filters.categories.length && `${filters.categories.length} categories`,
                ].filter(Boolean).join(', ') || 'Active'}
              </span>
            )}
          </h3>
          
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Filters */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('basic')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">Basic Filters</h4>
            {expandedSections.has('basic') ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.has('basic') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Resources */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resources
                  {filters.resources.length > 0 && (
                    <span className="ml-1 text-blue-600">({filters.resources.length})</span>
                  )}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {AVAILABLE_RESOURCES.map(resource => (
                    <label key={resource} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.resources.includes(resource)}
                        onChange={() => handleMultiSelect('resources', resource)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{resource}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actions
                  {filters.actions.length > 0 && (
                    <span className="ml-1 text-blue-600">({filters.actions.length})</span>
                  )}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {AVAILABLE_ACTIONS.map(action => (
                    <label key={action} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.actions.includes(action)}
                        onChange={() => handleMultiSelect('actions', action)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{action}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scopes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scopes
                  {filters.scopes.length > 0 && (
                    <span className="ml-1 text-blue-600">({filters.scopes.length})</span>
                  )}
                </label>
                <div className="space-y-2">
                  {AVAILABLE_SCOPES.map(scope => (
                    <label key={scope} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.scopes.includes(scope)}
                        onChange={() => handleMultiSelect('scopes', scope)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">
              Categories
              {filters.categories.length > 0 && (
                <span className="ml-2 text-blue-600">({filters.categories.length} selected)</span>
              )}
            </h4>
            {expandedSections.has('categories') ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.has('categories') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(PERMISSION_CATEGORIES).map(category => (
                <label
                  key={category.id}
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                    ${filters.categories.includes(category.name)
                      ? `border-${category.color}-200 bg-${category.color}-50`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.name)}
                    onChange={() => handleMultiSelect('categories', category.name)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <h5 className="text-sm font-medium text-gray-900">{category.name}</h5>
                    <p className="text-xs text-gray-600 mt-0.5">{category.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('advanced')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">Advanced Options</h4>
            {expandedSections.has('advanced') ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.has('advanced') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-900">System Permissions</label>
                    <p className="text-xs text-gray-600 mt-0.5">Include built-in system permissions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.includeSystemPermissions}
                    onChange={() => handleToggle('includeSystemPermissions')}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Conditional Permissions</label>
                    <p className="text-xs text-gray-600 mt-0.5">Include permissions with conditions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.includeConditionalPermissions}
                    onChange={() => handleToggle('includeConditionalPermissions')}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Popularity Threshold */}
              {filters.popularityThreshold !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Popularity Threshold: {filters.popularityThreshold}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.popularityThreshold}
                    onChange={(e) => onFiltersChange({ popularityThreshold: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Less Popular</span>
                    <span>More Popular</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionSearchFilters;
