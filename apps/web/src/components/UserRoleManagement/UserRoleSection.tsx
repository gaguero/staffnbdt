import React, { useState, useCallback } from 'react';
import { User } from '../../services/userService';
import { useUserRoleManagement, UserRole } from '../../hooks/useUserRoleManagement';
import { usePermissions } from '../../hooks/usePermissions';
import RoleBadge from '../RoleBadge';
import RoleBadgeGroup from '../RoleBadgeGroup';
import PermissionGate from '../PermissionGate';
import UserRoleAssignment from './UserRoleAssignment';
import UserRoleHistory from './UserRoleHistory';
import UserPermissionPreview from './UserPermissionPreview';
import QuickRoleSelector from './QuickRoleSelector';
import toastService from '../../utils/toast';

interface UserRoleSectionProps {
  user: User;
  onRoleChange?: (user: User, newRoles: UserRole[]) => void;
  showHistory?: boolean;
  showPermissionPreview?: boolean;
  enableAdvancedManagement?: boolean;
  maxVisibleRoles?: number;
  compact?: boolean;
  className?: string;
}

const UserRoleSection: React.FC<UserRoleSectionProps> = ({
  user,
  onRoleChange,
  showHistory = true,
  showPermissionPreview = true,
  enableAdvancedManagement = true,
  maxVisibleRoles = 3,
  compact = false,
  className = ''
}) => {
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const {
    currentRoles,
    availableRoles,
    effectivePermissions,
    isLoadingCurrentRoles,
    assignRole,
    removeRole,
    validateRoleAssignment,
    canAssignRole,
    canRemoveRole
  } = useUserRoleManagement(user.id);

  const { hasPermission } = usePermissions();

  const handleQuickRoleAssignment = useCallback(async (roleId: string) => {
    try {
      // Validate the assignment
      const validation = await validateRoleAssignment(user.id, roleId);
      
      if (!validation.isValid) {
        toastService.error(`Cannot assign role: ${validation.conflicts.join(', ')}`);
        return;
      }

      if (validation.warnings.length > 0) {
        const proceed = window.confirm(
          `Warning: ${validation.warnings.join(', ')}. Proceed?`
        );
        if (!proceed) return;
      }

      await assignRole({
        userId: user.id,
        roleId,
        metadata: {
          assignmentReason: 'Quick assignment from user profile'
        }
      });

      // Notify parent of role change
      if (onRoleChange && currentRoles) {
        onRoleChange(user, currentRoles);
      }
    } catch (error) {
      console.error('Quick role assignment failed:', error);
      toastService.error('Failed to assign role');
    }
  }, [user.id, validateRoleAssignment, assignRole, onRoleChange, currentRoles]);

  const handleQuickRoleRemoval = useCallback(async (userRoleId: string) => {
    try {
      const userRole = currentRoles?.find(ur => ur.id === userRoleId);
      if (!userRole) {
        toastService.error('Role assignment not found');
        return;
      }

      const proceed = window.confirm(
        `Are you sure you want to remove the "${userRole.role.name}" role from ${user.firstName} ${user.lastName}?`
      );
      
      if (!proceed) return;

      await removeRole(userRoleId);

      // Notify parent of role change
      if (onRoleChange && currentRoles) {
        onRoleChange(user, currentRoles.filter(ur => ur.id !== userRoleId));
      }
    } catch (error) {
      console.error('Quick role removal failed:', error);
      toastService.error('Failed to remove role');
    }
  }, [currentRoles, removeRole, user, onRoleChange]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  }, [expandedSection]);

  const getSectionClasses = useCallback(() => {
    const baseClasses = compact 
      ? 'bg-gray-50 rounded-lg p-4 space-y-3'
      : 'bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4';
    
    return `${baseClasses} ${className}`;
  }, [compact, className]);

  const getSystemRole = useCallback(() => {
    // Return the user's system role
    return user.role;
  }, [user.role]);

  const getCustomRoles = useCallback(() => {
    // Return custom roles assigned to user
    return currentRoles?.filter(ur => !ur.role.isSystem) || [];
  }, [currentRoles]);

  const hasManagementPermissions = hasPermission('role', 'assign', 'department').valueOf() ||
                                 hasPermission('role', 'assign', 'property').valueOf() ||
                                 hasPermission('role', 'assign', 'organization').valueOf();

  if (isLoadingCurrentRoles) {
    return (
      <div className={getSectionClasses()}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const systemRole = getSystemRole();
  const customRoles = getCustomRoles();
  const allRoles = [...(systemRole ? [{ role: { name: systemRole, isSystem: true } }] : []), ...customRoles];

  return (
    <div className={getSectionClasses()}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} text-gray-900`}>
            Role Management
          </h3>
          {allRoles.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {allRoles.length} role{allRoles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <PermissionGate permission="role.assign.department" fallback={null}>
          <div className="flex items-center space-x-2">
            {enableAdvancedManagement && hasManagementPermissions && (
              <button
                onClick={() => setShowAdvancedModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Advanced
              </button>
            )}
          </div>
        </PermissionGate>
      </div>

      {/* Current Roles Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Current Roles</label>
          <PermissionGate permission="role.assign.department" fallback={null}>
            {hasManagementPermissions && (
              <QuickRoleSelector
                availableRoles={availableRoles || []}
                currentRoles={currentRoles || []}
                onRoleSelect={handleQuickRoleAssignment}
                canAssignRole={canAssignRole}
                size="sm"
              />
            )}
          </PermissionGate>
        </div>

        {/* Role Badges */}
        <div className="space-y-2">
          {allRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {/* System Role */}
              {systemRole && (
                <RoleBadge
                  role={systemRole}
                  size={compact ? 'sm' : 'md'}
                  showTooltip={true}
                  variant="system"
                />
              )}

              {/* Custom Roles */}
              {customRoles.slice(0, maxVisibleRoles).map((userRole) => (
                <div key={userRole.id} className="relative group">
                  <RoleBadge
                    role={userRole.role.name}
                    size={compact ? 'sm' : 'md'}
                    showTooltip={true}
                    variant="custom"
                  />
                  
                  {hasManagementPermissions && canRemoveRole(userRole.roleId) && (
                    <button
                      onClick={() => handleQuickRoleRemoval(userRole.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      title="Remove role"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {/* Show more indicator */}
              {customRoles.length > maxVisibleRoles && (
                <button
                  onClick={() => toggleSection('roles')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 rounded-full transition-colors"
                >
                  +{customRoles.length - maxVisibleRoles} more
                </button>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No custom roles assigned
            </div>
          )}
        </div>

        {/* Expanded Roles View */}
        {expandedSection === 'roles' && customRoles.length > maxVisibleRoles && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {customRoles.slice(maxVisibleRoles).map((userRole) => (
                <div key={userRole.id} className="relative group">
                  <RoleBadge
                    role={userRole.role.name}
                    size="sm"
                    showTooltip={true}
                    variant="custom"
                  />
                  
                  {hasManagementPermissions && canRemoveRole(userRole.roleId) && (
                    <button
                      onClick={() => handleQuickRoleRemoval(userRole.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      title="Remove role"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {!compact && hasManagementPermissions && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={() => setShowAdvancedModal(true)}
            className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-medium transition-colors"
          >
            Manage Roles
          </button>
          
          {showHistory && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="text-sm px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors"
            >
              View History
            </button>
          )}
          
          {showPermissionPreview && effectivePermissions && (
            <button
              onClick={() => setShowPermissionsModal(true)}
              className="text-sm px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md font-medium transition-colors"
            >
              View Permissions ({effectivePermissions.permissionCount.total})
            </button>
          )}
        </div>
      )}

      {/* Permission Summary (Compact Mode) */}
      {compact && showPermissionPreview && effectivePermissions && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Permissions:</span>
            <div className="flex items-center space-x-3">
              <span className="text-gray-900 font-medium">
                {effectivePermissions.permissionCount.total} total
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                effectivePermissions.securityLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                effectivePermissions.securityLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                effectivePermissions.securityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {effectivePermissions.securityLevel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Role Management Modal */}
      {showAdvancedModal && (
        <UserRoleAssignment
          user={user}
          isOpen={showAdvancedModal}
          onClose={() => setShowAdvancedModal(false)}
          onRoleChange={onRoleChange}
        />
      )}

      {/* Role History Modal */}
      {showHistoryModal && (
        <UserRoleHistory
          userId={user.id}
          userName={`${user.firstName} ${user.lastName}`}
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Permission Preview Modal */}
      {showPermissionsModal && effectivePermissions && (
        <UserPermissionPreview
          userId={user.id}
          userName={`${user.firstName} ${user.lastName}`}
          effectivePermissions={effectivePermissions}
          isOpen={showPermissionsModal}
          onClose={() => setShowPermissionsModal(false)}
        />
      )}
    </div>
  );
};

export default UserRoleSection;