import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonTable, SkeletonStats } from '../components/skeletons';
import { toastService } from '../utils/toast';
import CreateOrganizationModal from '../components/CreateOrganizationModal';
import EditOrganizationModal from '../components/EditOrganizationModal';
import OrganizationDetailsModal from '../components/OrganizationDetailsModal';
import AdvancedSearch, { SearchField, SearchRule } from '../components/AdvancedSearch';
import FilterCombination, { FilterDefinition } from '../components/FilterCombination';
import { StatsDashboard, StatCardData } from '../components/ClickableStatCard';
import StatDrillDownModal from '../components/StatDrillDownModal';
import PermissionGate from '../components/PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import { organizationService, Organization, OrganizationFilter } from '../services/organizationService';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { useFilters } from '../hooks/useFilters';
import { useStatsDrillDown } from '../hooks/useStatsDrillDown';

const EnhancedOrganizationsPagePhase3: React.FC = () => {
  const { user: _currentUser } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalProperties: 0,
    totalUsers: 0,
  });

  // Advanced Search Configuration
  const searchFields: SearchField[] = [
    {
      key: 'name',
      label: 'Organization Name',
      type: 'text',
      operators: [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
      ],
    },
    {
      key: 'slug',
      label: 'Organization Slug',
      type: 'text',
      operators: [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
      ],
    },
    {
      key: 'contactEmail',
      label: 'Contact Email',
      type: 'text',
      operators: [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
      ],
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
      operators: [
        { value: 'equals', label: 'Is' },
        { value: 'notEquals', label: 'Is not' },
      ],
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      type: 'date',
      operators: [
        { value: 'equals', label: 'On date' },
        { value: 'after', label: 'After' },
        { value: 'before', label: 'Before' },
        { value: 'between', label: 'Between' },
        { value: 'last7Days', label: 'Last 7 days' },
        { value: 'last30Days', label: 'Last 30 days' },
        { value: 'thisMonth', label: 'This month' },
        { value: 'thisYear', label: 'This year' },
      ],
    },
    {
      key: 'propertyCount',
      label: 'Number of Properties',
      type: 'number',
      operators: [
        { value: 'equals', label: 'Equals' },
        { value: 'greaterThan', label: 'Greater than' },
        { value: 'lessThan', label: 'Less than' },
        { value: 'between', label: 'Between' },
      ],
    },
  ];

  // Filter Configuration
  const filterDefinitions: FilterDefinition[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active', count: stats.active },
        { value: 'inactive', label: 'Inactive', count: stats.inactive },
      ],
      placeholder: 'All Statuses',
    },
    {
      key: 'hasProperties',
      label: 'Has Properties',
      type: 'boolean',
      placeholder: 'All Organizations',
    },
    {
      key: 'hasUsers',
      label: 'Has Users',
      type: 'boolean',
      placeholder: 'All Organizations',
    },
    {
      key: 'createdDate',
      label: 'Created Date',
      type: 'date',
      placeholder: 'Any date',
    },
    {
      key: 'propertyRange',
      label: 'Property Count',
      type: 'range',
      placeholder: 'Any number',
    },
  ];

  // Hook integrations
  const {
    searchRules,
    savedSearches,
    executeSearch,
    saveSearch,
    loadSearch,
    deleteSearch,
    hasActiveSearch,
  } = useAdvancedSearch({
    onSearch: handleAdvancedSearch,
    storageKey: 'organizations-advanced-search',
  });

  const {
    filters,
    presets,
    setFilter,
    clearAllFilters,
    savePreset,
    loadPreset,
    deletePreset,
    hasActiveFilters,
  } = useFilters({
    onFilterChange: handleFiltersChange,
    enableUrlSync: true,
    storageKey: 'organizations-filters',
  });

  const {
    isDrillDownOpen,
    drillDownData,
    isLoading: drillDownLoading,
    error: drillDownError,
    openDrillDown,
    closeDrillDown,
    navigateToFilteredView,
  } = useStatsDrillDown({
    onNavigateToFiltered: handleNavigateToFiltered,
    onDataFetch: handleStatDrillDownFetch,
  });

  // Search and filter handlers
  async function handleAdvancedSearch(_rules: SearchRule[]) {
    await loadOrganizations();
  }

  async function handleFiltersChange(_newFilters: Record<string, any>) {
    await loadOrganizations();
  }

  function handleNavigateToFiltered(appliedFilters: Record<string, any>) {
    // Apply the filters and close drill-down
    Object.entries(appliedFilters).forEach(([key, value]) => {
      setFilter(key, value);
    });
  }

  async function handleStatDrillDownFetch(stat: StatCardData): Promise<any[]> {
    // Simulate fetching drill-down data based on the stat
    switch (stat.id) {
      case 'total':
        return organizations.map(org => ({
          name: org.name,
          status: org.isActive ? 'Active' : 'Inactive',
          properties: org._count?.properties || 0,
          users: org._count?.users || 0,
          created: org.createdAt,
        }));
      
      case 'active':
        return organizations
          .filter(org => org.isActive)
          .map(org => ({
            name: org.name,
            properties: org._count?.properties || 0,
            users: org._count?.users || 0,
            created: org.createdAt,
          }));
      
      case 'inactive':
        return organizations
          .filter(org => !org.isActive)
          .map(org => ({
            name: org.name,
            properties: org._count?.properties || 0,
            users: org._count?.users || 0,
            created: org.createdAt,
          }));
      
      case 'totalProperties':
        return organizations
          .filter(org => (org._count?.properties || 0) > 0)
          .map(org => ({
            organization: org.name,
            propertyCount: org._count?.properties || 0,
            status: org.isActive ? 'Active' : 'Inactive',
          }));
      
      case 'totalUsers':
        return organizations
          .filter(org => (org._count?.users || 0) > 0)
          .map(org => ({
            organization: org.name,
            userCount: org._count?.users || 0,
            status: org.isActive ? 'Active' : 'Inactive',
          }));
      
      default:
        return [];
    }
  }

  // Statistics configuration
  const statisticsData: StatCardData[] = [
    {
      id: 'total',
      title: 'Total Organizations',
      value: stats.total,
      icon: '🏢',
      color: 'gray',
      drillDownable: true,
      filterCriteria: {},
    },
    {
      id: 'active',
      title: 'Active',
      value: stats.active,
      icon: '✅',
      color: 'green',
      drillDownable: true,
      filterCriteria: { status: 'active' },
    },
    {
      id: 'inactive',
      title: 'Inactive',
      value: stats.inactive,
      icon: '❌',
      color: 'red',
      drillDownable: true,
      filterCriteria: { status: 'inactive' },
    },
    {
      id: 'totalProperties',
      title: 'Total Properties',
      value: stats.totalProperties,
      icon: '🏨',
      color: 'blue',
      drillDownable: true,
      filterCriteria: { hasProperties: true },
    },
    {
      id: 'totalUsers',
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'purple',
      drillDownable: true,
      filterCriteria: { hasUsers: true },
    },
  ];

  // Load organizations with advanced filtering
  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filter from advanced search and filters
      const filter: OrganizationFilter = {};
      
      // Apply basic filters
      if (filters.status) {
        filter.isActive = filters.status === 'active';
      }
      
      // Apply advanced search
      if (hasActiveSearch) {
        // Convert search rules to API filter
        searchRules.forEach(rule => {
          if (rule.field && rule.operator && rule.value) {
            switch (rule.field) {
              case 'name':
                if (rule.operator === 'contains') {
                  filter.search = rule.value;
                }
                break;
              case 'isActive':
                filter.isActive = rule.value === 'true';
                break;
              // Add more field mappings as needed
            }
          }
        });
      }
      
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
        
        // Apply client-side filters for complex filtering
        if (filters.hasProperties !== undefined) {
          orgs = orgs.filter((org: Organization) => 
            filters.hasProperties ? (org._count?.properties || 0) > 0 : (org._count?.properties || 0) === 0
          );
        }
        
        if (filters.hasUsers !== undefined) {
          orgs = orgs.filter((org: Organization) => 
            filters.hasUsers ? (org._count?.users || 0) > 0 : (org._count?.users || 0) === 0
          );
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
  }, [filters, searchRules, hasActiveSearch]);

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

  const handleToggleStatus = async (organizationId: string, currentStatus: boolean) => {
    const org = organizations.find(o => o.id === organizationId);
    if (!org) return;

    const action = currentStatus ? 'deactivate' : 'activate';
    const loadingToast = toastService.loading(`${action === 'activate' ? 'Activating' : 'Deactivating'} "${org.name}"...`);

    try {
      setLoading(true);
      await organizationService.updateOrganization(organizationId, {
        isActive: !currentStatus
      });
      await loadOrganizations();
      await loadStats();
      
      toastService.dismiss(loadingToast);
      if (currentStatus) {
        toastService.actions.deactivated('Organization', org.name);
      } else {
        toastService.actions.activated('Organization', org.name);
      }
    } catch (error: any) {
      console.error('Failed to update organization status:', error);
      toastService.dismiss(loadingToast);
      toastService.actions.operationFailed(
        `${action} organization`,
        error.response?.data?.message
      );
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
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className={`btn btn-outline ${showAdvancedSearch ? 'btn-primary' : ''}`}
          >
            <SearchIcon className="w-4 h-4 mr-1" />
            Advanced Search
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

      {/* Advanced Search */}
      <AdvancedSearch
        fields={searchFields}
        savedSearches={savedSearches}
        onSearch={executeSearch}
        onSaveSearch={saveSearch}
        onLoadSearch={loadSearch}
        onDeleteSearch={deleteSearch}
        isOpen={showAdvancedSearch}
        onToggle={() => setShowAdvancedSearch(!showAdvancedSearch)}
      />

      {/* Filter Combination */}
      <FilterCombination
        filters={filterDefinitions}
        activeFilters={filters}
        presets={presets}
        onFilterChange={setFilter}
        onClearAllFilters={clearAllFilters}
        onSavePreset={savePreset}
        onLoadPreset={loadPreset}
        onDeletePreset={deletePreset}
      />

      {/* Statistics Cards */}
      {initialLoading ? (
        <SkeletonStats cards={5} />
      ) : (
        <StatsDashboard
          stats={statisticsData}
          onStatDrillDown={openDrillDown}
          size="md"
          columns={5}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Organizations Table */}
      <div className="card">
        <div className="card-body p-0">
          {initialLoading ? (
            <SkeletonTable columns={7} rows={5} />
          ) : loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                No organizations found
              </h3>
              <p className="text-gray-600">
                {hasActiveSearch || hasActiveFilters
                  ? 'No organizations match your search criteria'
                  : 'No organizations available'
                }
              </p>
              {(hasActiveSearch || hasActiveFilters) && (
                <div className="mt-4 space-x-2">
                  {hasActiveSearch && (
                    <button
                      onClick={() => executeSearch([])}
                      className="btn btn-outline btn-sm"
                    >
                      Clear Search
                    </button>
                  )}
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="btn btn-outline btn-sm"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
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
                  <AnimatePresence>
                    {organizations.map((organization) => (
                      <motion.tr
                        key={organization.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`hover:bg-gray-50 ${!organization.isActive ? 'opacity-75 bg-gray-50' : ''}`}
                      >
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
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
          onRefresh={() => {
            loadOrganizations();
            loadStats();
          }}
        />
      )}

      {/* Drill-down Modal */}
      <StatDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={closeDrillDown}
        data={drillDownData}
        isLoading={drillDownLoading}
        error={drillDownError}
        onNavigateToFiltered={navigateToFilteredView}
        onRefresh={() => {
          // Implement refresh logic
        }}
      />
    </div>
  );
};

export default EnhancedOrganizationsPagePhase3;