import React, { useState, useCallback, useMemo } from 'react';
import { User } from '../../services/userService';
import { useUserRoleManagement, UserRole, RoleAssignment } from '../../hooks/useUserRoleManagement';
import { usePermissions } from '../../hooks/usePermissions';
import RoleBadge from '../RoleBadge';
import toast from '../../utils/toast';

interface UserRoleAssignmentProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onRoleChange?: (user: User, newRoles: UserRole[]) => void;
  mode?: 'assign' | 'manage';
}

const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  user,
  isOpen,
  onClose,
  onRoleChange,
  mode = 'manage'
}) => {
  const [activeTab, setActiveTab] = useState<'assign' | 'permissions' | 'history'>('assign');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');
  const [assignmentOptions, setAssignmentOptions] = useState<{
    expiresAt?: string;
    assignmentReason?: string;
    conditions?: Record<string, any>;
  }>({});
  const [validationResults, setValidationResults] = useState<Record<string, any>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    currentRoles,
    availableRoles,
    effectivePermissions,
    isLoadingCurrentRoles,
    isLoadingAvailableRoles,
    assignRole,
    removeRole,
    bulkAssignRoles,
    bulkRemoveRoles: _bulkRemoveRoles,
    validateRoleAssignment,
    canAssignRole,
    canRemoveRole,
    getRoleConflicts
  } = useUserRoleManagement(user.id);

  const { hasPermission: _hasPermission } = usePermissions();

  if (!isOpen) return null;

  // Filter available roles based on search and type
  const filteredAvailableRoles = useMemo(() => {
    if (!availableRoles) return [];
    
    return availableRoles.filter(role => {
      // Search filter
      if (searchTerm) {
        const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (role.description?.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (filterType === 'system' && !role.isSystem) return false;
      if (filterType === 'custom' && role.isSystem) return false;
      
      // Don't show roles already assigned
      const alreadyAssigned = currentRoles?.some(ur => ur.roleId === role.id);
      if (alreadyAssigned) return false;
      
      // Check if user has permission to assign this role
      return canAssignRole(role.id);
    });
  }, [availableRoles, searchTerm, filterType, currentRoles, canAssignRole]);

  // Validate selected roles
  const validateSelectedRoles = useCallback(async () => {
    if (selectedRoles.length === 0) return;
    
    setIsValidating(true);
    const results: Record<string, any> = {};
    
    try {
      for (const roleId of selectedRoles) {
        results[roleId] = await validateRoleAssignment(user.id, roleId);
      }
      
      // Check for conflicts between selected roles
      const conflicts = getRoleConflicts(selectedRoles);
      if (conflicts.length > 0) {
        results._global = {
          isValid: false,
          conflicts,
          warnings: [],
          recommendations: []
        };
      }
      
      setValidationResults(results);
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Failed to validate role assignments');
    } finally {
      setIsValidating(false);
    }
  }, [selectedRoles, validateRoleAssignment, user.id, getRoleConflicts]);

  // Handle role selection
  const handleRoleToggle = useCallback((roleId: string) => {
    setSelectedRoles(prev => {
      const newSelection = prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId];
      
      // Clear validation results when selection changes
      setValidationResults({});
      
      return newSelection;
    });
  }, []);

  // Handle role assignment
  const handleAssignSelectedRoles = useCallback(async () => {
    if (selectedRoles.length === 0) return;
    
    try {
      const assignments: RoleAssignment[] = selectedRoles.map(roleId => ({
        userId: user.id,
        roleId,
        expiresAt: assignmentOptions.expiresAt,
        metadata: {
          assignmentReason: assignmentOptions.assignmentReason || 'Assigned via user management interface',
        },
        conditions: assignmentOptions.conditions
      }));

      await bulkAssignRoles(assignments);
      
      // Notify parent of role change
      if (onRoleChange && currentRoles) {
        onRoleChange(user, [...currentRoles, ...assignments.map(a => ({
          id: `temp_${Date.now()}`,
          roleId: a.roleId,
          userId: a.userId,
          role: availableRoles?.find(r => r.id === a.roleId) || { id: a.roleId, name: 'Unknown', isSystem: false },
          assignedAt: new Date().toISOString()
        }))]);
      }
      
      // Reset form
      setSelectedRoles([]);
      setAssignmentOptions({});
      setValidationResults({});
      setShowConfirmDialog(false);
      
      toast.success(`Successfully assigned ${assignments.length} role(s)`);
    } catch (error) {
      console.error('Failed to assign roles:', error);
      toast.error('Failed to assign selected roles');
    }
  }, [selectedRoles, user.id, assignmentOptions, bulkAssignRoles, onRoleChange, currentRoles, availableRoles]);

  // Handle role removal
  const handleRemoveRole = useCallback(async (userRoleId: string) => {
    try {
      const userRole = currentRoles?.find(ur => ur.id === userRoleId);
      if (!userRole) return;
      
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
      console.error('Failed to remove role:', error);
      toast.error('Failed to remove role');
    }
  }, [currentRoles, removeRole, user, onRoleChange]);

  const hasValidationErrors = useMemo(() => {
    return Object.values(validationResults).some((result: any) => !result.isValid);
  }, [validationResults]);

  const hasValidationWarnings = useMemo(() => {
    return Object.values(validationResults).some((result: any) => result.warnings?.length > 0);
  }, [validationResults]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {mode === 'assign' ? 'Assign Roles' : 'Manage Roles'}: {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
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
              {/* Current Roles */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Current Roles</h3>
                <div className="space-y-2">
                  {isLoadingCurrentRoles ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ) : currentRoles && currentRoles.length > 0 ? (
                    <div className="space-y-3">
                      {/* System Role */}
                      {user.role && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <RoleBadge role={user.role} size="md" />
                            <span className="text-sm text-gray-600">System Role</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Custom Roles */}
                      {currentRoles.filter(ur => !ur.role.isSystem).map((userRole) => (
                        <div key={userRole.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <RoleBadge role={userRole.role.name} size="md" />
                            <div className="text-sm text-gray-600">
                              <div>Assigned: {new Date(userRole.assignedAt).toLocaleDateString()}</div>
                              {userRole.expiresAt && (
                                <div>Expires: {new Date(userRole.expiresAt).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                          {canRemoveRole(userRole.roleId) && (
                            <button
                              onClick={() => handleRemoveRole(userRole.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No custom roles assigned</p>
                  )}
                </div>
              </div>

              {/* Role Assignment */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Assign New Roles</h3>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="system">System Roles</option>
                    <option value="custom">Custom Roles</option>
                  </select>
                </div>

                {/* Available Roles */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {isLoadingAvailableRoles ? (
                    <div className="animate-pulse space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : filteredAvailableRoles.length > 0 ? (
                    filteredAvailableRoles.map((role) => (
                      <label key={role.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <RoleBadge role={role.name} size="sm" />
                            <span className="font-medium text-gray-900">{role.name}</span>
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      {searchTerm ? 'No roles found matching your search' : 'No roles available for assignment'}
                    </p>
                  )}
                </div>

                {/* Assignment Options */}
                {selectedRoles.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3">
                    <h4 className="font-medium text-gray-900">Assignment Options</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiration Date (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={assignmentOptions.expiresAt || ''}
                          onChange={(e) => setAssignmentOptions(prev => ({
                            ...prev,
                            expiresAt: e.target.value || undefined
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assignment Reason
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Temporary project assignment"
                          value={assignmentOptions.assignmentReason || ''}
                          onChange={(e) => setAssignmentOptions(prev => ({
                            ...prev,
                            assignmentReason: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Results */}
                {Object.keys(validationResults).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {hasValidationErrors && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 text-red-500">⚠</div>
                          <h4 className="font-medium text-red-800">Validation Errors</h4>
                        </div>
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                          {Object.entries(validationResults).map(([roleId, result]: [string, any]) => (
                            result.conflicts?.map((conflict: string, index: number) => (
                              <li key={`${roleId}-${index}`}>{conflict}</li>
                            ))
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {hasValidationWarnings && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 text-yellow-500">⚠</div>
                          <h4 className="font-medium text-yellow-800">Warnings</h4>
                        </div>
                        <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                          {Object.entries(validationResults).map(([roleId, result]: [string, any]) => (
                            result.warnings?.map((warning: string, index: number) => (
                              <li key={`${roleId}-${index}`}>{warning}</li>
                            ))
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="p-6">
              {effectivePermissions ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Effective Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">Total Permissions</h4>
                      <p className="text-2xl font-bold text-blue-600">{effectivePermissions.permissionCount.total}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900">Security Level</h4>
                      <p className="text-2xl font-bold text-green-600">{effectivePermissions.securityLevel}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900">Permission Sources</h4>
                      <p className="text-sm text-purple-600">
                        {Object.keys(effectivePermissions.permissionCount.byCategory).length} categories
                      </p>
                    </div>
                  </div>
                  
                  {/* Permission breakdown by category */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">By Category</h4>
                    {Object.entries(effectivePermissions.permissionCount.byCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="capitalize">{category.replace('_', ' ')}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading permission information...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Role Assignment History</h3>
              <p className="text-gray-500 text-center py-8">Role history will be displayed here</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedRoles.length > 0 && (
                <span>{selectedRoles.length} role(s) selected for assignment</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              
              {selectedRoles.length > 0 && (
                <>
                  <button
                    onClick={validateSelectedRoles}
                    disabled={isValidating}
                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium disabled:opacity-50"
                  >
                    {isValidating ? 'Validating...' : 'Validate'}
                  </button>
                  
                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={hasValidationErrors}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Assign Roles
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Role Assignment</h3>
              <p className="text-sm text-gray-600 mb-4">
                You are about to assign {selectedRoles.length} role(s) to {user.firstName} {user.lastName}.
                {hasValidationWarnings && ' Please review the warnings above.'}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSelectedRoles}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRoleAssignment;