import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import {
  PermissionSearchIndex,
  SearchOptions,
  SearchResult,
  SearchFilters,
  SavedSearch,
  PermissionSearchState,
} from '../types/permissionSearch';
import { Permission } from '../types/permission';
import { useAuth } from '../contexts/AuthContext';
import permissionService from '../services/permissionService';

interface UsePermissionSearchOptions {
  initialQuery?: string;
  initialFilters?: Partial<SearchFilters>;
  searchOptions?: Partial<SearchOptions>;
  enableHistory?: boolean;
  enableCache?: boolean;
  debounceMs?: number;
  context?: string;
}

interface UsePermissionSearchReturn {
  // State
  state: PermissionSearchState;
  
  // Search methods
  search: (query: string) => void;
  clearSearch: () => void;
  setQuery: (query: string) => void;
  
  // Selection methods
  selectPermission: (permission: PermissionSearchIndex) => void;
  deselectPermission: (permission: PermissionSearchIndex) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelection: (permission: PermissionSearchIndex) => void;
  
  // Filter methods
  updateFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setResourceFilter: (resources: string[]) => void;
  setCategoryFilter: (categories: string[]) => void;
  
  // History and saved searches
  addToHistory: (query: string, resultCount: number) => void;
  clearHistory: () => void;
  saveSearch: (name: string, description?: string) => void;
  deleteSavedSearch: (id: string) => void;
  loadSavedSearch: (search: SavedSearch) => void;
  
  // Utility methods
  getPopularPermissions: () => PermissionSearchIndex[];
  getRecentPermissions: () => PermissionSearchIndex[];
  exportResults: () => string;
  copyPermissionNames: () => void;
  
  // Data management
  refreshPermissions: () => Promise<void>;
  isLoading: boolean;
}

// Default search options
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  mode: 'simple',
  maxResults: 50,
  includeDescriptions: true,
  caseSensitive: false,
  exactMatch: false,
  useWildcards: false,
  searchScope: 'all',
  minScore: 0.1,
  sortBy: 'relevance',
  sortOrder: 'desc',
};

// Default filters
const DEFAULT_FILTERS: SearchFilters = {
  resources: [],
  actions: [],
  scopes: [],
  categories: [],
  includeSystemPermissions: true,
  includeConditionalPermissions: true,
};

/**
 * Custom hook for powerful permission searching functionality
 */
export function usePermissionSearch(options: UsePermissionSearchOptions = {}): UsePermissionSearchReturn {
  const {
    initialQuery = '',
    initialFilters = {},
    searchOptions = {},
    enableHistory = true,
    enableCache = true,
    debounceMs = 300,
    context = 'generic',
  } = options;

  const { user: _user } = useAuth(); // Prefixed to indicate intentional unused
  const [permissions, setPermissions] = useState<PermissionSearchIndex[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const searchCacheRef = useRef<Map<string, SearchResult[]>>(new Map());
  
  // Initialize state
  const [state, setState] = useState<PermissionSearchState>({
    query: initialQuery,
    results: [],
    selectedPermissions: new Set(),
    filters: { ...DEFAULT_FILTERS, ...initialFilters },
    isLoading: false,
    error: null,
    showDropdown: false,
    selectedIndex: -1,
    searchHistory: [],
    savedSearches: [],
    popularPermissions: [],
    recentPermissions: [],
  });

  // Merge search options with defaults
  const finalSearchOptions = useMemo(() => ({
    ...DEFAULT_SEARCH_OPTIONS,
    ...searchOptions,
  }), [searchOptions]);

  // Debounced query for search
  const debouncedQuery = useDebounce(state.query, debounceMs);

  /**
   * Load permissions from the backend
   */
  const loadPermissions = useCallback(async () => {
    setIsLoadingPermissions(true);
    try {
      const summary = await permissionService.getMyPermissions();
      const permissionIndex = summary.permissions.map(transformPermissionToIndex);
      setPermissions(permissionIndex);
      
      // Update popular and recent permissions
      setState(prev => ({
        ...prev,
        popularPermissions: getPopularFromList(permissionIndex),
        recentPermissions: getRecentFromList(permissionIndex),
      }));
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load permissions',
      }));
    } finally {
      setIsLoadingPermissions(false);
    }
  }, []);

  // Load permissions on mount
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Transform Permission to PermissionSearchIndex
   */
  const transformPermissionToIndex = (permission: Permission): PermissionSearchIndex => {
    const keywords = [
      permission.resource,
      permission.action,
      permission.scope,
      ...getContextualKeywords(permission.resource, permission.action),
    ];

    const searchableText = [
      permission.resource,
      permission.action,
      permission.scope,
      permission.description || '',
      ...keywords,
    ].join(' ').toLowerCase();

    return {
      id: permission.id,
      name: `${permission.resource}.${permission.action}.${permission.scope}`,
      resource: permission.resource,
      action: permission.action,
      scope: permission.scope,
      description: permission.description || `${permission.action} ${permission.resource} with ${permission.scope} scope`,
      category: getCategoryFromResource(permission.resource),
      keywords,
      popularity: calculatePopularity(permission.resource, permission.action),
      searchableText,
      displayName: generateDisplayName(permission.resource, permission.action, permission.scope),
      icon: getIconForResource(permission.resource),
      isSystemPermission: true,
      isConditional: !!permission.conditions,
    };
  };

  /**
   * Get contextual keywords for better search
   */
  const getContextualKeywords = (resource: string, action: string): string[] => {
    const keywords: string[] = [];
    
    // Add synonyms based on resource
    const resourceSynonyms: Record<string, string[]> = {
      user: ['staff', 'employee', 'person', 'member'],
      document: ['file', 'upload', 'attachment', 'paper'],
      vacation: ['holiday', 'leave', 'time-off', 'absence'],
      training: ['course', 'education', 'learning', 'development'],
      payslip: ['salary', 'wage', 'pay', 'payroll', 'compensation'],
      task: ['assignment', 'job', 'work', 'todo'],
      reservation: ['booking', 'appointment', 'schedule'],
      unit: ['room', 'suite', 'accommodation', 'space'],
      guest: ['customer', 'client', 'visitor', 'patron'],
    };

    // Add action synonyms
    const actionSynonyms: Record<string, string[]> = {
      create: ['add', 'new', 'make', 'generate', 'build'],
      read: ['view', 'see', 'access', 'display', 'show'],
      update: ['edit', 'modify', 'change', 'alter', 'adjust'],
      delete: ['remove', 'destroy', 'eliminate', 'erase'],
      approve: ['accept', 'confirm', 'authorize', 'validate'],
      assign: ['allocate', 'designate', 'appoint', 'give'],
    };

    if (resourceSynonyms[resource]) {
      keywords.push(...resourceSynonyms[resource]);
    }

    if (actionSynonyms[action]) {
      keywords.push(...actionSynonyms[action]);
    }

    return keywords;
  };

  /**
   * Get category from resource
   */
  const getCategoryFromResource = (resource: string): string => {
    const resourceCategoryMap: Record<string, string> = {
      user: 'HR',
      payslip: 'HR', 
      vacation: 'HR',
      training: 'Training',
      document: 'Documents',
      unit: 'Operations',
      reservation: 'Operations',
      guest: 'Operations',
      task: 'Operations',
      permission: 'Admin',
      role: 'Admin',
      audit: 'Admin',
    };

    return resourceCategoryMap[resource] || 'Operations';
  };

  /**
   * Calculate popularity score based on common usage patterns
   */
  const calculatePopularity = (resource: string, action: string): number => {
    const popularityScores: Record<string, number> = {
      // High usage permissions
      'user.read': 90,
      'user.update': 85,
      'vacation.create': 80,
      'vacation.read': 85,
      'payslip.read': 90,
      'document.read': 75,
      'training.read': 70,
      
      // Medium usage
      'user.create': 60,
      'document.create': 55,
      'task.read': 65,
      'task.update': 60,
      
      // Lower usage (admin functions)
      'permission.grant': 30,
      'role.assign': 25,
      'audit.read': 35,
    };

    const key = `${resource}.${action}`;
    return popularityScores[key] || 50; // Default middle score
  };

  /**
   * Generate human-readable display name
   */
  const generateDisplayName = (resource: string, action: string, scope: string): string => {
    const actionNames: Record<string, string> = {
      create: 'Create',
      read: 'View',
      update: 'Edit',
      delete: 'Delete',
      approve: 'Approve',
      assign: 'Assign',
      grant: 'Grant',
      revoke: 'Revoke',
    };

    const resourceNames: Record<string, string> = {
      user: 'Users',
      document: 'Documents',
      vacation: 'Vacations',
      training: 'Training',
      payslip: 'Payslips',
      task: 'Tasks',
      unit: 'Units/Rooms',
      reservation: 'Reservations',
      guest: 'Guests',
      permission: 'Permissions',
      role: 'Roles',
      audit: 'Audit Logs',
    };

    const scopeNames: Record<string, string> = {
      own: 'Own',
      department: 'Department',
      property: 'Property',
      organization: 'Organization',
      platform: 'Platform',
    };

    const actionName = actionNames[action] || action;
    const resourceName = resourceNames[resource] || resource;
    const scopeName = scopeNames[scope] || scope;

    return `${actionName} ${resourceName} (${scopeName})`;
  };

  /**
   * Get icon for resource
   */
  const getIconForResource = (resource: string): string => {
    const iconMap: Record<string, string> = {
      user: 'UserIcon',
      document: 'DocumentTextIcon',
      vacation: 'CalendarIcon',
      training: 'AcademicCapIcon',
      payslip: 'CurrencyDollarIcon',
      task: 'CheckCircleIcon',
      unit: 'HomeIcon',
      reservation: 'ClipboardDocumentListIcon',
      guest: 'UserGroupIcon',
      permission: 'ShieldCheckIcon',
      role: 'KeyIcon',
      audit: 'DocumentMagnifyingGlassIcon',
    };

    return iconMap[resource] || 'CogIcon';
  };

  /**
   * Get popular permissions from list
   */
  const getPopularFromList = (permissionList: PermissionSearchIndex[]): PermissionSearchIndex[] => {
    return permissionList
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);
  };

  /**
   * Get recent permissions (simulated based on common patterns)
   */
  const getRecentFromList = (permissionList: PermissionSearchIndex[]): PermissionSearchIndex[] => {
    // For now, return a mix of popular and varied permissions
    // In a real app, this would be based on actual usage history
    const recentResources = ['user', 'vacation', 'document', 'payslip', 'training'];
    return permissionList
      .filter(p => recentResources.includes(p.resource))
      .slice(0, 8);
  };

  /**
   * Advanced search algorithm
   */
  const performSearch = useCallback((query: string, permissionList: PermissionSearchIndex[]): SearchResult[] => {
    if (!query.trim()) {
      // Return popular permissions when no query
      return state.popularPermissions.map(p => ({
        permission: p,
        score: p.popularity / 100,
        matchedFields: ['popularity'],
      }));
    }

    const searchQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Check cache first if enabled
    const cacheKey = `${searchQuery}_${JSON.stringify(state.filters)}`;
    if (enableCache && searchCacheRef.current.has(cacheKey)) {
      return searchCacheRef.current.get(cacheKey) || [];
    }

    // Filter permissions based on current filters
    let filteredPermissions = permissionList.filter(permission => {
      const { filters } = state;
      
      if (filters.resources.length > 0 && !filters.resources.includes(permission.resource)) {
        return false;
      }
      
      if (filters.actions.length > 0 && !filters.actions.includes(permission.action)) {
        return false;
      }
      
      if (filters.scopes.length > 0 && !filters.scopes.includes(permission.scope)) {
        return false;
      }
      
      if (filters.categories.length > 0 && !filters.categories.includes(permission.category)) {
        return false;
      }
      
      if (!filters.includeSystemPermissions && permission.isSystemPermission) {
        return false;
      }
      
      if (!filters.includeConditionalPermissions && permission.isConditional) {
        return false;
      }
      
      return true;
    });

    // Perform search on filtered permissions
    for (const permission of filteredPermissions) {
      const searchResult = scorePermission(permission, searchQuery, finalSearchOptions);
      
      if (searchResult.score >= (finalSearchOptions.minScore || 0.1)) {
        results.push(searchResult);
      }
    }

    // Sort results
    results.sort((a, b) => {
      if (finalSearchOptions.sortBy === 'alphabetical') {
        const comparison = a.permission.displayName!.localeCompare(b.permission.displayName!);
        return finalSearchOptions.sortOrder === 'asc' ? comparison : -comparison;
      }
      
      if (finalSearchOptions.sortBy === 'category') {
        const categoryComparison = a.permission.category.localeCompare(b.permission.category);
        if (categoryComparison !== 0) {
          return finalSearchOptions.sortOrder === 'asc' ? categoryComparison : -categoryComparison;
        }
        return b.score - a.score; // Secondary sort by relevance
      }
      
      if (finalSearchOptions.sortBy === 'popularity') {
        const popularityComparison = b.permission.popularity - a.permission.popularity;
        return finalSearchOptions.sortOrder === 'asc' ? -popularityComparison : popularityComparison;
      }
      
      // Default: sort by relevance (score)
      return finalSearchOptions.sortOrder === 'asc' ? a.score - b.score : b.score - a.score;
    });

    // Limit results
    const limitedResults = results.slice(0, finalSearchOptions.maxResults);

    // Cache results if enabled
    if (enableCache) {
      searchCacheRef.current.set(cacheKey, limitedResults);
    }

    return limitedResults;
  }, [state.filters, state.popularPermissions, finalSearchOptions, enableCache]);

  /**
   * Score a permission against a search query
   */
  const scorePermission = (permission: PermissionSearchIndex, query: string, _options: SearchOptions): SearchResult => {
    const matchedFields: string[] = [];
    let totalScore = 0;
    const queryParts = query.split(/\s+/).filter(Boolean);

    // Exact match on permission name gets highest score
    if (permission.name.toLowerCase() === query) {
      matchedFields.push('name');
      totalScore += 100;
    }
    
    // Exact match on display name
    else if (permission.displayName?.toLowerCase() === query) {
      matchedFields.push('displayName');
      totalScore += 95;
    }
    
    // Check for matches in different fields
    else {
      // Resource match
      if (permission.resource.toLowerCase().includes(query)) {
        matchedFields.push('resource');
        totalScore += 80;
      }
      
      // Action match
      if (permission.action.toLowerCase().includes(query)) {
        matchedFields.push('action');
        totalScore += 75;
      }
      
      // Scope match
      if (permission.scope.toLowerCase().includes(query)) {
        matchedFields.push('scope');
        totalScore += 70;
      }
      
      // Description match
      if (permission.description.toLowerCase().includes(query)) {
        matchedFields.push('description');
        totalScore += 60;
      }
      
      // Keywords match
      for (const keyword of permission.keywords) {
        if (keyword.toLowerCase().includes(query)) {
          matchedFields.push('keywords');
          totalScore += 50;
          break; // Only score once for keywords
        }
      }
      
      // Category match
      if (permission.category.toLowerCase().includes(query)) {
        matchedFields.push('category');
        totalScore += 40;
      }
      
      // Partial matches for query parts
      for (const part of queryParts) {
        if (part.length < 2) continue; // Skip very short parts
        
        if (permission.searchableText.includes(part)) {
          totalScore += 30;
        }
      }
    }

    // Boost score based on popularity
    totalScore += permission.popularity * 0.1;
    
    // Boost score based on context relevance
    if (context === 'role-creation' && ['user', 'permission', 'role'].includes(permission.resource)) {
      totalScore += 10;
    }
    
    if (context === 'user-management' && permission.resource === 'user') {
      totalScore += 15;
    }

    // Normalize score to 0-1 range
    const normalizedScore = Math.min(totalScore / 100, 1);

    return {
      permission,
      score: normalizedScore,
      matchedFields,
      highlightedText: highlightMatches(permission.displayName || permission.name, query),
    };
  };

  /**
   * Highlight matching text
   */
  const highlightMatches = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  /**
   * Perform search based on debounced query
   */
  useEffect(() => {
    if (permissions.length === 0) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const results = performSearch(debouncedQuery, permissions);
      
      setState(prev => ({
        ...prev,
        results,
        isLoading: false,
        showDropdown: debouncedQuery.length > 0 || results.length > 0,
        selectedIndex: -1,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Search failed',
        results: [],
      }));
    }
  }, [debouncedQuery, permissions, performSearch]);

  // Search methods
  const search = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      showDropdown: false,
      selectedIndex: -1,
    }));
    searchCacheRef.current.clear();
  }, []);

  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  // Selection methods
  const selectPermission = useCallback((permission: PermissionSearchIndex) => {
    setState(prev => ({
      ...prev,
      selectedPermissions: new Set([...Array.from(prev.selectedPermissions), permission.name]),
    }));
  }, []);

  const deselectPermission = useCallback((permission: PermissionSearchIndex) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedPermissions);
      newSelected.delete(permission.name);
      return {
        ...prev,
        selectedPermissions: newSelected,
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedPermissions: new Set(prev.results.map(r => r.permission.name)),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedPermissions: new Set(),
    }));
  }, []);

  const toggleSelection = useCallback((permission: PermissionSearchIndex) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedPermissions);
      if (newSelected.has(permission.name)) {
        newSelected.delete(permission.name);
      } else {
        newSelected.add(permission.name);
      }
      return {
        ...prev,
        selectedPermissions: newSelected,
      };
    });
  }, []);

  // Filter methods
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));
    searchCacheRef.current.clear(); // Clear cache when filters change
  }, []);

  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: DEFAULT_FILTERS,
    }));
    searchCacheRef.current.clear();
  }, []);

  const setResourceFilter = useCallback((resources: string[]) => {
    updateFilters({ resources });
  }, [updateFilters]);

  const setCategoryFilter = useCallback((categories: string[]) => {
    updateFilters({ categories });
  }, [updateFilters]);

  // History methods
  const addToHistory = useCallback((query: string, resultCount: number) => {
    if (!enableHistory || !query.trim()) return;

    setState(prev => {
      const newHistory = [{
        id: Date.now().toString(),
        query,
        timestamp: new Date(),
        resultCount,
        filters: prev.filters,
      }, ...prev.searchHistory.filter(h => h.query !== query)].slice(0, 20); // Keep last 20

      return {
        ...prev,
        searchHistory: newHistory,
      };
    });
  }, [enableHistory]);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchHistory: [],
    }));
  }, []);

  // Saved search methods
  const saveSearch = useCallback((name: string, description?: string) => {
    setState(prev => {
      const newSavedSearch: SavedSearch = {
        id: Date.now().toString(),
        name,
        query: prev.query,
        description,
        filters: prev.filters,
        createdAt: new Date(),
        useCount: 0,
      };

      return {
        ...prev,
        savedSearches: [...prev.savedSearches, newSavedSearch],
      };
    });
  }, []);

  const deleteSavedSearch = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      savedSearches: prev.savedSearches.filter(s => s.id !== id),
    }));
  }, []);

  const loadSavedSearch = useCallback((search: SavedSearch) => {
    setState(prev => ({
      ...prev,
      query: search.query,
      filters: { 
        ...search.filters, 
        resources: search.filters.resources || [],
        actions: search.filters.actions || [],
        scopes: search.filters.scopes || [],
        categories: search.filters.categories || [],
        includeSystemPermissions: search.filters.includeSystemPermissions ?? true,
        includeConditionalPermissions: search.filters.includeConditionalPermissions ?? true
      },
      savedSearches: prev.savedSearches.map(s => 
        s.id === search.id 
          ? { ...s, lastUsed: new Date(), useCount: s.useCount + 1 }
          : s
      ),
    }));
  }, []);

  // Utility methods
  const getPopularPermissions = useCallback(() => {
    return state.popularPermissions;
  }, [state.popularPermissions]);

  const getRecentPermissions = useCallback(() => {
    return state.recentPermissions;
  }, [state.recentPermissions]);

  const exportResults = useCallback(() => {
    const data = {
      query: state.query,
      filters: state.filters,
      results: state.results.map(r => ({
        permission: r.permission.name,
        displayName: r.permission.displayName,
        description: r.permission.description,
        category: r.permission.category,
        score: r.score,
      })),
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }, [state.query, state.filters, state.results]);

  const copyPermissionNames = useCallback(() => {
    const names = Array.from(state.selectedPermissions).join('\n');
    navigator.clipboard?.writeText(names);
  }, [state.selectedPermissions]);

  const refreshPermissions = useCallback(async () => {
    searchCacheRef.current.clear();
    await loadPermissions();
  }, [loadPermissions]);

  return {
    state,
    search,
    clearSearch,
    setQuery,
    selectPermission,
    deselectPermission,
    selectAll,
    clearSelection,
    toggleSelection,
    updateFilters,
    resetFilters,
    setResourceFilter,
    setCategoryFilter,
    addToHistory,
    clearHistory,
    saveSearch,
    deleteSavedSearch,
    loadSavedSearch,
    getPopularPermissions,
    getRecentPermissions,
    exportResults,
    copyPermissionNames,
    refreshPermissions,
    isLoading: isLoadingPermissions || state.isLoading,
  };
}

export default usePermissionSearch;
