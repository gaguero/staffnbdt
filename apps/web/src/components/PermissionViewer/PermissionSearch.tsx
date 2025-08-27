import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PermissionSearchProps } from '../../types/permissionViewer';

export const PermissionSearch: React.FC<PermissionSearchProps> = ({
  searchQuery,
  onSearchChange,
  suggestions = [],
  isLoading = false,
  className = '',
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    setShowSuggestions(value.length > 0 && suggestions.length > 0);
    setSelectedSuggestion(-1);
  };

  // Handle clear search
  const handleClear = () => {
    onSearchChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0 && selectedSuggestion < suggestions.length) {
          handleSuggestionClick(suggestions[selectedSuggestion]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestion >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedSuggestion] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedSuggestion]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(searchQuery.length > 0 && suggestions.length > 0)}
          placeholder="Search permissions... (e.g., user.create, document, department)"
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}

        {/* Clear Button */}
        {searchQuery && !isLoading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Clear search"
          >
            <XMarkIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                index === selectedSuggestion ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MagnifyingGlassIcon className="h-3 w-3 text-gray-400" />
                <span>{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Search Hints */}
      {searchQuery.length === 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <div className="flex flex-wrap gap-2">
            <span className="font-medium">Search examples:</span>
            <span className="bg-gray-100 px-2 py-1 rounded">user.create</span>
            <span className="bg-gray-100 px-2 py-1 rounded">document</span>
            <span className="bg-gray-100 px-2 py-1 rounded">department</span>
            <span className="bg-gray-100 px-2 py-1 rounded">approve</span>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {searchQuery.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {suggestions.length > 0 ? (
            <span>Found {suggestions.length} matching permissions</span>
          ) : (
            <span>No permissions match your search</span>
          )}
        </div>
      )}
    </div>
  );
};

export default PermissionSearch;