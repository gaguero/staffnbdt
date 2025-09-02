import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  useSystemRoles, 
  useRoleStatistics, 
  useBulkAssignSystemRoles 
} from '../hooks/useSystemRoles';
import { Role, SYSTEM_ROLES } from '../types/role';
import LoadingSpinner from '../components/LoadingSpinner';
import RoleBadge from '../components/RoleBadge';
import PermissionGate from '../components/PermissionGate';
import { toastService } from '../services/toastService';

interface RoleStatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
}

const RoleStatCard: React.FC<RoleStatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`text-3xl bg-${color}-100 p-3 rounded-full`}>
        {icon}
      </div>
    </div>
  </div>
);

interface RoleOverviewCardProps {
  role: any;
  onViewUsers: (role: string) => void;
  onManageRole: (role: string) => void;
}

const RoleOverviewCard: React.FC<RoleOverviewCardProps> = ({ role, onViewUsers, onManageRole }) => {
  const { user: currentUser } = useAuth();
  
  const canManageThisRole = useCallback(() => {
    if (!currentUser) return false;
    
    const currentUserRole = currentUser.role as Role;
    
    // Platform Admin can manage everything
    if (currentUserRole === Role.PLATFORM_ADMIN) return true;
    
    // Users can only manage roles below their level
    const currentLevel = SYSTEM_ROLES[currentUserRole]?.level ?? 999;
    const targetLevel = role.level;
    
    return currentLevel < targetLevel;
  }, [currentUser, role.level]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <RoleBadge role={role.role} size="md" showTooltip={false} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
              <p className="text-sm text-gray-600">Level {role.level}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            role.assignable 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {role.assignable ? 'Assignable' : 'System Only'}
          </span>
        </div>

        <p className="text-gray-700 mb-4 line-clamp-2">{role.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {role.userCount} users
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              {role.userType}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onViewUsers(role.role)}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            View Users
          </button>
          {canManageThisRole() && (
            <button
              onClick={() => onManageRole(role.role)}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Manage Role
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface BulkRoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkRoleAssignmentModal: React.FC<BulkRoleAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [userEmails, setUserEmails] = useState('');
  const [reason, setReason] = useState('');
  const [sendNotifications, setSendNotifications] = useState(true);

  const { data: systemRoles = [] } = useSystemRoles();
  const bulkAssignRoles = useBulkAssignSystemRoles();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole || !userEmails.trim()) {
      toastService.error('Please select a role and enter user emails');
      return;
    }

    const emails = userEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emails.length === 0) {
      toastService.error('Please enter valid email addresses');
      return;
    }

    try {
      const assignments = emails.map(email => ({
        userEmail: email,
        role: selectedRole,
        reason: reason || 'Bulk role assignment'
      }));

      await bulkAssignRoles.mutateAsync({
        assignments: assignments.map(a => ({ userId: '', role: a.role, reason: a.reason })),
        reason: reason || 'Bulk role assignment'
      });

      onSuccess();
      onClose();
      setSelectedRole('');
      setUserEmails('');
      setReason('');
    } catch (error) {
      console.error('Bulk role assignment failed:', error);
    }
  }, [selectedRole, userEmails, reason, bulkAssignRoles, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Bulk Role Assignment
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={bulkAssignRoles.isPending}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={bulkAssignRoles.isPending}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a role...</option>
                {systemRoles
                  .filter(role => role.assignable)
                  .map(role => (
                    <option key={role.role} value={role.role}>
                      {role.name} (Level {role.level})
                    </option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Email Addresses *
              </label>
              <textarea
                value={userEmails}
                onChange={(e) => setUserEmails(e.target.value)}
                disabled={bulkAssignRoles.isPending}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Enter email addresses, one per line:&#10;user1@company.com&#10;user2@company.com&#10;user3@company.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter one email address per line
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Reason (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={bulkAssignRoles.isPending}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Reason for bulk role assignment"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendNotifications}
                  onChange={(e) => setSendNotifications(e.target.checked)}
                  disabled={bulkAssignRoles.isPending}
                  className="rounded border-gray-300 mr-2"
                />
                <span className="text-sm text-gray-700">
                  Send notification emails to users
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={bulkAssignRoles.isPending}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={bulkAssignRoles.isPending || !selectedRole || !userEmails.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {bulkAssignRoles.isPending && <LoadingSpinner size="sm" />}
                <span>Assign Roles</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const RoleManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);

  const { data: systemRoles = [], isLoading: rolesLoading } = useSystemRoles();
  const { data: roleStats, isLoading: statsLoading } = useRoleStatistics();

  const handleViewUsers = useCallback((role: string) => {
    // Navigate to users page with role filter
    console.log('View users for role:', role);
    // This would typically use router navigation
    toastService.info(`Viewing users for role: ${SYSTEM_ROLES[role as Role]?.label || role}`);
  }, []);

  const handleManageRole = useCallback((role: string) => {
    // Open role management modal
    console.log('Manage role:', role);
    toastService.info(`Managing role: ${SYSTEM_ROLES[role as Role]?.label || role}`);
  }, []);

  const canViewRoleManagement = hasPermission('role', 'read', 'organization') || 
                               hasPermission('role', 'read', 'platform');

  // const canBulkAssignRoles = hasPermission('role', 'assign', 'organization') || 
  //                          hasPermission('role', 'assign', 'platform');

  if (!canViewRoleManagement) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">
          You don't have permission to view the role management dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">System Role Management</h1>
          <p style={{ color: 'var(--brand-text-secondary)' }}>
            Manage system roles and user assignments across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGate resource="role" action="assign" scope="organization">
            <button
              onClick={() => setShowBulkAssignment(true)}
              className="btn btn-secondary"
            >
              <span className="mr-2">📋</span>
              Bulk Assign
            </button>
          </PermissionGate>
          <button
            onClick={() => window.location.href = '/users'}
            className="btn btn-primary"
          >
            <span className="mr-2">👥</span>
            Manage Users
          </button>
        </div>
      </div>

      {/* Role Statistics */}
      {roleStats && !statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <RoleStatCard
            title="Total Users"
            value={roleStats.totalUsers}
            icon="👥"
            color="blue"
            subtitle="Active users in system"
          />
          <RoleStatCard
            title="System Roles"
            value={systemRoles.length}
            icon="🛡️"
            color="purple"
            subtitle="Available role types"
          />
          <RoleStatCard
            title="Recent Changes"
            value={roleStats.recentRoleChanges}
            icon="⏱️"
            color="green"
            subtitle="Last 30 days"
          />
          <RoleStatCard
            title="Platform Admins"
            value={roleStats.roleDistribution.find(r => r.role === 'PLATFORM_ADMIN')?.count || 0}
            icon="🌐"
            color="red"
            subtitle="Highest privilege level"
          />
        </div>
      )}

      {/* Role Distribution Chart (Simplified) */}
      {roleStats && !statsLoading && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
          <div className="space-y-3">
            {roleStats.roleDistribution.map((roleData) => {
              const role = systemRoles.find(r => r.role === roleData.role);
              return (
                <div key={roleData.role} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <RoleBadge role={roleData.role} size="sm" />
                    <span className="text-sm text-gray-700">
                      {role?.name || roleData.role}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${roleData.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {roleData.count}
                    </span>
                    <span className="text-xs text-gray-500 w-12">
                      ({roleData.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* System Roles Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">System Roles</h3>
          <div className="text-sm text-gray-500">
            {systemRoles.filter(r => r.assignable).length} assignable roles
          </div>
        </div>

        {rolesLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Loading system roles...</span>
          </div>
        ) : systemRoles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">No system roles found</div>
            <div className="text-sm text-gray-400">Contact your system administrator</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemRoles.map((role) => (
              <RoleOverviewCard
                key={role.role}
                role={role}
                onViewUsers={handleViewUsers}
                onManageRole={handleManageRole}
              />
            ))}
          </div>
        )}
      </div>

      {/* Current User Info */}
      {currentUser && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-900">Your current role:</span>
              <RoleBadge role={currentUser.role} size="sm" />
            </div>
            <div className="text-xs text-blue-600">
              Level {SYSTEM_ROLES[currentUser.role as Role]?.level || 'Unknown'}
            </div>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            You can assign roles at level {(SYSTEM_ROLES[currentUser.role as Role]?.level || 0) + 1} and below
          </p>
        </div>
      )}

      {/* Bulk Assignment Modal */}
      <BulkRoleAssignmentModal
        isOpen={showBulkAssignment}
        onClose={() => setShowBulkAssignment(false)}
        onSuccess={() => {
          // Refresh data
          window.location.reload();
        }}
      />
    </div>
  );
};

export default RoleManagementPage;