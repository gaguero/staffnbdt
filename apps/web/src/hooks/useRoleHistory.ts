import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { roleHistoryService } from '../services/roleHistoryService';
import {
  RoleHistoryFilter,
  RoleHistoryResponse,
  RoleAssignmentHistoryEntry,
  RoleHistoryAnalytics,
  HistoryExportOptions,
  ExportResult,
  RollbackOperation,
  RollbackResult,
} from '../types/roleHistory';

export interface UseRoleHistoryOptions {
  initialFilters?: RoleHistoryFilter;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
}

export function useRoleHistory(options: UseRoleHistoryOptions = {}) {
  const {
    initialFilters = {},
    autoRefresh = false,
    refreshInterval = 30000,
    enableRealTime = false,
  } = options;

  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RoleHistoryFilter>(initialFilters);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  // Fetch role history with current filters
  const historyQuery = useQuery({
    queryKey: ['roleHistory', filters],
    queryFn: () => roleHistoryService.getHistory(filters),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  });

  // Fetch analytics data
  const analyticsQuery = useQuery({
    queryKey: ['roleHistoryAnalytics'],
    queryFn: () => roleHistoryService.getAnalytics(),
    staleTime: 300000, // 5 minutes
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (options: HistoryExportOptions) =>
      roleHistoryService.exportHistory(options),
    onSuccess: (result: ExportResult) => {
      if (result.success && result.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: (operation: RollbackOperation) =>
      roleHistoryService.rollbackAssignment(operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Filter management
  const updateFilters = useCallback((newFilters: Partial<RoleHistoryFilter>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const setTimeRange = useCallback((timeRange: RoleHistoryFilter['timeRange']) => {
    updateFilters({ timeRange, dateFrom: undefined, dateTo: undefined });
  }, [updateFilters]);

  const setCustomDateRange = useCallback((dateFrom: Date, dateTo: Date) => {
    updateFilters({
      timeRange: 'custom',
      dateFrom,
      dateTo,
    });
  }, [updateFilters]);

  // Pagination
  const goToPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const changePageSize = useCallback((limit: number) => {
    updateFilters({ limit, page: 1 });
  }, [updateFilters]);

  // Selection management
  const toggleSelection = useCallback((entryId: string) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  }, []);

  const selectAll = useCallback((entries: RoleAssignmentHistoryEntry[]) => {
    setSelectedEntries(entries.map(entry => entry.id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedEntries([]);
  }, []);

  const isSelected = useCallback((entryId: string) => {
    return selectedEntries.includes(entryId);
  }, [selectedEntries]);

  // Export functionality
  const exportHistory = useCallback((options: Omit<HistoryExportOptions, 'filters'>) => {
    const exportOptions: HistoryExportOptions = {
      ...options,
      filters,
    };
    exportMutation.mutate(exportOptions);
  }, [filters, exportMutation]);

  const exportSelected = useCallback((format: HistoryExportOptions['format']) => {
    if (selectedEntries.length === 0) return;

    const exportOptions: HistoryExportOptions = {
      format,
      includeMetadata: true,
      includePermissionChanges: true,
      includeAuditTrail: true,
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date(),
      },
      filters: {
        ...filters,
        // Filter by selected entries (would need backend support)
      },
      grouping: 'none',
    };

    exportMutation.mutate(exportOptions);
  }, [selectedEntries, filters, exportMutation]);

  // Rollback functionality
  const rollbackEntry = useCallback((
    historyEntryId: string,
    reason: string,
    confirmationRequired = false
  ) => {
    const operation: RollbackOperation = {
      historyEntryId,
      reason,
      confirmationRequired,
      impactAnalysis: {
        affectedUsers: 1,
        affectedRoles: 1,
        potentialIssues: [],
      },
    };
    rollbackMutation.mutate(operation);
  }, [rollbackMutation]);

  // Search functionality
  const searchHistory = useCallback((searchTerm: string) => {
    updateFilters({ searchTerm });
  }, [updateFilters]);

  // Computed values
  const isLoading = historyQuery.isLoading || analyticsQuery.isLoading;
  const isExporting = exportMutation.isPending;
  const isRollingBack = rollbackMutation.isPending;

  const historyData = historyQuery.data;
  const entries = historyData?.entries || [];
  const totalEntries = historyData?.total || 0;
  const currentPage = historyData?.page || 1;
  const totalPages = historyData?.totalPages || 1;
  const summary = historyData?.summary;

  const analytics = analyticsQuery.data;

  const hasSelection = selectedEntries.length > 0;
  const selectedCount = selectedEntries.length;

  const canRollback = useMemo(() => {
    // Check if user has rollback permissions (would need to be passed from parent)
    return true; // Simplified for now
  }, []);

  // Real-time updates (simplified)
  const enableRealTimeUpdates = useCallback(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['roleHistory'] });
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [enableRealTime, queryClient]);

  return {
    // Data
    entries,
    totalEntries,
    currentPage,
    totalPages,
    summary,
    analytics,
    
    // State
    filters,
    selectedEntries,
    selectedCount,
    hasSelection,
    isLoading,
    isExporting,
    isRollingBack,
    canRollback,
    
    // Filter actions
    updateFilters,
    resetFilters,
    setTimeRange,
    setCustomDateRange,
    searchHistory,
    
    // Pagination actions
    goToPage,
    changePageSize,
    
    // Selection actions
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    
    // Export actions
    exportHistory,
    exportSelected,
    
    // Rollback actions
    rollbackEntry,
    
    // Utility actions
    enableRealTimeUpdates,
    
    // Query objects for advanced usage
    historyQuery,
    analyticsQuery,
    exportMutation,
    rollbackMutation,
  };
}