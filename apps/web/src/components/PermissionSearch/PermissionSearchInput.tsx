import React, { useRef, useEffect } from 'react';
import {
  Search as MagnifyingGlassIcon,
  X as XMarkIcon,
  AlertTriangle as ExclamationTriangleIcon
} from 'lucide-react';

interface PermissionSearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  showClearButton?: boolean;
  allowRegex?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const PermissionSearchInput: React.FC<PermissionSearchInputProps> = ({
  query,
  onQueryChange,
  placeholder = 'Search permissions...',
  isLoading = false,
  error = null,
  className = '',
  showClearButton = true,
  allowRegex = false,
  disabled = false,
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value);
  };

  const handleClear = () => {
    onQueryChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle escape key to clear
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  // Validate regex if allowed
  const isValidRegex = allowRegex ? (() => {
    try {
      if (query.includes('/')) {
        const parts = query.split('/');
        if (parts.length >= 3) {
          new RegExp(parts.slice(1, -1).join('/'), parts[parts.length - 1]);
        }
      }
      return true;
    } catch {
      return false;
    }
  })() : true;

  const hasError = error || (allowRegex && !isValidRegex);
  const errorMessage = error || (allowRegex && !isValidRegex ? 'Invalid regular expression' : null);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className={`h-4 w-4 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full pl-10 pr-12 py-3 text-sm
            border rounded-lg shadow-sm
            placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0
            transition-colors
            ${hasError
              ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
            ${isLoading ? 'pr-20' : ''}
          `}
        />

        {/* Right Side Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Loading Spinner */}
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
          )}

          {/* Error Icon */}
          {hasError && !isLoading && (
            <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
          )}

          {/* Clear Button */}
          {showClearButton && query && !isLoading && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Clear search"
            >
              <XMarkIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-1 text-xs text-red-600 flex items-center space-x-1">
          <ExclamationTriangleIcon className="h-3 w-3" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Tips */}
      {!query && !hasError && (
        <div className="mt-2 text-xs text-gray-500">
          <div className="flex flex-wrap gap-2">
            <span className="font-medium">Try:</span>
            <span className="bg-gray-100 px-2 py-0.5 rounded">user.create</span>
            <span className="bg-gray-100 px-2 py-0.5 rounded">approve vacation</span>
            <span className="bg-gray-100 px-2 py-0.5 rounded">documents</span>
            {allowRegex && (
              <span className="bg-gray-100 px-2 py-0.5 rounded">/user\..*\.department/</span>
            )}
          </div>
        </div>
      )}

      {/* Regex Help */}
      {allowRegex && query && (
        <div className="mt-1 text-xs text-blue-600">
          <span className="font-medium">Regex mode:</span> Use /pattern/flags for advanced matching
        </div>
      )}
    </div>
  );
};

export default PermissionSearchInput;
