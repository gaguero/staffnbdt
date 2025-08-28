import React, { useState, useMemo } from 'react';
import { 
  Plus as PlusIcon, 
  Minus as MinusIcon, 
  Check as CheckIcon,
  Search as MagnifyingGlassIcon,
  Filter as FunnelIcon,
} from 'lucide-react';
import { RoleComparisonData, PermissionDifferences } from '../../types/roleComparison';
import { Permission } from '../../types/permission';
import RoleBadge from '../RoleBadge';

interface ComparisonDiffProps {
  roles: RoleComparisonData[];
  differences: PermissionDifferences;
  className?: string;
}

interface DiffViewSettings {
  selectedRole?: string;
  showShared: boolean;
  showUnique: boolean;
  showMissing: boolean;
  searchTerm: string;
  categoryFilter: string;
}

const ComparisonDiff: React.FC<ComparisonDiffProps> = ({
  roles,
  differences,
  className = '',
}) => {
  const [settings, setSettings] = useState<DiffViewSettings>({
    selectedRole: roles[0]?.id,
    showShared: true,
    showUnique: true,
    showMissing: true,
    searchTerm: '',
    categoryFilter: '',
  });
  
  // Get all categories from permissions
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    
    // From shared permissions
    differences.shared.forEach(permission => {
      categories.add(permission.resource);
    });
    
    // From unique permissions
    Object.values(differences.unique).forEach(permissions => {
      permissions.forEach(permission => {
        categories.add(permission.resource);
      });
    });
    
    // From missing permissions
    Object.values(differences.missing).forEach(permissions => {
      permissions.forEach(permission => {
        categories.add(permission.resource);
      });
    });
    
    return Array.from(categories).sort();
  }, [differences]);
  
  const selectedRole = roles.find(role => role.id === settings.selectedRole);
  
  // Filter permissions based on search and category
  const filterPermissions = (permissions: Permission[]) => {
    return permissions.filter(permission => {
      // Search filter
      if (settings.searchTerm) {
        const searchLower = settings.searchTerm.toLowerCase();
        const searchableText = [
          permission.resource,
          permission.action,
          permission.scope,
          permission.description || '',
        ].join(' ').toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }
      
      // Category filter
      if (settings.categoryFilter && permission.resource !== settings.categoryFilter) {
        return false;
      }
      
      return true;
    });
  };
  
  const filteredShared = filterPermissions(differences.shared);
  const filteredUnique = selectedRole ? filterPermissions(differences.unique[selectedRole.id] || []) : [];
  const filteredMissing = selectedRole ? filterPermissions(differences.missing[selectedRole.id] || []) : [];
  
  const PermissionItem: React.FC<{ 
    permission: Permission; 
    type: 'shared' | 'unique' | 'missing';
  }> = ({ permission, type }) => {
    const getTypeColor = () => {
      switch (type) {
        case 'shared':
          return 'border-green-200 bg-green-50';
        case 'unique':
          return 'border-blue-200 bg-blue-50';
        case 'missing':
          return 'border-red-200 bg-red-50';
      }
    };
    
    const getTypeIcon = () => {
      switch (type) {
        case 'shared':
          return <CheckIcon className="h-4 w-4 text-green-600" />;
        case 'unique':
          return <PlusIcon className="h-4 w-4 text-blue-600" />;
        case 'missing':
          return <MinusIcon className="h-4 w-4 text-red-600" />;
      }
    };
    
    return (
      <div className={`p-3 border rounded-lg ${getTypeColor()}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getTypeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
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
            {permission.description && (
              <p className="text-sm text-gray-600">{permission.description}</p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Permission Differences</h3>
            <p className="text-sm text-gray-500 mt-1">
              Detailed comparison of permissions between roles
            </p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Role Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Focus on:</label>
            <select
              value={settings.selectedRole || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, selectedRole: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={settings.searchTerm}
              onChange={(e) => setSettings(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={settings.categoryFilter}
              onChange={(e) => setSettings(prev => ({ ...prev, categoryFilter: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All categories</option>
              {allCategories.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* View Toggles */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700">Show:</div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showShared}
              onChange={(e) => setSettings(prev => ({ ...prev, showShared: e.target.checked }))}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700">Shared permissions</span>
            <span className="text-xs text-gray-500">({filteredShared.length})</span>
          </label>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showUnique}
              onChange={(e) => setSettings(prev => ({ ...prev, showUnique: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Unique permissions</span>
            <span className="text-xs text-gray-500">({filteredUnique.length})</span>
          </label>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showMissing}
              onChange={(e) => setSettings(prev => ({ ...prev, showMissing: e.target.checked }))}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Missing permissions</span>
            <span className="text-xs text-gray-500">({filteredMissing.length})</span>
          </label>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-8">
        {selectedRole && (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Analyzing permissions for:</span>
              <RoleBadge 
                role={selectedRole.isSystemRole ? (selectedRole.systemRole || selectedRole.name) : selectedRole.name}
                isCustomRole={!selectedRole.isSystemRole}
                size="md"
              />
            </div>
          </div>
        )}
        
        {/* Shared Permissions */}
        {settings.showShared && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckIcon className="h-5 w-5 text-green-600" />
              <h4 className="text-base font-medium text-gray-900">
                Shared Permissions
              </h4>
              <span className="text-sm text-gray-500">({filteredShared.length})</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Permissions that all selected roles have in common
            </p>
            {filteredShared.length > 0 ? (
              <div className="grid gap-3">
                {filteredShared.map((permission) => (
                  <PermissionItem 
                    key={`${permission.resource}.${permission.action}.${permission.scope}`} 
                    permission={permission} 
                    type="shared" 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <div className="text-sm">No shared permissions found</div>
              </div>
            )}
          </div>
        )}
        
        {/* Unique Permissions */}
        {settings.showUnique && selectedRole && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PlusIcon className="h-5 w-5 text-blue-600" />
              <h4 className="text-base font-medium text-gray-900">
                Unique to {selectedRole.name}
              </h4>
              <span className="text-sm text-gray-500">({filteredUnique.length})</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Permissions that only this role has (not shared with other selected roles)
            </p>
            {filteredUnique.length > 0 ? (
              <div className="grid gap-3">
                {filteredUnique.map((permission) => (
                  <PermissionItem 
                    key={`${permission.resource}.${permission.action}.${permission.scope}`} 
                    permission={permission} 
                    type="unique" 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PlusIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <div className="text-sm">No unique permissions found</div>
              </div>
            )}
          </div>
        )}
        
        {/* Missing Permissions */}
        {settings.showMissing && selectedRole && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MinusIcon className="h-5 w-5 text-red-600" />
              <h4 className="text-base font-medium text-gray-900">
                Missing from {selectedRole.name}
              </h4>
              <span className="text-sm text-gray-500">({filteredMissing.length})</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Permissions that other selected roles have but this role doesn't
            </p>
            {filteredMissing.length > 0 ? (
              <div className="grid gap-3">
                {filteredMissing.map((permission) => (
                  <PermissionItem 
                    key={`${permission.resource}.${permission.action}.${permission.scope}`} 
                    permission={permission} 
                    type="missing" 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MinusIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <div className="text-sm">No missing permissions found</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonDiff;
