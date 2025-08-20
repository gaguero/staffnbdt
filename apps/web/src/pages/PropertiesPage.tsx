import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import CreatePropertyModal from '../components/CreatePropertyModal';
import EditPropertyModal from '../components/EditPropertyModal';
import PropertyDetailsModal from '../components/PropertyDetailsModal';
import PermissionGate from '../components/PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import { propertyService, Property, PropertyFilter } from '../services/propertyService';
import { organizationService } from '../services/organizationService';

const PropertiesPage: React.FC = () => {
  const { user: _currentUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [organizations, setOrganizations] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalDepartments: 0,
    totalUsers: 0,
  });

  // Load properties
  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filter: PropertyFilter = {
        search: searchTerm || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        organizationId: organizationFilter === 'all' ? undefined : organizationFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
      };
      
      const response = await propertyService.getProperties(filter);
      if (response.data) {
        // Ensure we always have an array for properties
        let props = [];
        if (Array.isArray(response.data)) {
          props = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          props = response.data.data;
        } else if (response.data.properties && Array.isArray(response.data.properties)) {
          props = response.data.properties;
        }
        setProperties(props);
      } else {
        setError('Failed to load properties');
        setProperties([]);
      }
    } catch (error: any) {
      console.error('Failed to load properties:', error);
      setError(error.response?.data?.message || 'Failed to load properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, organizationFilter, typeFilter]);

  // Load organizations for filter dropdown
  const loadOrganizations = useCallback(async () => {
    try {
      const response = await organizationService.getOrganizations();
      if (response.data) {
        let orgs = [];
        if (Array.isArray(response.data)) {
          orgs = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          orgs = response.data.data;
        } else if (response.data.organizations && Array.isArray(response.data.organizations)) {
          orgs = response.data.organizations;
        }
        setOrganizations(orgs.map(org => ({ id: org.id, name: org.name })));
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      setOrganizations([]);
    }
  }, []);

  // Load property statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await propertyService.getPropertyStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Calculate stats from loaded properties as fallback
      const propsArray = Array.isArray(properties) ? properties : [];
      const total = propsArray.length;
      const active = propsArray.filter(prop => prop.isActive).length;
      const inactive = total - active;
      const totalDepartments = propsArray.reduce((sum, prop) => sum + (prop._count?.departments || 0), 0);
      const totalUsers = propsArray.reduce((sum, prop) => sum + (prop._count?.users || 0), 0);
      
      setStats({
        total,
        active,
        inactive,
        totalDepartments,
        totalUsers,
      });
    }
  }, [properties]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Filter properties for display - ensure properties is always an array
  const filteredProperties = (Array.isArray(properties) ? properties : []).filter(property => {
    const matchesSearch = !searchTerm || 
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.description && property.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (property.city && property.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (property.organization?.name && property.organization.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && property.isActive) ||
      (statusFilter === 'inactive' && !property.isActive);
    
    const matchesOrganization = organizationFilter === 'all' || property.organizationId === organizationFilter;
    
    const matchesType = typeFilter === 'all' || property.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesOrganization && matchesType;
  });

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadProperties();
    loadStats();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedProperty(null);
    loadProperties();
    loadStats();
  };

  const handleDelete = async (property: Property) => {
    if (!window.confirm(`Are you sure you want to delete "${property.name}"?`)) {
      return;
    }

    try {
      await propertyService.deleteProperty(property.id);
      loadProperties();
      loadStats();
    } catch (error: any) {
      console.error('Failed to delete property:', error);
      alert(error.response?.data?.message || 'Failed to delete property');
    }
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setShowEditModal(true);
  };

  const handleView = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading properties..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading text-charcoal">Property Management</h1>
          <p className="text-gray-600 mt-1">Manage hotel properties and their settings</p>
        </div>
        <PermissionGate permission={COMMON_PERMISSIONS.CREATE_PROPERTY}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-warm-gold text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Add Property
          </button>
        </PermissionGate>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-soft border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">🏨</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Properties</p>
              <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-soft border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-soft border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-red-600 text-xl">⏸️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-soft border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">🏢</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Departments</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalDepartments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-soft border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-xl">👥</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Users</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-soft border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Properties
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, slug, description, city, or organization..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Organization Filter */}
          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <select
              id="organization"
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
            >
              <option value="all">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-gold focus:border-transparent"
            >
              <option value="all">All Types</option>
              {propertyService.getPropertyTypes().map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' || organizationFilter !== 'all' || typeFilter !== 'all' 
                      ? 'No properties match your filters' 
                      : 'No properties found'}
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {property.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {property.slug}
                        </div>
                        {property.description && (
                          <div className="text-sm text-gray-400 max-w-xs truncate">
                            {property.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {property.organization?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {property.type ? propertyService.getPropertyTypes().find(t => t.value === property.type)?.label || property.type : 'Not specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {property.city && property.state ? `${property.city}, ${property.state}` : property.city || property.address || 'Not specified'}
                      </div>
                      {property.country && (
                        <div className="text-xs text-gray-500">{property.country}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        property.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {property.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-4">
                        <span>{property._count?.departments || 0} depts</span>
                        <span>{property._count?.users || 0} users</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <PermissionGate permission={COMMON_PERMISSIONS.VIEW_PROPERTIES}>
                          <button
                            onClick={() => handleView(property)}
                            className="text-warm-gold hover:text-opacity-80 transition-colors"
                            title="View Details"
                          >
                            👁️
                          </button>
                        </PermissionGate>
                        <PermissionGate permission={COMMON_PERMISSIONS.EDIT_PROPERTY}>
                          <button
                            onClick={() => handleEdit(property)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit Property"
                          >
                            ✏️
                          </button>
                        </PermissionGate>
                        <PermissionGate permission={COMMON_PERMISSIONS.DELETE_PROPERTY}>
                          <button
                            onClick={() => handleDelete(property)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete Property"
                          >
                            🗑️
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredProperties.length} of {properties.length} properties
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePropertyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          organizations={organizations}
        />
      )}

      {showEditModal && selectedProperty && (
        <EditPropertyModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProperty(null);
          }}
          onSuccess={handleEditSuccess}
          property={selectedProperty}
          organizations={organizations}
        />
      )}

      {showDetailsModal && selectedProperty && (
        <PropertyDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProperty(null);
          }}
          property={selectedProperty}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
};

export default PropertiesPage;