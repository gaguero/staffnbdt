import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonStats } from '../components/skeletons';
import { toastService } from '../utils/toast';
import CreateOrganizationModal from '../components/CreateOrganizationModal';
import EditOrganizationModal from '../components/EditOrganizationModal';
import OrganizationDetailsModal from '../components/OrganizationDetailsModal';
import PermissionGate from '../components/PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import { organizationService, Organization, OrganizationFilter } from '../services/organizationService';

// Phase 2 UX Improvements
import { 
  EnhancedTable, 
  BulkActionBar, 
  type TableColumn 
} from '../components';
import { 
  usePagination, 
  useBulkSelection, 
  useExport, 
  useInlineEdit,
  type InlineEditField
} from '../hooks';

/**
 * Enhanced Organizations Page demonstrating Phase 2 UX improvements:
 * - Enhanced pagination with items per page selector
 * - Bulk operations framework with multi-select
 * - Enhanced export functionality
 * - Inline editing capabilities
 */
const EnhancedOrganizationsPage: React.FC = () => {
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalProperties: 0,
    totalUsers: 0,
  });

  // Phase 2 Hooks
  const pagination = usePagination({
    defaultLimit: 25,
    persistInUrl: true,
  });

  const { exportData, exportFromService, isExporting } = useExport();

  // Load organizations with pagination
  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filter: OrganizationFilter = {
        search: searchTerm || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        page: pagination.page,
        limit: pagination.limit,
      };
      
      const response = await organizationService.getOrganizations(filter);
      if (response.data) {
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
        toastService.error('Failed to load organizations');
      }
    } catch (error: any) {
      console.error('Failed to load organizations:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load organizations';
      setError(errorMessage);
      setOrganizations([]);
      toastService.error(errorMessage);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [searchTerm, statusFilter, pagination.page, pagination.limit]);

  // Load organization statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await organizationService.getOrganizationStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  // Table configuration
  const columns: TableColumn<Organization>[] = [
    {
      key: 'name',
      label: 'Organization',
      editable: true,
      render: (value, org) => (
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-4 ${
            org.isActive ? 'bg-warm-gold' : 'bg-gray-400'
          }`}>
            {org.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className={`text-sm font-medium ${!org.isActive ? 'text-gray-500 line-through' : 'text-charcoal'}`}>
              {org.name}
            </p>
            <p className={`text-sm ${!org.isActive ? 'text-gray-400' : 'text-gray-500'}`}>
              {org.slug}
            </p>
            {org.description && (
              <p className="text-xs text-gray-400 truncate max-w-xs">
                {org.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contactEmail',
      label: 'Contact',
      editable: true,
      render: (value, org) => (
        <div className="text-sm">
          {org.contactEmail && (
            <p className="text-charcoal">{org.contactEmail}</p>
          )}
          {org.contactPhone && (
            <p className="text-gray-500">{org.contactPhone}</p>
          )}
          {org.website && (
            <a 
              href={org.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              🌐 Website
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'properties',
      label: 'Properties',
      align: 'center',
      render: (value, org) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {org._count?.properties || 0}
        </span>
      ),
    },
    {
      key: 'users',
      label: 'Users',
      align: 'center',
      render: (value, org) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {org._count?.users || 0}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      editable: true,
      render: (value, org) => (
        <span className={`badge ${org.isActive ? 'badge-success' : 'badge-error'}`}>
          {org.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (value, org) => (
        <div className="flex space-x-2">
          <button 
            className="text-blue-600 hover:text-blue-800"
            onClick={() => {
              setSelectedOrganization(org);
              setShowDetailsModal(true);
            }}
          >
            View
          </button>
          <PermissionGate commonPermission={COMMON_PERMISSIONS.EDIT_ORGANIZATION}>
            <button 
              className="text-green-600 hover:text-green-800"
              onClick={() => {
                setSelectedOrganization(org);
                setShowEditModal(true);
              }}
            >
              Edit
            </button>
          </PermissionGate>
          <PermissionGate commonPermission={COMMON_PERMISSIONS.DELETE_ORGANIZATION}>
            <button 
              className="text-red-600 hover:text-red-800"
              onClick={() => handleDelete(org.id)}
              disabled={loading}
            >
              Delete
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  // Inline edit fields configuration
  const inlineEditFields: InlineEditField[] = [
    {
      key: 'name',
      type: 'text',
      validator: (value) => {
        if (!value || value.trim().length < 2) {
          return 'Organization name must be at least 2 characters';
        }
        return null;
      },
    },
    {
      key: 'contactEmail',
      type: 'text',
      validator: (value) => {
        if (value && !/\S+@\S+\.\S+/.test(value)) {
          return 'Please enter a valid email address';
        }
        return null;
      },
    },
    {
      key: 'isActive',
      type: 'boolean',
    },
  ];

  // Bulk actions configuration
  const bulkActions = [
    {
      id: 'activate',
      label: 'Activate',
      icon: '✅',
      variant: 'success' as const,
      requiresConfirmation: true,
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: '⏸️',
      variant: 'secondary' as const,
      requiresConfirmation: true,
    },
    {
      id: 'export',
      label: 'Export Selected',
      icon: '📥',
      variant: 'primary' as const,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑️',
      variant: 'danger' as const,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to delete the selected organizations? This action cannot be undone.',
    },
  ];

  // Event handlers
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

    if (!confirm(confirmMessage)) {
      toastService.actions.confirmationRequired('proceed with deletion');
      return;
    }

    const loadingToast = toastService.loading(`Deleting "${org.name}"...`);

    try {
      setLoading(true);
      await organizationService.deleteOrganization(organizationId);
      await loadOrganizations();
      await loadStats();
      
      toastService.dismiss(loadingToast);
      toastService.actions.deleted('Organization', org.name);
    } catch (error: any) {
      console.error('Failed to delete organization:', error);
      toastService.dismiss(loadingToast);
      toastService.actions.operationFailed(
        'delete organization',
        error.response?.data?.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Bulk action handler
  const handleBulkAction = async (actionId: string, selectedItems: Organization[]) => {
    switch (actionId) {
      case 'activate':
        await handleBulkStatusChange(selectedItems, true);
        break;
      case 'deactivate':
        await handleBulkStatusChange(selectedItems, false);
        break;
      case 'export':
        await handleExportSelected(selectedItems);
        break;
      case 'delete':
        await handleBulkDelete(selectedItems);
        break;
    }
  };

  const handleBulkStatusChange = async (items: Organization[], isActive: boolean) => {
    const action = isActive ? 'activate' : 'deactivate';
    const loadingToast = toastService.loading(`${action === 'activate' ? 'Activating' : 'Deactivating'} ${items.length} organization${items.length > 1 ? 's' : ''}...`);
    
    try {
      setLoading(true);
      await Promise.all(
        items.map(org => 
          organizationService.updateOrganization(org.id, { isActive })
        )
      );
      await loadOrganizations();
      await loadStats();
      
      toastService.dismiss(loadingToast);
      toastService.success(`Successfully ${action}d ${items.length} organization${items.length > 1 ? 's' : ''}`);
    } catch (error: any) {
      toastService.dismiss(loadingToast);
      toastService.error(`Failed to ${action} organizations`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (items: Organization[]) => {
    const loadingToast = toastService.loading(`Deleting ${items.length} organization${items.length > 1 ? 's' : ''}...`);
    
    try {
      setLoading(true);
      await Promise.all(
        items.map(org => organizationService.deleteOrganization(org.id))
      );
      await loadOrganizations();
      await loadStats();
      
      toastService.dismiss(loadingToast);
      toastService.success(`Successfully deleted ${items.length} organization${items.length > 1 ? 's' : ''}`);
    } catch (error: any) {
      toastService.dismiss(loadingToast);
      toastService.error('Failed to delete organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSelected = async (items: Organization[]) => {
    await exportData(items, {
      filename: `organizations-selected-${new Date().toISOString().split('T')[0]}.csv`,
      selectedColumns: ['name', 'slug', 'contactEmail', 'contactPhone', 'website', 'isActive'],
      customColumnMapping: {
        name: 'Organization Name',
        slug: 'Slug',
        contactEmail: 'Contact Email',
        contactPhone: 'Contact Phone',
        website: 'Website',
        isActive: 'Status',
      },
    });
  };

  // Enhanced export handler
  const handleExport = async () => {
    try {
      await exportFromService(
        () => organizationService.exportOrganizations({ 
          search: searchTerm || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        }),
        `organizations-export-${new Date().toISOString().split('T')[0]}.csv`
      );
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Inline edit handler
  const handleInlineEdit = async (id: string, field: string, value: any) => {
    try {
      await organizationService.updateOrganization(id, { [field]: value });
      await loadOrganizations();
      await loadStats();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || `Failed to update ${field}`);
    }
  };

  // Filter organizations for display
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
            Enhanced with pagination, bulk operations, export, and inline editing
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary"
            disabled={isExporting || loading}
          >
            📥 Export All
          </button>
          
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
      </div>

      {/* Statistics Cards */}
      {initialLoading ? (
        <SkeletonStats cards={5} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-2xl mb-2">🏢</div>
            <p className="text-sm text-gray-600 mb-1">Total Organizations</p>
            <p className="text-xl font-bold text-charcoal">{stats.total}</p>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-2xl mb-2">❌</div>
            <p className="text-sm text-gray-600 mb-1">Inactive</p>
            <p className="text-xl font-bold text-red-600">{stats.inactive}</p>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-2xl mb-2">🏨</div>
            <p className="text-sm text-gray-600 mb-1">Total Properties</p>
            <p className="text-xl font-bold text-blue-600">{stats.totalProperties}</p>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-xl font-bold text-purple-600">{stats.totalUsers}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 lg:max-w-md">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
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

      {/* Enhanced Table with Phase 2 Features */}
      <EnhancedTable
        data={filteredOrganizations}
        columns={columns}
        getItemId={(org) => org.id}
        
        // Pagination
        paginationConfig={pagination.getConfig(stats.total)}
        onPageChange={pagination.setPage}
        onLimitChange={pagination.setLimit}
        
        // Bulk operations
        enableBulkSelection={true}
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        
        // Inline editing
        inlineEditFields={inlineEditFields}
        onInlineEdit={handleInlineEdit}
        
        // General
        loading={loading}
        emptyMessage={
          searchTerm 
            ? `No organizations match "${searchTerm}"`
            : 'No organizations available'
        }
      />

      {/* Modals */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

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

export default EnhancedOrganizationsPage;