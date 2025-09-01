import React, { useState, useCallback, useEffect } from 'react';
import { User } from '../services/userService';
import { 
  useAssignSystemRole, 
  useChangeUserRole, 
  useUserPermissions,
  useRefreshUserPermissions,
  useUserRoleHistory 
} from '../hooks/useSystemRoles';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Role, SYSTEM_ROLES, canManageRole } from '../types/role';
import SystemRoleSelector from './SystemRoleSelector';
import LoadingSpinner from './LoadingSpinner';
import RoleBadge from './RoleBadge';
import { toastService } from '../services/toastService';

interface UserSystemRoleManagementProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onRoleChanged?: (user: User, newRole: string) => void;
}

interface PermissionPreviewProps {
  userId: string;
}

const PermissionPreview: React.FC<PermissionPreviewProps> = ({ userId }) => {
  const { data: userPermissions, isLoading } = useUserPermissions(userId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!userPermissions) {
    return (
      <div className="text-center py-4 text-gray-500">
        Failed to load permissions
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Current Role</div>
          <div className="mt-1">
            <RoleBadge role={userPermissions.systemRole} size="sm" />
          </div>
          <div className="text-xs text-blue-500 mt-1">
            Level {userPermissions.roleInfo?.level}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Total Permissions</div>
          <div className="text-2xl font-bold text-green-800 mt-1">
            {userPermissions.permissions?.length || 0}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Custom Roles</div>
          <div className="text-2xl font-bold text-purple-800 mt-1">
            {userPermissions.customRoles?.length || 0}
          </div>
        </div>
      </div>

      {/* Recent Permissions */}
      {userPermissions.permissions && userPermissions.permissions.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-900 mb-3">
            Sample Permissions ({userPermissions.permissions.length} total)
          </div>
          <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
            <div className="space-y-1">
              {userPermissions.permissions.slice(0, 10).map((permission, index) => (
                <div key={index} className="text-sm text-gray-700 font-mono">
                  {permission}
                </div>
              ))}
              {userPermissions.permissions.length > 10 && (
                <div className="text-sm text-blue-600 font-medium">
                  ... and {userPermissions.permissions.length - 10} more permissions
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Last updated: {new Date(userPermissions.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

interface RoleHistoryProps {
  userId: string;
}

const RoleHistory: React.FC<RoleHistoryProps> = ({ userId }) => {
  const { data: roleHistory = [], isLoading } = useUserRoleHistory(userId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (roleHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No role assignment history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-900 mb-3">
        Role Assignment History ({roleHistory.length} entries)
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {roleHistory.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-900">
                {entry.action}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(entry.createdAt).toLocaleString()}
              </div>
            </div>
            
            {entry.oldData && entry.newData && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">From:</div>
                  <RoleBadge role={entry.oldData.role || 'Unknown'} size="sm" />
                </div>
                <div>
                  <div className="text-gray-600">To:</div>
                  <RoleBadge role={entry.newData.role || 'Unknown'} size="sm" />
                </div>
              </div>
            )}
            
            {entry.user && (
              <div className="text-xs text-gray-500 mt-2">
                Changed by: {entry.user.firstName} {entry.user.lastName} ({entry.user.email})
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const UserSystemRoleManagement: React.FC<UserSystemRoleManagementProps> = ({
  user,
  isOpen,
  onClose,
  onRoleChanged
}) => {
  const { user: currentUser } = useAuth();
  const { refreshPermissions } = usePermissions();
  const [activeTab, setActiveTab] = useState<'assign' | 'permissions' | 'history'>('assign');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [reason, setReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const assignSystemRole = useAssignSystemRole();
  const changeUserRole = useChangeUserRole();
  const refreshUserPermissions = useRefreshUserPermissions();

  // Check if current user can manage this user's role
  const canManageThisUser = useCallback(() => {
    if (!currentUser) return false;
    
    const currentUserRole = currentUser.role as Role;
    const targetUserRole = user.role as Role;
    
    // Platform Admin can manage anyone
    if (currentUserRole === Role.PLATFORM_ADMIN) return true;
    
    // Check role hierarchy
    return canManageRole(currentUserRole, targetUserRole);
  }, [currentUser, user.role]);

  // Initialize selected role to current user's role
  useEffect(() => {
    if (isOpen && user.role) {
      setSelectedRole(user.role);
    }
  }, [isOpen, user.role]);

  const handleRoleAssign = useCallback(async () => {
    if (!selectedRole || selectedRole === user.role) {
      toastService.warning('Please select a different role');
      return;
    }

    try {
      if (user.role && user.role !== 'STAFF') {
        // This is a role change
        await changeUserRole.mutateAsync({
          userId: user.id,
          role: selectedRole,
          reason: reason || 'Role changed via system role management'
        });
      } else {
        // This is a new role assignment
        await assignSystemRole.mutateAsync({
          userId: user.id,
          role: selectedRole,
          reason: reason || 'Role assigned via system role management'
        });
      }

      // Refresh user permissions
      await refreshUserPermissions.mutateAsync(user.id);
      
      // Refresh current user permissions if they changed their own role
      if (user.id === currentUser?.id) {
        await refreshPermissions();
      }

      // Notify parent component
      if (onRoleChanged) {
        onRoleChanged(user, selectedRole);
      }

      setShowConfirmDialog(false);
      setReason('');
      
    } catch (error) {
      console.error('Role assignment failed:', error);
    }
  }, [
    selectedRole, 
    user, 
    reason, 
    changeUserRole, 
    assignSystemRole, 
    refreshUserPermissions, 
    refreshPermissions, 
    currentUser?.id, 
    onRoleChanged
  ]);

  const handleConfirmAssignment = useCallback(() => {
    if (selectedRole && selectedRole !== user.role) {
      setShowConfirmDialog(true);
    }
  }, [selectedRole, user.role]);

  if (!isOpen) return null;

  if (!canManageThisUser()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 mb-6">
              You don't have permission to manage {user.firstName} {user.lastName}'s system role.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  System Role Management: {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={assignSystemRole.isPending || changeUserRole.isPending}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Current Role Display */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-900">Current System Role:</span>
              <RoleBadge role={user.role || 'STAFF'} size="sm" />
            </div>
            {user.role && SYSTEM_ROLES[user.role as Role] && (
              <span className="text-xs text-blue-600">
                Level {SYSTEM_ROLES[user.role as Role].level}
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('assign')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Role Assignment
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Permission Preview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Assignment History
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {activeTab === 'assign' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Select New System Role
                </h3>
                <SystemRoleSelector
                  selectedRole={selectedRole}
                  onRoleSelect={setSelectedRole}
                  showDescriptions={true}
                  showPermissionPreviews={true}
                  disabled={assignSystemRole.isPending || changeUserRole.isPending}
                  size="md"
                  excludeRoles={[]}
                  className="max-h-96 overflow-y-auto"
                />
              </div>

              {/* Assignment Reason */}
              {selectedRole && selectedRole !== user.role && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Reason (Optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={assignSystemRole.isPending || changeUserRole.isPending}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Optional reason for this role change..."
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="p-6">
              <PermissionPreview userId={user.id} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6">
              <RoleHistory userId={user.id} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedRole && selectedRole !== user.role && (
                <span>
                  Role will change from{' '}
                  <strong>{SYSTEM_ROLES[user.role as Role]?.label || user.role}</strong> to{' '}
                  <strong>{SYSTEM_ROLES[selectedRole as Role]?.label || selectedRole}</strong>
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={assignSystemRole.isPending || changeUserRole.isPending}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              
              {activeTab === 'assign' && selectedRole && selectedRole !== user.role && (
                <button
                  onClick={handleConfirmAssignment}
                  disabled={assignSystemRole.isPending || changeUserRole.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {(assignSystemRole.isPending || changeUserRole.isPending) && (
                    <LoadingSpinner size="sm" />
                  )}
                  <span>
                    {user.role && user.role !== 'STAFF' ? 'Change Role' : 'Assign Role'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Role Assignment</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to {user.role && user.role !== 'STAFF' ? 'change' : 'assign'} {user.firstName} {user.lastName}'s role to{' '}
                <strong>{SYSTEM_ROLES[selectedRole as Role]?.label || selectedRole}</strong>?
                {user.id === currentUser?.id && (
                  <span className="block mt-2 text-amber-600 font-medium">
                    ⚠️ You are changing your own role. This will affect your permissions.
                  </span>
                )}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={assignSystemRole.isPending || changeUserRole.isPending}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleAssign}
                  disabled={assignSystemRole.isPending || changeUserRole.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {(assignSystemRole.isPending || changeUserRole.isPending) && (
                    <LoadingSpinner size="sm" />
                  )}
                  <span>Confirm {user.role && user.role !== 'STAFF' ? 'Change' : 'Assignment'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSystemRoleManagement;