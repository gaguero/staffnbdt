import { useState, useCallback, useEffect } from 'react';
import { SearchRule, SavedSearch } from '../components/AdvancedSearch';

interface UseAdvancedSearchOptions {
  onSearch?: (rules: SearchRule[]) => void;
  storageKey?: string;
  enableLocalStorage?: boolean;
}

interface UseAdvancedSearchReturn {
  searchRules: SearchRule[];
  savedSearches: SavedSearch[];
  isSearching: boolean;
  activeSearchName: string | null;
  
  // Search operations
  executeSearch: (rules: SearchRule[]) => void;
  clearSearch: () => void;
  
  // Saved search operations
  saveSearch: (name: string, description: string, rules: SearchRule[]) => void;
  loadSearch: (search: SavedSearch) => void;
  deleteSearch: (searchId: string) => void;
  
  // Rule operations
  addRule: () => void;
  removeRule: (ruleId: string) => void;
  updateRule: (ruleId: string, updates: Partial<SearchRule>) => void;
  
  // Utility functions
  hasActiveSearch: boolean;
  generateSearchQuery: (rules: SearchRule[]) => string;
  parseSearchQuery: (query: string) => SearchRule[];
}

export const useAdvancedSearch = (options: UseAdvancedSearchOptions = {}): UseAdvancedSearchReturn => {
  const {
    onSearch,
    storageKey = 'advanced-search-data',
    enableLocalStorage = true,
  } = options;

  const [searchRules, setSearchRules] = useState<SearchRule[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchName, setActiveSearchName] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (enableLocalStorage && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.savedSearches) {
            setSavedSearches(data.savedSearches);
          }
          if (data.lastSearch) {
            setSearchRules(data.lastSearch);
          }
        }
      } catch (error) {
        console.warn('Failed to load advanced search data from localStorage:', error);
      }
    }
  }, [enableLocalStorage, storageKey]);

  // Save to localStorage when data changes
  useEffect(() => {
    if (enableLocalStorage && storageKey) {
      try {
        const data = {
          savedSearches,
          lastSearch: searchRules,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save advanced search data to localStorage:', error);
      }
    }
  }, [savedSearches, searchRules, enableLocalStorage, storageKey]);

  const generateRuleId = () => `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addRule = useCallback(() => {
    const newRule: SearchRule = {
      id: generateRuleId(),
      field: '',
      operator: 'contains',
      value: '',
      logicalOperator: 'AND',
    };
    setSearchRules(prev => [...prev, newRule]);
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setSearchRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<SearchRule>) => {
    setSearchRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  }, []);

  const executeSearch = useCallback(async (rules: SearchRule[]) => {
    setIsSearching(true);
    setSearchRules(rules);
    
    try {
      await onSearch?.(rules);
    } catch (error) {
      console.error('Search execution failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch]);

  const clearSearch = useCallback(() => {
    setSearchRules([]);
    setActiveSearchName(null);
    executeSearch([]);
  }, [executeSearch]);

  const saveSearch = useCallback((name: string, description: string, rules: SearchRule[]) => {
    const newSearch: SavedSearch = {
      id: `search_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      rules: [...rules],
      createdAt: new Date().toISOString(),
    };

    setSavedSearches(prev => {
      // Remove any existing search with the same name
      const filtered = prev.filter(search => search.name !== newSearch.name);
      return [...filtered, newSearch].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const loadSearch = useCallback((search: SavedSearch) => {
    setSearchRules([...search.rules]);
    setActiveSearchName(search.name);
    executeSearch(search.rules);
  }, [executeSearch]);

  const deleteSearch = useCallback((searchId: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
    
    // If this was the active search, clear it
    const deletedSearch = savedSearches.find(s => s.id === searchId);
    if (deletedSearch && activeSearchName === deletedSearch.name) {
      setActiveSearchName(null);
    }
  }, [savedSearches, activeSearchName]);

  const generateSearchQuery = useCallback((rules: SearchRule[]): string => {
    if (rules.length === 0) return '';

    const queryParts = rules.map((rule, index) => {
      let part = '';
      
      // Add logical operator for non-first rules
      if (index > 0) {
        part += ` ${rule.logicalOperator} `;
      }
      
      // Build the condition
      switch (rule.operator) {
        case 'contains':
          part += `${rule.field}:*${rule.value}*`;
          break;
        case 'equals':
          part += `${rule.field}:"${rule.value}"`;
          break;
        case 'startsWith':
          part += `${rule.field}:${rule.value}*`;
          break;
        case 'endsWith':
          part += `${rule.field}:*${rule.value}`;
          break;
        case 'greaterThan':
          part += `${rule.field}:>${rule.value}`;
          break;
        case 'lessThan':
          part += `${rule.field}:<${rule.value}`;
          break;
        case 'greaterThanOrEqual':
          part += `${rule.field}:>=${rule.value}`;
          break;
        case 'lessThanOrEqual':
          part += `${rule.field}:<=${rule.value}`;
          break;
        case 'between':
          if (Array.isArray(rule.value) && rule.value.length === 2) {
            part += `${rule.field}:[${rule.value[0]} TO ${rule.value[1]}]`;
          }
          break;
        case 'isEmpty':
          part += `${rule.field}:""`;
          break;
        case 'isNotEmpty':
          part += `NOT ${rule.field}:""`;
          break;
        case 'in':
          if (Array.isArray(rule.value)) {
            part += `${rule.field}:(${rule.value.map(v => `"${v}"`).join(' OR ')})`;
          }
          break;
        case 'notIn':
          if (Array.isArray(rule.value)) {
            part += `NOT ${rule.field}:(${rule.value.map(v => `"${v}"`).join(' OR ')})`;
          }
          break;
        default:
          part += `${rule.field}:${rule.value}`;
      }
      
      return part;
    });

    return queryParts.join('');
  }, []);

  const parseSearchQuery = useCallback((query: string): SearchRule[] => {
    // This is a simplified parser - in a real application, you'd want a more robust solution
    const rules: SearchRule[] = [];
    
    // Split by AND/OR while preserving the operators
    const parts = query.split(/\s+(AND|OR)\s+/);
    
    for (let i = 0; i < parts.length; i += 2) {
      const condition = parts[i];
      const logicalOperator = i + 1 < parts.length ? parts[i + 1] as 'AND' | 'OR' : 'AND';
      
      // Parse field:value pattern
      const match = condition.match(/(\w+):(.+)/);
      if (match) {
        const [, field, value] = match;
        
        rules.push({
          id: generateRuleId(),
          field,
          operator: 'contains', // Default operator
          value: value.replace(/[*"]/g, ''), // Clean up wildcards and quotes
          logicalOperator,
        });
      }
    }
    
    return rules;
  }, []);

  const hasActiveSearch = searchRules.length > 0 && searchRules.some(rule => 
    rule.field && rule.operator && (
      rule.value !== '' || 
      ['isEmpty', 'isNotEmpty', 'last7Days', 'last30Days', 'thisMonth', 'thisYear'].includes(rule.operator)
    )
  );

  return {
    searchRules,
    savedSearches,
    isSearching,
    activeSearchName,
    
    executeSearch,
    clearSearch,
    
    saveSearch,
    loadSearch,
    deleteSearch,
    
    addRule,
    removeRule,
    updateRule,
    
    hasActiveSearch,
    generateSearchQuery,
    parseSearchQuery,
  };
};