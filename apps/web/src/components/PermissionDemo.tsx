import React, { useState } from 'react';
import { PermissionGate, RoleBasedComponent, usePermissionGate } from './';
import { usePermissions } from '../hooks/usePermissions';
import { useRoleCheck } from './RoleBasedComponent';
import { COMMON_PERMISSIONS, PermissionSpec } from '../types/permission';
import LoadingSpinner from './LoadingSpinner';

/**
 * PermissionDemo - Comprehensive demonstration of permission system usage
 * 
 * This component showcases all the different ways to use the permission system:
 * 1. PermissionGate component usage
 * 2. RoleBasedComponent for backwards compatibility
 * 3. usePermissions hook for imperative checks
 * 4. Common permissions usage
 * 5. Migration patterns from roles to permissions
 */
const PermissionDemo: React.FC = () => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
    isLoading,
    error,
    refreshPermissions,
    getCacheStats,
  } = usePermissions();
  
  const { checkPermissionGate } = usePermissionGate();
  const { isAdmin } = useRoleCheck();
  
  const [imperativeResult, setImperativeResult] = useState<boolean | null>(null);
  const [bulkCheckResult, setBulkCheckResult] = useState<Record<string, boolean> | null>(null);

  // Test imperative permission checking
  const testImperativeCheck = async () => {
    const result = await hasPermission('user', 'create', 'department');
    setImperativeResult(result);
  };

  // Test bulk permission checking
  const testBulkCheck = async () => {
    const permissionsToCheck: PermissionSpec[] = [
      { resource: 'user', action: 'create' },
      { resource: 'user', action: 'read' },
      { resource: 'user', action: 'update' },
      { resource: 'user', action: 'delete' },
    ];

    const anyResult = await hasAnyPermission(permissionsToCheck);
    const allResult = await hasAllPermissions(permissionsToCheck);

    setBulkCheckResult({
      any: anyResult,
      all: allResult,
    });
  };

  // Test permission gate hook
  const testPermissionGateHook = async () => {
    await checkPermissionGate({
      resource: 'document',
      action: 'create',
      scope: 'department',
    });
    // Permission gate hook result logged
  };

  const cacheStats = getCacheStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Loading permissions..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Permission System Demo</h1>
        <p className="text-gray-600 mb-6">
          Comprehensive demonstration of the permission-based access control system
        </p>

        {/* Permission Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Permissions Loaded</h3>
            <p className="text-2xl font-bold text-blue-600">{permissions.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Cache Hits</h3>
            <p className="text-2xl font-bold text-green-600">{cacheStats.validEntries}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">Is Admin</h3>
            <p className="text-2xl font-bold text-purple-600">{isAdmin() ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Permission Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={refreshPermissions}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* 1. Basic PermissionGate Usage */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-charcoal mb-4">1. Basic PermissionGate Usage</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Single Permission Check</h3>
            <PermissionGate
              resource="user"
              action="create"
              scope="department"
              unauthorized={<div className="text-red-600 p-3 bg-red-50 rounded">❌ No permission to create users</div>}
            >
              <div className="text-green-600 p-3 bg-green-50 rounded">✅ Can create users in department</div>
            </PermissionGate>
          </div>

          <div>
            <h3 className="font-medium mb-2">Common Permission</h3>
            <PermissionGate
              commonPermission={COMMON_PERMISSIONS.VIEW_ALL_USERS}
              unauthorized={<div className="text-red-600 p-3 bg-red-50 rounded">❌ Cannot view all users</div>}
            >
              <div className="text-green-600 p-3 bg-green-50 rounded">✅ Can view all users</div>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* 2. Multiple Permissions Logic */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-charcoal mb-4">2. Multiple Permissions Logic</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">ANY Permission (OR Logic)</h3>
            <PermissionGate
              permissions={[
                { resource: 'user', action: 'create' },
                { resource: 'user', action: 'update' },
                { resource: 'user', action: 'delete' },
              ]}
              requireAll={false}
              unauthorized={<div className="text-red-600 p-3 bg-red-50 rounded">❌ No user management permissions</div>}
            >
              <div className="text-green-600 p-3 bg-green-50 rounded">✅ Has some user management permissions</div>
            </PermissionGate>
          </div>

          <div>
            <h3 className="font-medium mb-2">ALL Permissions (AND Logic)</h3>
            <PermissionGate
              permissions={[
                { resource: 'user', action: 'create' },
                { resource: 'user', action: 'update' },
                { resource: 'user', action: 'delete' },
              ]}
              requireAll={true}
              unauthorized={<div className="text-red-600 p-3 bg-red-50 rounded">❌ Missing some user permissions</div>}
            >
              <div className="text-green-600 p-3 bg-green-50 rounded">✅ Has full user management permissions</div>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* 3. Backwards Compatibility */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-charcoal mb-4">3. Backwards Compatibility (Roles + Permissions)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Legacy Role-Based</h3>
            <RoleBasedComponent
              roles={['DEPARTMENT_ADMIN', 'PROPERTY_MANAGER']}
              unauthorized={<div className="text-orange-600 p-3 bg-orange-50 rounded">⚠️ Admin role required</div>}
            >
              <div className="text-green-600 p-3 bg-green-50 rounded">✅ Has admin role</div>
            </RoleBasedComponent>
          </div>

          <div>
            <h3 className="font-medium mb-2">Mixed (Role + Permission)</h3>
            <RoleBasedComponent
              roles={['STAFF']}
              resource="payroll"
              action="read"
              scope="own"
              usePermissions={true}
              unauthorized={<div className="text-orange-600 p-3 bg-orange-50 rounded">⚠️ Cannot access payroll</div>}
            >
              <div className="text-green-600 p-3 bg-green-50 rounded">✅ Can view own payroll</div>
            </RoleBasedComponent>
          </div>
        </div>
      </div>

      {/* 4. Imperative Usage */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-charcoal mb-4">4. Imperative Permission Checking</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={testImperativeCheck}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Single Permission
            </button>
            {imperativeResult !== null && (
              <span className={`px-3 py-1 rounded ${imperativeResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {imperativeResult ? '✅ Allowed' : '❌ Denied'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={testBulkCheck}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test Bulk Permissions
            </button>
            {bulkCheckResult && (
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded ${bulkCheckResult.any ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  ANY: {bulkCheckResult.any ? '✅' : '❌'}
                </span>
                <span className={`px-3 py-1 rounded ${bulkCheckResult.all ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  ALL: {bulkCheckResult.all ? '✅' : '❌'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={testPermissionGateHook}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Test Permission Gate Hook
            </button>
            <span className="text-sm text-gray-600">Check console for results</span>
          </div>
        </div>
      </div>

      {/* 5. Context-Aware Permissions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-charcoal mb-4">5. Context-Aware Permissions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Department-Scoped Action</h3>
            <PermissionGate
              resource="document"
              action="delete"
              scope="department"
              context={{ 
                departmentId: 'dept-123',
                documentType: 'policy' 
              }}
              unauthorized={<div className="text-red-600 p-3 bg-red-50 rounded">❌ Cannot delete department documents</div>}
            >
              <div className="text-green-600 p-3 bg-green-50 rounded">✅ Can delete department documents</div>
            </PermissionGate>
          </div>

          <div>
            <h3 className="font-medium mb-2">Resource-Specific Context</h3>
            <PermissionGate
              resource="user"
              action="update"
              scope="department"
              context={{ 
                targetUserId: 'user-456',
                field: 'role' 
              }}
              unauthorized={<div className="text-red-600 p-3 bg-red-50 rounded">❌ Cannot modify user roles</div>}
            >
              <div className="text-green-600 p-3 bg-green-50 rounded">✅ Can modify user roles</div>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* 6. Loading States and Error Handling */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-charcoal mb-4">6. Loading States and Error Handling</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">With Custom Loading</h3>
            <PermissionGate
              resource="expensive_operation"
              action="execute"
              loading={
                <div className="p-3 bg-blue-50 rounded flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-blue-600">Checking expensive operation permission...</span>
                </div>
              }
              unauthorized={<div className="text-red-600 p-3 bg-red-50 rounded">❌ Cannot execute expensive operations</div>}
            >
              <div className="text-green-600 p-3 bg-green-50 rounded">✅ Can execute expensive operations</div>
            </PermissionGate>
          </div>

          <div>
            <h3 className="font-medium mb-2">Hide on Denied</h3>
            <p className="text-sm text-gray-600 mb-2">Admin-only content (hidden if no permission):</p>
            <PermissionGate
              resource="system"
              action="admin"
              hideOnDenied={true}
            >
              <div className="text-blue-600 p-3 bg-blue-50 rounded">🔧 Secret admin panel access</div>
            </PermissionGate>
            <p className="text-xs text-gray-500 mt-2">
              You'll only see the admin panel if you have system admin permissions
            </p>
          </div>
        </div>
      </div>

      {/* 7. Cache Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-charcoal mb-4">7. Cache Information & Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-600">Total Cache Entries</p>
            <p className="text-xl font-bold">{cacheStats.totalEntries}</p>
          </div>
          <div className="bg-green-50 rounded p-3">
            <p className="text-sm text-gray-600">Valid Entries</p>
            <p className="text-xl font-bold text-green-600">{cacheStats.validEntries}</p>
          </div>
          <div className="bg-red-50 rounded p-3">
            <p className="text-sm text-gray-600">Expired Entries</p>
            <p className="text-xl font-bold text-red-600">{cacheStats.expiredEntries}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refreshPermissions}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Permissions
          </button>
        </div>
      </div>

      {/* 8. Debug Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-charcoal mb-4">8. Debug Information</h2>
        
        <div className="bg-gray-50 rounded p-4">
          <h3 className="font-medium mb-2">Current User Permissions</h3>
          <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
            {permissions.length > 0 ? (
              <ul className="space-y-1">
                {permissions.slice(0, 10).map((permission, index) => (
                  <li key={index} className="font-mono">
                    {permission.resource}:{permission.action}:{permission.scope}
                  </li>
                ))}
                {permissions.length > 10 && (
                  <li className="italic">... and {permissions.length - 10} more</li>
                )}
              </ul>
            ) : (
              <p>No permissions loaded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDemo;