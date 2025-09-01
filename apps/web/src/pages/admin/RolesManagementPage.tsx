import React, { useState, useMemo, useEffect } from 'react';
// Force rebuild - v3 (BULLETPROOF VERSION)
import { useRoles, useUserRoles, useRoleStats, useDeleteRole, useAssignRole, useRemoveUserRole } from '../../hooks/useRoles';
import { useUsers } from '../../hooks/useUsers';
import { Role, RoleAssignment, UserRole } from '../../services/roleService';
import RoleCard from '../../components/roles/RoleCard';
import CreateRoleModal from '../../components/roles/CreateRoleModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import RoleBadge from '../../components/RoleBadge';
import PermissionGate from '../../components/PermissionGate';
import { useTenant } from '../../contexts/TenantContext';
import PropertySelector from '../../components/PropertySelector';

// BULLETPROOF UTILITY FUNCTIONS
const extractSafeArray = <T,>(data: any, fallback: T[] = []): T[] => {
  try {
    // Direct array check
    if (Array.isArray(data)) {
      console.log('[SafeArray] Direct array found:', data.length, 'items');
      return data;
    }
    
    // Check common response wrapper patterns
    if (data && typeof data === 'object') {
      // Check .data property
      if (data.data && Array.isArray(data.data)) {
        console.log('[SafeArray] Found array in .data property:', data.data.length, 'items');
        return data.data;
      }
      
      // Check .items property
      if (data.items && Array.isArray(data.items)) {
        console.log('[SafeArray] Found array in .items property:', data.items.length, 'items');
        return data.items;
      }
      
      // Check .results property
      if (data.results && Array.isArray(data.results)) {
        console.log('[SafeArray] Found array in .results property:', data.results.length, 'items');
        return data.results;
      }
      
      // Check .list property
      if (data.list && Array.isArray(data.list)) {
        console.log('[SafeArray] Found array in .list property:', data.list.length, 'items');
        return data.list;
      }
      
      // If it's an object but not an array-like structure, return fallback
      console.log('[SafeArray] Object found but no array property detected:', Object.keys(data));
    }
    
    // If data is null, undefined, or not an object
    console.log('[SafeArray] No valid array found, using fallback. Data type:', typeof data, 'Data value:', data);
    return fallback;
  } catch (error) {
    console.error('[SafeArray] Error extracting array:', error, 'Data:', data);
    return fallback;
  }
};

const safeFilter = <T,>(array: any, predicate: (item: T) => boolean, fallback: T[] = []): T[] => {
  try {
    const safeArray = extractSafeArray<T>(array, fallback);
    if (safeArray.length === 0) return fallback;
    
    const filtered = safeArray.filter((item: T) => {
      try {
        return predicate(item);
      } catch (error) {
        console.error('[SafeFilter] Error in predicate for item:', item, error);
        return false;
      }
    });
    
    console.log('[SafeFilter] Filtered', safeArray.length, 'to', filtered.length, 'items');
    return filtered;
  } catch (error) {
    console.error('[SafeFilter] Error in safeFilter:', error, 'Array:', array);
    return fallback;
  }
};

const safeMap = <T, R>(array: any, mapper: (item: T) => R, fallback: R[] = []): R[] => {
  try {
    const safeArray = extractSafeArray<T>(array, []);
    if (safeArray.length === 0) return fallback;
    
    const mapped = safeArray.map((item: T) => {
      try {
        return mapper(item);
      } catch (error) {
        console.error('[SafeMap] Error in mapper for item:', item, error);
        return null;
      }
    }).filter(Boolean) as R[];
    
    console.log('[SafeMap] Mapped', safeArray.length, 'to', mapped.length, 'items');
    return mapped;
  } catch (error) {
    console.error('[SafeMap] Error in safeMap:', error, 'Array:', array);
    return fallback;
  }
};

const safeFind = <T,>(array: any, predicate: (item: T) => boolean): T | undefined => {
  try {
    const safeArray = extractSafeArray<T>(array, []);
    return safeArray.find((item: T) => {
      try {
        return predicate(item);
      } catch (error) {
        console.error('[SafeFind] Error in predicate for item:', item, error);
        return false;
      }
    });
  } catch (error) {
    console.error('[SafeFind] Error in safeFind:', error, 'Array:', array);
    return undefined;
  }
};

const getQueryParam = (name: string): string | null => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  } catch (error) {
    console.error('[QueryParam] Error getting query param:', name, error);
    return null;
  }
};

