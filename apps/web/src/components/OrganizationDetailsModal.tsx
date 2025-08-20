import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import PermissionGate from './PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import { organizationService, Organization } from '../services/organizationService';

interface OrganizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  onEdit: () => void;
}

interface OrganizationProperty {
  id: string;
  name: string;
  address?: string;
  type?: string;
  isActive: boolean;
  _count?: {
    users: number;
    departments: number;
  };
}

interface OrganizationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  position?: string;
  isActive: boolean;
}

const OrganizationDetailsModal: React.FC<OrganizationDetailsModalProps> = ({
  isOpen,
  onClose,
  organization,
  onEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<OrganizationProperty[]>([]);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'users'>('overview');

  // Load organization details
  useEffect(() => {
    if (isOpen && organization) {
      loadOrganizationDetails();
    }
  }, [isOpen, organization]);

  const loadOrganizationDetails = async () => {
    if (!organization) return;

    setLoading(true);
    try {
      // Load properties and users in parallel
      const [propertiesResponse, usersResponse] = await Promise.allSettled([
        organizationService.getOrganizationProperties(organization.id),
        organizationService.getOrganizationUsers(organization.id),
      ]);

      if (propertiesResponse.status === 'fulfilled' && propertiesResponse.value.success) {
        setProperties(propertiesResponse.value.data || []);
      } else {
        console.error('Failed to load properties:', propertiesResponse);
        setProperties([]);
      }

      if (usersResponse.status === 'fulfilled' && usersResponse.value.success) {
        setUsers(usersResponse.value.data || []);
      } else {
        console.error('Failed to load users:', usersResponse);
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load organization details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <span className="badge badge-success">Active</span>
      : <span className="badge badge-error">Inactive</span>;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return <span className="badge bg-red-100 text-red-800">Platform Admin</span>;
      case 'ORGANIZATION_OWNER':
        return <span className="badge bg-purple-100 text-purple-800">Owner</span>;
      case 'ORGANIZATION_ADMIN':
        return <span className="badge bg-blue-100 text-blue-800">Admin</span>;
      case 'PROPERTY_MANAGER':
        return <span className="badge bg-green-100 text-green-800">Property Manager</span>;
      case 'DEPARTMENT_ADMIN':
        return <span className="badge bg-yellow-100 text-yellow-800">Dept Admin</span>;
      case 'STAFF':
        return <span className="badge badge-neutral">Staff</span>;
      default:
        return <span className="badge badge-neutral">{role}</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                organization.isActive ? 'bg-warm-gold' : 'bg-gray-400'
              }`}>
                {organization.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-charcoal">
                  {organization.name}
                </h3>
                <p className="text-gray-600">{organization.slug}</p>
                <div className="mt-1">{getStatusBadge(organization.isActive)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <PermissionGate commonPermission={COMMON_PERMISSIONS.EDIT_ORGANIZATION}>
                <button
                  onClick={onEdit}
                  className="btn btn-primary"
                >
                  ✏️ Edit
                </button>
              </PermissionGate>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📋' },
                { id: 'properties', label: `Properties (${properties.length})`, icon: '🏨' },
                { id: 'users', label: `Users (${users.length})`, icon: '👥' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-warm-gold text-warm-gold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-charcoal border-b pb-2">Basic Information</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Name</label>
                            <p className="text-charcoal">{organization.name}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-500">Slug</label>
                            <p className="text-charcoal font-mono text-sm">{organization.slug}</p>
                          </div>
                          
                          {organization.description && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Description</label>
                              <p className="text-charcoal">{organization.description}</p>
                            </div>
                          )}
                          
                          {organization.timezone && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Timezone</label>
                              <p className="text-charcoal">{organization.timezone}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-charcoal border-b pb-2">Contact Information</h4>
                        
                        <div className="space-y-3">
                          {organization.contactEmail && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Email</label>
                              <p className="text-charcoal">{organization.contactEmail}</p>
                            </div>
                          )}
                          
                          {organization.contactPhone && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Phone</label>
                              <p className="text-charcoal">{organization.contactPhone}</p>
                            </div>
                          )}
                          
                          {organization.website && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Website</label>
                              <a 
                                href={organization.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {organization.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Settings and Branding */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-charcoal border-b pb-2">Settings</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Default Language</label>
                            <p className="text-charcoal">{organization.settings?.defaultLanguage || 'en'}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-500">Supported Languages</label>
                            <p className="text-charcoal">
                              {organization.settings?.supportedLanguages?.join(', ') || 'en'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-500">Theme</label>
                            <p className="text-charcoal capitalize">{organization.settings?.theme || 'default'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-charcoal border-b pb-2">Branding</h4>
                        
                        <div className="space-y-3">
                          {organization.branding?.primaryColor && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Primary Color</label>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: organization.branding.primaryColor }}
                                ></div>
                                <span className="text-charcoal font-mono text-sm">
                                  {organization.branding.primaryColor}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {organization.branding?.secondaryColor && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Secondary Color</label>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: organization.branding.secondaryColor }}
                                ></div>
                                <span className="text-charcoal font-mono text-sm">
                                  {organization.branding.secondaryColor}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {organization.branding?.accentColor && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Accent Color</label>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: organization.branding.accentColor }}
                                ></div>
                                <span className="text-charcoal font-mono text-sm">
                                  {organization.branding.accentColor}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-charcoal border-b pb-2">Metadata</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <label className="text-gray-500">Created</label>
                          <p className="text-charcoal">{formatDate(organization.createdAt)}</p>
                        </div>
                        
                        <div>
                          <label className="text-gray-500">Last Updated</label>
                          <p className="text-charcoal">{formatDate(organization.updatedAt)}</p>
                        </div>
                        
                        <div>
                          <label className="text-gray-500">Organization ID</label>
                          <p className="text-charcoal font-mono text-xs">{organization.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Properties Tab */}
                {activeTab === 'properties' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-charcoal">Properties</h4>
                      <span className="text-sm text-gray-500">{properties.length} total</span>
                    </div>
                    
                    {properties.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🏨</div>
                        <p>No properties found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {properties.map((property) => (
                          <div key={property.id} className="card p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-charcoal">{property.name}</h5>
                              {getStatusBadge(property.isActive)}
                            </div>
                            {property.address && (
                              <p className="text-sm text-gray-600 mb-2">📍 {property.address}</p>
                            )}
                            {property.type && (
                              <p className="text-sm text-gray-600 mb-2">🏢 {property.type}</p>
                            )}
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>👥 {property._count?.users || 0} users</span>
                              <span>🏢 {property._count?.departments || 0} depts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-charcoal">Users</h4>
                      <span className="text-sm text-gray-500">{users.length} total</span>
                    </div>
                    
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">👥</div>
                        <p>No users found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="text-sm font-medium text-charcoal">
                                      {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {getRoleBadge(user.role)}
                                </td>
                                <td className="px-4 py-3 text-sm text-charcoal">
                                  {user.position || '-'}
                                </td>
                                <td className="px-4 py-3">
                                  {getStatusBadge(user.isActive)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetailsModal;