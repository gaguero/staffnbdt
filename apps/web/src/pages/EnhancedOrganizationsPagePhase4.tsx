import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SearchIcon, 
  FilterIcon, 
  SettingsIcon, 
  ZapIcon, 
  TemplateIcon,
  DatabaseIcon,
  KeyboardIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useHotkeys } from 'react-hotkeys-hook';
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
import QuickAssign, { QuickAssignConfig, QuickAssignOption } from '../components/QuickAssign';
import TemplateManager from '../components/TemplateManager';
import TemplateSelector from '../components/TemplateSelector';
import QueryBuilder, { QueryConfig } from '../components/QueryBuilder';
import PermissionGate from '../components/PermissionGate';
import { COMMON_PERMISSIONS } from '../types/permission';
import { organizationService, Organization, OrganizationFilter } from '../services/organizationService';
import { Template } from '../types/template';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { useFilters } from '../hooks/useFilters';
import { useStatsDrillDown } from '../hooks/useStatsDrillDown';
import { useQuickAssign } from '../hooks/useQuickAssign';
import { useTemplates } from '../hooks/useTemplates';
import { useQueryBuilder } from '../hooks/useQueryBuilder';

const EnhancedOrganizationsPagePhase4: React.FC = () => {
  const { user: _currentUser } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalProperties: 0,
    totalUsers: 0,
  });

  // Keyboard shortcuts
  useHotkeys('ctrl+n', () => setShowCreateModal(true), { preventDefault: true });
  useHotkeys('ctrl+f', () => setShowAdvancedSearch(true), { preventDefault: true });
  useHotkeys('ctrl+shift+f', () => setShowQueryBuilder(true), { preventDefault: true });
  useHotkeys('ctrl+t', () => setShowTemplateManager(true), { preventDefault: true });
  useHotkeys('ctrl+shift+t', () => setShowTemplateSelector(true), { preventDefault: true });
  useHotkeys('ctrl+/', () => setShowKeyboardShortcuts(true), { preventDefault: true });
  useHotkeys('escape', () => {
    setShowAdvancedSearch(false);
    setShowQueryBuilder(false);
    setShowTemplateManager(false);
    setShowTemplateSelector(false);
    setShowKeyboardShortcuts(false);
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
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
      ],
    },
    {
      key: 'slug',
      label: 'Organization Slug',
      type: 'text',
      operators: [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
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
        { value: 'isEmpty', label: 'Has no properties' },
        { value: 'isNotEmpty', label: 'Has properties' },
      ],
    },
    {
      key: 'userCount',
      label: 'Number of Users',
      type: 'number',
      operators: [
        { value: 'equals', label: 'Equals' },
        { value: 'greaterThan', label: 'Greater than' },
        { value: 'lessThan', label: 'Less than' },
        { value: 'between', label: 'Between' },
        { value: 'isEmpty', label: 'Has no users' },
        { value: 'isNotEmpty', label: 'Has users' },
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

  // Quick Assign Hook
  const {
    performAssignment,
    createManagerOptions,
    createStatusOptions,
  } = useQuickAssign(handleQuickAssignment);

  // Templates Hook
  const {
    templates,
    loadTemplates,
    applyTemplate,
  } = useTemplates({
    categoryId: 'organization-setup',
    autoLoad: true,
  });

  // Query Builder Hook
  const {
    query: queryBuilderQuery,
    executeQuery: executeQueryBuilder,
    hasActiveQuery,
  } = useQueryBuilder({
    onQueryExecute: handleQueryBuilderExecute,
    enableLocalStorage: true,
    storageKey: 'organizations-query-builder',
  });

  // Quick Assign configurations
  const getManagerAssignConfig = (organization: Organization): QuickAssignConfig => ({
    field: 'managerId',
    label: 'Manager',
    loadOptions: loadManagerOptions,
    currentValue: organization.managerId,
    placeholder: 'Assign manager...',
    permissions: ['organization.update'],
    formatCurrentValue: (value) => {
      // In real app, resolve manager name from ID
      return value ? `Manager ${value}` : 'No manager assigned';
    },
    searchable: true,
    clearable: true,
  });

  const getStatusAssignConfig = (organization: Organization): QuickAssignConfig => ({
    field: 'isActive',
    label: 'Status',
    loadOptions: async () => createStatusOptions(),
    currentValue: organization.isActive?.toString(),
    placeholder: 'Set status...',
    permissions: ['organization.update'],
    formatCurrentValue: (value) => value === 'true' ? 'Active' : 'Inactive',
    searchable: false,
    clearable: false,
  });

  // Load mock manager options
  async function loadManagerOptions(search: string): Promise<QuickAssignOption[]> {
    // In real app, this would call the API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockManagers = [
      { id: '1', name: 'John Smith', email: 'john@example.com', department: 'Operations' },
      { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', department: 'Administration' },
      { id: '3', name: 'Mike Wilson', email: 'mike@example.com', department: 'Finance' },
      { id: '4', name: 'Lisa Brown', email: 'lisa@example.com', department: 'HR' },
    ];

    const filtered = search 
      ? mockManagers.filter(m => 
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
        )
      : mockManagers;

    return filtered.map(manager => ({
      value: manager.id,
      label: manager.name,
      description: `${manager.email} • ${manager.department}`,
      icon: '👨‍💼',
    }));
  }

  // Quick assignment handler
  async function handleQuickAssignment(itemId: string, field: string, value: any): Promise<void> {
    // In real app, this would call the API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state optimistically
    setOrganizations(prev => prev.map(org => 
      org.id === itemId 
        ? { ...org, [field]: field === 'isActive' ? value === 'true' : value }
        : org
    ));
  }

  // Search and filter handlers
  async function handleAdvancedSearch(rules: SearchRule[]) {
    await loadOrganizations();
  }

  async function handleFiltersChange(newFilters: Record<string, any>) {
    await loadOrganizations();
  }

  async function handleQueryBuilderExecute(query: QueryConfig) {
    // Convert query builder query to API filter and execute
    await loadOrganizations();
  }

  function handleNavigateToFiltered(appliedFilters: Record<string, any>) {
    Object.entries(appliedFilters).forEach(([key, value]) => {
      setFilter(key, value);
    });
  }

  async function handleStatDrillDownFetch(stat: StatCardData): Promise<any[]> {
    // Return drill-down data based on stat
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
      
      default:
        return [];
    }
  }

  // Template handlers
  const handleTemplateApply = useCallback(async (template: Template, data: Record<string, any>) => {
    try {
      const appliedData = await applyTemplate(template.id, data);
      
      // Pre-fill create modal with template data
      if (appliedData) {
        setShowTemplateSelector(false);
        setShowCreateModal(true);
        // In real app, pass appliedData to create modal
      }
    } catch (err) {
      console.error('Failed to apply template:', err);
    }
  }, [applyTemplate]);

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
      
      const filter: OrganizationFilter = {};
      
      if (filters.status) {
        filter.isActive = filters.status === 'active';
      }
      
      if (hasActiveSearch) {
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
        }
        
        // Apply client-side filters
        if (filters.hasProperties !== undefined) {
          orgs = orgs.filter(org => 
            filters.hasProperties ? (org._count?.properties || 0) > 0 : (org._count?.properties || 0) === 0
          );
        }
        
        if (filters.hasUsers !== undefined) {
          orgs = orgs.filter(org => 
            filters.hasUsers ? (org._count?.users || 0) > 0 : (org._count?.users || 0) === 0
          );
        }
        
        setOrganizations(orgs);
      }
    } catch (error: any) {
      console.error('Failed to load organizations:', error);
      setError(error.response?.data?.message || 'Failed to load organizations');
      setOrganizations([]);
      toastService.error('Failed to load organizations');
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
      const orgsArray = Array.isArray(organizations) ? organizations : [];
      const total = orgsArray.length;
      const active = orgsArray.filter(org => org.isActive).length;
      const inactive = total - active;
      const totalProperties = orgsArray.reduce((sum, org) => sum + (org._count?.properties || 0), 0);
      const totalUsers = orgsArray.reduce((sum, org) => sum + (org._count?.users || 0), 0);
      
      setStats({ total, active, inactive, totalProperties, totalUsers });
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
      {/* Header with Enhanced Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Organization Management</h1>
          <p className="text-gray-600">
            Manage hotel organizations with quick actions, templates, and advanced search
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="btn btn-outline"
            title="Use Template (Ctrl+Shift+T)"
          >
            <TemplateIcon className="w-4 h-4 mr-1" />
            Templates
          </button>
          
          <button
            onClick={() => setShowQueryBuilder(!showQueryBuilder)}
            className={`btn btn-outline ${showQueryBuilder ? 'btn-primary' : ''}`}
            title="Query Builder (Ctrl+Shift+F)"
          >
            <DatabaseIcon className="w-4 h-4 mr-1" />
            Query Builder
          </button>
          
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className={`btn btn-outline ${showAdvancedSearch ? 'btn-primary' : ''}`}
            title="Advanced Search (Ctrl+F)"
          >
            <SearchIcon className="w-4 h-4 mr-1" />
            Advanced Search
          </button>
          
          <button
            onClick={() => setShowKeyboardShortcuts(true)}
            className="btn btn-outline"
            title="Keyboard Shortcuts (Ctrl+/)"
          >
            <KeyboardIcon className="w-4 h-4 mr-1" />
            Shortcuts
          </button>
          
          <PermissionGate commonPermission={COMMON_PERMISSIONS.CREATE_ORGANIZATION}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              disabled={loading}
              title="Create Organization (Ctrl+N)"
            >
              <span className="mr-2">➕</span>
              Add Organization
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Query Builder */}
      {showQueryBuilder && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <QueryBuilder
            fields={searchFields}
            value={queryBuilderQuery}
            onChange={() => {}} // Handled by hook
            onExecute={executeQueryBuilder}
            showSQL={true}
            enableKeyboardShortcuts={true}
          />
        </motion.div>
      )}

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

      {/* Quick Actions Bar */}
      {(hasActiveSearch || hasActiveQuery || hasActiveFilters) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ZapIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Active Filters: {searchRules.length + Object.keys(filters).length} conditions
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => executeSearch([])}
                className="btn btn-outline btn-sm"
              >
                Clear Search
              </button>
              <button
                onClick={clearAllFilters}
                className="btn btn-outline btn-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}

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

      {/* Organizations Table with Quick Assign */}
      <div className="card">
        <div className="card-body p-0">
          {initialLoading ? (
            <SkeletonTable columns={8} rows={5} />
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
                      Manager
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
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <QuickAssign
                            itemId={organization.id}
                            config={getManagerAssignConfig(organization)}
                            onAssign={performAssignment}
                            size="sm"
                            variant="inline"
                          />
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
                          <QuickAssign
                            itemId={organization.id}
                            config={getStatusAssignConfig(organization)}
                            onAssign={performAssignment}
                            size="sm"
                            variant="minimal"
                          />
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

      <StatDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={closeDrillDown}
        data={drillDownData}
        isLoading={drillDownLoading}
        error={drillDownError}
        onNavigateToFiltered={navigateToFilteredView}
        onRefresh={() => {}}
      />

      {/* Template Manager Modal */}
      <AnimatePresence>
        {showTemplateManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setShowTemplateManager(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Template Manager</h2>
                  <button
                    onClick={() => setShowTemplateManager(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <TemplateManager
                  categoryId="organization-setup"
                  onTemplateApply={handleTemplateApply}
                  showActions={true}
                  maxHeight="70vh"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Selector Modal */}
      <AnimatePresence>
        {showTemplateSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setShowTemplateSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Select Template</h2>
                  <button
                    onClick={() => setShowTemplateSelector(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <TemplateSelector
                  categoryId="organization-setup"
                  onTemplateSelect={() => {}}
                  onTemplateApply={handleTemplateApply}
                  showApplyButton={true}
                  showCreateOption={true}
                  onCreateNew={() => {
                    setShowTemplateSelector(false);
                    setShowCreateModal(true);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setShowKeyboardShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                  <button
                    onClick={() => setShowKeyboardShortcuts(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">General</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Create Organization</span>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Advanced Search</span>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+F</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Query Builder</span>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Shift+F</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Close Modals</span>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Templates</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Template Manager</span>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+T</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Template Selector</span>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Shift+T</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Execute Query</span>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Show Shortcuts</span>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+/</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedOrganizationsPagePhase4;