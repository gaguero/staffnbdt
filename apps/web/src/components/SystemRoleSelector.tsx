import React, { useState, useCallback, useMemo } from 'react';
import { useSystemRoles, useRolePermissionPreview } from '../hooks/useSystemRoles';
import { useAuth } from '../contexts/AuthContext';
import { Role, ROLE_HIERARCHY, SYSTEM_ROLES } from '../types/role';
import LoadingSpinner from './LoadingSpinner';
import RoleBadge from './RoleBadge';

interface SystemRoleSelectorProps {
  /** Currently selected role */
  selectedRole?: string;
  /** Callback when role is selected */
  onRoleSelect: (role: string) => void;
  /** Show role descriptions */
  showDescriptions?: boolean;
  /** Show permission previews */
  showPermissionPreviews?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Exclude certain roles from selection */
  excludeRoles?: string[];
  /** Optional class name */
  className?: string;
}

interface RoleOptionProps {
  role: any;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  showDescription: boolean;
  showPermissionPreview: boolean;
  size: 'sm' | 'md' | 'lg';
}

const RoleOption: React.FC<RoleOptionProps> = ({
  role,
  isSelected,
  isDisabled,
  onClick,
  showDescription,
  showPermissionPreview,
  size
}) => {
  const { data: permissionPreview, isLoading: previewLoading } = useRolePermissionPreview(
    role.role,
    showPermissionPreview && isSelected
  );

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} border rounded-lg cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={!isDisabled ? onClick : undefined}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-selected={isSelected}
      aria-disabled={isDisabled}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <RoleBadge role={role.role} size={size} showTooltip={false} />
          <div className="flex-1 min-w-0">
            <div className={`font-medium text-gray-900 ${textSizes[size]}`}>
              {role.name}
            </div>
            {showDescription && role.description && (
              <div className={`text-gray-600 mt-1 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
                {role.description}
              </div>
            )}
            <div className={`flex items-center space-x-4 mt-2 ${size === 'lg' ? 'text-sm' : 'text-xs'} text-gray-500`}>
              <span>Level {role.level}</span>
              <span>{role.userCount} users</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                role.assignable 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {role.assignable ? 'Assignable' : 'System Only'}
              </span>
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="ml-3 text-blue-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Permission Preview */}
      {showPermissionPreview && isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-900 mb-2">
            Permission Preview
          </div>
          {previewLoading ? (
            <div className="flex justify-center py-2">
              <LoadingSpinner size="sm" />
            </div>
          ) : permissionPreview ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Permissions:</span>
                <span className="font-medium">{permissionPreview.permissions.length}</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {permissionPreview.permissions.slice(0, 10).map((permission, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {permission}
                  </span>
                ))}
                {permissionPreview.permissions.length > 10 && (
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    +{permissionPreview.permissions.length - 10} more
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Failed to load permission preview
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SystemRoleSelector: React.FC<SystemRoleSelectorProps> = ({
  selectedRole,
  onRoleSelect,
  showDescriptions = true,
  showPermissionPreviews = false,
  disabled = false,
  size = 'md',
  excludeRoles = [],
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const { data: systemRoles = [], isLoading, error } = useSystemRoles();
  const [searchTerm, setSearchTerm] = useState('');

  // Determine which roles the current user can assign
  const availableRoles = useMemo(() => {
    if (!currentUser || !systemRoles.length) return [];

    const currentUserRole = currentUser.role as Role;
    const currentUserLevel = ROLE_HIERARCHY[currentUserRole]?.level ?? 999;

    return systemRoles.filter(role => {
      // Exclude specified roles
      if (excludeRoles.includes(role.role)) return false;
      
      // Only show assignable roles
      if (!role.assignable) return false;

      // Platform Admin can assign any role
      if (currentUserRole === Role.PLATFORM_ADMIN) return true;

      // Other users can only assign roles at their level or below
      const targetLevel = role.level;
      return targetLevel > currentUserLevel;
    });
  }, [currentUser, systemRoles, excludeRoles]);

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return availableRoles;

    const search = searchTerm.toLowerCase();
    return availableRoles.filter(role =>
      role.name.toLowerCase().includes(search) ||
      role.description.toLowerCase().includes(search) ||
      role.role.toLowerCase().includes(search)
    );
  }, [availableRoles, searchTerm]);

  const handleRoleSelect = useCallback((role: string) => {
    if (!disabled) {
      onRoleSelect(role);
    }
  }, [disabled, onRoleSelect]);

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <LoadingSpinner size="md" />
        <span className="ml-2 text-gray-600">Loading system roles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-2">Failed to load system roles</div>
        <div className="text-sm text-gray-500">{error.message}</div>
      </div>
    );
  }

  if (availableRoles.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-600 mb-2">No roles available for assignment</div>
        <div className="text-sm text-gray-500">
          You may not have permission to assign system roles
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search bar */}
      {availableRoles.length > 3 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
          />
        </div>
      )}

      {/* Role options */}
      <div className="space-y-3">
        {filteredRoles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No roles match your search
          </div>
        ) : (
          filteredRoles.map((role) => (
            <RoleOption
              key={role.role}
              role={role}
              isSelected={selectedRole === role.role}
              isDisabled={disabled}
              onClick={() => handleRoleSelect(role.role)}
              showDescription={showDescriptions}
              showPermissionPreview={showPermissionPreviews}
              size={size}
            />
          ))
        )}
      </div>

      {/* Current user role info */}
      {currentUser && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Your current role:</div>
          <div className="flex items-center space-x-2">
            <RoleBadge role={currentUser.role} size="sm" />
            <span className="text-sm text-gray-700">
              Can assign roles at level {ROLE_HIERARCHY[currentUser.role as Role]?.level + 1} and below
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemRoleSelector;