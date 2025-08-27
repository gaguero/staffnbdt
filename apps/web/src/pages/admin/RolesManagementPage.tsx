import React, { useState, useMemo } from 'react';
// Force rebuild - v1
import { useRoles, useUserRoles, useRoleStats, useDeleteRole, useAssignRole, useRemoveUserRole } from '../../hooks/useRoles';
import { useUsers } from '../../hooks/useUsers';
import { Role, RoleAssignment, UserRole } from '../../services/roleService';
import RoleCard from '../../components/roles/RoleCard';
import CreateRoleModal from '../../components/roles/CreateRoleModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import PermissionGate from '../../components/PermissionGate';

const RolesManagementPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'roles' | 'assignments'>('roles');
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const { data: roles, isLoading: rolesLoading, error: rolesError } = useRoles();
  const { data: userRoles, isLoading: userRolesLoading } = useUserRoles();
  const { data: roleStats } = useRoleStats();
  const { data: usersResponse } = useUsers({}); // Assuming this exists
  const deleteRole = useDeleteRole();
  const assignRole = useAssignRole();
  const removeUserRole = useRemoveUserRole();

  const users = usersResponse?.data || [];

  // Filter roles based on search with defensive programming
  const filteredRoles = useMemo(() => {
    console.log('Roles data debug:', roles, typeof roles, Array.isArray(roles));
    
    // Ensure we always have an array - roles should be Role[] | undefined based on hook
    const rolesArray: Role[] = Array.isArray(roles) ? roles : 
                       ((roles as any)?.data && Array.isArray((roles as any).data)) ? (roles as any).data : [];
    
    if (!rolesArray || rolesArray.length === 0) return [];
    
    return rolesArray.filter((role: Role) =>
      role?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role?.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  // Filter user roles based on selected role with defensive programming
  const filteredUserRoles = useMemo(() => {
    console.log('UserRoles data debug:', userRoles, typeof userRoles, Array.isArray(userRoles));
    
    // Ensure we always have an array - userRoles should be UserRole[] | undefined based on hook
    const userRolesArray: UserRole[] = Array.isArray(userRoles) ? userRoles : 
                          ((userRoles as any)?.data && Array.isArray((userRoles as any).data)) ? (userRoles as any).data : [];
    
    if (!userRolesArray || userRolesArray.length === 0) return [];
    
    if (!selectedRoleFilter) return userRolesArray;
    
    return userRolesArray.filter((userRole: UserRole) => userRole?.roleId === selectedRoleFilter);
  }, [userRoles, selectedRoleFilter]);

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    // Could show role details modal here
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowEditRoleModal(true);
  };

  const handleDeleteRole = async (role: Role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"? This will remove all assignments.`)) {
      await deleteRole.mutateAsync(role.id);
    }
  };

  const handleAssignRole = async (assignment: RoleAssignment) => {
    await assignRole.mutateAsync(assignment);
    setShowAssignRoleModal(false);
    setSelectedUserId('');
  };

  const handleRemoveUserRole = async (userRoleId: string) => {
    if (window.confirm('Are you sure you want to remove this role assignment?')) {
      await removeUserRole.mutateAsync(userRoleId);
    }
  };

  const getUsersWithoutRoles = () => {
    // Ensure userRoles is an array before mapping
    const userRolesArray: UserRole[] = Array.isArray(userRoles) ? userRoles : 
                          ((userRoles as any)?.data && Array.isArray((userRoles as any).data)) ? (userRoles as any).data : [];
    
    const assignedUserIds = new Set(userRolesArray.map((ur: UserRole) => ur?.userId).filter(Boolean));
    return users.filter((user: any) => !assignedUserIds.has(user.id));
  };

  if (rolesLoading || userRolesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading roles..." />
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ Failed to load roles</div>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600 mt-1">
            Manage user roles, permissions, and access levels
          </p>
        </div>
        <PermissionGate resource="role" action="create">
          <button
            onClick={() => setShowCreateRoleModal(true)}
            className="btn btn-primary"
          >
            <span className="mr-2">👥</span>
            Create Role
          </button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      {roleStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{roleStats.totalRoles}</div>
            <div className="text-sm text-gray-600">Total Roles</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{roleStats.totalAssignments}</div>
            <div className="text-sm text-gray-600">Active Assignments</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{users.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{getUsersWithoutRoles().length}</div>
            <div className="text-sm text-gray-600">Unassigned Users</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('roles')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'roles' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Roles ({filteredRoles.length})
          </button>
          <button
            onClick={() => setViewMode('assignments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'assignments' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Assignments ({filteredUserRoles.length})
          </button>
        </div>
      </div>

      {viewMode === 'roles' ? (
        <>
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search roles by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Roles Grid */}
          {filteredRoles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms."
                  : "Get started by creating your first role."}
              </p>
              <PermissionGate resource="role" action="create">
                <button
                  onClick={() => setShowCreateRoleModal(true)}
                  className="btn btn-primary"
                >
                  Create First Role
                </button>
              </PermissionGate>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map((role: Role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onClick={handleRoleClick}
                  onEdit={handleEditRole}
                  onDelete={handleDeleteRole}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Assignment Controls */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  {Array.isArray(roles) ? roles.map((role: Role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  )) : ((roles as any)?.data && Array.isArray((roles as any).data)) ? (roles as any).data.map((role: Role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  )) : null}
                </select>
              </div>
              <PermissionGate resource="role" action="assign">
                <button
                  onClick={() => setShowAssignRoleModal(true)}
                  className="btn btn-primary"
                >
                  <span className="mr-2">➕</span>
                  Assign Role
                </button>
              </PermissionGate>
            </div>
          </div>

          {/* User Role Assignments Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUserRoles.map((userRole: UserRole) => (
                    <tr key={userRole.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                            {userRole.user.firstName[0]}{userRole.user.lastName[0]}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">
                              {userRole.user.firstName} {userRole.user.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {userRole.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{userRole.role.name}</div>
                        <div className="text-sm text-gray-600 line-clamp-1">{userRole.role.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Level {userRole.role.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(userRole.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <PermissionGate resource="role" action="remove">
                          <button
                            onClick={() => handleRemoveUserRole(userRole.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Remove
                          </button>
                        </PermissionGate>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUserRoles.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No role assignments found</h3>
                <p className="text-gray-600">
                  {selectedRoleFilter 
                    ? "No users have been assigned this role yet."
                    : "No role assignments exist yet."}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        mode="create"
      />

      {/* Edit Role Modal */}
      <CreateRoleModal
        isOpen={showEditRoleModal}
        onClose={() => {
          setShowEditRoleModal(false);
          setSelectedRole(null);
        }}
        role={selectedRole || undefined}
        mode="edit"
      />

      {/* Assign Role Modal */}
      {showAssignRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAssignRoleModal(false)} />
          
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Role</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select user</option>
                    {users.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={selectedRole?.id || ''}
                    onChange={(e) => {
                      const rolesArray: Role[] = Array.isArray(roles) ? roles : 
                                        ((roles as any)?.data && Array.isArray((roles as any).data)) ? (roles as any).data : [];
                      const role = rolesArray.find((r: Role) => r.id === e.target.value);
                      setSelectedRole(role || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select role</option>
                    {Array.isArray(roles) ? roles.map((role: Role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} (Level {role.level})
                      </option>
                    )) : ((roles as any)?.data && Array.isArray((roles as any).data)) ? (roles as any).data.map((role: Role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} (Level {role.level})
                      </option>
                    )) : null}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAssignRoleModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedUserId && selectedRole) {
                      handleAssignRole({
                        userId: selectedUserId,
                        roleId: selectedRole.id
                      });
                    }
                  }}
                  disabled={!selectedUserId || !selectedRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Assign Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManagementPage;