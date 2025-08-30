import React, { useState, useMemo } from 'react';
import { EffectivePermissions } from '../../hooks/useUserRoleManagement';

interface UserPermissionPreviewProps {
  userId: string;
  userName: string;
  effectivePermissions: EffectivePermissions;
  isOpen: boolean;
  onClose: () => void;
}

const UserPermissionPreview: React.FC<UserPermissionPreviewProps> = ({
  userId: _userId,
  userName,
  effectivePermissions,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'by_source'>('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  if (!isOpen) return null;

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const groups: Record<string, typeof effectivePermissions.permissions> = {};
    
    effectivePermissions.permissions.forEach(permission => {
      const category = permission.resource;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    
    return groups;
  }, [effectivePermissions.permissions]);

  // Group permissions by source
  const permissionsBySource = useMemo(() => {
    const groups: Record<string, typeof effectivePermissions.permissions> = {};
    
    effectivePermissions.permissions.forEach(permission => {
      const key = `${permission.source}_${permission.sourceRole}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(permission);
    });
    
    return groups;
  }, [effectivePermissions.permissions]);

  // Filter permissions based on search and filters
  const filteredPermissions = useMemo(() => {
    let filtered = effectivePermissions.permissions;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(permission =>
        permission.resource.toLowerCase().includes(searchLower) ||
        permission.action.toLowerCase().includes(searchLower) ||
        permission.scope.toLowerCase().includes(searchLower) ||
        permission.sourceRole.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(permission => permission.resource === selectedCategory);
    }
    
    if (selectedSource !== 'all') {
      filtered = filtered.filter(permission => permission.source === selectedSource);
    }
    
    return filtered;
  }, [effectivePermissions.permissions, searchTerm, selectedCategory, selectedSource]);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'system_role':
        return '🏢';
      case 'custom_role':
        return '⚙️';
      default:
        return '📝';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'system_role':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'custom_role':
        return 'bg-green-50 text-green-800 border-green-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'platform':
        return 'bg-red-50 text-red-800';
      case 'organization':
        return 'bg-purple-50 text-purple-800';
      case 'property':
        return 'bg-orange-50 text-orange-800';
      case 'department':
        return 'bg-blue-50 text-blue-800';
      case 'own':
        return 'bg-green-50 text-green-800';
      default:
        return 'bg-gray-50 text-gray-800';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'text-red-600 bg-red-100';
      case 'High':
        return 'text-orange-600 bg-orange-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Low':
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Effective Permissions
              </h2>
              <p className="text-sm text-gray-600">{userName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {effectivePermissions.permissionCount.total}
              </div>
              <div className="text-sm text-blue-800">Total Permissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(effectivePermissions.permissionCount.byCategory).length}
              </div>
              <div className="text-sm text-purple-800">Categories</div>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                getSecurityLevelColor(effectivePermissions.securityLevel)
              }`}>
                {effectivePermissions.securityLevel}
              </div>
              <div className="text-sm text-gray-600 mt-1">Security Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {new Set(effectivePermissions.permissions.map(p => p.sourceRole)).size}
              </div>
              <div className="text-sm text-gray-800">Permission Sources</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'detailed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Detailed View
            </button>
            <button
              onClick={() => setActiveTab('by_source')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'by_source'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              By Source
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {activeTab === 'summary' && (
            <div className="p-6 space-y-6">
              {/* Permission Categories */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions by Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(effectivePermissions.permissionCount.byCategory).map(([category, count]) => (
                    <div key={category} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {category.replace('_', ' ')}
                          </div>
                          <div className="text-2xl font-bold text-blue-600">{count}</div>
                        </div>
                        <div className="text-gray-400">
                          {Math.round((count / effectivePermissions.permissionCount.total) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Breakdown */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Sources</h3>
                <div className="space-y-3">
                  {Object.entries(permissionsBySource).map(([sourceKey, permissions]) => {
                    const source = permissions[0].source;
                    const sourceRole = permissions[0].sourceRole;
                    
                    return (
                      <div key={sourceKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getSourceIcon(source)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{sourceRole}</div>
                            <div className="text-sm text-gray-600 capitalize">
                              {source.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                          {permissions.length} permissions
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'detailed' && (
            <div className="p-6 space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {Object.keys(permissionsByCategory).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sources</option>
                  <option value="system_role">System Roles</option>
                  <option value="custom_role">Custom Roles</option>
                </select>
              </div>

              {/* Permission List */}
              <div className="space-y-2">
                {filteredPermissions.length > 0 ? (
                  filteredPermissions.map((permission, index) => (
                    <div key={`${permission.resource}-${permission.action}-${permission.scope}-${index}`} 
                         className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-mono text-sm text-gray-900">
                          {permission.resource}.{permission.action}.{permission.scope}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          From: {permission.sourceRole} ({permission.source.replace('_', ' ')})
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getScopeColor(permission.scope)
                        }`}>
                          {permission.scope}
                        </span>
                        <span className={`px-2 py-1 rounded border text-xs ${
                          getSourceColor(permission.source)
                        }`}>
                          {getSourceIcon(permission.source)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No permissions found matching your filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'by_source' && (
            <div className="p-6 space-y-4">
              {Object.entries(permissionsBySource).map(([sourceKey, permissions]) => {
                const source = permissions[0].source;
                const sourceRole = permissions[0].sourceRole;
                
                return (
                  <div key={sourceKey} className="border border-gray-200 rounded-lg">
                    <div className={`px-4 py-3 border-b border-gray-200 ${
                      source === 'system_role' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getSourceIcon(source)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{sourceRole}</div>
                            <div className="text-sm text-gray-600 capitalize">
                              {source.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                          {permissions.length} permissions
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {permissions.map((permission, index) => (
                          <div key={index} className="font-mono text-xs bg-gray-50 p-2 rounded border">
                            <div className="text-gray-900">
                              {permission.resource}.{permission.action}
                            </div>
                            <div className={`mt-1 px-1 rounded text-xs ${
                              getScopeColor(permission.scope)
                            }`}>
                              {permission.scope}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {activeTab === 'detailed' && (
                <span>Showing {filteredPermissions.length} of {effectivePermissions.permissionCount.total} permissions</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionPreview;