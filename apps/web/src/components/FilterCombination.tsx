import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterIcon, XIcon, SaveIcon, BookmarkIcon, RotateCcwIcon } from 'lucide-react';

export interface FilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'range' | 'boolean';
  options?: FilterOption[];
  defaultValue?: any;
  placeholder?: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  description?: string;
}

export interface ActiveFilter {
  key: string;
  value: any;
  label: string;
  displayValue: string;
  removable: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  isSystem?: boolean;
  isPublic?: boolean;
  createdAt: string;
}

interface FilterCombinationProps {
  filters: FilterDefinition[];
  activeFilters: Record<string, any>;
  presets?: FilterPreset[];
  onFilterChange: (key: string, value: any) => void;
  onClearAllFilters: () => void;
  onSavePreset?: (name: string, description: string) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
  onDeletePreset?: (presetId: string) => void;
  className?: string;
  showPresets?: boolean;
  showFilterCount?: boolean;
}

export const FilterCombination: React.FC<FilterCombinationProps> = ({
  filters,
  activeFilters,
  presets = [],
  onFilterChange,
  onClearAllFilters,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  className = '',
  showPresets = true,
  showFilterCount = true,
}) => {
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showPresetsList, setShowPresetsList] = useState(false);
  const [presetForm, setPresetForm] = useState({ name: '', description: '' });

  // Calculate active filter chips
  const activeFilterChips: ActiveFilter[] = filters.reduce((chips: ActiveFilter[], filter) => {
    const value = activeFilters[filter.key];
    if (value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
      let displayValue = '';
      let label = filter.label;

      switch (filter.type) {
        case 'select':
          const option = filter.options?.find(opt => opt.value === value);
          displayValue = option?.label || value;
          break;
        
        case 'multiselect':
          if (Array.isArray(value) && value.length > 0) {
            if (value.length === 1) {
              const option = filter.options?.find(opt => opt.value === value[0]);
              displayValue = option?.label || value[0];
            } else {
              displayValue = `${value.length} selected`;
            }
          }
          break;
        
        case 'boolean':
          displayValue = value ? 'Yes' : 'No';
          break;
        
        case 'date':
          if (typeof value === 'object' && value.from && value.to) {
            displayValue = `${value.from} to ${value.to}`;
          } else {
            displayValue = value;
          }
          break;
        
        case 'range':
          if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
            displayValue = `${value.min} - ${value.max}`;
          } else {
            displayValue = value;
          }
          break;
        
        default:
          displayValue = value;
      }

      chips.push({
        key: filter.key,
        value,
        label,
        displayValue,
        removable: true,
      });
    }
    return chips;
  }, []);

  const hasActiveFilters = activeFilterChips.length > 0;

  const handleSavePreset = () => {
    if (onSavePreset && presetForm.name.trim() && hasActiveFilters) {
      onSavePreset(presetForm.name.trim(), presetForm.description.trim());
      setPresetForm({ name: '', description: '' });
      setShowPresetDialog(false);
    }
  };

  const renderFilterControl = (filter: FilterDefinition) => {
    const value = activeFilters[filter.key];

    switch (filter.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value || undefined)}
            className="form-input text-sm"
          >
            <option value="">{filter.placeholder || `All ${filter.label}`}</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value} title={option.description}>
                {option.label}
                {showFilterCount && option.count !== undefined && ` (${option.count})`}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="relative">
            <select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => {
                const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                onFilterChange(filter.key, selectedValues.length > 0 ? selectedValues : undefined);
              }}
              className="form-input text-sm min-h-[80px]"
            >
              {filter.options?.map(option => (
                <option key={option.value} value={option.value} title={option.description}>
                  {option.label}
                  {showFilterCount && option.count !== undefined && ` (${option.count})`}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
        );

      case 'boolean':
        return (
          <select
            value={value === undefined ? '' : value.toString()}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange(filter.key, val === '' ? undefined : val === 'true');
            }}
            className="form-input text-sm"
          >
            <option value="">{filter.placeholder || `All ${filter.label}`}</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <input
              type="date"
              value={typeof value === 'object' ? value?.from || '' : value || ''}
              onChange={(e) => {
                if (typeof value === 'object') {
                  onFilterChange(filter.key, { ...value, from: e.target.value });
                } else {
                  onFilterChange(filter.key, e.target.value || undefined);
                }
              }}
              className="form-input text-sm"
              placeholder="From date"
            />
            {typeof value === 'object' && (
              <input
                type="date"
                value={value?.to || ''}
                onChange={(e) => onFilterChange(filter.key, { ...value, to: e.target.value })}
                className="form-input text-sm"
                placeholder="To date"
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (typeof value === 'object') {
                  onFilterChange(filter.key, undefined);
                } else {
                  onFilterChange(filter.key, { from: value || '', to: '' });
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {typeof value === 'object' ? 'Single date' : 'Date range'}
            </button>
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="number"
                value={typeof value === 'object' ? value?.min || '' : ''}
                onChange={(e) => {
                  const currentValue = typeof value === 'object' ? value : {};
                  onFilterChange(filter.key, { 
                    ...currentValue, 
                    min: e.target.value ? Number(e.target.value) : undefined 
                  });
                }}
                className="form-input text-sm"
                placeholder="Min"
              />
              <input
                type="number"
                value={typeof value === 'object' ? value?.max || '' : ''}
                onChange={(e) => {
                  const currentValue = typeof value === 'object' ? value : {};
                  onFilterChange(filter.key, { 
                    ...currentValue, 
                    max: e.target.value ? Number(e.target.value) : undefined 
                  });
                }}
                className="form-input text-sm"
                placeholder="Max"
              />
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value || undefined)}
            className="form-input text-sm"
            placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FilterIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-charcoal">Filters</h3>
              {hasActiveFilters && showFilterCount && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {activeFilterChips.length} active
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {showPresets && presets.length > 0 && (
                <button
                  onClick={() => setShowPresetsList(!showPresetsList)}
                  className="btn btn-outline btn-sm"
                  title="Filter Presets"
                >
                  <BookmarkIcon className="w-4 h-4" />
                </button>
              )}
              {onSavePreset && hasActiveFilters && (
                <button
                  onClick={() => setShowPresetDialog(true)}
                  className="btn btn-outline btn-sm"
                  title="Save Filter Preset"
                >
                  <SaveIcon className="w-4 h-4" />
                </button>
              )}
              {hasActiveFilters && (
                <button
                  onClick={onClearAllFilters}
                  className="btn btn-outline btn-sm"
                  title="Clear All Filters"
                >
                  <RotateCcwIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Presets */}
          {showPresets && showPresetsList && presets.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-4 p-3 bg-gray-50 rounded-lg"
            >
              <h4 className="text-sm font-medium text-gray-700 mb-2">Filter Presets</h4>
              <div className="grid gap-2">
                {presets.map(preset => (
                  <div key={preset.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <button
                        onClick={() => onLoadPreset?.(preset)}
                        className="text-left"
                      >
                        <p className="text-sm font-medium text-charcoal flex items-center space-x-1">
                          <span>{preset.name}</span>
                          {preset.isSystem && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-1 rounded">System</span>
                          )}
                        </p>
                        {preset.description && (
                          <p className="text-xs text-gray-500">{preset.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {Object.keys(preset.filters).length} filter{Object.keys(preset.filters).length !== 1 ? 's' : ''} • {new Date(preset.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    </div>
                    {onDeletePreset && !preset.isSystem && (
                      <button
                        onClick={() => onDeletePreset(preset.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete Preset"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map(filter => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                {renderFilterControl(filter)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          <AnimatePresence>
            {activeFilterChips.map(chip => (
              <motion.div
                key={chip.key}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
              >
                <span className="mr-1 font-medium">{chip.label}:</span>
                <span>{chip.displayValue}</span>
                {chip.removable && (
                  <button
                    onClick={() => onFilterChange(chip.key, undefined)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            onClick={onClearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </motion.div>
      )}

      {/* Save Preset Dialog */}
      {showPresetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-lg max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-charcoal mb-4">Save Filter Preset</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label">Preset Name</label>
                  <input
                    type="text"
                    value={presetForm.name}
                    onChange={(e) => setPresetForm(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    placeholder="Enter a name for this filter combination..."
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    value={presetForm.description}
                    onChange={(e) => setPresetForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input"
                    rows={3}
                    placeholder="Describe what this filter combination shows..."
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Filters:</h4>
                  <div className="space-y-1">
                    {activeFilterChips.map(chip => (
                      <div key={chip.key} className="text-sm text-gray-600">
                        <span className="font-medium">{chip.label}:</span> {chip.displayValue}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-2 pt-4">
                <button
                  onClick={() => setShowPresetDialog(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreset}
                  className="btn btn-primary"
                  disabled={!presetForm.name.trim()}
                >
                  Save Preset
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FilterCombination;