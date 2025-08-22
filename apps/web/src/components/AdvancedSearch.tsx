import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, PlusIcon, TrashIcon, SaveIcon, BookmarkIcon } from 'lucide-react';

export interface SearchField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  operators: SearchOperator[];
  options?: SelectOption[];
}

export interface SearchOperator {
  value: string;
  label: string;
  description?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SearchRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  logicalOperator: 'AND' | 'OR';
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  rules: SearchRule[];
  createdAt: string;
  isPublic?: boolean;
}

interface AdvancedSearchProps {
  fields: SearchField[];
  savedSearches?: SavedSearch[];
  onSearch: (rules: SearchRule[]) => void;
  onSaveSearch?: (name: string, description: string, rules: SearchRule[]) => void;
  onLoadSearch?: (search: SavedSearch) => void;
  onDeleteSearch?: (searchId: string) => void;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const defaultOperators: Record<string, SearchOperator[]> = {
  text: [
    { value: 'contains', label: 'Contains', description: 'Field contains the value' },
    { value: 'equals', label: 'Equals', description: 'Field exactly matches the value' },
    { value: 'startsWith', label: 'Starts with', description: 'Field starts with the value' },
    { value: 'endsWith', label: 'Ends with', description: 'Field ends with the value' },
    { value: 'isEmpty', label: 'Is empty', description: 'Field is empty or null' },
    { value: 'isNotEmpty', label: 'Is not empty', description: 'Field has a value' },
  ],
  number: [
    { value: 'equals', label: 'Equals', description: 'Field equals the number' },
    { value: 'greaterThan', label: 'Greater than', description: 'Field is greater than the number' },
    { value: 'lessThan', label: 'Less than', description: 'Field is less than the number' },
    { value: 'greaterThanOrEqual', label: 'Greater than or equal', description: 'Field is greater than or equal to the number' },
    { value: 'lessThanOrEqual', label: 'Less than or equal', description: 'Field is less than or equal to the number' },
    { value: 'between', label: 'Between', description: 'Field is between two numbers' },
  ],
  date: [
    { value: 'equals', label: 'On date', description: 'Field is on the specific date' },
    { value: 'before', label: 'Before', description: 'Field is before the date' },
    { value: 'after', label: 'After', description: 'Field is after the date' },
    { value: 'between', label: 'Between', description: 'Field is between two dates' },
    { value: 'last7Days', label: 'Last 7 days', description: 'Field is within the last 7 days' },
    { value: 'last30Days', label: 'Last 30 days', description: 'Field is within the last 30 days' },
    { value: 'thisMonth', label: 'This month', description: 'Field is in the current month' },
    { value: 'thisYear', label: 'This year', description: 'Field is in the current year' },
  ],
  select: [
    { value: 'equals', label: 'Is', description: 'Field equals the selected value' },
    { value: 'notEquals', label: 'Is not', description: 'Field does not equal the selected value' },
    { value: 'in', label: 'Is one of', description: 'Field is one of the selected values' },
    { value: 'notIn', label: 'Is not one of', description: 'Field is not one of the selected values' },
  ],
};

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  fields,
  savedSearches = [],
  onSearch,
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
  className = '',
  isOpen = false,
  onToggle,
}) => {
  const [rules, setRules] = useState<SearchRule[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', description: '' });

  // Initialize with one empty rule
  useEffect(() => {
    if (rules.length === 0) {
      addRule();
    }
  }, []);

  const generateRuleId = () => `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addRule = () => {
    const newRule: SearchRule = {
      id: generateRuleId(),
      field: fields[0]?.key || '',
      operator: fields[0]?.operators[0]?.value || 'contains',
      value: '',
      logicalOperator: 'AND',
    };
    setRules(prev => [...prev, newRule]);
  };

  const removeRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const updateRule = (ruleId: string, updates: Partial<SearchRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const handleFieldChange = (ruleId: string, fieldKey: string) => {
    const field = fields.find(f => f.key === fieldKey);
    if (field) {
      updateRule(ruleId, {
        field: fieldKey,
        operator: field.operators[0]?.value || 'contains',
        value: '',
      });
    }
  };

  const getFieldByKey = (key: string) => fields.find(f => f.key === key);

  const getOperatorsForField = (fieldKey: string): SearchOperator[] => {
    const field = getFieldByKey(fieldKey);
    if (field?.operators) {
      return field.operators;
    }
    return defaultOperators[field?.type || 'text'] || defaultOperators.text;
  };

  const handleSearch = () => {
    const validRules = rules.filter(rule => 
      rule.field && rule.operator && (
        rule.value !== '' || 
        ['isEmpty', 'isNotEmpty', 'last7Days', 'last30Days', 'thisMonth', 'thisYear'].includes(rule.operator)
      )
    );
    onSearch(validRules);
  };

  const handleSaveSearch = () => {
    if (onSaveSearch && saveForm.name.trim()) {
      onSaveSearch(saveForm.name.trim(), saveForm.description.trim(), rules);
      setSaveForm({ name: '', description: '' });
      setShowSaveDialog(false);
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setRules(search.rules);
    setShowSavedSearches(false);
    onLoadSearch?.(search);
  };

  const clearSearch = () => {
    setRules([]);
    addRule();
  };

  const renderValueInput = (rule: SearchRule) => {
    const field = getFieldByKey(rule.field);
    const needsValue = !['isEmpty', 'isNotEmpty', 'last7Days', 'last30Days', 'thisMonth', 'thisYear'].includes(rule.operator);
    
    if (!needsValue) {
      return null;
    }

    const commonProps = {
      value: rule.value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
        updateRule(rule.id, { value: e.target.value }),
      className: 'form-input text-sm',
      placeholder: 'Enter value...',
    };

    switch (field?.type) {
      case 'select':
        return (
          <select {...commonProps} className="form-input text-sm">
            <option value="">Select value...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            placeholder="Enter number..."
          />
        );
      
      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
            placeholder="Select date..."
          />
        );
      
      default:
        return (
          <input
            {...commonProps}
            type="text"
            placeholder="Enter text..."
          />
        );
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`card ${className}`}
      >
        <div className="card-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <SearchIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-charcoal">Advanced Search</h3>
            </div>
            <div className="flex items-center space-x-2">
              {savedSearches.length > 0 && (
                <button
                  onClick={() => setShowSavedSearches(!showSavedSearches)}
                  className="btn btn-outline btn-sm"
                  title="Saved Searches"
                >
                  <BookmarkIcon className="w-4 h-4" />
                </button>
              )}
              {onSaveSearch && rules.length > 0 && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="btn btn-outline btn-sm"
                  title="Save Search"
                >
                  <SaveIcon className="w-4 h-4" />
                </button>
              )}
              {onToggle && (
                <button
                  onClick={onToggle}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Saved Searches */}
          {showSavedSearches && savedSearches.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-4 p-3 bg-gray-50 rounded-lg"
            >
              <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Searches</h4>
              <div className="grid gap-2">
                {savedSearches.map(search => (
                  <div key={search.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <button
                        onClick={() => handleLoadSearch(search)}
                        className="text-left"
                      >
                        <p className="text-sm font-medium text-charcoal">{search.name}</p>
                        {search.description && (
                          <p className="text-xs text-gray-500">{search.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {search.rules.length} rule{search.rules.length !== 1 ? 's' : ''} • {new Date(search.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    </div>
                    {onDeleteSearch && (
                      <button
                        onClick={() => onDeleteSearch(search.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete Search"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Search Rules */}
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-2 items-center">
                  {/* Logical Operator */}
                  {index > 0 && (
                    <div className="lg:col-span-1">
                      <select
                        value={rule.logicalOperator}
                        onChange={(e) => updateRule(rule.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                        className="form-input text-sm"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Field */}
                  <div className={index === 0 ? 'lg:col-span-2' : 'lg:col-span-1'}>
                    <select
                      value={rule.field}
                      onChange={(e) => handleFieldChange(rule.id, e.target.value)}
                      className="form-input text-sm"
                    >
                      <option value="">Select field...</option>
                      {fields.map(field => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Operator */}
                  <div className="lg:col-span-1">
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
                      className="form-input text-sm"
                      disabled={!rule.field}
                    >
                      {getOperatorsForField(rule.field).map(operator => (
                        <option key={operator.value} value={operator.value} title={operator.description}>
                          {operator.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Value */}
                  <div className="lg:col-span-1">
                    {renderValueInput(rule)}
                  </div>
                  
                  {/* Actions */}
                  <div className="lg:col-span-1 flex justify-end">
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      disabled={rules.length === 1}
                      title="Remove Rule"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={addRule}
                className="btn btn-outline btn-sm"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Rule
              </button>
              <button
                onClick={clearSearch}
                className="btn btn-outline btn-sm"
              >
                Clear All
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSearch}
                className="btn btn-primary"
                disabled={rules.every(rule => !rule.field || !rule.operator)}
              >
                <SearchIcon className="w-4 h-4 mr-1" />
                Apply Search
              </button>
            </div>
          </div>
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-lg max-w-md w-full"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-charcoal mb-4">Save Search</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Search Name</label>
                    <input
                      type="text"
                      value={saveForm.name}
                      onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      placeholder="Enter a name for this search..."
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Description (Optional)</label>
                    <textarea
                      value={saveForm.description}
                      onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                      className="form-input"
                      rows={3}
                      placeholder="Describe what this search finds..."
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2 pt-4">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSearch}
                    className="btn btn-primary"
                    disabled={!saveForm.name.trim()}
                  >
                    Save Search
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AdvancedSearch;