const RolesManagementPage: React.FC = () => {
  const { propertyId } = useTenant();
  // Debug mode from query parameter
  const debugMode = getQueryParam('debug') === 'true';
  
  // State management with safe initialization
  const [viewMode, setViewMode] = useState<'roles' | 'assignments'>('roles');
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Data hooks with error boundaries
  const { data: roles, isLoading: rolesLoading, error: rolesError } = useRoles();
  const { data: userRoles, isLoading: userRolesLoading, error: userRolesError } = useUserRoles();
  const { data: roleStats, error: roleStatsError } = useRoleStats();
  const { data: usersResponse, error: usersError } = useUsers({});
  const deleteRole = useDeleteRole();
  const assignRole = useAssignRole();
  const removeUserRole = useRemoveUserRole();

  // COMPREHENSIVE DATA DEBUGGING (moved to useEffect to avoid hook order violations)
  useEffect(() => {
    if (debugMode) {
      console.log('[RolesPage] COMPREHENSIVE DEBUG DATA:');
      console.log('- Roles:', { 
        value: roles, 
        type: typeof roles, 
        isArray: Array.isArray(roles),
        keys: roles && typeof roles === 'object' ? Object.keys(roles) : 'N/A',
        length: Array.isArray(roles) ? roles.length : 'Not array'
      });
      console.log('- UserRoles:', { 
        value: userRoles, 
        type: typeof userRoles, 
        isArray: Array.isArray(userRoles),
        keys: userRoles && typeof userRoles === 'object' ? Object.keys(userRoles) : 'N/A',
        length: Array.isArray(userRoles) ? userRoles.length : 'Not array'
      });
      console.log('- UsersResponse:', { 
        value: usersResponse, 
        type: typeof usersResponse, 
        keys: usersResponse && typeof usersResponse === 'object' ? Object.keys(usersResponse) : 'N/A'
      });
      console.log('- RoleStats:', { 
        value: roleStats, 
        type: typeof roleStats,
        keys: roleStats && typeof roleStats === 'object' ? Object.keys(roleStats) : 'N/A'
      });
    }
  }, [debugMode, roles, userRoles, usersResponse, roleStats]);

  // BULLETPROOF DATA EXTRACTION
  const safeUsers = useMemo(() => {
    try {
      const users = extractSafeArray(usersResponse?.data || usersResponse, []);
      console.log('[Users] Extracted safe users:', users.length, 'items');
      return users;
    } catch (error) {
      console.error('[Users] Error extracting users:', error);
      setErrorState('Failed to load users data');
      return [];
    }
  }, [usersResponse]);

  // BULLETPROOF ROLES FILTERING
  const filteredRoles = useMemo(() => {
    try {
      console.log('[FilteredRoles] Starting roles filtering...');
      
      // Extract safe roles array
      const rolesArray = extractSafeArray<Role>(roles, []);
      
      if (rolesArray.length === 0) {
        console.log('[FilteredRoles] No roles to filter');
        return [];
      }

      // Apply search filter safely
      const filtered = safeFilter<Role>(
        rolesArray,
        (role: Role) => {
          try {
            const name = role?.name || '';
            const description = role?.description || '';
            const searchLower = searchTerm.toLowerCase();
            
            return (
              name.toLowerCase().includes(searchLower) ||
              description.toLowerCase().includes(searchLower)
            );
          } catch (error) {
            console.error('[FilteredRoles] Error filtering role:', role, error);
            return false;
          }
        },
        []
      );
      
      console.log('[FilteredRoles] Successfully filtered roles:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('[FilteredRoles] Critical error in roles filtering:', error);
      setErrorState('Failed to filter roles');
      return [];
    }
  }, [roles, searchTerm]);

  // BULLETPROOF USER ROLES FILTERING
  const filteredUserRoles = useMemo(() => {
    try {
      console.log('[FilteredUserRoles] Starting user roles filtering...');
      
      // Extract safe user roles array
      const userRolesArray = extractSafeArray<UserRole>(userRoles, []);
      
      if (userRolesArray.length === 0) {
        console.log('[FilteredUserRoles] No user roles to filter');
        return [];
      }

      // Apply role filter safely
      if (!selectedRoleFilter) {
        console.log('[FilteredUserRoles] No role filter, returning all user roles');
        return userRolesArray;
      }

      const filtered = safeFilter<UserRole>(
        userRolesArray,
        (userRole: UserRole) => {
          try {
            return userRole?.roleId === selectedRoleFilter;
          } catch (error) {
            console.error('[FilteredUserRoles] Error filtering user role:', userRole, error);
            return false;
          }
        },
        []
      );
      
      console.log('[FilteredUserRoles] Successfully filtered user roles:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('[FilteredUserRoles] Critical error in user roles filtering:', error);
      setErrorState('Failed to filter user roles');
      return [];
    }
  }, [userRoles, selectedRoleFilter]);

  // BULLETPROOF EVENT HANDLERS
  const handleRoleClick = (role: Role) => {
    try {
      if (!role || !role.id) {
        console.warn('[HandleRoleClick] Invalid role provided:', role);
        return;
      }
      setSelectedRole(role);
    } catch (error) {
      console.error('[HandleRoleClick] Error handling role click:', error);
      setErrorState('Failed to select role');
    }
  };

  const handleEditRole = (role: Role) => {
    try {
      if (!role || !role.id) {
        console.warn('[HandleEditRole] Invalid role provided:', role);
        return;
      }
      setSelectedRole(role);
      setShowEditRoleModal(true);
    } catch (error) {
      console.error('[HandleEditRole] Error handling edit role:', error);
      setErrorState('Failed to edit role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      if (!role || !role.id || !role.name) {
        console.warn('[HandleDeleteRole] Invalid role provided:', role);
        return;
      }
      
      if (window.confirm(`Are you sure you want to delete the role "${role.name}"? This will remove all assignments.`)) {
        await deleteRole.mutateAsync(role.id);
      }
    } catch (error) {
      console.error('[HandleDeleteRole] Error deleting role:', error);
      setErrorState('Failed to delete role');
    }
  };

  const handleAssignRole = async (assignment: RoleAssignment) => {
    try {
      if (!assignment || !assignment.userId || !assignment.roleId) {
        console.warn('[HandleAssignRole] Invalid assignment provided:', assignment);
        return;
      }
      
      await assignRole.mutateAsync(assignment);
      setShowAssignRoleModal(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('[HandleAssignRole] Error assigning role:', error);
      setErrorState('Failed to assign role');
    }
  };

  const handleRemoveUserRole = async (userRoleId: string) => {
    try {
      if (!userRoleId) {
        console.warn('[HandleRemoveUserRole] Invalid userRoleId provided:', userRoleId);
        return;
      }
      
      if (window.confirm('Are you sure you want to remove this role assignment?')) {
        await removeUserRole.mutateAsync(userRoleId);
      }
    } catch (error) {
      console.error('[HandleRemoveUserRole] Error removing user role:', error);
      setErrorState('Failed to remove user role');
    }
  };

  // BULLETPROOF USERS WITHOUT ROLES CALCULATION
  const getUsersWithoutRoles = () => {
    try {
      console.log('[GetUsersWithoutRoles] Calculating users without roles...');
      
      const userRolesArray = extractSafeArray<UserRole>(userRoles, []);
      const usersArray = extractSafeArray(safeUsers, []);
      
      if (usersArray.length === 0) {
        console.log('[GetUsersWithoutRoles] No users available');
        return [];
      }

      // Create set of assigned user IDs safely
      const assignedUserIds = new Set(
        userRolesArray
          .map((ur: UserRole) => {
            try {
              return ur?.userId;
            } catch (error) {
              console.error('[GetUsersWithoutRoles] Error getting userId from userRole:', ur, error);
              return null;
            }
          })
          .filter(Boolean)
      );
      
      // Filter users safely
      const unassignedUsers = usersArray.filter((user: any) => {
        try {
          return user && user.id && !assignedUserIds.has(user.id);
        } catch (error) {
          console.error('[GetUsersWithoutRoles] Error filtering user:', user, error);
          return false;
        }
      });
      
      console.log('[GetUsersWithoutRoles] Found', unassignedUsers.length, 'unassigned users');
      return unassignedUsers;
    } catch (error) {
      console.error('[GetUsersWithoutRoles] Critical error:', error);
      return [];
    }
  };

  // SAFE STATS CALCULATION - Must be before early returns to avoid hooks violation
  const safeRoleStats = useMemo(() => {
    try {
      return {
        totalRoles: filteredRoles.length,
        totalAssignments: filteredUserRoles.length,
        totalUsers: safeUsers.length,
        unassignedUsers: getUsersWithoutRoles().length
      };
    } catch (error) {
      console.error('[SafeRoleStats] Error calculating stats:', error);
      return {
        totalRoles: 0,
        totalAssignments: 0,
        totalUsers: 0,
        unassignedUsers: 0
      };
    }
  }, [filteredRoles, filteredUserRoles, safeUsers]);

  // ERROR STATE HANDLER
  const handleErrorDismiss = () => {
    setErrorState(null);
  };

  const handleRefreshData = () => {
    try {
      window.location.reload();
    } catch (error) {
      console.error('[RefreshData] Error refreshing:', error);
    }
  };

  // LOADING STATE
  if (rolesLoading || userRolesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading roles data..." />
      </div>
    );
  }

  // COMPREHENSIVE ERROR STATE
  const hasErrors = rolesError || userRolesError || roleStatsError || usersError || errorState;
  if (hasErrors) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ Failed to load roles data</div>
        
        {debugMode && (
          <div className="text-left bg-gray-100 p-4 rounded-lg mb-4 text-sm">
            <h4 className="font-bold mb-2">Debug Information:</h4>
            <div>Roles Error: {rolesError?.message || 'None'}</div>
            <div>User Roles Error: {userRolesError?.message || 'None'}</div>
            <div>Role Stats Error: {roleStatsError?.message || 'None'}</div>
            <div>Users Error: {usersError?.message || 'None'}</div>
            <div>Component Error: {errorState || 'None'}</div>
          </div>
        )}
        
        {errorState && (
          <div className="text-orange-600 mb-4">
            Component Error: {errorState}
          </div>
        )}
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={handleRefreshData}
            className="btn btn-primary"
          >
            Retry Loading
          </button>
          {errorState && (
            <button 
              onClick={handleErrorDismiss}
              className="btn btn-secondary"
            >
              Dismiss Error
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DEBUG MODE INDICATOR */}
      {debugMode && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          🐛 Debug Mode Active - Check console for detailed logs
        </div>
      )}

      {/* ERROR STATE INDICATOR */}
      {errorState && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex justify-between items-center">
          <span>⚠️ {errorState}</span>
          <button onClick={handleErrorDismiss} className="text-red-900 hover:text-red-600">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600 mt-1">
            Manage user roles, permissions, and access levels
          </p>
        </div>
        <PropertySelector variant="compact" className="min-w-[180px]" showOrganization={false} size="sm" />
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

      {!propertyId && (
        <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded flex items-center justify-between">
          <span className="text-sm text-yellow-800">Select a property to view property-scoped roles and assignments.</span>
          <PropertySelector variant="compact" className="min-w-[200px]" showOrganization={false} size="sm" />
        </div>
      )}

      {/* Stats Cards with Safe Data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{safeRoleStats.totalRoles}</div>
          <div className="text-sm text-gray-600">Total Roles</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{safeRoleStats.totalAssignments}</div>
          <div className="text-sm text-gray-600">Active Assignments</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{safeRoleStats.totalUsers}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{safeRoleStats.unassignedUsers}</div>
          <div className="text-sm text-gray-600">Unassigned Users</div>
        </div>
      </div>

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
                  onChange={(e) => {
                    try {
                      setSearchTerm(e.target.value);
                    } catch (error) {
                      console.error('[SearchTerm] Error setting search term:', error);
                    }
                  }}
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
              {safeMap<Role, JSX.Element>(
                filteredRoles,
                (role: Role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onClick={handleRoleClick}
                    onEdit={handleEditRole}
                    onDelete={handleDeleteRole}
                  />
                ),
                []
              )}
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
                  onChange={(e) => {
                    try {
                      setSelectedRoleFilter(e.target.value);
                    } catch (error) {
                      console.error('[RoleFilter] Error setting role filter:', error);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  {safeMap<Role, JSX.Element>(
                    roles,
                    (role: Role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ),
                    []
                  )}
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
                  {safeMap<UserRole, JSX.Element>(
                    filteredUserRoles,
                    (userRole: UserRole) => (
                      <tr key={userRole.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                              {(userRole?.user?.firstName?.[0] || '?')}{(userRole?.user?.lastName?.[0] || '')}
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">
                                {userRole?.user?.firstName || 'Unknown'} {userRole?.user?.lastName || 'User'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {userRole?.user?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 mb-1">
                            <RoleBadge
                              role={userRole?.role?.name || 'Unknown Role'}
                              isCustomRole={true}
                              size="sm"
                              showTooltip={true}
                              customRoles={[{
                                id: userRole?.role?.id || 'unknown',
                                name: userRole?.role?.name || 'Unknown Role',
                                description: userRole?.role?.description || ''
                              }]}
                            />
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">{userRole?.role?.description || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            📊 Level {userRole?.role?.level || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {userRole?.assignedAt ? new Date(userRole.assignedAt).toLocaleDateString() : 'Unknown'}
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
                    ),
                    []
                  )}
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
                    onChange={(e) => {
                      try {
                        setSelectedUserId(e.target.value);
                      } catch (error) {
                        console.error('[AssignModal] Error setting selected user:', error);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select user</option>
                    {safeMap(
                      safeUsers,
                      (user: any) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ),
                      []
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={selectedRole?.id || ''}
                    onChange={(e) => {
                      try {
                        const role = safeFind<Role>(roles, (r: Role) => r.id === e.target.value);
                        setSelectedRole(role || null);
                      } catch (error) {
                        console.error('[AssignModal] Error setting selected role:', error);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select role</option>
                    {safeMap<Role, JSX.Element>(
                      roles,
                      (role: Role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} (Level {role.level})
                        </option>
                      ),
                      []
                    )}
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
                    try {
                      if (selectedUserId && selectedRole) {
                        handleAssignRole({
                          userId: selectedUserId,
                          roleId: selectedRole.id
                        });
                      }
                    } catch (error) {
                      console.error('[AssignModal] Error in assign role button:', error);
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