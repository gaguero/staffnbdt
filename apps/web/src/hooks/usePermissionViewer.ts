import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Permission } from '../types/permission';
import {
  PermissionTreeData,
  PermissionTreeNode,
  PermissionFilter,
  PermissionViewerOptions,
  PermissionSelection,
  PermissionViewerState,
  PermissionExportOptions,
  PERMISSION_TREE_CONFIG,
} from '../types/permissionViewer';
import permissionService from '../services/permissionService';

// Default filter state
const DEFAULT_FILTER: PermissionFilter = {
  searchQuery: '',
  selectedResources: [],
  selectedActions: [],
  selectedScopes: [],
  showOnlyUserPermissions: false,
  showOnlyRolePermissions: false,
};

// Default options
const DEFAULT_OPTIONS: PermissionViewerOptions = {
  showSearch: true,
  showFilters: true,
  showExport: true,
  showPermissionDetails: true,
  showRoleContext: true,
  showUserContext: true,
  multiSelect: true,
  expandAll: false,
  showCounts: true,
  showDescriptions: true,
};

// Default selection state
const DEFAULT_SELECTION: PermissionSelection = {
  selectedPermissions: new Set(),
  selectedNodes: new Set(),
};

export interface UsePermissionViewerOptions {
  autoLoad?: boolean;
  cacheResults?: boolean;
  debounceSearch?: boolean;
  virtualScrolling?: boolean;
}

