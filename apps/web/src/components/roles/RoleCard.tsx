import React from 'react';
import { Role } from '../../services/roleService';

interface RoleCardProps {
  role: Role;
  onClick?: (role: Role) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  compact?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, onClick, onEdit, onDelete, compact = false }) => {
  const getLevelBadgeColor = (level: number) => {
    if (level >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (level >= 70) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (level >= 30) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getLevelLabel = (level: number) => {
    if (level >= 90) return 'Platform Admin';
    if (level >= 70) return 'Organization Admin';
    if (level >= 50) return 'Property Manager';
    if (level >= 30) return 'Department Admin';
    return 'Staff';
  };

  const getPermissionGroups = () => {
    const groups: Record<string, number> = {};
    role.permissions.forEach(permission => {
      groups[permission.resource] = (groups[permission.resource] || 0) + 1;
    });
    return groups;
  };

  if (compact) {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onClick?.(role)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{role.name}</h3>
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium border
                ${getLevelBadgeColor(role.level)}
              `}>
                Level {role.level}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{role.description}</p>
          </div>
          <div className="text-right ml-4">
            <div className="text-lg font-bold text-blue-600">{role.userCount}</div>
            <div className="text-sm text-gray-500">Users</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onClick?.(role)}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{role.name}</h3>
              <span className={`
                px-3 py-1 rounded-full text-xs font-medium border
                ${getLevelBadgeColor(role.level)}
              `}>
                Level {role.level} - {getLevelLabel(role.level)}
              </span>
            </div>
            <p className="text-gray-600">{role.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(role);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit role"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(role);
                }}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete role"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{role.userCount}</div>
            <div className="text-sm text-gray-600">Assigned Users</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{role.permissions.length}</div>
            <div className="text-sm text-gray-600">Permissions</div>
          </div>
        </div>

        {/* Permission Groups */}
        {role.permissions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Permission Groups</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(getPermissionGroups()).slice(0, 6).map(([resource, count]) => (
                <span
                  key={resource}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {resource} ({count})
                </span>
              ))}
              {Object.keys(getPermissionGroups()).length > 6 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  +{Object.keys(getPermissionGroups()).length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            Created {new Date(role.createdAt).toLocaleDateString()}
          </span>
          <span>
            Updated {new Date(role.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoleCard;