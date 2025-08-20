import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateOrganizationModal from '../components/CreateOrganizationModal';
import EditOrganizationModal from '../components/EditOrganizationModal';
import OrganizationDetailsModal from '../components/OrganizationDetailsModal';
import PermissionGate from '../components/PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import { organizationService, Organization, OrganizationFilter } from '../services/organizationService';

const OrganizationsPage: React.FC = () => {
  const { user: _currentUser } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalProperties: 0,
    totalUsers: 0,
  });

  // Load organizations
  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filter: OrganizationFilter = {
        search: searchTerm || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      };
      
      const response = await organizationService.getOrganizations(filter);
      if (response.data) {
        // Ensure we always have an array for organizations
        let orgs = [];
        if (Array.isArray(response.data)) {
          orgs = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          orgs = response.data.data;
        } else if (response.data.organizations && Array.isArray(response.data.organizations)) {
          orgs = response.data.organizations;
        }
        setOrganizations(orgs);
      } else {
        setError('Failed to load organizations');
        setOrganizations([]);
      }
    } catch (error: any) {
      console.error('Failed to load organizations:', error);
      setError(error.response?.data?.message || 'Failed to load organizations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  // Load organization statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await organizationService.getOrganizationStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Calculate stats from loaded organizations as fallback
      const orgsArray = Array.isArray(organizations) ? organizations : [];
      const total = orgsArray.length;
      const active = orgsArray.filter(org => org.isActive).length;
      const inactive = total - active;
      const totalProperties = orgsArray.reduce((sum, org) => sum + (org._count?.properties || 0), 0);
      const totalUsers = orgsArray.reduce((sum, org) => sum + (org._count?.users || 0), 0);
      
      setStats({
        total,
        active,
        inactive,
        totalProperties,
        totalUsers,
      });
    }
  }, [organizations]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadOrganizations();
    loadStats();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedOrganization(null);
    loadOrganizations();
    loadStats();
  };

  const handleDelete = async (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (!org) return;

    const hasProperties = org._count?.properties && org._count.properties > 0;
    const hasUsers = org._count?.users && org._count.users > 0;

    let confirmMessage = `Are you sure you want to delete "${org.name}"?`;
    if (hasProperties || hasUsers) {
      confirmMessage += '\n\nThis organization contains:';
      if (hasUsers) confirmMessage += `\n• ${org._count?.users} user${org._count?.users && org._count.users > 1 ? 's' : ''}`;
      if (hasProperties) confirmMessage += `\n• ${org._count?.properties} propert${org._count?.properties && org._count.properties > 1 ? 'ies' : 'y'}`;
      confirmMessage += '\n\nAll associated data will be removed. This action cannot be undone.';
    }

    if (!confirm(confirmMessage)) return;

    try {
      setLoading(true);
      await organizationService.deleteOrganization(organizationId);
      await loadOrganizations();
      await loadStats();
    } catch (error: any) {
      console.error('Failed to delete organization:', error);
      alert(error.response?.data?.message || 'Failed to delete organization');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (organizationId: string, currentStatus: boolean) => {
    const org = organizations.find(o => o.id === organizationId);
    if (!org) return;

    try {
      setLoading(true);
      await organizationService.updateOrganization(organizationId, {
        isActive: !currentStatus
      });
      await loadOrganizations();
      await loadStats();
    } catch (error: any) {
      console.error('Failed to update organization status:', error);
      alert(error.response?.data?.message || 'Failed to update organization status');
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

  // Filter organizations for display - ensure organizations is always an array
  const filteredOrganizations = (Array.isArray(organizations) ? organizations : []).filter(org => {
    const matchesSearch = !searchTerm || 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && org.isActive) ||
      (statusFilter === 'inactive' && !org.isActive);
    
    return matchesSearch && matchesStatus;
  });


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Organization Management</h1>
          <p className="text-gray-600">
            Manage hotel organizations, properties, and organizational structure
          </p>
        </div>
        
        <PermissionGate commonPermission={COMMON_PERMISSIONS.CREATE_ORGANIZATION}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            disabled={loading}
          >
            <span className="mr-2">➕</span>
            Add Organization
          </button>
        </PermissionGate>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🏢</div>
          <p className="text-sm text-gray-600 mb-1">Total Organizations</p>
          <p className="text-xl font-bold text-charcoal">{stats.total}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">❌</div>
          <p className="text-sm text-gray-600 mb-1">Inactive</p>
          <p className="text-xl font-bold text-red-600">{stats.inactive}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🏨</div>
          <p className="text-sm text-gray-600 mb-1">Total Properties</p>
          <p className="text-xl font-bold text-blue-600">{stats.totalProperties}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">👥</div>
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-xl font-bold text-purple-600">{stats.totalUsers}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 lg:max-w-md">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="form-input w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Organizations Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                No organizations found
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `No organizations match "${searchTerm}"`
                  : 'No organizations available'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrganizations.map((organization) => (
                    <tr key={organization.id} className={`hover:bg-gray-50 ${!organization.isActive ? 'opacity-75 bg-gray-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-4 ${
                            organization.isActive ? 'bg-warm-gold' : 'bg-gray-400'
                          }`}>
                            {organization.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${!organization.isActive ? 'text-gray-500 line-through' : 'text-charcoal'}`}>
                              {organization.name}
                            </p>
                            <p className={`text-sm ${!organization.isActive ? 'text-gray-400' : 'text-gray-500'}`}>
                              {organization.slug}
                            </p>
                            {organization.description && (
                              <p className="text-xs text-gray-400 truncate max-w-xs">
                                {organization.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {organization.contactEmail && (
                            <p className="text-charcoal">{organization.contactEmail}</p>
                          )}
                          {organization.contactPhone && (
                            <p className="text-gray-500">{organization.contactPhone}</p>
                          )}
                          {organization.website && (
                            <a 
                              href={organization.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              🌐 Website
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {organization._count?.properties || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {organization._count?.users || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(organization.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(organization.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              setSelectedOrganization(organization);
                              setShowDetailsModal(true);
                            }}
                          >
                            View
                          </button>
                          <PermissionGate commonPermission={COMMON_PERMISSIONS.EDIT_ORGANIZATION}>
                            <button 
                              className="text-green-600 hover:text-green-800"
                              onClick={() => {
                                setSelectedOrganization(organization);
                                setShowEditModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className={organization.isActive ? "text-yellow-600 hover:text-yellow-800" : "text-green-600 hover:text-green-800"}
                              onClick={() => handleToggleStatus(organization.id, organization.isActive)}
                              disabled={loading}
                            >
                              {organization.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </PermissionGate>
                          <PermissionGate commonPermission={COMMON_PERMISSIONS.DELETE_ORGANIZATION}>
                            <button 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDelete(organization.id)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Organization Modal */}
      {selectedOrganization && (
        <EditOrganizationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrganization(null);
          }}
          organization={selectedOrganization}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Organization Details Modal */}
      {selectedOrganization && (
        <OrganizationDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrganization(null);
          }}
          organization={selectedOrganization}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
};

export default OrganizationsPage;