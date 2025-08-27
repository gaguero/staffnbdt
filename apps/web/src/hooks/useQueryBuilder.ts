import { useState, useCallback, useEffect } from 'react';
import { QueryConfig, QueryGroup, QueryRule, SavedQuery } from '../components/QueryBuilder';

interface UseQueryBuilderOptions {
  onQueryChange?: (query: QueryConfig) => void;
  onQueryExecute?: (query: QueryConfig) => void;
  enableLocalStorage?: boolean;
  storageKey?: string;
  autoExecute?: boolean;
  debounceMs?: number;
}

interface UseQueryBuilderReturn {
  // State
  query: QueryConfig;
  savedQueries: SavedQuery[];
  isExecuting: boolean;
  hasActiveQuery: boolean;
  
  // Query management
  setQuery: (query: QueryConfig) => void;
  resetQuery: () => void;
  executeQuery: (query?: QueryConfig) => Promise<void>;
  
  // Rule management
  addRule: (groupId: string, rule?: Partial<QueryRule>) => void;
  updateRule: (ruleId: string, updates: Partial<QueryRule>) => void;
  removeRule: (ruleId: string, groupId: string) => void;
  duplicateRule: (ruleId: string, groupId: string) => void;
  
  // Group management
  addGroup: (parentGroupId: string, group?: Partial<QueryGroup>) => void;
  updateGroup: (groupId: string, updates: Partial<QueryGroup>) => void;
  removeGroup: (groupId: string, parentGroupId: string) => void;
  duplicateGroup: (groupId: string, parentGroupId: string) => void;
  
  // Saved queries
  saveQuery: (name: string, description: string, tags?: string[]) => void;
  loadQuery: (queryId: string) => void;
  deleteQuery: (queryId: string) => void;
  getSavedQuery: (queryId: string) => SavedQuery | null;
  
