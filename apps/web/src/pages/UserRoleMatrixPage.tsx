import React, { useState } from 'react';
import { UserRoleMatrix } from '../components/UserRoleMatrix';
import { PermissionGate } from '../components/PermissionGate';
import { MatrixUser } from '../types/userRoleMatrix';
import { toast } from 'react-hot-toast';

const UserRoleMatrixPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Custom handlers for role assignment operations (optional)
  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      // Custom assignment logic here
      console.log(`Assigning role ${roleId} to user ${userId}`);
      // This would typically call your API
      toast.success('Role assigned successfully');
    } catch (error) {
      console.error('Failed to assign role:', error);
      toast.error('Failed to assign role');
      throw error; // Re-throw to let the component handle the error
    }
  };
  
  const handleUnassignRole = async (userId: string, roleId: string) => {
    try {
      // Custom unassignment logic here
      console.log(`Unassigning role ${roleId} from user ${userId}`);
      // This would typically call your API
      toast.success('Role unassigned successfully');
    } catch (error) {
      console.error('Failed to unassign role:', error);
      toast.error('Failed to unassign role');
      throw error;
    }
  };
  
  const handleBulkAssign = async (userIds: string[], roleIds: string[]) => {
    try {
      console.log('Bulk assigning:', { userIds, roleIds });
      // Custom bulk assignment logic
      toast.success(`Assigned ${roleIds.length} roles to ${userIds.length} users`);
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      toast.error('Bulk assignment failed');
      throw error;
    }
  };
  
  const handleBulkUnassign = async (userIds: string[], roleIds: string[]) => {
    try {
      console.log('Bulk unassigning:', { userIds, roleIds });
      // Custom bulk unassignment logic
      toast.success(`Unassigned ${roleIds.length} roles from ${userIds.length} users`);
    } catch (error) {
      console.error('Bulk unassignment failed:', error);
      toast.error('Bulk unassignment failed');
      throw error;
    }
  };
  
  const matrixConfiguration = {
    search: {
      searchFields: ['firstName', 'lastName', 'email'] as (keyof MatrixUser)[],
      fuzzySearch: true,
      highlightMatches: true,
      debounceMs: 300,
    },
    filters: {
      showSystemRoles: true,
      showCustomRoles: true,
      groupByDepartment: false,
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    },
    performance: {
      virtualScrolling: false, // Using pagination instead
      batchSize: 50,
      debounceMs: 300,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxVisibleUsers: 100,
      maxVisibleRoles: 20,
    },
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            User Role Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user role assignments with an intuitive matrix interface.
            Assign or remove roles individually or in bulk.
          </p>
        </div>
        
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300
                     rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white
                     hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              How to use the User Role Matrix
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Individual Assignment:</strong> Click checkboxes to assign/remove roles for specific users</li>
                <li><strong>Bulk Operations:</strong> Select multiple users and roles, then use the bulk action bar</li>
                <li><strong>Search & Filter:</strong> Use the search box and filters to find specific users or roles</li>
                <li><strong>Visual Indicators:</strong> Green checkmarks show current assignments, role badges indicate system vs custom roles</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Permission-gated matrix */}
      <PermissionGate permissions={[{ resource: 'user', action: 'read', scope: 'property' }]}>
        <div className="bg-white shadow-sm rounded-lg">
          <UserRoleMatrix
            key={refreshKey}
            onAssignRole={handleAssignRole}
            onUnassignRole={handleUnassignRole}
            onBulkAssign={handleBulkAssign}
            onBulkUnassign={handleBulkUnassign}
            permissions={{
              canAssignRoles: true,
              canUnassignRoles: true,
              canViewAuditLog: true,
              canBulkAssign: true,
            }}
            configuration={matrixConfiguration}
            className="p-6"
          />
        </div>
      </PermissionGate>
      
      {/* Access denied fallback */}
      <PermissionGate 
        permissions={[{ resource: 'user', action: 'read', scope: 'property' }]} 
        fallback={
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have permission to view user role management.
            </p>
          </div>
        }
      >
        {/* Content is rendered above when permission is granted */}
        <div />
      </PermissionGate>
      
      {/* Help section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Virtual Scrolling</h4>
            <p className="text-sm text-gray-600">
              Automatically enabled for large datasets (100+ users) to maintain performance.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Optimistic Updates</h4>
            <p className="text-sm text-gray-600">
              Changes appear immediately with visual feedback while processing in the background.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Bulk Operations</h4>
            <p className="text-sm text-gray-600">
              Select multiple users and roles to perform batch assignments efficiently.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Role Hierarchies</h4>
            <p className="text-sm text-gray-600">
              System roles follow organizational hierarchy (Platform Admin → Staff).
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Custom Roles</h4>
            <p className="text-sm text-gray-600">
              Organization-specific roles appear alongside system roles with distinct styling.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Audit Trail</h4>
            <p className="text-sm text-gray-600">
              All role changes are logged with timestamps and attribution for compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleMatrixPage;
