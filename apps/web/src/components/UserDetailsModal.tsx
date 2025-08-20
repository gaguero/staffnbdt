import React, { useState } from 'react';
import { User } from '../services/userService';
import UserActivityLog from './UserActivityLog';
import UserPropertyAssignment from './UserPropertyAssignment';
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
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'properties'>('details');
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
        <div className="px-6 py-4 border-b border-gray-200 bg-sand">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-12 h-12 bg-warm-gold text-white rounded-full flex items-center justify-center font-medium text-lg">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-charcoal">
                  {user.firstName} {user.lastName}
                  {user.deletedAt && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      Inactive
                    </span>
                  )}
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
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-warm-gold text-warm-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>👤</span>
                <span>User Details</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-warm-gold text-warm-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
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
                  ? 'border-warm-gold text-warm-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
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
                  <h3 className="text-lg font-semibold text-charcoal border-b border-gray-200 pb-2">
                    Basic Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <p className="text-gray-900">{user.firstName} {user.lastName}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <p className="text-gray-900">{formatRole(user.role)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <p className="text-gray-900">{user.position || 'Not set'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <p className="text-gray-900">{user.phoneNumber || 'Not set'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <p className="text-gray-900">{user.department?.name || 'No Department'}</p>
                    </div>

                    {/* Property Access Summary */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property Access
                      </label>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-900">
                          {user.properties ? `${user.properties.length} properties` : 'No property access'}
                        </p>
                        {canManageProperty() && (
                          <button
                            onClick={() => setShowPropertyAssignment(true)}
                            className="text-xs text-warm-gold hover:text-opacity-80 underline"
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
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-warm-gold bg-opacity-10 text-warm-gold"
                            >
                              {property.name}
                            </span>
                          ))}
                          {user.properties.length > 3 && (
                            <span className="text-xs text-gray-500">
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
                  <h3 className="text-lg font-semibold text-charcoal border-b border-gray-200 pb-2">
                    Employment & Contact
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hire Date
                      </label>
                      <p className="text-gray-900">{formatDate(user.hireDate)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Created
                      </label>
                      <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <p className="text-gray-900">
                        {user.deletedAt ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive since {formatDate(user.deletedAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-gray-900">{user.emergencyContact.name}</p>
                          <p className="text-sm text-gray-600">{user.emergencyContact.relationship}</p>
                          <p className="text-sm text-gray-600">{user.emergencyContact.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-charcoal mb-4">
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
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
                  <h3 className="text-lg font-semibold text-charcoal">
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
                          <div className="w-8 h-8 bg-warm-gold text-white rounded-full flex items-center justify-center font-medium text-sm">
                            {property.name[0]?.toUpperCase() || 'P'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-charcoal">
                              {property.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {property.code}
                            </p>
                            {property.address && (
                              <p className="text-xs text-gray-400">
                                {typeof property.address === 'string' 
                                  ? property.address
                                  : `${property.address.city || ''}, ${property.address.country || ''}`
                                }
                              </p>
                            )}
                          </div>
                          <div className="text-green-600">
                            <span className="text-sm">✓</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🏢</div>
                    <p className="text-gray-500">No property access assigned</p>
                    {canManageProperty() && (
                      <button
                        onClick={() => setShowPropertyAssignment(true)}
                        className="mt-3 text-sm text-warm-gold hover:text-opacity-80 underline"
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
                  className="px-4 py-2 bg-warm-gold text-white rounded-md hover:bg-opacity-90 font-medium"
                >
                  Edit User
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
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