  // Utilities
  generateSQL: (query?: QueryConfig) => string;
  validateQuery: (query?: QueryConfig) => { isValid: boolean; errors: string[] };
  exportQuery: (query?: QueryConfig) => string;
  importQuery: (queryJson: string) => boolean;
  getQueryComplexity: (query?: QueryConfig) => number;
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createEmptyQuery = (): QueryConfig => {
  const rootGroupId = generateId();
  return {
    groups: [{
      id: rootGroupId,
      type: 'group',
      logicalOperator: 'AND',
      rules: [],
    }],
    rootGroupId,
  };
};

export const useQueryBuilder = (options: UseQueryBuilderOptions = {}): UseQueryBuilderReturn => {
  const {
    onQueryChange,
    onQueryExecute,
    enableLocalStorage = true,
    storageKey = 'query-builder-data',
    autoExecute = false,
    debounceMs = 500,
  } = options;

  const [query, setQueryState] = useState<QueryConfig>(createEmptyQuery);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (enableLocalStorage && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.query) {
            setQueryState(data.query);
          }
          if (data.savedQueries) {
            setSavedQueries(data.savedQueries);
          }
        }
      } catch (error) {
        console.warn('Failed to load query builder data from localStorage:', error);
      }
    }
  }, [enableLocalStorage, storageKey]);

  // Save to localStorage when data changes
  useEffect(() => {
    if (enableLocalStorage && storageKey) {
      try {
        const data = {
          query,
          savedQueries,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save query builder data to localStorage:', error);
      }
    }
  }, [query, savedQueries, enableLocalStorage, storageKey]);

  // Check if query has active conditions
  const hasActiveQuery = useCallback((q: QueryConfig = query): boolean => {
    const checkGroup = (group: QueryGroup): boolean => {
      return group.rules.some(rule => {
        if (rule.type === 'rule') {
          const queryRule = rule as QueryRule;
          return queryRule.field && queryRule.operator && (
            queryRule.value !== '' || 
            ['isEmpty', 'isNotEmpty'].includes(queryRule.operator)
          );
        } else {
          return checkGroup(rule as QueryGroup);
        }
      });
    };

    const rootGroup = q.groups.find(g => g.id === q.rootGroupId);
    return rootGroup ? checkGroup(rootGroup) : false;
  }, [query]);

  // Update query and notify
  const setQuery = useCallback((newQuery: QueryConfig) => {
    setQueryState(newQuery);
    onQueryChange?.(newQuery);
    
    if (autoExecute && hasActiveQuery(newQuery)) {
      // Auto-execute with debounce
      const timeoutId = setTimeout(() => {
        executeQuery(newQuery);
      }, debounceMs);
      return () => clearTimeout(timeoutId);
    }
    
    return undefined;
  }, [onQueryChange, autoExecute, hasActiveQuery, debounceMs]);

  // Reset query to empty state
  const resetQuery = useCallback(() => {
    const emptyQuery = createEmptyQuery();
    setQuery(emptyQuery);
  }, [setQuery]);

  // Execute query
  const executeQuery = useCallback(async (queryToExecute: QueryConfig = query) => {
    if (!onQueryExecute) return;
    
    setIsExecuting(true);
    try {
      await onQueryExecute(queryToExecute);
    } catch (error) {
      console.error('Query execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [query, onQueryExecute]);

  // Find group by ID
  const findGroup = useCallback((groupId: string, groups: QueryGroup[] = query.groups): QueryGroup | null => {
    for (const group of groups) {
      if (group.id === groupId) return group;
      const found = findGroup(groupId, group.rules.filter(r => r.type === 'group') as QueryGroup[]);
      if (found) return found;
    }
    return null;
  }, [query.groups]);

  // Add rule to group
  const addRule = useCallback((groupId: string, rule: Partial<QueryRule> = {}) => {
    const newQuery = { ...query };
    const group = findGroup(groupId, newQuery.groups);
    
    if (group) {
      const newRule: QueryRule = {
        id: generateId(),
        field: '',
        operator: 'contains',
        value: '',
        type: 'rule',
        logicalOperator: 'AND',
        ...rule,
      };
      
      group.rules.push(newRule);
      setQuery(newQuery);
    }
  }, [query, findGroup, setQuery]);

  // Update rule
  const updateRule = useCallback((ruleId: string, updates: Partial<QueryRule>) => {
    const newQuery = { ...query };
    
    const updateRuleInGroup = (group: QueryGroup) => {
      group.rules = group.rules.map(rule => {
        if (rule.type === 'rule' && rule.id === ruleId) {
          return { ...rule, ...updates };
        }
        if (rule.type === 'group') {
          updateRuleInGroup(rule as QueryGroup);
        }
        return rule;
      });
    };

    newQuery.groups.forEach(updateRuleInGroup);
    setQuery(newQuery);
  }, [query, setQuery]);

  // Remove rule
  const removeRule = useCallback((ruleId: string, groupId: string) => {
    const newQuery = { ...query };
    const group = findGroup(groupId, newQuery.groups);
    
    if (group) {
      group.rules = group.rules.filter(rule => rule.id !== ruleId);
      setQuery(newQuery);
    }
  }, [query, findGroup, setQuery]);

  // Duplicate rule
  const duplicateRule = useCallback((ruleId: string, groupId: string) => {
    const newQuery = { ...query };
    const group = findGroup(groupId, newQuery.groups);
    
    if (group) {
      const rule = group.rules.find(r => r.id === ruleId);
      if (rule && rule.type === 'rule') {
        const duplicated = {
          ...JSON.parse(JSON.stringify(rule)),
          id: generateId(),
        };
        group.rules.push(duplicated);
        setQuery(newQuery);
      }
    }
  }, [query, findGroup, setQuery]);

  // Add group
  const addGroup = useCallback((parentGroupId: string, group: Partial<QueryGroup> = {}) => {
    const newQuery = { ...query };
    const parentGroup = findGroup(parentGroupId, newQuery.groups);
    
    if (parentGroup) {
      const newGroup: QueryGroup = {
        id: generateId(),
        type: 'group',
        logicalOperator: 'AND',
        rules: [],
        parentId: parentGroupId,
        ...group,
      };
      
      parentGroup.rules.push(newGroup);
      setQuery(newQuery);
    }
  }, [query, findGroup, setQuery]);

  // Update group
  const updateGroup = useCallback((groupId: string, updates: Partial<QueryGroup>) => {
    const newQuery = { ...query };
    const group = findGroup(groupId, newQuery.groups);
    
    if (group) {
      Object.assign(group, updates);
      setQuery(newQuery);
    }
  }, [query, findGroup, setQuery]);

  // Remove group
  const removeGroup = useCallback((groupId: string, parentGroupId: string) => {
    const newQuery = { ...query };
    const parentGroup = findGroup(parentGroupId, newQuery.groups);
    
    if (parentGroup) {
      parentGroup.rules = parentGroup.rules.filter(rule => rule.id !== groupId);
      setQuery(newQuery);
    }
  }, [query, findGroup, setQuery]);

  // Duplicate group
  const duplicateGroup = useCallback((groupId: string, parentGroupId: string) => {
    const newQuery = { ...query };
    const parentGroup = findGroup(parentGroupId, newQuery.groups);
    const group = findGroup(groupId, newQuery.groups);
    
    if (parentGroup && group) {
      const duplicated = JSON.parse(JSON.stringify(group));
      
      // Update all IDs recursively
      const updateIds = (item: QueryRule | QueryGroup) => {
        item.id = generateId();
        if (item.type === 'group') {
          (item as QueryGroup).rules.forEach(updateIds);
        }
      };
      
      updateIds(duplicated);
      duplicated.parentId = parentGroupId;
      
      parentGroup.rules.push(duplicated);
      setQuery(newQuery);
    }
  }, [query, findGroup, setQuery]);

  // Save query
  const saveQuery = useCallback((name: string, description: string, tags: string[] = []) => {
    const newSavedQuery: SavedQuery = {
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      query: JSON.parse(JSON.stringify(query)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags,
      isPublic: false,
    };

    setSavedQueries(prev => {
      // Remove any existing query with the same name
      const filtered = prev.filter(q => q.name !== newSavedQuery.name);
      return [...filtered, newSavedQuery].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, [query]);

  // Load query
  const loadQuery = useCallback((queryId: string) => {
    const savedQuery = savedQueries.find(q => q.id === queryId);
    if (savedQuery) {
      setQuery(savedQuery.query);
    }
  }, [savedQueries, setQuery]);

  // Delete saved query
  const deleteQuery = useCallback((queryId: string) => {
    setSavedQueries(prev => prev.filter(q => q.id !== queryId));
  }, []);

  // Get saved query by ID
  const getSavedQuery = useCallback((queryId: string): SavedQuery | null => {
    return savedQueries.find(q => q.id === queryId) || null;
  }, [savedQueries]);

  // Generate SQL representation
  const generateSQL = useCallback((queryToGenerate: QueryConfig = query): string => {
    const rootGroup = queryToGenerate.groups.find(g => g.id === queryToGenerate.rootGroupId);
    if (!rootGroup) return '';

    const buildGroupSQL = (group: QueryGroup, depth = 0): string => {
      if (group.rules.length === 0) return '';

      const parts: string[] = [];

      group.rules.forEach((rule, index) => {
        let part = '';
        
        if (index > 0) {
          part += ` ${group.logicalOperator} `;
        }

        if (rule.type === 'rule') {
          const queryRule = rule as QueryRule;
          switch (queryRule.operator) {
            case 'contains':
              part += `${queryRule.field} LIKE '%${queryRule.value}%'`;
              break;
            case 'equals':
              part += `${queryRule.field} = '${queryRule.value}'`;
              break;
            case 'greaterThan':
              part += `${queryRule.field} > ${queryRule.value}`;
              break;
            case 'lessThan':
              part += `${queryRule.field} < ${queryRule.value}`;
              break;
            case 'isEmpty':
              part += `(${queryRule.field} IS NULL OR ${queryRule.field} = '')`;
              break;
            case 'isNotEmpty':
              part += `(${queryRule.field} IS NOT NULL AND ${queryRule.field} != '')`;
              break;
            default:
              part += `${queryRule.field} ${queryRule.operator} ${queryRule.value}`;
          }
        } else {
          const nestedSQL = buildGroupSQL(rule as QueryGroup, depth + 1);
          if (nestedSQL) {
            part += `(${nestedSQL})`;
          }
        }

        if (part.trim()) {
          parts.push(part);
        }
      });

      return parts.join('');
    };

    const whereClause = buildGroupSQL(rootGroup);
    return whereClause ? `SELECT * FROM data WHERE ${whereClause}` : 'SELECT * FROM data';
  }, [query]);

  // Validate query
  const validateQuery = useCallback((queryToValidate: QueryConfig = query): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    const validateGroup = (group: QueryGroup): void => {
      if (group.rules.length === 0) {
        errors.push(`Group ${group.id} is empty`);
        return;
      }

      group.rules.forEach(rule => {
        if (rule.type === 'rule') {
          const queryRule = rule as QueryRule;
          if (!queryRule.field) {
            errors.push('Rule is missing field selection');
          }
          if (!queryRule.operator) {
            errors.push('Rule is missing operator selection');
          }
          if (!['isEmpty', 'isNotEmpty'].includes(queryRule.operator) && !queryRule.value) {
            errors.push('Rule is missing value');
          }
        } else {
          validateGroup(rule as QueryGroup);
        }
      });
    };

    const rootGroup = queryToValidate.groups.find(g => g.id === queryToValidate.rootGroupId);
    if (rootGroup) {
      validateGroup(rootGroup);
    } else {
      errors.push('Root group not found');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [query]);

  // Export query as JSON
  const exportQuery = useCallback((queryToExport: QueryConfig = query): string => {
    const exportData = {
      query: queryToExport,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(exportData, null, 2);
  }, [query]);

  // Import query from JSON
  const importQuery = useCallback((queryJson: string): boolean => {
    try {
      const importData = JSON.parse(queryJson);
      if (importData.query && importData.query.groups && importData.query.rootGroupId) {
        setQuery(importData.query);
        return true;
      }
    } catch (error) {
      console.error('Failed to import query:', error);
    }
    return false;
  }, [setQuery]);

  // Get query complexity score
  const getQueryComplexity = useCallback((queryToAnalyze: QueryConfig = query): number => {
    let complexity = 0;
    
    const analyzeGroup = (group: QueryGroup): void => {
      complexity += 1; // Base group complexity
      
      group.rules.forEach(rule => {
        if (rule.type === 'rule') {
          complexity += 1; // Base rule complexity
          
          const queryRule = rule as QueryRule;
          // Add complexity for advanced operators
          if (['between', 'in', 'notIn'].includes(queryRule.operator)) {
            complexity += 2;
          }
        } else {
          analyzeGroup(rule as QueryGroup);
        }
      });
    };

    const rootGroup = queryToAnalyze.groups.find(g => g.id === queryToAnalyze.rootGroupId);
    if (rootGroup) {
      analyzeGroup(rootGroup);
    }

    return complexity;
  }, [query]);

  return {
    query,
    savedQueries,
    isExecuting,
    hasActiveQuery: hasActiveQuery(),
    
    setQuery,
    resetQuery,
    executeQuery,
    
    addRule,
    updateRule,
    removeRule,
    duplicateRule,
    
    addGroup,
    updateGroup,
    removeGroup,
    duplicateGroup,
    
    saveQuery,
    loadQuery,
    deleteQuery,
    getSavedQuery,
    
    generateSQL,
    validateQuery,
    exportQuery,
    importQuery,
    getQueryComplexity,
  };
};