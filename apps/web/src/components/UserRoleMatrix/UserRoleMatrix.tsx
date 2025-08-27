import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import useUserRoleMatrix from '../../hooks/useUserRoleMatrix';
import { usePermissions } from '../../hooks/usePermissions';
import { UserRoleMatrixProps, MatrixUser, MatrixRole } from '../../types/userRoleMatrix';
import UserRoleMatrixHeader from './UserRoleMatrixHeader';
import UserRoleMatrixRow from './UserRoleMatrixRow';
import BulkActionBar from './BulkActionBar';
import LoadingSpinner from '../LoadingSpinner';
import ErrorDisplay from '../ErrorDisplay';
import { toast } from 'react-hot-toast';

// Scrolling configuration
const MAX_VISIBLE_ITEMS_BEFORE_PAGINATION = 100;

const UserRoleMatrix: React.FC<UserRoleMatrixProps> = ({
  users: propUsers,
  roles: propRoles,
  assignments: propAssignments,
  onAssignRole,
  onUnassignRole,
  onBulkAssign,
  onBulkUnassign,
  permissions: propPermissions,
  configuration,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const { hasPermission } = usePermissions();
  
  // Use the custom hook for matrix management
  const {
    state,
    actions,
    utils,
  } = useUserRoleMatrix();

  // Use prop data if provided, otherwise use hook data
  const users = propUsers || state.users;
  const roles = propRoles || state.roles;
  const assignmentMap = state.assignments;
  
  // Filter data based on current filters
  const filteredUsers = utils.getFilteredUsers();
  const filteredRoles = utils.getFilteredRoles();
  
  // Permission checks
  const [permissions, setPermissions] = useState({
    canAssignRoles: false,
    canUnassignRoles: false,
    canViewAuditLog: false,
    canBulkAssign: false,
  });
  
  useEffect(() => {
    const checkPermissions = async () => {
      const [canAssign, canUnassign, canViewAudit, canBulkAssign] = await Promise.all([
        hasPermission('user-roles', 'create'),
        hasPermission('user-roles', 'delete'),
        hasPermission('audit', 'read'),
        hasPermission('user-roles', 'bulk'),
      ]);
      
      setPermissions({
        canAssignRoles: propPermissions?.canAssignRoles ?? canAssign,
        canUnassignRoles: propPermissions?.canUnassignRoles ?? canUnassign,
        canViewAuditLog: propPermissions?.canViewAuditLog ?? canViewAudit,
        canBulkAssign: propPermissions?.canBulkAssign ?? canBulkAssign,
      });
    };
    
    checkPermissions();
  }, [hasPermission, propPermissions]);
  
  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(window.innerHeight - rect.top - 100); // Leave space for bulk action bar
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle role toggle
  const handleToggleRole = useCallback(async (userId: string, roleId: string, isAssigned: boolean) => {
    try {
      if (onAssignRole && onUnassignRole) {
        // Use prop handlers if provided
        if (isAssigned) {
          await onUnassignRole(userId, roleId);
        } else {
          await onAssignRole(userId, roleId);
        }
      } else {
        // Use hook action
        await actions.toggleRole(userId, roleId);
      }
    } catch (error) {
      console.error('Failed to toggle role:', error);
    }
  }, [actions.toggleRole, onAssignRole, onUnassignRole]);
  
  // Handle bulk operations
  const handleBulkAssign = useCallback(async () => {
    const userIds = Array.from(state.bulkSelection.selectedUsers);
    const roleIds = Array.from(state.bulkSelection.selectedRoles);
    
    try {
      if (onBulkAssign) {
        await onBulkAssign(userIds, roleIds);
      } else {
        await actions.bulkAssignRoles(userIds, roleIds);
      }
    } catch (error) {
      console.error('Bulk assign failed:', error);
      toast.error('Failed to assign roles in bulk');
    }
  }, [state.bulkSelection, actions.bulkAssignRoles, onBulkAssign]);
  
  const handleBulkUnassign = useCallback(async () => {
    const userIds = Array.from(state.bulkSelection.selectedUsers);
    const roleIds = Array.from(state.bulkSelection.selectedRoles);
    
    try {
      if (onBulkUnassign) {
        await onBulkUnassign(userIds, roleIds);
      } else {
        await actions.bulkUnassignRoles(userIds, roleIds);
      }
    } catch (error) {
      console.error('Bulk unassign failed:', error);
      toast.error('Failed to unassign roles in bulk');
    }
  }, [state.bulkSelection, actions.bulkUnassignRoles, onBulkUnassign]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [state.filters]);
  
  // Determine if we should show pagination for large datasets
  const shouldPaginate = filteredUsers.length > (configuration?.performance?.maxVisibleUsers || MAX_VISIBLE_ITEMS_BEFORE_PAGINATION);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = configuration?.performance?.batchSize || 50;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  // Paginated users for display
  const paginatedUsers = useMemo(() => {
    if (!shouldPaginate) return filteredUsers;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage, shouldPaginate]);
  
  // Loading state
  if (state.loading && users.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg text-gray-600">Loading user role matrix...</span>
      </div>
    );
  }
  
  // Error state
  if (state.error) {
    return (
      <div className={className}>
        <ErrorDisplay
          error={state.error}
          onRetry={actions.refreshData}
          className="h-64"
        />
      </div>
    );
  }
  
  // Empty state
  if (users.length === 0 || roles.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">
          {users.length === 0 ? 'No users found.' : 'No roles found.'}
        </p>
        <div className="mt-6">
          <button
            onClick={actions.refreshData}
            className="inline-flex items-center px-4 py-2 border border-transparent
                     shadow-sm text-sm font-medium rounded-md text-white bg-blue-600
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`user-role-matrix ${className}`} ref={containerRef}>
      {/* Matrix filters and search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">User Role Matrix</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{filteredUsers.length} users</span>
              <span>•</span>
              <span>{filteredRoles.length} roles</span>
              <span>•</span>
              <span>{Array.from(assignmentMap.values()).reduce((sum, roles) => sum + roles.size, 0)} assignments</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={actions.refreshData}
              disabled={state.loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300
                       text-sm leading-4 font-medium rounded-md text-gray-700 bg-white
                       hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2
                       focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className={`-ml-0.5 mr-2 h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={state.filters.search}
              onChange={(e) => actions.updateFilters({ search: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md
                       placeholder-gray-400 focus:outline-none focus:ring-blue-500
                       focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <select
            value={state.filters.statusFilter}
            onChange={(e) => actions.updateFilters({ statusFilter: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                     focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          
          <select
            value={state.filters.roleTypeFilter}
            onChange={(e) => actions.updateFilters({ roleTypeFilter: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                     focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Role Types</option>
            <option value="system">System Roles</option>
            <option value="custom">Custom Roles</option>
          </select>
        </div>
      </div>
      
      {/* Matrix table container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: containerHeight - 60 }}>
          <table className="min-w-full divide-y divide-gray-200">
            <UserRoleMatrixHeader
              roles={filteredRoles}
              selectedUsers={state.bulkSelection.selectedUsers}
              selectedRoles={state.bulkSelection.selectedRoles}
              onRoleSelect={actions.selectRole}
              onSelectAllUsers={actions.selectAllUsers}
              onSelectAllRoles={actions.selectAllRoles}
              userCount={filteredUsers.length}
              permissions={{ canBulkAssign: permissions.canBulkAssign }}
            />
            
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => {
                const userAssignments = assignmentMap.get(user.id) || new Set();
                const isUserSelected = state.bulkSelection.selectedUsers.has(user.id);
                
                return (
                  <UserRoleMatrixRow
                    key={user.id}
                    user={user}
                    roles={filteredRoles}
                    assignments={userAssignments}
                    onToggleRole={handleToggleRole}
                    onUserSelect={actions.selectUser}
                    isUserSelected={isUserSelected}
                    selectedRoles={state.bulkSelection.selectedRoles}
                    permissions={{
                      canAssignRoles: permissions.canAssignRoles,
                      canUnassignRoles: permissions.canUnassignRoles,
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination for large datasets */}
      {shouldPaginate && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{filteredUsers.length}</span>
                {' '}results
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {state.loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg text-gray-600">Processing...</span>
        </div>
      )}
      
      {/* Bulk action bar */}
      <BulkActionBar
        selectedUsers={state.bulkSelection.selectedUsers}
        selectedRoles={state.bulkSelection.selectedRoles}
        onBulkAssign={handleBulkAssign}
        onBulkUnassign={handleBulkUnassign}
        onClearSelection={actions.clearSelection}
        isLoading={state.loading}
      />
    </div>
  );
};

export default UserRoleMatrix;