export function usePermissionViewer(options: UsePermissionViewerOptions = {}) {
  const {
    autoLoad = true,
    cacheResults = true,
    debounceSearch = true,
    virtualScrolling: _virtualScrolling = false,
  } = options;

  // State management
  const [state, setState] = useState<PermissionViewerState>({
    treeData: null,
    filter: DEFAULT_FILTER,
    options: DEFAULT_OPTIONS,
    selection: DEFAULT_SELECTION,
    isLoading: false,
    error: null,
    expandedNodes: new Set(['root']),
    searchResults: [],
    currentView: 'tree',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Cache for permissions and tree data
  const cacheRef = useRef<{
    permissions: Permission[] | null;
    treeData: PermissionTreeData | null;
    timestamp: number;
  }>({
    permissions: null,
    treeData: null,
    timestamp: 0,
  });

  // Search debounce timer
  const searchTimerRef = useRef<NodeJS.Timeout>();

  /**
   * Build tree data from permissions array
   */
  const buildTreeData = useCallback((permissions: Permission[]): PermissionTreeData => {
    const nodes: Record<string, PermissionTreeNode> = {};
    const resourceCounts: Record<string, number> = {};
    const rootNodes: string[] = [];

    // Group permissions by resource
    const resourceGroups: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!resourceGroups[permission.resource]) {
        resourceGroups[permission.resource] = [];
        resourceCounts[permission.resource] = 0;
      }
      resourceGroups[permission.resource].push(permission);
      resourceCounts[permission.resource]++;
    });

    // Create resource nodes
    Object.entries(resourceGroups).forEach(([resource, resourcePermissions]) => {
      const resourceNodeId = `resource_${resource}`;
      
      // Group by action within resource
      const actionGroups: Record<string, Permission[]> = {};
      resourcePermissions.forEach(permission => {
        if (!actionGroups[permission.action]) {
          actionGroups[permission.action] = [];
        }
        actionGroups[permission.action].push(permission);
      });

      // Create action nodes
      const actionNodeIds: string[] = [];
      Object.entries(actionGroups).forEach(([action, actionPermissions]) => {
        const actionNodeId = `action_${resource}_${action}`;
        
        // Create permission nodes
        const permissionNodeIds = actionPermissions.map(permission => {
          const permissionNodeId = `permission_${permission.id}`;
          nodes[permissionNodeId] = {
            id: permissionNodeId,
            name: `${permission.resource}.${permission.action}.${permission.scope}`,
            type: 'permission',
            expanded: false,
            children: [],
            permission,
            description: permission.description,
            level: 3,
            parentId: actionNodeId,
          };
          return permissionNodeId;
        });

        // Create action node
        nodes[actionNodeId] = {
          id: actionNodeId,
          name: action,
          type: 'action',
          expanded: state.expandedNodes.has(actionNodeId),
          children: permissionNodeIds as any[],
          count: actionPermissions.length,
          level: 2,
          parentId: resourceNodeId,
        };
        
        actionNodeIds.push(actionNodeId);
      });

      // Create resource node
      nodes[resourceNodeId] = {
        id: resourceNodeId,
        name: resource,
        type: 'resource',
        expanded: state.expandedNodes.has(resourceNodeId),
        children: actionNodeIds as any[],
        count: resourcePermissions.length,
        level: 1,
        parentId: 'root',
      };
      
      rootNodes.push(resourceNodeId);
    });

    return {
      nodes,
      rootNodes,
      totalPermissions: permissions.length,
      resourceCounts,
    };
  }, [state.expandedNodes]);

  /**
   * Load permissions from API
   */
  const loadPermissions = useCallback(async (): Promise<Permission[]> => {
    // Check cache first
    if (cacheResults && cacheRef.current.permissions && 
        Date.now() - cacheRef.current.timestamp < PERMISSION_TREE_CONFIG.CACHE_TTL_MS) {
      return cacheRef.current.permissions;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await permissionService.getMyPermissions();
      const permissions = response.permissions;

      // Cache the results
      if (cacheResults) {
        cacheRef.current = {
          permissions,
          treeData: null,
          timestamp: Date.now(),
        };
      }

      return permissions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load permissions';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [cacheResults]);

  /**
   * Initialize tree data
   */
  const initializeTree = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const permissions = await loadPermissions();
      const treeData = buildTreeData(permissions);

      setState(prev => ({
        ...prev,
        treeData,
        isLoading: false,
        error: null,
      }));

      // Cache tree data
      if (cacheResults) {
        cacheRef.current.treeData = treeData;
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize tree',
      }));
    }
  }, [loadPermissions, buildTreeData, cacheResults]);

  /**
   * Filter permissions based on current filter settings
   */
  const filterPermissions = useCallback((permissions: Permission[], filter: PermissionFilter): Permission[] => {
    let filtered = permissions;

    // Search query filter
    if (filter.searchQuery.trim()) {
      const query = filter.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(permission =>
        permission.resource.toLowerCase().includes(query) ||
        permission.action.toLowerCase().includes(query) ||
        permission.scope.toLowerCase().includes(query) ||
        (permission.description && permission.description.toLowerCase().includes(query))
      );
    }

    // Resource filter
    if (filter.selectedResources.length > 0) {
      filtered = filtered.filter(permission => 
        filter.selectedResources.includes(permission.resource)
      );
    }

    // Action filter
    if (filter.selectedActions.length > 0) {
      filtered = filtered.filter(permission => 
        filter.selectedActions.includes(permission.action)
      );
    }

    // Scope filter
    if (filter.selectedScopes.length > 0) {
      filtered = filtered.filter(permission => 
        filter.selectedScopes.includes(permission.scope)
      );
    }

    return filtered;
  }, []);

  /**
   * Get filtered tree data
   */
  const filteredTreeData = useMemo(() => {
    if (!state.treeData) return null;
    if (!state.filter.searchQuery.trim() && 
        !state.filter.selectedResources.length &&
        !state.filter.selectedActions.length &&
        !state.filter.selectedScopes.length) {
      return state.treeData;
    }

    // Get all permissions from tree
    const allPermissions = Object.values(state.treeData.nodes)
      .filter(node => node.type === 'permission' && node.permission)
      .map(node => node.permission!);

    // Filter permissions
    const filtered = filterPermissions(allPermissions, state.filter);
    
    // Rebuild tree with filtered permissions
    return buildTreeData(filtered);
  }, [state.treeData, state.filter, filterPermissions, buildTreeData]);

  /**
   * Update filter with debounced search
   */
  const updateFilter = useCallback((filterUpdate: Partial<PermissionFilter>) => {
    if (debounceSearch && filterUpdate.searchQuery !== undefined) {
      // Clear existing timer
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      // Set new timer for search
      searchTimerRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          filter: { ...prev.filter, ...filterUpdate }
        }));
      }, PERMISSION_TREE_CONFIG.SEARCH_DEBOUNCE_MS);
    } else {
      setState(prev => ({
        ...prev,
        filter: { ...prev.filter, ...filterUpdate }
      }));
    }
  }, [debounceSearch]);

  /**
   * Update viewer options
   */
  const updateOptions = useCallback((optionsUpdate: Partial<PermissionViewerOptions>) => {
    setState(prev => ({
      ...prev,
      options: { ...prev.options, ...optionsUpdate }
    }));
  }, []);

  /**
   * Toggle node expansion
   */
  const toggleNode = useCallback((nodeId: string) => {
    setState(prev => {
      const newExpandedNodes = new Set(prev.expandedNodes);
      if (newExpandedNodes.has(nodeId)) {
        newExpandedNodes.delete(nodeId);
      } else {
        newExpandedNodes.add(nodeId);
      }
      return {
        ...prev,
        expandedNodes: newExpandedNodes
      };
    });
  }, []);

  /**
   * Select/deselect permission or node
   */
  const selectNode = useCallback((nodeId: string, permission?: Permission) => {
    setState(prev => {
      const newSelection = { ...prev.selection };
      
      if (permission) {
        // Toggle permission selection
        const newSelectedPermissions = new Set(prev.selection.selectedPermissions);
        if (newSelectedPermissions.has(permission.id)) {
          newSelectedPermissions.delete(permission.id);
        } else {
          newSelectedPermissions.add(permission.id);
        }
        newSelection.selectedPermissions = newSelectedPermissions;
      }

      // Toggle node selection
      const newSelectedNodes = new Set(prev.selection.selectedNodes);
      if (newSelectedNodes.has(nodeId)) {
        newSelectedNodes.delete(nodeId);
      } else {
        newSelectedNodes.add(nodeId);
      }
      newSelection.selectedNodes = newSelectedNodes;
      newSelection.lastSelected = nodeId;

      return {
        ...prev,
        selection: newSelection
      };
    });
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selection: DEFAULT_SELECTION
    }));
  }, []);

  /**
   * Expand all nodes
   */
  const expandAll = useCallback(() => {
    if (!state.treeData) return;
    
    const allNodeIds = Object.keys(state.treeData.nodes);
    setState(prev => ({
      ...prev,
      expandedNodes: new Set(allNodeIds)
    }));
  }, [state.treeData]);

  /**
   * Collapse all nodes
   */
  const collapseAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      expandedNodes: new Set(['root'])
    }));
  }, []);

  /**
   * Export selected or all permissions
   */
  const exportPermissions = useCallback(async (options: PermissionExportOptions) => {
    if (!state.treeData) return;

    // Get permissions to export
    let permissionsToExport: Permission[] = [];
    
    if (options.filterBySelection && state.selection.selectedPermissions.size > 0) {
      // Export selected permissions only
      permissionsToExport = Object.values(state.treeData.nodes)
        .filter(node => node.type === 'permission' && node.permission && 
                state.selection.selectedPermissions.has(node.permission.id))
        .map(node => node.permission!);
    } else {
      // Export all visible permissions
      permissionsToExport = Object.values(state.treeData.nodes)
        .filter(node => node.type === 'permission' && node.permission)
        .map(node => node.permission!);
    }

    // Generate export data based on format
    let exportData: string;
    let filename: string;
    let mimeType: string;

    switch (options.format) {
      case 'json':
        exportData = JSON.stringify(permissionsToExport, null, 2);
        filename = `permissions_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        const headers = ['ID', 'Resource', 'Action', 'Scope'];
        if (options.includeDescriptions) headers.push('Description');
        
        const rows = permissionsToExport.map(p => {
          const row = [p.id, p.resource, p.action, p.scope];
          if (options.includeDescriptions) row.push(p.description || '');
          return row.join(',');
        });
        
        exportData = [headers.join(','), ...rows].join('\n');
        filename = `permissions_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;

      case 'yaml':
        exportData = `permissions:\n${permissionsToExport.map(p => 
          `  - id: ${p.id}\n    resource: ${p.resource}\n    action: ${p.action}\n    scope: ${p.scope}${
            options.includeDescriptions && p.description ? `\n    description: "${p.description}"` : ''
          }`
        ).join('\n')}`;
        filename = `permissions_${new Date().toISOString().split('T')[0]}.yaml`;
        mimeType = 'text/yaml';
        break;

      case 'markdown':
        exportData = `# Permission Export\n\n**Generated:** ${new Date().toISOString()}\n**Total Permissions:** ${permissionsToExport.length}\n\n## Permissions\n\n${
          permissionsToExport.map(p => 
            `### ${p.resource}.${p.action}.${p.scope}\n\n- **Resource:** ${p.resource}\n- **Action:** ${p.action}\n- **Scope:** ${p.scope}${
              options.includeDescriptions && p.description ? `\n- **Description:** ${p.description}` : ''
            }\n`
          ).join('\n')
        }`;
        filename = `permissions_${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
        break;

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // Create and trigger download
    const blob = new Blob([exportData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      format: options.format,
      filename,
      count: permissionsToExport.length,
      size: blob.size,
    };
  }, [state.treeData, state.selection.selectedPermissions]);

  /**
   * Refresh tree data
   */
  const refresh = useCallback(async () => {
    // Clear cache
    cacheRef.current = {
      permissions: null,
      treeData: null,
      timestamp: 0,
    };
    
    await initializeTree();
  }, [initializeTree]);

  // Initialize on mount if autoLoad is enabled
  useEffect(() => {
    if (autoLoad) {
      initializeTree();
    }

    return () => {
      // Cleanup search timer
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [autoLoad, initializeTree]);

  // Available filter options
  const filterOptions = useMemo(() => {
    if (!state.treeData) return { resources: [], actions: [], scopes: [] };

    const permissions = Object.values(state.treeData.nodes)
      .filter(node => node.type === 'permission' && node.permission)
      .map(node => node.permission!);

    return {
      resources: Array.from(new Set(permissions.map(p => p.resource))).sort(),
      actions: Array.from(new Set(permissions.map(p => p.action))).sort(),
      scopes: Array.from(new Set(permissions.map(p => p.scope))).sort(),
    };
  }, [state.treeData]);

  // Selected permissions array
  const selectedPermissions = useMemo(() => {
    if (!state.treeData) return [];
    
    return Object.values(state.treeData.nodes)
      .filter(node => node.type === 'permission' && node.permission && 
              state.selection.selectedPermissions.has(node.permission.id))
      .map(node => node.permission!);
  }, [state.treeData, state.selection.selectedPermissions]);

  return {
    // State
    treeData: filteredTreeData,
    filter: state.filter,
    options: state.options,
    selection: state.selection,
    isLoading: state.isLoading,
    error: state.error,
    expandedNodes: state.expandedNodes,
    currentView: state.currentView,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    
    // Computed data
    filterOptions,
    selectedPermissions,
    
    // Actions
    updateFilter,
    updateOptions,
    toggleNode,
    selectNode,
    clearSelection,
    expandAll,
    collapseAll,
    exportPermissions,
    refresh,
    initializeTree,
    
    // Utilities
    setState,
  };
}