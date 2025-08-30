import React, { useState } from 'react';
import { User } from '../services/userService';
import RoleBadge from './RoleBadge';
import { useRoleHelpers } from '../hooks/useRoleHelpers';
import { useUserRoleManagement } from '../hooks/useUserRoleManagement';
import { usePermissions } from '../hooks/usePermissions';
import { UserRoleAssignment, QuickRoleSelector } from './UserRoleManagement';
import PermissionGate from './PermissionGate';

export interface UserCardProps {
  user: User;
  customRoles?: Array<{
    id: string;
    name: string;
    description?: string;
    level?: number;
  }>;
  showDetails?: boolean;
  showActions?: boolean;
  showRoles?: boolean;
  enableQuickRoleEdit?: boolean;
  enableRoleManagement?: boolean;
  maxVisibleRoles?: number;
  showRoleHistory?: boolean;
  compact?: boolean;
  onClick?: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onRoleChange?: (user: User, newRoles: any[]) => void;
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  customRoles = [],
  showDetails = true,
  showActions = true,
  showRoles = true,
  enableQuickRoleEdit = false,
  enableRoleManagement = false,
  maxVisibleRoles = 3,
  showRoleHistory: _showRoleHistory = false,
  compact: _compact = false,
  onClick,
  onEdit,
  onDelete,
  onRoleChange,
  className = ''
}) => {
  const [showRoleManagementModal, setShowRoleManagementModal] = useState(false);
  const [showQuickSelector, setShowQuickSelector] = useState(false);
  
  const { getRoleIcon: _getRoleIcon, getRoleDescription: _getRoleDescription } = useRoleHelpers(customRoles as any);
  const { hasPermission } = usePermissions();
  const {
    currentRoles,
    availableRoles,
    isLoadingCurrentRoles,
    assignRole,
    canAssignRole
  } = useUserRoleManagement(user.id);
  
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (user: User): string => {
    if (user.deletedAt) return 'text-red-500';
    return 'text-green-500';
  };

  const getStatusText = (user: User): string => {
    if (user.deletedAt) return 'Inactive';
    return 'Active';
  };

  const cardClasses = [
    'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md',
    'transition-all duration-200 p-6',
    onClick ? 'cursor-pointer hover:border-blue-300' : '',
    className
  ].filter(Boolean).join(' ');

  const userRoleAssignments = currentRoles || [];
  const hasManagementPermissions = hasPermission('role', 'assign', 'department').valueOf() ||
                                 hasPermission('role', 'assign', 'property').valueOf() ||
                                 hasPermission('role', 'assign', 'organization').valueOf();

  const handleQuickRoleAssignment = async (roleId: string) => {
    try {
      await assignRole({
        userId: user.id,
        roleId,
        metadata: {
          assignmentReason: 'Quick assignment from user card'
        }
      });
      if (onRoleChange) {
        onRoleChange(user, userRoleAssignments);
      }
      setShowQuickSelector(false);
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  return (
    <div 
      className={cardClasses}
      onClick={() => onClick?.(user)}
    >
      {/* Header with Avatar and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            
            {/* Online status indicator (placeholder) */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${getStatusColor(user)} bg-current rounded-full border-2 border-white`}>
              <span className="sr-only">{getStatusText(user)}</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          user.deletedAt 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {getStatusText(user)}
        </span>
      </div>

      {/* Role Badges with Management */}
      {showRoles && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {isLoadingCurrentRoles ? (
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              ) : (
                <>
                  {/* System Role */}
                  <RoleBadge
                    role={user.role}
                    size="sm"
                    showTooltip={true}
                  />
                  
                  {/* Custom Roles */}
                  {userRoleAssignments.slice(0, maxVisibleRoles).map((userRole) => (
                    <RoleBadge
                      key={userRole.id}
                      role={userRole.role.name}
                      size="sm"
                      showTooltip={true}
                    />
                  ))}
                  
                  {/* Show more indicator */}
                  {userRoleAssignments.length > maxVisibleRoles && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      +{userRoleAssignments.length - maxVisibleRoles}
                    </span>
                  )}
                </>
              )}
            </div>
            
            {/* Role Management Actions */}
            <PermissionGate resource="role" action="assign" scope="department" fallback={null}>
              {(enableQuickRoleEdit || enableRoleManagement) && hasManagementPermissions && (
                <div className="flex items-center space-x-1">
                  {enableQuickRoleEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickSelector(!showQuickSelector);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1 py-0.5 rounded hover:bg-blue-50"
                      title="Quick add role"
                    >
                      +
                    </button>
                  )}
                  
                  {enableRoleManagement && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRoleManagementModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-800 text-xs font-medium px-1 py-0.5 rounded hover:bg-gray-50"
                      title="Manage roles"
                    >
                      ⚙️
                    </button>
                  )}
                </div>
              )}
            </PermissionGate>
          </div>
          
          {/* Quick Role Selector */}
          {showQuickSelector && enableQuickRoleEdit && hasManagementPermissions && (
            <div className="mb-2">
              <QuickRoleSelector
                availableRoles={availableRoles || []}
                currentRoles={userRoleAssignments}
                onRoleSelect={handleQuickRoleAssignment}
                canAssignRole={canAssignRole}
                size="sm"
                placeholder="Add role..."
              />
            </div>
          )}
        </div>
      )}

      {/* Details */}
      {showDetails && (
        <div className="space-y-2 mb-4">
          {user.position && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4 h-4 mr-2" role="img" aria-label="Position">💼</span>
              <span className="truncate">{user.position}</span>
            </div>
          )}
          
          {user.department && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4 h-4 mr-2" role="img" aria-label="Department">🏢</span>
              <span className="truncate">{user.department.name}</span>
            </div>
          )}
          
          {user.phoneNumber && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4 h-4 mr-2" role="img" aria-label="Phone">📞</span>
              <span className="truncate">{user.phoneNumber}</span>
            </div>
          )}
          
          {user.hireDate && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4 h-4 mr-2" role="img" aria-label="Hire Date">📅</span>
              <span>Hired: {formatDate(user.hireDate)}</span>
            </div>
          )}
          
          {user.properties && user.properties.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4 h-4 mr-2" role="img" aria-label="Properties">🏨</span>
              <span className="truncate">
                {user.properties.length === 1 
                  ? user.properties[0].name 
                  : `${user.properties.length} properties`
                }
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Edit
            </button>
          )}
          
          {onDelete && !user.deletedAt && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user);
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
            >
              Deactivate
            </button>
          )}
          
          {onDelete && user.deletedAt && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user);
              }}
              className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
            >
              Restore
            </button>
          )}
        </div>
      )}
      
      {/* Role Management Modal */}
      {showRoleManagementModal && enableRoleManagement && (
        <UserRoleAssignment
          user={user}
          isOpen={showRoleManagementModal}
          onClose={() => setShowRoleManagementModal(false)}
          onRoleChange={onRoleChange}
          mode="manage"
        />
      )}
    </div>
  );
};

export default UserCard;