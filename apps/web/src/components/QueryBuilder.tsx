import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  CopyIcon,
  SaveIcon,
  FolderIcon,
  PlayIcon,
  RefreshCwIcon,
  BracketsIcon,
  FilterIcon,
  CodeIcon,
} from 'lucide-react';
import { SearchField, SearchRule } from './AdvancedSearch';
import { useHotkeys } from 'react-hotkeys-hook';

export interface QueryRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  type: 'rule' | 'group';
  logicalOperator?: 'AND' | 'OR';
}

export interface QueryGroup {
  id: string;
  type: 'group';
  logicalOperator: 'AND' | 'OR';
  rules: (QueryRule | QueryGroup)[];
  parentId?: string;
}

export interface QueryConfig {
  groups: QueryGroup[];
  rootGroupId: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  query: QueryConfig;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isPublic: boolean;
}

interface QueryBuilderProps {
  fields: SearchField[];
  value: QueryConfig;
  onChange: (query: QueryConfig) => void;
  onExecute: (query: QueryConfig) => void;
  savedQueries?: SavedQuery[];
  onSaveQuery?: (name: string, description: string, query: QueryConfig, tags: string[]) => void;
  onLoadQuery?: (query: SavedQuery) => void;
  onDeleteQuery?: (queryId: string) => void;
  isExecuting?: boolean;
  showSQL?: boolean;
  enableKeyboardShortcuts?: boolean;
}

