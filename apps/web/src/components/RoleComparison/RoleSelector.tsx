import React, { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { RoleComparisonData, ComparisonFilters } from '../../types/roleComparison';
import RoleBadge from '../RoleBadge';

interface RoleSelectorProps {
  availableRoles: RoleComparisonData[];
  selectedRoles: RoleComparisonData[];
  maxRoles: number;
  onSelectRole: (roleId: string) => void;
  onUnselectRole: (roleId: string) => void;
  filters: ComparisonFilters;
  onFiltersChange: (filters: Partial<ComparisonFilters>) => void;
  className?: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  availableRoles,
  selectedRoles,
  maxRoles,
  onSelectRole,
  onUnselectRole,
  filters,
  onFiltersChange,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const canAddMore = selectedRoles.length < maxRoles;
  
  // Filter and search roles
  const filteredRoles = useMemo(() => {
    return availableRoles.filter(role => {
      // Role type filter
      if (filters.roleTypes.length > 0) {
        const roleType = role.isSystemRole ? 'system' : 'custom';
        if (!filters.roleTypes.includes(roleType)) return false;
      }
      
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      if (searchLower) {
        const nameMatch = role.name.toLowerCase().includes(searchLower);
        const descMatch = role.description?.toLowerCase().includes(searchLower) || false;
        if (!nameMatch && !descMatch) return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort system roles first, then by name
      if (a.isSystemRole && !b.isSystemRole) return -1;
      if (!a.isSystemRole && b.isSystemRole) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [availableRoles, filters, searchTerm]);
  
  const handleRoleToggle = (role: RoleComparisonData) => {
    const isSelected = selectedRoles.some(r => r.id === role.id);
    
    if (isSelected) {
      onUnselectRole(role.id);
    } else if (canAddMore) {
      onSelectRole(role.id);
    }
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  const handleFilterToggle = (filterType: keyof ComparisonFilters, value: string) => {
    const currentFilters = filters[filterType] as string[];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(f => f !== value)
      : [...currentFilters, value];
    
    onFiltersChange({ [filterType]: newFilters });
  };
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Select Roles to Compare</h3>
            <p className="text-sm text-gray-500 mt-1">
              Choose {maxRoles - selectedRoles.length > 0 ? `up to ${maxRoles - selectedRoles.length} more` : 'maximum reached'} role{maxRoles - selectedRoles.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {selectedRoles.length}/{maxRoles} selected
          </div>
        </div>
      </div>
      
      {/* Selected Roles */}
      {selectedRoles.length > 0 && (
        <div className="px-4 py-3 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Roles</h4>
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map(role => (
              <div key={role.id} className="relative group">
                <div className="flex items-center gap-1 bg-white rounded-full border border-gray-300 pl-2 pr-1 py-1">
                  <RoleBadge 
                    role={role.isSystemRole ? (role.systemRole || role.name) : role.name}
                    isCustomRole={!role.isSystemRole}
                    size="sm"
                    showTooltip={false}
                    className="border-0 bg-transparent"
                  />
                  <button
                    onClick={() => onUnselectRole(role.id)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    title="Remove role"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <div className="flex gap-2">
              {['system', 'custom'].map(type => (
                <label key={type} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.roleTypes.includes(type as 'system' | 'custom')}
                    onChange={() => handleFilterToggle('roleTypes', type)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {isExpanded ? 'Less filters' : 'More filters'}
          </button>
        </div>
        
        {/* Advanced Filters */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Additional filtering options coming soon...
            </div>
          </div>
        )}
      </div>
      
      {/* Role List */}
      <div className="border-t border-gray-200">
        <div className="max-h-96 overflow-y-auto">
          {filteredRoles.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="text-sm">No roles found</div>
              <div className="text-xs mt-1">Try adjusting your search or filters</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRoles.map(role => {
                const isSelected = selectedRoles.some(r => r.id === role.id);
                const canSelect = canAddMore || isSelected;
                
                return (
                  <div
                    key={role.id}
                    className={`
                      px-4 py-3 hover:bg-gray-50 transition-colors
                      ${!canSelect && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                    `}
                    onClick={() => canSelect && handleRoleToggle(role)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`
                            w-4 h-4 rounded border-2 flex items-center justify-center
                            ${isSelected 
                              ? 'bg-blue-600 border-blue-600' 
                              : canSelect 
                                ? 'border-gray-300 hover:border-blue-500' 
                                : 'border-gray-200'
                            }
                          `}>
                            {isSelected && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          
                          <RoleBadge 
                            role={role.isSystemRole ? (role.systemRole || role.name) : role.name}
                            isCustomRole={!role.isSystemRole}
                            size="sm"
                            showTooltip={false}
                          />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">
                              {role.name}
                            </span>
                            {role.isSystemRole && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                System
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-500 truncate mt-0.5">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="text-right">
                          <div>{role.permissions.length} permissions</div>
                          {role.userCount !== undefined && (
                            <div>{role.userCount} users</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{filteredRoles.length} roles available</span>
          <span>Select at least 2 roles to compare</span>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
