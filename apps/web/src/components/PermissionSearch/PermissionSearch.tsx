import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search as MagnifyingGlassIcon,
  Filter as FunnelIcon,
  Bookmark as BookmarkIcon,
  Clock as ClockIcon,
  Flame as FireIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Download as DocumentArrowDownIcon,
  FileText as ClipboardDocumentIcon,
  Settings as AdjustmentsHorizontalIcon
} from 'lucide-react';

import {
  PermissionSearchProps,
  PermissionSearchIndex,
  PERMISSION_CATEGORIES,
} from '../../types/permissionSearch';
import { usePermissionSearch } from '../../hooks/usePermissionSearch';
import { PermissionSearchInput } from './PermissionSearchInput';
import { PermissionSearchResults } from './PermissionSearchResults';
import { PermissionSearchFilters } from './PermissionSearchFilters';
import { SearchHistory } from './SearchHistory';
import { SavedSearches } from './SavedSearches';
import { PopularPermissions } from './PopularPermissions';
import { RecentPermissions } from './RecentPermissions';

export const PermissionSearch: React.FC<PermissionSearchProps> = ({
  mode = 'single-select',
  variant = 'full',
  placeholder = 'Search permissions...',
  searchOptions = {},
  filters = {},
  onSelect,
  onPermissionSelect,
  onPermissionDeselect,
  onSearch,
  onFilterChange,
  isLoading = false,
  error = null,
  showFilters = true,
  showHistory = true,
  showSavedSearches = true,
  showCategories = true,
  showPopularPermissions = true,
  showRecent = true,
  showKeyboardShortcuts = false,
  maxHeight = 400,
  context = 'generic',
  allowRegex = false,
  allowExport = true,
  debounceMs = 300,
  cacheResults = true,
  className = '',
  inputClassName = '',
  dropdownClassName = '',
}) => {
  // State for UI controls
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showSavedSearchPanel, setShowSavedSearchPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'popular' | 'recent' | 'categories'>('search');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom hook for permission search logic
  const {
    state,
    search,
    clearSearch,
    selectPermission,
    deselectPermission,
    selectAll,
    clearSelection,
    updateFilters,
    resetFilters,
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
    isLoading: hookIsLoading,
  } = usePermissionSearch({
    initialQuery: '',
    initialFilters: filters,
    searchOptions,
    enableHistory: showHistory,
    enableCache: cacheResults,
    debounceMs,
    context,
  });

  // Combine loading states
  const combinedIsLoading = isLoading || hookIsLoading;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body && !containerRef.current?.contains(event.target as Node)) {
        return;
      }

      switch (true) {
        case event.key === '/' && !event.shiftKey && !event.ctrlKey && !event.altKey:
          event.preventDefault();
          inputRef.current?.focus();
          break;
        
        case event.key === 'Escape':
          clearSearch();
          inputRef.current?.blur();
          break;
        
        case event.key === 'f' && event.ctrlKey:
          event.preventDefault();
          setShowAdvancedFilters(prev => !prev);
          break;
        
        case event.key === 'h' && event.ctrlKey:
          event.preventDefault();
          setShowHistoryPanel(prev => !prev);
          break;
        
        case event.key === 'a' && event.ctrlKey && mode === 'multi-select':
          event.preventDefault();
          selectAll();
          break;
        
        case event.key === 'c' && event.ctrlKey && state.selectedPermissions.size > 0:
          event.preventDefault();
          copyPermissionNames();
          break;
      }
    };

    if (showKeyboardShortcuts) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {}; // Empty cleanup for when showKeyboardShortcuts is false
  }, [showKeyboardShortcuts, mode, clearSearch, selectAll, copyPermissionNames, state.selectedPermissions.size]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Close all panels when clicking outside
        setShowHistoryPanel(false);
        setShowSavedSearchPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selection changes
  const handlePermissionSelect = useCallback((permission: PermissionSearchIndex) => {
    if (mode === 'single-select') {
      onSelect?.([permission.name]);
      onPermissionSelect?.(permission);
    } else if (mode === 'multi-select') {
      if (state.selectedPermissions.has(permission.name)) {
        deselectPermission(permission);
        onPermissionDeselect?.(permission);
      } else {
        selectPermission(permission);
        onPermissionSelect?.(permission);
      }
      
      // Update parent component
      const newSelection = state.selectedPermissions.has(permission.name)
        ? Array.from(state.selectedPermissions).filter(name => name !== permission.name)
        : [...Array.from(state.selectedPermissions), permission.name];
      
      onSelect?.(newSelection);
    } else {
      onPermissionSelect?.(permission);
    }
  }, [mode, state.selectedPermissions, selectPermission, deselectPermission, onSelect, onPermissionSelect, onPermissionDeselect]);

  // Handle search with callback
  const handleSearch = useCallback((query: string) => {
    search(query);
    onSearch?.(query, state.results);
    
    if (query.trim()) {
      addToHistory(query, state.results.length);
    }
  }, [search, onSearch, state.results, addToHistory]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: any) => {
    updateFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [updateFilters, onFilterChange]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setCategoryFilter([categoryId]);
    setActiveTab('search');
  }, [setCategoryFilter]);

  // Handle export
  const handleExport = useCallback(() => {
    if (!allowExport) return;
    
    const exportData = exportResults();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permission-search-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [allowExport, exportResults]);

  // Render different variants
  if (variant === 'minimal') {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <PermissionSearchInput
          query={state.query}
          onQueryChange={handleSearch}
          placeholder={placeholder}
          isLoading={combinedIsLoading}
          error={error || state.error}
          className={inputClassName}
          showClearButton
        />
        
        {state.showDropdown && (
          <PermissionSearchResults
            results={state.results}
            selectedPermissions={state.selectedPermissions}
            onPermissionSelect={handlePermissionSelect}
            mode={mode}
            isLoading={combinedIsLoading}
            maxHeight={maxHeight}
            className={dropdownClassName}
          />
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <PermissionSearchInput
              query={state.query}
              onQueryChange={handleSearch}
              placeholder={placeholder}
              isLoading={combinedIsLoading}
              error={error || state.error}
              className={inputClassName}
              showClearButton
            />
          </div>
          
          {showFilters && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Toggle filters"
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {showAdvancedFilters && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <PermissionSearchFilters
              filters={state.filters}
              onFiltersChange={handleFilterChange}
              onReset={resetFilters}
            />
          </div>
        )}
        
        {state.showDropdown && (
          <PermissionSearchResults
            results={state.results}
            selectedPermissions={state.selectedPermissions}
            onPermissionSelect={handlePermissionSelect}
            mode={mode}
            isLoading={combinedIsLoading}
            maxHeight={maxHeight}
            className={dropdownClassName}
          />
        )}
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Permission Search</h3>
          
          <div className="flex items-center space-x-2">
            {mode === 'multi-select' && state.selectedPermissions.size > 0 && (
              <span className="text-sm text-gray-600">
                {state.selectedPermissions.size} selected
              </span>
            )}
            
            {allowExport && state.results.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                title="Export results"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export</span>
              </button>
            )}
            
            {mode === 'multi-select' && state.selectedPermissions.size > 0 && (
              <button
                onClick={copyPermissionNames}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                title="Copy selected permission names"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                <span>Copy</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Search Input */}
        <PermissionSearchInput
          query={state.query}
          onQueryChange={handleSearch}
          placeholder={placeholder}
          isLoading={combinedIsLoading}
          error={error || state.error}
          className={inputClassName}
          showClearButton
          allowRegex={allowRegex}
        />
        
        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            {/* Tab Navigation */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === 'search'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Search</span>
              </button>
              
              {showPopularPermissions && (
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === 'popular'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FireIcon className="h-4 w-4" />
                  <span>Popular</span>
                </button>
              )}
              
              {showRecent && (
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === 'recent'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ClockIcon className="h-4 w-4" />
                  <span>Recent</span>
                </button>
              )}
              
              {showCategories && (
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === 'categories'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  <span>Categories</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Advanced Filters Toggle */}
            {showFilters && (
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  showAdvancedFilters
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title="Toggle advanced filters"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filters</span>
                {showAdvancedFilters ? (
                  <ChevronUpIcon className="h-3 w-3" />
                ) : (
                  <ChevronDownIcon className="h-3 w-3" />
                )}
              </button>
            )}
            
            {/* History Toggle */}
            {showHistory && (
              <button
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  showHistoryPanel
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title="Toggle search history"
              >
                <ClockIcon className="h-4 w-4" />
                <span>History</span>
              </button>
            )}
            
            {/* Saved Searches Toggle */}
            {showSavedSearches && (
              <button
                onClick={() => setShowSavedSearchPanel(!showSavedSearchPanel)}
                className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  showSavedSearchPanel
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title="Toggle saved searches"
              >
                <BookmarkIcon className="h-4 w-4" />
                <span>Saved</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <PermissionSearchFilters
            filters={state.filters}
            onFiltersChange={handleFilterChange}
            onReset={resetFilters}
          />
        </div>
      )}
      
      {/* History Panel */}
      {showHistoryPanel && (
        <div className="p-4 border-b border-gray-100 bg-blue-50">
          <SearchHistory
            history={state.searchHistory}
            onSelectHistory={(item) => {
              handleSearch(item.query);
              if (item.filters) {
                handleFilterChange(item.filters);
              }
              setShowHistoryPanel(false);
            }}
            onClearHistory={clearHistory}
          />
        </div>
      )}
      
      {/* Saved Searches Panel */}
      {showSavedSearchPanel && (
        <div className="p-4 border-b border-gray-100 bg-green-50">
          <SavedSearches
            savedSearches={state.savedSearches}
            currentQuery={state.query}
            currentFilters={state.filters}
            onLoadSearch={(search) => {
              loadSavedSearch(search);
              setShowSavedSearchPanel(false);
            }}
            onSaveSearch={saveSearch}
            onDeleteSearch={deleteSavedSearch}
          />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden" style={{ maxHeight }}>
        {activeTab === 'search' && (
          <PermissionSearchResults
            results={state.results}
            selectedPermissions={state.selectedPermissions}
            onPermissionSelect={handlePermissionSelect}
            mode={mode}
            isLoading={combinedIsLoading}
            maxHeight={maxHeight - 100} // Account for header
            className={dropdownClassName}
            query={state.query}
            showEmptyState={!state.query && state.results.length === 0}
          />
        )}
        
        {activeTab === 'popular' && showPopularPermissions && (
          <PopularPermissions
            permissions={getPopularPermissions()}
            selectedPermissions={state.selectedPermissions}
            onPermissionSelect={handlePermissionSelect}
            mode={mode}
            maxHeight={maxHeight - 100}
          />
        )}
        
        {activeTab === 'recent' && showRecent && (
          <RecentPermissions
            permissions={getRecentPermissions()}
            selectedPermissions={state.selectedPermissions}
            onPermissionSelect={handlePermissionSelect}
            mode={mode}
            maxHeight={maxHeight - 100}
          />
        )}
        
        {activeTab === 'categories' && showCategories && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(PERMISSION_CATEGORIES).map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`p-4 text-left border rounded-lg hover:border-gray-300 transition-colors ${
                    selectedCategory === category.id
                      ? `border-${category.color}-200 bg-${category.color}-50`
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-${category.color}-100 text-${category.color}-600 rounded-md`}>
                      {/* Category icon would go here */}
                      <div className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with selection info and actions */}
      {mode === 'multi-select' && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {state.selectedPermissions.size} of {state.results.length || 0} selected
              </span>
              
              {state.results.length > 0 && (
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select All
                </button>
              )}
              
              {state.selectedPermissions.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear Selection
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {state.selectedPermissions.size > 0 && (
                <button
                  onClick={copyPermissionNames}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  <span>Copy Names</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Help */}
      {showKeyboardShortcuts && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><kbd>/</kbd> Focus search</div>
            <div><kbd>Esc</kbd> Clear/Close</div>
            <div><kbd>Ctrl+F</kbd> Toggle filters</div>
            <div><kbd>Ctrl+H</kbd> Toggle history</div>
            {mode === 'multi-select' && (
              <>
                <div><kbd>Ctrl+A</kbd> Select all</div>
                <div><kbd>Ctrl+C</kbd> Copy selected</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionSearch;
