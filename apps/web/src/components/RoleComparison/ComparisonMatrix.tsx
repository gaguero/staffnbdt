import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { RoleComparisonData, PermissionMatrix } from '../../types/roleComparison';
import { Permission } from '../../types/permission';
import RoleBadge from '../RoleBadge';

interface ComparisonMatrixProps {
  roles: RoleComparisonData[];
  matrix: PermissionMatrix;
  className?: string;
}

interface MatrixViewSettings {
  groupByCategory: boolean;
  showOnlyDifferences: boolean;
  showDescriptions: boolean;
  searchTerm: string;
  expandedCategories: Set<string>;
}

const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  roles,
  matrix,
  className = '',
}) => {
  const [settings, setSettings] = useState<MatrixViewSettings>({
    groupByCategory: true,
    showOnlyDifferences: false,
    showDescriptions: false,
    searchTerm: '',
    expandedCategories: new Set(Object.keys(matrix.categories)),
  });
  
  // Filter permissions based on settings
  const filteredPermissions = useMemo(() => {
    let permissions = matrix.permissions;
    
    // Search filter
    if (settings.searchTerm) {
      const searchLower = settings.searchTerm.toLowerCase();
      permissions = permissions.filter(permission => {
        const searchableText = [
          permission.resource,
          permission.action,
          permission.scope,
          permission.description || '',
        ].join(' ').toLowerCase();
        return searchableText.includes(searchLower);
      });
    }
    
    // Show only differences filter
    if (settings.showOnlyDifferences) {
      permissions = permissions.filter(permission => {
        const permissionKey = `${permission.resource}.${permission.action}.${permission.scope}`;
        const rolesWithPermission = roles.filter(role => 
          matrix.rolePermissionMap[role.id][permissionKey]
        );
        return rolesWithPermission.length !== roles.length && rolesWithPermission.length !== 0;
      });
    }
    
    return permissions;
  }, [matrix.permissions, settings.searchTerm, settings.showOnlyDifferences, roles, matrix.rolePermissionMap]);
  
  // Group permissions by category if enabled
  const groupedPermissions = useMemo(() => {
    if (!settings.groupByCategory) {
      return { 'All Permissions': filteredPermissions };
    }
    
    const groups: Record<string, Permission[]> = {};
    filteredPermissions.forEach(permission => {
      const category = permission.resource;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    
    return groups;
  }, [filteredPermissions, settings.groupByCategory]);
  
  const handleCategoryToggle = (category: string) => {
    const newExpanded = new Set(settings.expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setSettings(prev => ({ ...prev, expandedCategories: newExpanded }));
  };
  
  const handleExpandAll = () => {
    setSettings(prev => ({ 
      ...prev, 
      expandedCategories: new Set(Object.keys(groupedPermissions)) 
    }));
  };
  
  const handleCollapseAll = () => {
    setSettings(prev => ({ ...prev, expandedCategories: new Set() }));
  };
  
  const getPermissionStatus = (permission: Permission, roleId: string) => {
    const permissionKey = `${permission.resource}.${permission.action}.${permission.scope}`;
    return matrix.rolePermissionMap[roleId][permissionKey] || false;
  };
  
  const getPermissionStatusIcon = (hasPermission: boolean, isShared: boolean, isUnique: boolean) => {
    if (hasPermission) {
      if (isShared) {
        return <CheckIcon className="h-4 w-4 text-green-600" />;
      } else if (isUnique) {
        return <CheckIcon className="h-4 w-4 text-blue-600" />;
      } else {
        return <CheckIcon className="h-4 w-4 text-gray-600" />;
      }
    }
    return <XMarkIcon className="h-4 w-4 text-gray-300" />;
  };
  
  const getPermissionCellClass = (hasPermission: boolean, isShared: boolean, isUnique: boolean) => {
    if (hasPermission) {
      if (isShared) {
        return 'bg-green-50 border-green-200';
      } else if (isUnique) {
        return 'bg-blue-50 border-blue-200';
      } else {
        return 'bg-gray-50 border-gray-200';
      }
    }
    return 'bg-red-50 border-red-200';
  };
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Permission Matrix</h3>
            <p className="text-sm text-gray-500 mt-1">
              Compare permissions across selected roles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Collapse All
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={settings.searchTerm}
              onChange={(e) => setSettings(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.groupByCategory}
                onChange={(e) => setSettings(prev => ({ ...prev, groupByCategory: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Group by category</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showOnlyDifferences}
                onChange={(e) => setSettings(prev => ({ ...prev, showOnlyDifferences: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Show only differences</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showDescriptions}
                onChange={(e) => setSettings(prev => ({ ...prev, showDescriptions: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Show descriptions</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1">
            <CheckIcon className="h-3 w-3 text-green-600" />
            <span className="text-gray-700">Shared by all roles</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckIcon className="h-3 w-3 text-blue-600" />
            <span className="text-gray-700">Unique to some roles</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckIcon className="h-3 w-3 text-gray-600" />
            <span className="text-gray-700">Has permission</span>
          </div>
          <div className="flex items-center gap-1">
            <XMarkIcon className="h-3 w-3 text-gray-300" />
            <span className="text-gray-700">No permission</span>
          </div>
        </div>
      </div>
      
      {/* Matrix Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Permission
              </th>
              {roles.map(role => (
                <th key={role.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col items-center gap-1">
                    <RoleBadge 
                      role={role.isSystemRole ? (role.systemRole || role.name) : role.name}
                      isCustomRole={!role.isSystemRole}
                      size="sm"
                      showTooltip={false}
                    />
                    <span className="text-xs text-gray-400">
                      {role.permissions.length} perms
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <React.Fragment key={category}>
                {/* Category Header (if grouping) */}
                {settings.groupByCategory && (
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td colSpan={roles.length + 1} className="px-6 py-2">
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        {settings.expandedCategories.has(category) ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                        <span className="capitalize">{category}</span>
                        <span className="text-xs text-gray-500">({permissions.length} permissions)</span>
                      </button>
                    </td>
                  </tr>
                )}
                
                {/* Permission Rows */}
                {(settings.expandedCategories.has(category) || !settings.groupByCategory) &&
                  permissions.map(permission => {
                    const permissionKey = `${permission.resource}.${permission.action}.${permission.scope}`;
                    const rolesWithPermission = roles.filter(role => 
                      matrix.rolePermissionMap[role.id][permissionKey]
                    );
                    const isShared = rolesWithPermission.length === roles.length;
                    const isUnique = rolesWithPermission.length === 1;
                    
                    return (
                      <tr key={permissionKey} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                                {permission.resource}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-mono">
                                {permission.action}
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded font-mono">
                                {permission.scope}
                              </span>
                            </div>
                            {settings.showDescriptions && permission.description && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </td>
                        
                        {roles.map(role => {
                          const hasPermission = getPermissionStatus(permission, role.id);
                          const cellClass = getPermissionCellClass(hasPermission, isShared, isUnique);
                          const icon = getPermissionStatusIcon(hasPermission, isShared, isUnique);
                          
                          return (
                            <td 
                              key={role.id} 
                              className={`px-4 py-4 text-center border ${cellClass}`}
                            >
                              <div className="flex items-center justify-center">
                                {icon}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        
        {/* Empty State */}
        {Object.keys(groupedPermissions).length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500">
              <div className="text-sm font-medium">No permissions found</div>
              <div className="text-xs mt-1">Try adjusting your search or filters</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonMatrix;
