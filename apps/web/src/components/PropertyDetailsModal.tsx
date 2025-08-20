import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import PermissionGate from './PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import { propertyService, Property } from '../services/propertyService';

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onEdit: () => void;
}

interface PropertyDepartment {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  _count?: {
    users: number;
  };
}

interface PropertyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  position?: string;
  isActive: boolean;
  department?: {
    name: string;
  };
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  isOpen,
  onClose,
  property,
  onEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<PropertyDepartment[]>([]);
  const [users, setUsers] = useState<PropertyUser[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'users'>('overview');

  // Load property details
  useEffect(() => {
    if (isOpen && property) {
      loadPropertyDetails();
    }
  }, [isOpen, property]);

  const loadPropertyDetails = async () => {
    if (!property) return;

    setLoading(true);
    try {
      // Load departments and users in parallel
      const [departmentsResponse, usersResponse] = await Promise.allSettled([
        propertyService.getPropertyDepartments(property.id),
        propertyService.getPropertyUsers(property.id),
      ]);

      if (departmentsResponse.status === 'fulfilled' && departmentsResponse.value.data) {
        setDepartments(departmentsResponse.value.data || []);
      } else {
        console.error('Failed to load departments:', departmentsResponse);
        setDepartments([]);
      }

      if (usersResponse.status === 'fulfilled' && usersResponse.value.data) {
        setUsers(usersResponse.value.data || []);
      } else {
        console.error('Failed to load users:', usersResponse);
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load property details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const propertyTypes = propertyService.getPropertyTypes();
  const timezones = propertyService.getTimezones();
  const currencies = propertyService.getCurrencies();

  const getPropertyTypeLabel = (type?: string) => {
    if (!type) return 'Not specified';
    return propertyTypes.find(t => t.value === type)?.label || type;
  };

  const getTimezoneLabel = (timezone?: string) => {
    if (!timezone) return 'Not specified';
    return timezones.find(tz => tz.value === timezone)?.label || timezone;
  };

  const getCurrencyLabel = (currency?: string) => {
    if (!currency) return 'Not specified';
    return currencies.find(curr => curr.value === currency)?.label || currency;
  };

  const formatLocation = () => {
    const parts = [];
    if (property.address) parts.push(property.address);
    if (property.city) parts.push(property.city);
    if (property.state) parts.push(property.state);
    if (property.country) parts.push(property.country);
    if (property.postalCode) parts.push(property.postalCode);
    
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{property.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{property.organization?.name}</p>
          </div>
          <div className="flex items-center space-x-3">
            <PermissionGate permission={COMMON_PERMISSIONS.EDIT_PROPERTY}>
              <button
                onClick={onEdit}
                className="px-3 py-2 text-sm font-medium text-white bg-warm-gold hover:bg-opacity-90 rounded-md transition-colors"
              >
                Edit Property
              </button>
            </PermissionGate>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-warm-gold text-warm-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'departments'
                  ? 'border-warm-gold text-warm-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Departments ({property._count?.departments || 0})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-warm-gold text-warm-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users ({property._count?.users || 0})
            </button>
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!loading && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property Name</label>
                    <p className="mt-1 text-sm text-gray-900">{property.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">URL Slug</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{property.slug}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property Type</label>
                    <p className="mt-1 text-sm text-gray-900">{getPropertyTypeLabel(property.type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {property.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {property.description && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{property.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Full Address</label>
                    <p className="mt-1 text-sm text-gray-900">{formatLocation()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <p className="mt-1 text-sm text-gray-900">{property.city || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <p className="mt-1 text-sm text-gray-900">{property.country || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <p className="mt-1 text-sm text-gray-900">{property.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <p className="mt-1 text-sm text-gray-900">{property.email || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {property.website ? (
                        <a href={property.website} target="_blank" rel="noopener noreferrer" className="text-warm-gold hover:underline">
                          {property.website}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Property Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <p className="mt-1 text-sm text-gray-900">{getTimezoneLabel(property.timezone)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <p className="mt-1 text-sm text-gray-900">{getCurrencyLabel(property.currency)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Room Occupancy</label>
                    <p className="mt-1 text-sm text-gray-900">{property.settings?.maxOccupancy || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-in Time</label>
                    <p className="mt-1 text-sm text-gray-900">{property.settings?.checkInTime || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-out Time</label>
                    <p className="mt-1 text-sm text-gray-900">{property.settings?.checkOutTime || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Branding */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Branding Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: property.branding?.primaryColor || '#AA8E67' }}
                      />
                      <span className="text-sm text-gray-900 font-mono">
                        {property.branding?.primaryColor || '#AA8E67'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: property.branding?.secondaryColor || '#F5EBD7' }}
                      />
                      <span className="text-sm text-gray-900 font-mono">
                        {property.branding?.secondaryColor || '#F5EBD7'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Accent Color</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: property.branding?.accentColor || '#4A4A4A' }}
                      />
                      <span className="text-sm text-gray-900 font-mono">
                        {property.branding?.accentColor || '#4A4A4A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(property.createdAt).toLocaleDateString()} at {new Date(property.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(property.updatedAt).toLocaleDateString()} at {new Date(property.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'departments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Property Departments</h3>
                <span className="text-sm text-gray-500">{departments.length} departments</span>
              </div>
              
              {departments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No departments found for this property
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {departments.map((department) => (
                        <tr key={department.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {department.name}
                              </div>
                              {department.description && (
                                <div className="text-sm text-gray-500">
                                  {department.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              department.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {department.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {department._count?.users || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Property Users</h3>
                <span className="text-sm text-gray-500">{users.length} users</span>
              </div>
              
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users found for this property
                </div>
              ) : (
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
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                              {user.position && (
                                <div className="text-sm text-gray-400">
                                  {user.position}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {user.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.department?.name || 'No department'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;