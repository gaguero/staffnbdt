import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckIcon, LoaderIcon, AlertCircleIcon } from 'lucide-react';
import { toastService } from '../utils/toast';
import { usePermissions } from '../hooks/usePermissions';
import type { PermissionSpec } from '../types/permission';

export interface QuickAssignOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface QuickAssignConfig {
  field: string;
  label: string;
  loadOptions: (inputValue: string) => Promise<QuickAssignOption[]>;
  currentValue?: any;
  placeholder: string;
  permissions: PermissionSpec[];
  formatCurrentValue?: (value: any) => string;
  searchable?: boolean;
  clearable?: boolean;
  maxOptions?: number;
}

interface QuickAssignProps {
  itemId: string;
  config: QuickAssignConfig;
  onAssign: (itemId: string, field: string, value: any) => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'inline';
}

const QuickAssign: React.FC<QuickAssignProps> = ({
  itemId,
  config,
  onAssign,
  disabled = false,
  size = 'md',
  variant = 'default',
}) => {
  const { hasAnyPermission } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<QuickAssignOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [assigning, setAssigning] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Check permissions
  const hasPermission = hasAnyPermission(config.permissions);

  // Load options when dropdown opens
  const loadOptions = useCallback(async (search: string = '') => {
    if (!hasPermission) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const loadedOptions = await config.loadOptions(search);
      const limitedOptions = config.maxOptions 
        ? loadedOptions.slice(0, config.maxOptions)
        : loadedOptions;
      setOptions(limitedOptions);
      setHighlightedIndex(-1);
    } catch (err: any) {
      console.error('Failed to load options:', err);
      setError(err.message || 'Failed to load options');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [config, hasPermission]);

  // Handle dropdown toggle
  const toggleDropdown = useCallback(async () => {
    if (!hasPermission || disabled || assigning) return;
    
    if (!isOpen) {
      setIsOpen(true);
      await loadOptions(searchValue);
      
      // Focus search input after a brief delay
      setTimeout(() => {
        if (config.searchable && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      setIsOpen(false);
      setSearchValue('');
      setHighlightedIndex(-1);
    }
  }, [hasPermission, disabled, assigning, isOpen, loadOptions, searchValue, config.searchable]);

  // Handle search input change
  const handleSearchChange = useCallback(async (value: string) => {
    setSearchValue(value);
    if (config.searchable) {
      await loadOptions(value);
    }
  }, [config.searchable, loadOptions]);

  // Handle option selection
  const handleOptionSelect = useCallback(async (option: QuickAssignOption) => {
    if (option.disabled || assigning) return;
    
    setAssigning(true);
    const loadingToast = toastService.loading(`Assigning ${config.label.toLowerCase()}...`);
    
    try {
      await onAssign(itemId, config.field, option.value);
      setIsOpen(false);
      setSearchValue('');
      
      toastService.dismiss(loadingToast);
      toastService.success(`${config.label} assigned successfully`);
    } catch (err: any) {
      console.error('Assignment failed:', err);
      toastService.dismiss(loadingToast);
      toastService.error(err.message || `Failed to assign ${config.label.toLowerCase()}`);
    } finally {
      setAssigning(false);
    }
  }, [itemId, config, onAssign, assigning]);

  // Handle clear selection
  const handleClear = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!config.clearable || assigning) return;
    
    setAssigning(true);
    const loadingToast = toastService.loading(`Clearing ${config.label.toLowerCase()}...`);
    
    try {
      await onAssign(itemId, config.field, null);
      
      toastService.dismiss(loadingToast);
      toastService.success(`${config.label} cleared successfully`);
    } catch (err: any) {
      console.error('Clear failed:', err);
      toastService.dismiss(loadingToast);
      toastService.error(err.message || `Failed to clear ${config.label.toLowerCase()}`);
    } finally {
      setAssigning(false);
    }
  }, [itemId, config, onAssign, assigning]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleOptionSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchValue('');
        break;
    }
  }, [isOpen, options, highlightedIndex, handleOptionSelect]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchValue('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [isOpen]);

  // Get current value display
  const getCurrentValueDisplay = () => {
    if (config.currentValue) {
      return config.formatCurrentValue 
        ? config.formatCurrentValue(config.currentValue)
        : String(config.currentValue);
    }
    return config.placeholder;
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  // Variant classes
  const variantClasses = {
    default: 'border border-gray-300 rounded-lg bg-white shadow-sm',
    minimal: 'border-b border-gray-300 bg-transparent',
    inline: 'border border-transparent bg-gray-50 rounded',
  };

  if (!hasPermission) {
    return (
      <span className={`${sizeClasses[size]} text-gray-500`}>
        {getCurrentValueDisplay()}
      </span>
    );
  }

  const isDisabled = disabled || assigning;

  return (
    <div 
      ref={dropdownRef}
      className="relative"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={isDisabled}
        className={`
          w-full flex items-center justify-between
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${isDisabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : ''}
          transition-colors duration-200
        `}
      >
        <div className="flex items-center min-w-0 flex-1">
          {assigning ? (
            <LoaderIcon className="w-4 h-4 animate-spin mr-2 flex-shrink-0" />
          ) : null}
          <span className={`truncate ${config.currentValue ? 'text-gray-900' : 'text-gray-500'}`}>
            {getCurrentValueDisplay()}
          </span>
        </div>
        
        <div className="flex items-center ml-2 space-x-1">
          {config.clearable && config.currentValue && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isDisabled}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden"
          >
            {/* Search Input */}
            {config.searchable && (
              <div className="p-2 border-b border-gray-200">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={`Search ${config.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Options List */}
            <div ref={optionsRef} className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <LoaderIcon className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading options...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <AlertCircleIcon className="w-5 h-5 mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              ) : options.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">No options available</p>
                </div>
              ) : (
                options.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    disabled={option.disabled}
                    className={`
                      w-full px-3 py-2 text-left flex items-center justify-between
                      transition-colors duration-150
                      ${index === highlightedIndex 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'hover:bg-gray-50'
                      }
                      ${option.disabled 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'cursor-pointer'
                      }
                      ${option.value === config.currentValue?.toString() 
                        ? 'bg-green-50 text-green-700' 
                        : 'text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      {option.icon && (
                        <span className="mr-2 flex-shrink-0">{option.icon}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {option.value === config.currentValue?.toString() && (
                      <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickAssign;