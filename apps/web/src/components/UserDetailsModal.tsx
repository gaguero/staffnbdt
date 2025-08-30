import React, { useState } from 'react';
import { User } from '../services/userService';
import UserActivityLog from './UserActivityLog';
import UserPropertyAssignment from './UserPropertyAssignment';
import { UserRoleSection } from './UserRoleManagement';
import { useTenantPermissions } from '../contexts/TenantContext';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onEdit?: (user: User) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'roles' | 'activity' | 'properties'>('details');
  const [showPropertyAssignment, setShowPropertyAssignment] = useState(false);
  const { canManageProperty } = useTenantPermissions();

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: 'var(--brand-background)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-12 h-12 text-white rounded-full flex items-center justify-center font-medium text-lg" style={{ backgroundColor: 'var(--brand-primary)' }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--brand-text-primary)' }}>
                  {user.firstName} {user.lastName}
                  {user.deletedAt && (
                    <span className="ml-2 px-2 py-1 text-xs rounded" style={{ backgroundColor: 'var(--brand-primary-200)', color: 'var(--brand-primary-800)' }}>
                      Inactive
                    </span>
                  )}
                </h2>
                <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{user.email}</p>
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
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-transparent'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{
                borderBottomColor: activeTab === 'details' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'details' ? 'var(--brand-primary)' : 'var(--brand-text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'details') {
                  e.currentTarget.style.color = 'var(--brand-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'details') {
                  e.currentTarget.style.color = 'var(--brand-text-secondary)';
                }
              }}
            >
              <span className="flex items-center space-x-2">
                <span>👤</span>
                <span>User Details</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-transparent'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{
                borderBottomColor: activeTab === 'roles' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'roles' ? 'var(--brand-primary)' : 'var(--brand-text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'roles') {
                  e.currentTarget.style.color = 'var(--brand-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'roles') {
                  e.currentTarget.style.color = 'var(--brand-text-secondary)';
                }
              }}
            >
              <span className="flex items-center space-x-2">
                <span>🎭</span>
                <span>Roles & Permissions</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-transparent'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{
                borderBottomColor: activeTab === 'activity' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'activity' ? 'var(--brand-primary)' : 'var(--brand-text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'activity') {
                  e.currentTarget.style.color = 'var(--brand-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'activity') {
                  e.currentTarget.style.color = 'var(--brand-text-secondary)';
                }
              }}
            >
              <span className="flex items-center space-x-2">
                <span>📋</span>
                <span>Activity Log</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'properties'
                  ? 'border-transparent'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{
                borderBottomColor: activeTab === 'properties' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'properties' ? 'var(--brand-primary)' : 'var(--brand-text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'properties') {
                  e.currentTarget.style.color = 'var(--brand-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'properties') {
                  e.currentTarget.style.color = 'var(--brand-text-secondary)';
                }
              }}
            >
              <span className="flex items-center space-x-2">
                <span>🏢</span>
                <span>Properties</span>
              </span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-96">
          {/* User Details Tab */}
          {activeTab === 'details' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2" style={{ color: 'var(--brand-text-primary)' }}>
                    Basic Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-secondary)' }}>
                        Full Name
                      </label>
                      <p style={{ color: 'var(--brand-text-primary)' }}>{user.firstName} {user.lastName}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-secondary)' }}>
                        Email Address
                      </label>
                      <p style={{ color: 'var(--brand-text-primary)' }}>{user.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-secondary)' }}>
                        Role
                      </label>
                      <p style={{ color: 'var(--brand-text-primary)' }}>{formatRole(user.role)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-secondary)' }}>
                        Position
                      </label>
                      <p style={{ color: 'var(--brand-text-primary)' }}>{user.position || 'Not set'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-secondary)' }}>
                        Phone Number
                      </label>
                      <p style={{ color: 'var(--brand-text-primary)' }}>{user.phoneNumber || 'Not set'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-secondary)' }}>
                        Department
                      </label>
                      <p style={{ color: 'var(--brand-text-primary)' }}>{user.department?.name || 'No Department'}</p>
                    </div>

                    {/* Property Access Summary */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property Access
                      </label>
                      <div className="flex items-center space-x-2">
                        <p style={{ color: 'var(--brand-text-primary)' }}>
                          {user.properties ? `${user.properties.length} properties` : 'No property access'}
                        </p>
                        {canManageProperty() && (
                          <button
                            onClick={() => setShowPropertyAssignment(true)}
                            className="text-xs underline"
                            style={{ color: 'var(--brand-primary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-primary-600)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-primary)'}
                          >
                            Manage
                          </button>
                        )}
                      </div>
                      {user.properties && user.properties.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {user.properties.slice(0, 3).map((property) => (
                            <span
                              key={property.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                              style={{ backgroundColor: 'var(--brand-primary-50)', color: 'var(--brand-primary)' }}
                            >
                              {property.name}
                            </span>
                          ))}
                          {user.properties.length > 3 && (
                            <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                              +{user.properties.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Employment & Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2" style={{ color: 'var(--brand-text-primary)' }}>
                    Employment & Contact
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hire Date
                      </label>
                      <p style={{ color: 'var(--brand-text-primary)' }}>{formatDate(user.hireDate)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Created
                      </label>
                      <p style={{ color: 'var(--brand-text-primary)' }}>{formatDate(user.createdAt)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <p style={{ color: 'var(--brand-text-primary)' }}>
                        {user.deletedAt ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--brand-primary-200)', color: 'var(--brand-primary-800)' }}>
                            Inactive since {formatDate(user.deletedAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--brand-primary-100)', color: 'var(--brand-primary-700)' }}>
                            Active
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Emergency Contact */}
                    {user.emergencyContact && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Emergency Contact
                        </label>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          {/* Handle both new format (contacts array) and legacy format (primaryContact/secondaryContact) */}
                          {user.emergencyContact.contacts ? (
                            // New format
                            user.emergencyContact.contacts.map((contact: any, index: number) => (
                              <div key={index} className={index > 0 ? 'border-t border-gray-200 pt-2' : ''}>
                                <p className="font-medium" style={{ color: 'var(--brand-text-primary)' }}>
                                  {contact.name} {contact.isPrimary && <span className="text-xs text-white px-1 rounded" style={{ backgroundColor: 'var(--brand-primary)' }}>Primary</span>}
                                </p>
                                <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{contact.relationship}</p>
                                <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{contact.phoneNumber}</p>
                                {contact.email && <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{contact.email}</p>}
                              </div>
                            ))
                          ) : (
                            // Legacy format
                            <>
                              {user.emergencyContact.primaryContact && (
                                <div>
                                  <p className="font-medium" style={{ color: 'var(--brand-text-primary)' }}>
                                    {user.emergencyContact.primaryContact.name} <span className="text-xs text-white px-1 rounded" style={{ backgroundColor: 'var(--brand-primary)' }}>Primary</span>
                                  </p>
                                  <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{user.emergencyContact.primaryContact.relationship}</p>
                                  <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{user.emergencyContact.primaryContact.phoneNumber}</p>
                                  {user.emergencyContact.primaryContact.email && <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{user.emergencyContact.primaryContact.email}</p>}
                                </div>
                              )}
                              {user.emergencyContact.secondaryContact && (
                                <div className="border-t border-gray-200 pt-2">
                                  <p className="font-medium" style={{ color: 'var(--brand-text-primary)' }}>
                                    {user.emergencyContact.secondaryContact.name} <span className="text-xs text-white px-1 rounded" style={{ backgroundColor: 'var(--brand-text-secondary)' }}>Secondary</span>
                                  </p>
                                  <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{user.emergencyContact.secondaryContact.relationship}</p>
                                  <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{user.emergencyContact.secondaryContact.phoneNumber}</p>
                                  {user.emergencyContact.secondaryContact.email && <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{user.emergencyContact.secondaryContact.email}</p>}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--brand-text-primary)' }}>
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
                  <div>
                    <span className="font-medium">User ID:</span> {user.id}
                  </div>
                  {user.department && (
                    <div>
                      <span className="font-medium">Department ID:</span> {user.department.id}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Roles & Permissions Tab */}
          {activeTab === 'roles' && (
            <div className="p-6">
              <UserRoleSection
                user={user}
                showHistory={true}
                showPermissionPreview={true}
                enableAdvancedManagement={true}
                maxVisibleRoles={5}
                compact={false}
              />
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div className="p-6">
              <UserActivityLog userId={user.id} maxEntries={25} />
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--brand-text-primary)' }}>
                    Property Access
                  </h3>
                  {canManageProperty() && (
                    <button
                      onClick={() => setShowPropertyAssignment(true)}
                      className="btn btn-sm btn-primary"
                    >
                      Manage Access
                    </button>
                  )}
                </div>

                {user.properties && user.properties.length > 0 ? (
                  <div className="grid gap-3">
                    {user.properties.map((property) => (
                      <div
                        key={property.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 text-white rounded-full flex items-center justify-center font-medium text-sm" style={{ backgroundColor: 'var(--brand-primary)' }}>
                            {property.name[0]?.toUpperCase() || 'P'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium" style={{ color: 'var(--brand-text-primary)' }}>
                              {property.name}
                            </h4>
                            <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
                              {property.code}
                            </p>
                            {property.address && (
                              <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                                {typeof property.address === 'string' 
                                  ? property.address
                                  : `${property.address.city || ''}, ${property.address.country || ''}`
                                }
                              </p>
                            )}
                          </div>
                          <div style={{ color: 'var(--brand-primary)' }}>
                            <span className="text-sm">✓</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🏢</div>
                    <p style={{ color: 'var(--brand-text-secondary)' }}>No property access assigned</p>
                    {canManageProperty() && (
                      <button
                        onClick={() => setShowPropertyAssignment(true)}
                        className="mt-3 text-sm underline"
                        style={{ color: 'var(--brand-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-primary-600)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-primary)'}
                      >
                        Assign Properties
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <div>
              {onEdit && (
                <button
                  onClick={() => onEdit(user)}
                  className="px-4 py-2 text-white rounded-md font-medium transition-colors"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--brand-primary-600)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}
                >
                  Edit User
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 transition-colors"
              style={{ color: 'var(--brand-text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-text-secondary)'}
            >
              Close
            </button>
          </div>
        </div>

        {/* Property Assignment Modal */}
        <UserPropertyAssignment
          user={user}
          isOpen={showPropertyAssignment}
          onClose={() => setShowPropertyAssignment(false)}
          onSuccess={() => {
            // Refresh user data or trigger parent refresh
            setShowPropertyAssignment(false);
          }}
        />
      </div>
    </div>
  );
};

export default UserDetailsModal;