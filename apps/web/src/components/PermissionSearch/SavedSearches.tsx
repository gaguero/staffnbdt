import React, { useState } from 'react';
import {
  Bookmark,
  Plus,
  X,
  Trash,
  Search,
} from 'lucide-react';
import { SavedSearch, SearchFilters } from '../../types/permissionSearch';

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  currentQuery: string;
  currentFilters: SearchFilters;
  onLoadSearch: (search: SavedSearch) => void;
  onSaveSearch: (name: string, description?: string) => void;
  onDeleteSearch: (id: string) => void;
  className?: string;
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({
  savedSearches,
  currentQuery,
  currentFilters,
  onLoadSearch,
  onSaveSearch,
  onDeleteSearch,
  className = '',
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  const handleSave = () => {
    if (saveName.trim()) {
      onSaveSearch(saveName.trim(), saveDescription.trim() || undefined);
      setSaveName('');
      setSaveDescription('');
      setShowSaveDialog(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const hasActiveFilters = (
    currentFilters.resources.length > 0 ||
    currentFilters.actions.length > 0 ||
    currentFilters.scopes.length > 0 ||
    currentFilters.categories.length > 0 ||
    !currentFilters.includeSystemPermissions ||
    !currentFilters.includeConditionalPermissions
  );

  const canSaveCurrentSearch = currentQuery.trim() !== '' || hasActiveFilters;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <Bookmark className="h-4 w-4 mr-2" />
          Saved Searches
        </h3>
        
        {canSaveCurrentSearch && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
            title="Save current search"
          >
            <Plus className="h-3 w-3" />
            <span>Save Current</span>
          </button>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 mb-3">Save Current Search</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., User Management Permissions"
                className="w-full px-3 py-2 text-sm border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">
                Description (optional)
              </label>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Brief description of this search..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
            
            {/* Preview */}
            <div className="bg-white p-2 border border-green-200 rounded text-xs">
              <div className="font-medium text-green-900 mb-1">Preview:</div>
              <div className="text-gray-700">
                Query: <code className="bg-gray-100 px-1 rounded">{currentQuery || '(empty)'}</code>
              </div>
              {hasActiveFilters && (
                <div className="text-gray-700 mt-1">
                  Filters: 
                  {[
                    currentFilters.resources.length && `${currentFilters.resources.length} resources`,
                    currentFilters.actions.length && `${currentFilters.actions.length} actions`,
                    currentFilters.categories.length && `${currentFilters.categories.length} categories`,
                  ].filter(Boolean).join(', ') || 'Custom settings'}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
              
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveName('');
                  setSaveDescription('');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches List */}
      {savedSearches.length === 0 ? (
        <div className="text-center py-8">
          <Bookmark className="h-8 w-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-medium text-gray-900 mt-2">No saved searches</h3>
          <p className="text-sm text-gray-500 mt-1">
            Save frequently used searches for quick access
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {savedSearches
            .sort((a, b) => {
              // Sort by last used (most recent first), then by use count (most used first)
              if (a.lastUsed && b.lastUsed) {
                return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
              }
              if (a.lastUsed && !b.lastUsed) return -1;
              if (!a.lastUsed && b.lastUsed) return 1;
              return b.useCount - a.useCount;
            })
            .map((search) => {
              const hasFilters = (
                search.filters.resources?.length > 0 ||
                search.filters.actions?.length > 0 ||
                search.filters.scopes?.length > 0 ||
                search.filters.categories?.length > 0 ||
                !search.filters.includeSystemPermissions ||
                !search.filters.includeConditionalPermissions
              );

              return (
                <div
                  key={search.id}
                  className="group flex items-start justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <button
                    onClick={() => onLoadSearch(search)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Bookmark className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {search.name}
                      </h4>
                    </div>
                    
                    {search.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {search.description}
                      </p>
                    )}
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Search className="h-3 w-3 text-gray-400" />
                        <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded truncate max-w-48">
                          {search.query || '(no query)'}
                        </code>
                        {hasFilters && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Filtered
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                      <span>Created {formatTimestamp(search.createdAt)}</span>
                      {search.useCount > 0 && (
                        <>
                          <span>•</span>
                          <span>Used {search.useCount} time{search.useCount !== 1 ? 's' : ''}</span>
                        </>
                      )}
                      {search.lastUsed && (
                        <>
                          <span>•</span>
                          <span>Last used {formatTimestamp(search.lastUsed)}</span>
                        </>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => onDeleteSearch(search.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                    title="Delete saved search"
                  >
                    <Trash className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Saved searches persist across sessions
      </div>
    </div>
  );
};

export default SavedSearches;
