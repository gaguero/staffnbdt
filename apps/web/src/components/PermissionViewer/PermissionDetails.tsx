import React from 'react';
import {
  X,
  Clock,
  Shield,
  Tag,
  Info,
  Users,
  BarChart3,
} from 'lucide-react';
import { 
  PermissionDetailsProps,
  RESOURCE_ICONS,
  ACTION_ICONS,
  SCOPE_ICONS 
} from '../../types/permissionViewer';

export const PermissionDetails: React.FC<PermissionDetailsProps> = ({
  permission,
  usageStats,
  relationships,
  onClose,
  className = '',
}) => {
  if (!permission) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Info className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Select a permission to view details</p>
        </div>
      </div>
    );
  }

  // Format permission name
  const permissionName = `${permission.resource}.${permission.action}.${permission.scope}`;

  // Get permission badge color based on scope
  const getScopeBadgeColor = (scope: string) => {
    switch (scope) {
      case 'platform':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'organization':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'property':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'department':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'own':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl" title={`${permission.resource} permission`}>
                {RESOURCE_ICONS[permission.resource as keyof typeof RESOURCE_ICONS] || '📝'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{permissionName}</h3>
              {permission.description && (
                <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Basic Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Permission Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-lg" title="Resource">
                {RESOURCE_ICONS[permission.resource as keyof typeof RESOURCE_ICONS] || '📝'}
              </span>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</div>
                <div className="text-sm font-medium text-gray-900 capitalize">{permission.resource}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-lg" title="Action">
                {ACTION_ICONS[permission.action as keyof typeof ACTION_ICONS] || '⚡'}
              </span>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Action</div>
                <div className="text-sm font-medium text-gray-900 capitalize">{permission.action}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-lg" title="Scope">
                {SCOPE_ICONS[permission.scope as keyof typeof SCOPE_ICONS] || '🔒'}
              </span>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScopeBadgeColor(permission.scope)}`}>
                  {permission.scope}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Permission ID</div>
                <div className="text-sm font-mono text-gray-900 break-all">{permission.id}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Metadata
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</div>
              <div className="text-sm text-gray-900">{formatDate(permission.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</div>
              <div className="text-sm text-gray-900">{formatDate(permission.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        {permission.conditions && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Conditions
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <pre className="text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(permission.conditions, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Usage Statistics */}
        {usageStats && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage Statistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{usageStats.usageCount}</div>
                <div className="text-xs text-gray-500">Total Uses</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900">{usageStats.topRoles.length}</div>
                <div className="text-xs text-gray-500">Roles</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900">{usageStats.topUsers.length}</div>
                <div className="text-xs text-gray-500">Users</div>
              </div>
            </div>

            {usageStats.lastUsed && (
              <div className="mt-3 text-xs text-gray-500">
                Last used: {formatDate(usageStats.lastUsed)}
              </div>
            )}

            {/* Top Roles */}
            {usageStats.topRoles.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-500 mb-2">Top Roles</div>
                <div className="space-y-1">
                  {usageStats.topRoles.slice(0, 3).map((role, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{role.roleName}</span>
                      <span className="text-gray-500">{role.count} uses</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Relationships */}
        {relationships && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Related Permissions
            </h4>
            
            {relationships.relatedPermissions.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-2">Related</div>
                <div className="flex flex-wrap gap-1">
                  {relationships.relatedPermissions.slice(0, 5).map(relatedId => (
                    <span key={relatedId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {relatedId}
                    </span>
                  ))}
                  {relationships.relatedPermissions.length > 5 && (
                    <span className="text-xs text-gray-500">+{relationships.relatedPermissions.length - 5} more</span>
                  )}
                </div>
              </div>
            )}

            {relationships.dependencies.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-2">Dependencies</div>
                <div className="flex flex-wrap gap-1">
                  {relationships.dependencies.map(depId => (
                    <span key={depId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      {depId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {relationships.conflicts.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Conflicts</div>
                <div className="flex flex-wrap gap-1">
                  {relationships.conflicts.map(conflictId => (
                    <span key={conflictId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      {conflictId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scope Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Scope: {permission.scope}</h5>
          <p className="text-sm text-blue-800">
            {permission.scope === 'platform' && 'This permission grants access across the entire platform, affecting all organizations and properties.'}
            {permission.scope === 'organization' && 'This permission is scoped to the user\'s organization and all properties within it.'}
            {permission.scope === 'property' && 'This permission is limited to the user\'s assigned property and its departments.'}
            {permission.scope === 'department' && 'This permission only applies within the user\'s specific department.'}
            {permission.scope === 'own' && 'This permission only allows access to the user\'s own resources and data.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigator.clipboard.writeText(permissionName)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Copy Permission Name
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(permission.id)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Copy Permission ID
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(permission, null, 2))}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Copy JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionDetails;