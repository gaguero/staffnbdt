import { useState, useCallback, useMemo } from 'react';
import { RoleHistoryFilter, RoleAssignmentHistoryEntry } from '../types/roleHistory';

export interface FilterPreset {
  name: string;
  label: string;
  filters: Partial<RoleHistoryFilter>;
  icon?: string;
}

export interface UseHistoryFiltersOptions {
  initialFilters?: RoleHistoryFilter;
  presets?: FilterPreset[];
}

const defaultPresets: FilterPreset[] = [
  {
    name: 'recent',
    label: 'Recent Activity',
    filters: { timeRange: '24h' },
    icon: 'clock',
  },
  {
    name: 'thisWeek',
    label: 'This Week',
    filters: { timeRange: '7d' },
    icon: 'calendar-week',
  },
  {
    name: 'assignments',
    label: 'New Assignments',
    filters: { actions: ['ASSIGNED', 'BULK_ASSIGNED'] },
    icon: 'user-plus',
  },
  {
    name: 'removals',
    label: 'Role Removals',
    filters: { actions: ['REMOVED', 'BULK_REMOVED'] },
    icon: 'user-minus',
  },
  {
    name: 'bulkOperations',
    label: 'Bulk Operations',
    filters: { showBulkOperations: true, groupByBatch: true },
    icon: 'users',
  },
  {
    name: 'systemActions',
    label: 'System Actions',
    filters: { sources: ['automated', 'system', 'migration'] },
    icon: 'cog',
  },
];

export function useHistoryFilters(options: UseHistoryFiltersOptions = {}) {
  const { initialFilters = {}, presets = defaultPresets } = options;

  const [filters, setFilters] = useState<RoleHistoryFilter>(initialFilters);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [customFilters, setCustomFilters] = useState<Partial<RoleHistoryFilter>>({});

  // Time range handling
  const setTimeRange = useCallback((timeRange: RoleHistoryFilter['timeRange']) => {
    setFilters(prev => ({
      ...prev,
      timeRange,
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  const setCustomDateRange = useCallback((dateFrom: Date, dateTo: Date) => {
    setFilters(prev => ({
      ...prev,
      timeRange: 'custom',
      dateFrom,
      dateTo,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  // Entity filters
  const setUserFilter = useCallback((userIds: string[]) => {
    setFilters(prev => ({
      ...prev,
      userIds: userIds.length > 0 ? userIds : undefined,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  const setRoleFilter = useCallback((roleIds: string[]) => {
    setFilters(prev => ({
      ...prev,
      roleIds: roleIds.length > 0 ? roleIds : undefined,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  const setAdminFilter = useCallback((adminIds: string[]) => {
    setFilters(prev => ({
      ...prev,
      adminIds: adminIds.length > 0 ? adminIds : undefined,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  // Action filters
  const setActionFilter = useCallback((actions: RoleHistoryFilter['actions']) => {
    setFilters(prev => ({
      ...prev,
      actions: actions && actions.length > 0 ? actions : undefined,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  const setSourceFilter = useCallback((sources: RoleHistoryFilter['sources']) => {
    setFilters(prev => ({
      ...prev,
      sources: sources && sources.length > 0 ? sources : undefined,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  // Search
  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: searchTerm.trim() || undefined,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  // Bulk operation filters
  const setBulkOperationFilter = useCallback((showBulkOperations: boolean, groupByBatch?: boolean) => {
    setFilters(prev => ({
      ...prev,
      showBulkOperations,
      groupByBatch,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  // Tenant filters
  const setTenantFilters = useCallback((
    organizationIds?: string[],
    propertyIds?: string[],
    departmentIds?: string[]
  ) => {
    setFilters(prev => ({
      ...prev,
      organizationIds: organizationIds && organizationIds.length > 0 ? organizationIds : undefined,
      propertyIds: propertyIds && propertyIds.length > 0 ? propertyIds : undefined,
      departmentIds: departmentIds && departmentIds.length > 0 ? departmentIds : undefined,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  // Sorting
  const setSorting = useCallback((
    sortBy: RoleHistoryFilter['sortBy'],
    sortDirection: RoleHistoryFilter['sortDirection']
  ) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortDirection,
    }));
  }, []);

  // Pagination
  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Preset management
  const applyPreset = useCallback((presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (!preset) return;

    setFilters(prev => ({
      ...initialFilters,
      ...preset.filters,
      page: 1,
    }));
    setActivePreset(presetName);
  }, [presets, initialFilters]);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setActivePreset(null);
    setCustomFilters({});
  }, [initialFilters]);

  const updateFilters = useCallback((newFilters: Partial<RoleHistoryFilter>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  // Advanced filtering
  const addCustomFilter = useCallback((key: keyof RoleHistoryFilter, value: any) => {
    setCustomFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
    setActivePreset(null);
  }, []);

  const removeCustomFilter = useCallback((key: keyof RoleHistoryFilter) => {
    setCustomFilters(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
    setFilters(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Quick filters for common scenarios
  const quickFilters = useMemo(() => ({
    showMyActivity: (adminId: string) => {
      setAdminFilter([adminId]);
    },
    showRecentAssignments: () => {
      setTimeRange('24h');
      setActionFilter(['ASSIGNED', 'BULK_ASSIGNED']);
    },
    showRecentRemovals: () => {
      setTimeRange('24h');
      setActionFilter(['REMOVED', 'BULK_REMOVED']);
    },
    showUserActivity: (userId: string) => {
      setUserFilter([userId]);
    },
    showRoleActivity: (roleId: string) => {
      setRoleFilter([roleId]);
    },
    showBulkActivity: () => {
      setBulkOperationFilter(true, true);
    },
    showSystemActivity: () => {
      setSourceFilter(['automated', 'system', 'migration']);
    },
  }), [
    setAdminFilter,
    setTimeRange,
    setActionFilter,
    setUserFilter,
    setRoleFilter,
    setBulkOperationFilter,
    setSourceFilter,
  ]);

  // Filter validation and suggestions
  const validateFilters = useCallback((filters: RoleHistoryFilter) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Date range validation
    if (filters.dateFrom && filters.dateTo) {
      if (filters.dateFrom > filters.dateTo) {
        errors.push('Start date must be before end date');
      }
      
      const daysDiff = (filters.dateTo.getTime() - filters.dateFrom.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        warnings.push('Large date ranges may affect performance');
      }
    }

    // Entity filter validation
    if (filters.userIds && filters.userIds.length > 20) {
      warnings.push('Too many users selected may affect performance');
    }

    return { errors, warnings };
  }, []);

  // Filter suggestions based on data
  const generateSuggestions = useCallback((entries: RoleAssignmentHistoryEntry[]) => {
    const suggestions = [];

    // Suggest frequent users
    const userCounts = entries.reduce((acc, entry) => {
      acc[entry.userId] = (acc[entry.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (topUsers.length > 0) {
      suggestions.push({
        type: 'users',
        label: 'Most active users',
        items: topUsers.map(([userId, count]) => ({ id: userId, count })),
      });
    }

    // Suggest common time ranges
    const now = new Date();
    const recentActivity = entries.filter(entry =>
      new Date(entry.timestamp) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    ).length;

    if (recentActivity > 0) {
      suggestions.push({
        type: 'timeRange',
        label: `${recentActivity} activities in the last 24 hours`,
        action: () => setTimeRange('24h'),
      });
    }

    return suggestions;
  }, [setTimeRange]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    const filterKeys = Object.keys(filters) as Array<keyof RoleHistoryFilter>;
    return filterKeys.some(key => {
      if (key === 'page' || key === 'limit') return false;
      return filters[key] !== undefined;
    });
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.values(customFilters).filter(value => value !== undefined).length;
  }, [customFilters]);

  const filterSummary = useMemo(() => {
    const parts = [];

    if (filters.timeRange && filters.timeRange !== 'custom') {
      parts.push(`Last ${filters.timeRange}`);
    } else if (filters.dateFrom && filters.dateTo) {
      parts.push(`${filters.dateFrom.toLocaleDateString()} - ${filters.dateTo.toLocaleDateString()}`);
    }

    if (filters.actions && filters.actions.length > 0) {
      parts.push(`Actions: ${filters.actions.join(', ')}`);
    }

    if (filters.userIds && filters.userIds.length > 0) {
      parts.push(`${filters.userIds.length} users`);
    }

    if (filters.roleIds && filters.roleIds.length > 0) {
      parts.push(`${filters.roleIds.length} roles`);
    }

    if (filters.searchTerm) {
      parts.push(`Search: "${filters.searchTerm}"`);
    }

    return parts.join(' • ');
  }, [filters]);

  return {
    // Current state
    filters,
    activePreset,
    customFilters,
    hasActiveFilters,
    activeFilterCount,
    filterSummary,

    // Time range actions
    setTimeRange,
    setCustomDateRange,

    // Entity filter actions
    setUserFilter,
    setRoleFilter,
    setAdminFilter,

    // Action filter actions
    setActionFilter,
    setSourceFilter,

    // Search actions
    setSearchTerm,

    // Bulk operation actions
    setBulkOperationFilter,

    // Tenant filter actions
    setTenantFilters,

    // Sorting actions
    setSorting,

    // Pagination actions
    setPage,
    setPageSize,

    // Preset actions
    applyPreset,
    clearFilters,
    updateFilters,

    // Custom filter actions
    addCustomFilter,
    removeCustomFilter,

    // Quick filter actions
    quickFilters,

    // Validation and suggestions
    validateFilters,
    generateSuggestions,

    // Available presets
    presets,
  };
}