const QueryBuilder: React.FC<QueryBuilderProps> = ({
  fields,
  value,
  onChange,
  onExecute,
  savedQueries = [],
  onSaveQuery,
  onLoadQuery,
  onDeleteQuery,
  isExecuting = false,
  showSQL = false,
  enableKeyboardShortcuts = true,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSQLView, setShowSQLView] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Keyboard shortcuts
  useHotkeys('ctrl+s', () => setShowSaveModal(true), { 
    enabled: enableKeyboardShortcuts,
    preventDefault: true 
  });
  useHotkeys('ctrl+o', () => setShowLoadModal(true), { 
    enabled: enableKeyboardShortcuts,
    preventDefault: true 
  });
  useHotkeys('ctrl+enter', () => handleExecuteQuery(), { 
    enabled: enableKeyboardShortcuts,
    preventDefault: true 
  });
  useHotkeys('escape', () => {
    setShowSaveModal(false);
    setShowLoadModal(false);
    setShowSQLView(false);
  }, { enabled: enableKeyboardShortcuts });

  // Generate unique ID
  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Find group by ID
  const findGroup = useCallback((groupId: string, groups: QueryGroup[] = value.groups): QueryGroup | null => {
    for (const group of groups) {
      if (group.id === groupId) return group;
      const found = findGroup(groupId, group.rules.filter(r => r.type === 'group') as QueryGroup[]);
      if (found) return found;
    }
    return null;
  }, [value.groups]);

  // Get root group
  const getRootGroup = useCallback(() => {
    return findGroup(value.rootGroupId) || value.groups[0];
  }, [findGroup, value]);

  // Update query configuration
  const updateQuery = useCallback((updater: (query: QueryConfig) => QueryConfig) => {
    const updated = updater({ ...value });
    onChange(updated);
  }, [value, onChange]);

  // Add rule to group
  const addRule = useCallback((groupId: string) => {
    updateQuery(query => {
      const group = findGroup(groupId, query.groups);
      if (!group) return query;

      const newRule: QueryRule = {
        id: generateId(),
        field: fields[0]?.key || '',
        operator: fields[0]?.operators[0]?.value || 'contains',
        value: '',
        type: 'rule',
        logicalOperator: 'AND',
      };

      group.rules.push(newRule);
      return query;
    });
  }, [findGroup, fields, updateQuery]);

  // Add group to parent group
  const addGroup = useCallback((parentGroupId: string) => {
    updateQuery(query => {
      const parentGroup = findGroup(parentGroupId, query.groups);
      if (!parentGroup) return query;

      const newGroup: QueryGroup = {
        id: generateId(),
        type: 'group',
        logicalOperator: 'AND',
        rules: [],
        parentId: parentGroupId,
      };

      parentGroup.rules.push(newGroup);
      return query;
    });
  }, [findGroup, updateQuery]);

  // Remove rule or group
  const removeItem = useCallback((itemId: string, parentGroupId: string) => {
    updateQuery(query => {
      const parentGroup = findGroup(parentGroupId, query.groups);
      if (!parentGroup) return query;

      parentGroup.rules = parentGroup.rules.filter(rule => rule.id !== itemId);
      return query;
    });
  }, [findGroup, updateQuery]);

  // Update rule
  const updateRule = useCallback((ruleId: string, updates: Partial<QueryRule>) => {
    updateQuery(query => {
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

      query.groups.forEach(updateRuleInGroup);
      return query;
    });
  }, [updateQuery]);

  // Update group
  const updateGroup = useCallback((groupId: string, updates: Partial<QueryGroup>) => {
    updateQuery(query => {
      const group = findGroup(groupId, query.groups);
      if (!group) return query;

      Object.assign(group, updates);
      return query;
    });
  }, [findGroup, updateQuery]);

  // Duplicate rule or group
  const duplicateItem = useCallback((itemId: string, parentGroupId: string) => {
    updateQuery(query => {
      const parentGroup = findGroup(parentGroupId, query.groups);
      if (!parentGroup) return query;

      const item = parentGroup.rules.find(r => r.id === itemId);
      if (!item) return query;

      const duplicated = {
        ...JSON.parse(JSON.stringify(item)),
        id: generateId(),
      };

      // If duplicating a group, update all nested IDs
      if (duplicated.type === 'group') {
        const updateNestedIds = (group: QueryGroup) => {
          group.id = generateId();
          group.rules.forEach(rule => {
            if (rule.type === 'rule') {
              rule.id = generateId();
            } else {
              updateNestedIds(rule as QueryGroup);
            }
          });
        };
        updateNestedIds(duplicated as QueryGroup);
      }

      parentGroup.rules.push(duplicated);
      return query;
    });
  }, [findGroup, updateQuery]);

  // Execute query
  const handleExecuteQuery = useCallback(() => {
    onExecute(value);
  }, [onExecute, value]);

  // Generate SQL-like representation
  const generateSQL = useCallback((query: QueryConfig): string => {
    const rootGroup = getRootGroup();
    if (!rootGroup) return '';

    const buildGroupSQL = (group: QueryGroup, depth = 0): string => {
      if (group.rules.length === 0) return '';

      const indent = '  '.repeat(depth);
      const parts: string[] = [];

      group.rules.forEach((rule, index) => {
        let part = '';
        
        // Add logical operator for non-first rules
        if (index > 0) {
          part += ` ${group.logicalOperator} `;
        }

        if (rule.type === 'rule') {
          const field = fields.find(f => f.key === rule.field);
          const operator = field?.operators.find(op => op.value === rule.operator);
          
          switch (rule.operator) {
            case 'contains':
              part += `${rule.field} LIKE '%${rule.value}%'`;
              break;
            case 'equals':
              part += `${rule.field} = '${rule.value}'`;
              break;
            case 'startsWith':
              part += `${rule.field} LIKE '${rule.value}%'`;
              break;
            case 'endsWith':
              part += `${rule.field} LIKE '%${rule.value}'`;
              break;
            case 'greaterThan':
              part += `${rule.field} > ${rule.value}`;
              break;
            case 'lessThan':
              part += `${rule.field} < ${rule.value}`;
              break;
            case 'isEmpty':
              part += `${rule.field} IS NULL OR ${rule.field} = ''`;
              break;
            case 'isNotEmpty':
              part += `${rule.field} IS NOT NULL AND ${rule.field} != ''`;
              break;
            default:
              part += `${rule.field} ${operator?.label || rule.operator} ${rule.value}`;
          }
        } else {
          const nestedSQL = buildGroupSQL(rule as QueryGroup, depth + 1);
          if (nestedSQL) {
            part += `(\n${indent}  ${nestedSQL}\n${indent})`;
          }
        }

        if (part.trim()) {
          parts.push(part);
        }
      });

      return parts.join('');
    };

    return `SELECT * FROM data WHERE\n  ${buildGroupSQL(rootGroup)}`;
  }, [getRootGroup, fields]);

  // Render rule component
  const renderRule = (rule: QueryRule, parentGroupId: string, index: number) => {
    const field = fields.find(f => f.key === rule.field);
    const operators = field?.operators || [];

    return (
      <motion.div
        key={rule.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
      >
        {/* Logical Operator */}
        {index > 0 && (
          <select
            value={rule.logicalOperator || 'AND'}
            onChange={(e) => updateRule(rule.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        )}

        {/* Field */}
        <select
          value={rule.field}
          onChange={(e) => {
            const newField = fields.find(f => f.key === e.target.value);
            updateRule(rule.id, {
              field: e.target.value,
              operator: newField?.operators[0]?.value || 'contains',
              value: '',
            });
          }}
          className="px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select field...</option>
          {fields.map(field => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
        </select>

        {/* Operator */}
        <select
          value={rule.operator}
          onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!rule.field}
        >
          {operators.map(operator => (
            <option key={operator.value} value={operator.value}>
              {operator.label}
            </option>
          ))}
        </select>

        {/* Value */}
        {!['isEmpty', 'isNotEmpty'].includes(rule.operator) && (
          <>
            {field?.type === 'select' ? (
              <select
                value={rule.value}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select value...</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field?.type === 'date' ? (
              <input
                type="date"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : field?.type === 'number' ? (
              <input
                type="number"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                placeholder="Enter value..."
                className="px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input
                type="text"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                placeholder="Enter value..."
                className="px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-1 ml-auto">
          <button
            onClick={() => duplicateItem(rule.id, parentGroupId)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
            title="Duplicate rule"
          >
            <CopyIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => removeItem(rule.id, parentGroupId)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Remove rule"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  // Render group component
  const renderGroup = (group: QueryGroup): React.ReactNode => {
    return (
      <motion.div
        key={group.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`
          border rounded-lg p-4 space-y-3
          ${selectedGroupId === group.id 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-white'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedGroupId(group.id);
        }}
      >
        {/* Group Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BracketsIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Group</span>
            {group.rules.length > 1 && (
              <select
                value={group.logicalOperator}
                onChange={(e) => updateGroup(group.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                className="px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addRule(group.id);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Add rule"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addGroup(group.id);
              }}
              className="p-1 text-gray-400 hover:text-green-600 rounded"
              title="Add group"
            >
              <BracketsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateItem(group.id, group.parentId || value.rootGroupId);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Duplicate group"
            >
              <CopyIcon className="w-4 h-4" />
            </button>
            {group.id !== value.rootGroupId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(group.id, group.parentId || value.rootGroupId);
                }}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Remove group"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Group Content */}
        <div className="space-y-2">
          <AnimatePresence>
            {group.rules.map((rule, index) => {
              if (rule.type === 'rule') {
                return renderRule(rule as QueryRule, group.id, index);
              } else {
                return renderGroup(rule as QueryGroup);
              }
            })}
          </AnimatePresence>
          
          {group.rules.length === 0 && (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-500 text-sm mb-2">No conditions in this group</p>
              <button
                onClick={() => addRule(group.id)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Add your first condition
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const rootGroup = getRootGroup();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <FilterIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Query Builder</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {showSQL && (
            <button
              onClick={() => setShowSQLView(!showSQLView)}
              className="btn btn-outline btn-sm"
            >
              <CodeIcon className="w-4 h-4 mr-1" />
              {showSQLView ? 'Hide' : 'Show'} SQL
            </button>
          )}
          
          <button
            onClick={() => setShowLoadModal(true)}
            className="btn btn-outline btn-sm"
            disabled={savedQueries.length === 0}
          >
            <FolderIcon className="w-4 h-4 mr-1" />
            Load
          </button>
          
          {onSaveQuery && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="btn btn-outline btn-sm"
            >
              <SaveIcon className="w-4 h-4 mr-1" />
              Save
            </button>
          )}
          
          <button
            onClick={handleExecuteQuery}
            disabled={isExecuting}
            className="btn btn-primary btn-sm"
          >
            {isExecuting ? (
              <RefreshCwIcon className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <PlayIcon className="w-4 h-4 mr-1" />
            )}
            Execute
          </button>
        </div>
      </div>

      {/* SQL View */}
      {showSQL && showSQLView && (
        <div className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{generateSQL(value)}</pre>
        </div>
      )}

      {/* Query Builder */}
      <div className="min-h-[200px]" onClick={() => setSelectedGroupId(null)}>
        {rootGroup ? renderGroup(rootGroup) : (
          <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
            <FilterIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Build Your Query</h4>
            <p className="text-gray-500 mb-4">Add conditions to filter your data</p>
            <button
              onClick={() => addRule(value.rootGroupId)}
              className="btn btn-primary"
            >
              Add First Condition
            </button>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      {enableKeyboardShortcuts && (
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          <strong>Shortcuts:</strong> Ctrl+S (Save), Ctrl+O (Load), Ctrl+Enter (Execute), Esc (Close modals)
        </div>
      )}
    </div>
  );
};

export default QueryBuilder;