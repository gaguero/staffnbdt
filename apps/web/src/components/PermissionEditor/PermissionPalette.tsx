import React, { useState, useMemo, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  StarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FunnelIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolidIcon,
  ClockIcon as ClockSolidIcon,
  SparklesIcon as SparklesSolidIcon
} from '@heroicons/react/24/solid';

import { 
  PermissionPaletteProps, 
  CategoryGroup, 
  PERMISSION_CATEGORIES 
} from '../../types/permissionEditor';
import { Permission } from '../../types/permission';
import PermissionCard from './PermissionCard';

const PermissionPalette: React.FC<PermissionPaletteProps> = ({
  permissions,
  selectedPermissions,
  searchQuery,
  activeCategory,
  onPermissionSelect,
  onCategoryChange,
  onSearchChange,
  className = '',
  showCategories = true,
  showSearch = true,
  showRecommendations = true
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(PERMISSION_CATEGORIES))
  );
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'popular' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'usage'>('category');

  // Group permissions by category
  const categorizedPermissions = useMemo(() => {
    const categories: Record<string, CategoryGroup> = { ...PERMISSION_CATEGORIES };

    // Initialize categories
    Object.keys(categories).forEach(key => {
      categories[key] = {
        ...categories[key],
        permissions: [],
        count: 0,
        selectedCount: 0,
        isExpanded: expandedCategories.has(key)
      };
    });

    // Categorize permissions
    permissions.forEach(permission => {
      const categoryKey = permission.resource || 'system';
      if (categories[categoryKey]) {
        categories[categoryKey].permissions.push(permission);
        categories[categoryKey].count++;
        if (selectedPermissions.has(permission.id)) {
          categories[categoryKey].selectedCount++;
        }
      } else {
        // Create dynamic category for unknown resources
        if (!categories[categoryKey]) {
          categories[categoryKey] = {
            id: categoryKey,
            name: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
            description: `Permissions for ${categoryKey} management`,
            icon: '🔧',
            color: 'gray',
            permissions: [],
            count: 0,
            selectedCount: 0,
            isExpanded: expandedCategories.has(categoryKey)
          };
        }
        categories[categoryKey].permissions.push(permission);
        categories[categoryKey].count++;
        if (selectedPermissions.has(permission.id)) {
          categories[categoryKey].selectedCount++;
        }
      }
    });

    return categories;
  }, [permissions, selectedPermissions, expandedCategories]);

  // Filter permissions based on search and active category
  const filteredPermissions = useMemo(() => {
    let filtered = permissions;

    // Apply category filter
    if (activeCategory) {
      filtered = filtered.filter(permission => permission.resource === activeCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(permission =>
        permission.name?.toLowerCase().includes(query) ||
        permission.description?.toLowerCase().includes(query) ||
        permission.resource?.toLowerCase().includes(query) ||
        permission.action?.toLowerCase().includes(query) ||
        permission.scope?.toLowerCase().includes(query) ||
        `${permission.resource}.${permission.action}.${permission.scope}`.toLowerCase().includes(query)
      );
    }

    // Sort permissions
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'category':
        filtered.sort((a, b) => {
          const categoryCompare = (a.resource || '').localeCompare(b.resource || '');
          if (categoryCompare !== 0) return categoryCompare;
          return (a.name || '').localeCompare(b.name || '');
        });
        break;
      case 'usage':
        // Sort by popularity/usage if available
        filtered.sort((a, b) => {
          const aUsage = (a as any).popularity || 0;
          const bUsage = (b as any).popularity || 0;
          return bUsage - aUsage;
        });
        break;
    }

    return filtered;
  }, [permissions, activeCategory, searchQuery, sortBy]);

  // Get recommended permissions
  const recommendedPermissions = useMemo(() => {
    // Mock implementation - would be based on role analysis
    return permissions
      .filter(permission => !selectedPermissions.has(permission.id))
      .slice(0, 10);
  }, [permissions, selectedPermissions]);

  // Get popular permissions
  const popularPermissions = useMemo(() => {
    // Mock implementation - would be based on usage statistics
    return permissions
      .filter(permission => !selectedPermissions.has(permission.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
  }, [permissions, selectedPermissions]);

  // Get recently used permissions
  const recentPermissions = useMemo(() => {
    // Mock implementation - would be based on recent usage
    return permissions
      .filter(permission => !selectedPermissions.has(permission.id))
      .slice(0, 8);
  }, [permissions, selectedPermissions]);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Handle permission selection
  const handlePermissionSelect = useCallback((permission: Permission) => {
    onPermissionSelect(permission);
  }, [onPermissionSelect]);

  // Render permission list for a category
  const renderPermissionList = useCallback((permissionList: Permission[], title?: string) => (
    <div className="space-y-1">
      {title && (
        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
          {title}
        </div>
      )}
      {permissionList.length === 0 ? (
        <div className="px-3 py-4 text-center text-gray-500 text-sm">
          <InformationCircleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No permissions found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        permissionList.map(permission => (
          <div
            key={permission.id}
            className="group relative"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'permission',
                permission
              }));
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            <div
              className={`mx-2 mb-1 p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${
                selectedPermissions.has(permission.id)
                  ? 'border-green-300 bg-green-50 opacity-60 cursor-default'
                  : 'border-gray-200 hover:shadow-sm'
              }`}
              onClick={() => !selectedPermissions.has(permission.id) && handlePermissionSelect(permission)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {permission.name || `${permission.resource}.${permission.action}`}
                    </span>
                    {selectedPermissions.has(permission.id) && (
                      <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                        Added
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                      {permission.resource}
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {permission.action}
                    </span>
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                      {permission.scope}
                    </span>
                  </div>
                  {permission.description && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {permission.description}
                    </p>
                  )}
                </div>
                
                {!selectedPermissions.has(permission.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePermissionSelect(permission);
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    title="Add to role"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  ), [selectedPermissions, handlePermissionSelect]);

  // Render category view
  const renderCategoryView = useCallback(() => (
    <div className="space-y-2">
      {Object.values(categorizedPermissions)
        .filter(category => category.count > 0)
        .filter(category => !activeCategory || category.id === activeCategory)
        .map(category => (
          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{category.icon}</span>
                <div className="text-left">
                  <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {category.selectedCount}/{category.count}
                </span>
                {category.selectedCount > 0 && (
                  <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(category.selectedCount / category.count) * 100}%` }}
                    />
                  </div>
                )}
                {category.isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </button>

            {/* Category Content */}
            {category.isExpanded && (
              <div className="max-h-80 overflow-y-auto">
                {renderPermissionList(
                  category.permissions.filter(p => 
                    !searchQuery || 
                    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                )}
              </div>
            )}
          </div>
        ))}
    </div>
  ), [categorizedPermissions, activeCategory, toggleCategory, renderPermissionList, searchQuery]);

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header with Tabs */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Permission Palette</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSortBy(sortBy === 'name' ? 'category' : sortBy === 'category' ? 'usage' : 'name')}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Change sort order"
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-3 py-2 space-x-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
              activeTab === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MagnifyingGlassIcon className="h-3 w-3" />
            <span>All</span>
            <span className="bg-white text-gray-500 px-1 py-0.5 rounded text-xs">
              {filteredPermissions.length}
            </span>
          </button>

          {showRecommendations && (
            <button
              onClick={() => setActiveTab('recommended')}
              className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                activeTab === 'recommended'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {activeTab === 'recommended' ? (
                <SparklesSolidIcon className="h-3 w-3" />
              ) : (
                <SparklesIcon className="h-3 w-3" />
              )}
              <span>Recommended</span>
              <span className="bg-white text-gray-500 px-1 py-0.5 rounded text-xs">
                {recommendedPermissions.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('popular')}
            className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
              activeTab === 'popular'
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {activeTab === 'popular' ? (
              <StarSolidIcon className="h-3 w-3" />
            ) : (
              <StarIcon className="h-3 w-3" />
            )}
            <span>Popular</span>
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
              activeTab === 'recent'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {activeTab === 'recent' ? (
              <ClockSolidIcon className="h-3 w-3" />
            ) : (
              <ClockIcon className="h-3 w-3" />
            )}
            <span>Recent</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'all' && showCategories && renderCategoryView()}
        
        {activeTab === 'all' && !showCategories && renderPermissionList(filteredPermissions)}
        
        {activeTab === 'recommended' && renderPermissionList(recommendedPermissions, 'Recommended for this role')}
        
        {activeTab === 'popular' && renderPermissionList(popularPermissions, 'Most commonly used permissions')}
        
        {activeTab === 'recent' && renderPermissionList(recentPermissions, 'Recently used permissions')}
      </div>

      {/* Footer with Summary */}
      <div className="border-t border-gray-100 p-3 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>
            {activeTab === 'all' 
              ? `${filteredPermissions.length} of ${permissions.length} permissions`
              : activeTab === 'recommended'
              ? `${recommendedPermissions.length} recommendations`
              : activeTab === 'popular'
              ? `${popularPermissions.length} popular permissions`
              : `${recentPermissions.length} recent permissions`
            }
          </span>
          <span>
            Drag to add
          </span>
        </div>
      </div>
    </div>
  );
};

export default PermissionPalette;