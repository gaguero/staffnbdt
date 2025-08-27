import React, { useState } from 'react';
import {
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Role } from '../../services/roleService';

interface RoleCardProps {
  role: Role;
  onClick?: (role: Role) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onClone?: (role: Role) => void;
  onCompare?: (role: Role) => void;
  onViewLineage?: (role: Role) => void;
  compact?: boolean;
  showCloneActions?: boolean;
  showLineageInfo?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({ 
  role, 
  onClick, 
  onEdit, 
  onDelete, 
  onClone,
  onCompare,
  onViewLineage,
  compact = false, 
  showCloneActions = true,
  showLineageInfo = false 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
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
      
      {/* Backdrop to close dropdown when clicking outside */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(false);
          }}
        />
      )}
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
            {/* Quick Clone Button */}
            {showCloneActions && onClone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClone(role);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Clone role"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
            )}
            
            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="More actions"
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(role);
                          setShowDropdown(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Edit Role</span>
                      </button>
                    )}
                    
                    {showCloneActions && onClone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClone(role);
                          setShowDropdown(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        <span>Clone Role</span>
                      </button>
                    )}
                    
                    {onCompare && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompare(role);
                          setShowDropdown(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Compare</span>
                      </button>
                    )}
                    
                    {showLineageInfo && onViewLineage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewLineage(role);
                          setShowDropdown(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                        <span>View Lineage</span>
                      </button>
                    )}
                    
                    {onDelete && (
                      <>
                        <div className="border-t border-gray-200 my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(role);
                            setShowDropdown(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span>Delete Role</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Backdrop to close dropdown */}
              {showDropdown && (
                <div 
                  className="fixed inset-0 z-0" 
                  onClick={() => setShowDropdown(false)}
                />
              )}
            </div>
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
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <div>Created {new Date(role.createdAt).toLocaleDateString()}</div>
            <div>Updated {new Date(role.updatedAt).toLocaleDateString()}</div>
          </div>
          
          {/* Clone Actions */}
          {showCloneActions && (
            <div className="flex items-center space-x-2">
              {onClone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClone(role);
                  }}
                  className="flex items-center space-x-1 px-3 py-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <DocumentDuplicateIcon className="h-3 w-3" />
                  <span>Clone</span>
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Lineage Information */}
        {showLineageInfo && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <span>Generation: 0 (Original)</span>
                <span>Clones: 0</span>
              </div>
              {onViewLineage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewLineage(role);
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Tree
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleCard;