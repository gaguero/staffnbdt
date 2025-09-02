import React, { useState, useRef, useEffect } from 'react';
import { ObjectFieldDefinition } from '../../../types/concierge';

interface MultiSelectInputProps {
  field: ObjectFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customValue, setCustomValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = field.options || [];
  const selectedValues: string[] = Array.isArray(value) ? value : [];
  const allowCustom = !field.validation?.pattern; // Allow custom values if no specific pattern required

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedValues.includes(option)
  );

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      // Remove option
      const newValues = selectedValues.filter(v => v !== option);
      onChange(newValues);
    } else {
      // Add option
      const newValues = [...selectedValues, option];
      onChange(newValues);
    }
  };

  const addCustomValue = () => {
    if (customValue.trim() && !selectedValues.includes(customValue.trim())) {
      const newValues = [...selectedValues, customValue.trim()];
      onChange(newValues);
      setCustomValue('');
    }
  };

  const removeValue = (valueToRemove: string) => {
    const newValues = selectedValues.filter(v => v !== valueToRemove);
    onChange(newValues);
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (allowCustom && customValue.trim()) {
        addCustomValue();
      } else if (filteredOptions.length === 1) {
        toggleOption(filteredOptions[0]);
        setSearchTerm('');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Backspace' && searchTerm === '' && selectedValues.length > 0) {
      // Remove last selected value when backspacing in empty search
      removeValue(selectedValues[selectedValues.length - 1]);
    }
  };

  const getSelectionSummary = () => {
    const count = selectedValues.length;
    if (count === 0) return 'Select options...';
    if (count === 1) return selectedValues[0];
    if (count <= 3) return selectedValues.join(', ');
    return `${count} items selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="form-label flex items-center">
        ☑️ {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Selected Values Display */}
      {selectedValues.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-gray-50 rounded">
          {selectedValues.map((value) => (
            <span
              key={value}
              className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
            >
              {value}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeValue(value)}
                  className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                  title={`Remove ${value}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Main Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : ''}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isOpen ? 'Search options...' : getSelectionSummary()}
          className={`form-input pr-12 ${error ? 'border-red-500' : ''} ${
            selectedValues.length > 0 ? 'bg-blue-50' : ''
          }`}
          disabled={disabled}
          autoComplete="off"
        />

        {/* Input Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {selectedValues.length > 0 && !disabled && (
            <button
              type="button"
              onClick={clearAll}
              className="text-gray-400 hover:text-gray-600"
              title="Clear all"
            >
              ×
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={`text-gray-400 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            } ${disabled ? 'cursor-not-allowed' : 'hover:text-gray-600'}`}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Quick Actions */}
          <div className="p-2 border-b border-gray-100 flex justify-between">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-800"
              disabled={selectedValues.length === options.length}
            >
              Select All
            </button>
            <span className="text-xs text-gray-500">
              {selectedValues.length} of {options.length} selected
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800"
              disabled={selectedValues.length === 0}
            >
              Clear All
            </button>
          </div>

          {/* Options List */}
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>{option}</span>
                  {selectedValues.includes(option) && (
                    <span className="text-blue-600">✓</span>
                  )}
                </button>
              ))
            ) : searchTerm ? (
              <div className="p-4 text-center text-gray-500">
                No options found for "{searchTerm}"
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                All options are selected
              </div>
            )}
          </div>

          {/* Add Custom Option */}
          {allowCustom && (
            <div className="border-t border-gray-100 p-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomValue();
                    }
                  }}
                  placeholder="Add custom option..."
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                />
                <button
                  type="button"
                  onClick={addCustomValue}
                  disabled={!customValue.trim() || selectedValues.includes(customValue.trim())}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Search Results Summary */}
          {searchTerm && (
            <div className="border-t border-gray-100 p-2 text-xs text-gray-500 text-center">
              {filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''} match "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {/* Selection Summary */}
      <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
        <span>
          {selectedValues.length} of {options.length} options selected
          {allowCustom && selectedValues.some(v => !options.includes(v)) && (
            <span className="ml-1 text-green-600">
              (+{selectedValues.filter(v => !options.includes(v)).length} custom)
            </span>
          )}
        </span>
        
        {selectedValues.length > 0 && (
          <span className="font-medium">
            {Math.round((selectedValues.length / Math.max(options.length, selectedValues.length)) * 100)}%
          </span>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Click to select multiple options. Use backspace to remove the last selected item.
        {allowCustom && ' Type custom values and press Enter to add them.'}
      </p>
    </div>
  );
};

export default MultiSelectInput;