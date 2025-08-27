import React, { useState } from 'react';
import { 
  PermissionViewer
} from '../components/PermissionViewer';
import { Permission } from '../types/permission';
import toastService from '../utils/toast';

const PermissionViewerPage: React.FC = () => {
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);

  // Handle single permission selection
  const handlePermissionSelect = (permission: Permission) => {
    setSelectedPermission(permission);
    console.log('Selected permission:', permission);
  };

  // Handle bulk permission selection
  const handleBulkSelect = (permissions: Permission[]) => {
    setSelectedPermissions(permissions);
    console.log('Selected permissions:', permissions);
  };

  // Handle permission export
  const handleExport = async (permissions: Permission[], format: string) => {
    try {
      console.log(`Exporting ${permissions.length} permissions as ${format}`);
      toastService.success(`Successfully exported ${permissions.length} permissions as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toastService.error('Failed to export permissions');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Permission Explorer</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Comprehensive view of all 82 permissions in the Hotel Operations Hub
                </p>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Production Ready
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  Multi-Tenant
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  RBAC + ABAC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Overview */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">🌳</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Hierarchical Tree</h3>
                  <p className="text-sm text-gray-600">Resource → Action → Scope structure</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">🔍</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Search</h3>
                  <p className="text-sm text-gray-600">Real-time filtering with suggestions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">✅</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Multi-Select</h3>
                  <p className="text-sm text-gray-600">Bulk operations and selection</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">📤</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
                  <p className="text-sm text-gray-600">JSON, CSV, YAML, Markdown</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permission System Overview */}
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hotel Operations Hub Permission System</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">📁 Resources (9 categories)</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>👤 User Management</div>
                <div>🎭 Role Management</div>
                <div>📄 Document Library</div>
                <div>📅 Schedule Management</div>
                <div>💰 Payroll System</div>
                <div>🏖️ Vacation Management</div>
                <div>📊 Analytics & Reports</div>
                <div>📋 Audit Logs</div>
                <div>⚙️ System Administration</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">⚡ Actions (11 types)</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>➕ Create - Add new resources</div>
                <div>👁️ Read - View existing data</div>
                <div>✏️ Update - Modify resources</div>
                <div>🗑️ Delete - Remove resources</div>
                <div>⚙️ Manage - Full control</div>
                <div>✅ Approve - Authorization workflow</div>
                <div>❌ Reject - Denial workflow</div>
                <div>📤 Export - Data extraction</div>
                <div>📥 Import - Data import</div>
                <div>🔗 Assign - Resource assignment</div>
                <div>🚫 Revoke - Access removal</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔒 Scopes (5 levels)</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>🌐 Platform - Entire system</div>
                <div>🏢 Organization - Hotel chain/group</div>
                <div>🏨 Property - Individual hotel</div>
                <div>🏬 Department - Hotel department</div>
                <div>👤 Own - Personal resources only</div>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Viewer Component */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <PermissionViewer
            onPermissionSelect={handlePermissionSelect}
            onBulkSelect={handleBulkSelect}
            onExport={handleExport}
            height={800}
            showToolbar={true}
            showFooter={true}
            options={{
              showSearch: true,
              showFilters: true,
              showExport: true,
              showPermissionDetails: true,
              showRoleContext: true,
              showUserContext: true,
              multiSelect: true,
              expandAll: false,
              showCounts: true,
              showDescriptions: true,
            }}
          />
        </div>

        {/* Selection Summary */}
        {(selectedPermission || selectedPermissions.length > 0) && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selection Summary</h2>
            
            {selectedPermission && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Currently Selected Permission:</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔐</span>
                    <div>
                      <div className="font-mono text-blue-900">
                        {selectedPermission.resource}.{selectedPermission.action}.{selectedPermission.scope}
                      </div>
                      {selectedPermission.description && (
                        <div className="text-sm text-blue-700 mt-1">{selectedPermission.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPermissions.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Bulk Selected Permissions ({selectedPermissions.length}):
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {selectedPermissions.slice(0, 9).map(permission => (
                    <div 
                      key={permission.id} 
                      className="bg-gray-50 border border-gray-200 rounded p-2 text-xs font-mono text-gray-700"
                    >
                      {permission.resource}.{permission.action}.{permission.scope}
                    </div>
                  ))}
                  {selectedPermissions.length > 9 && (
                    <div className="bg-gray-100 border border-gray-300 rounded p-2 text-xs text-gray-500 flex items-center justify-center">
                      +{selectedPermissions.length - 9} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage Examples */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔍 Search Examples</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-100 p-2 rounded font-mono">user.create</div>
                <div className="text-gray-600">Find all user creation permissions</div>
                <div className="bg-gray-100 p-2 rounded font-mono">department</div>
                <div className="text-gray-600">Find all department-scoped permissions</div>
                <div className="bg-gray-100 p-2 rounded font-mono">approve</div>
                <div className="text-gray-600">Find all approval permissions</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">⚙️ Use Cases</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Role creation and management</div>
                <div>• Security audit and compliance</div>
                <div>• Permission documentation</div>
                <div>• System integration planning</div>
                <div>• Access control debugging</div>
                <div>• Multi-tenant permission analysis</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionViewerPage;