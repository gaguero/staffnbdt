import React from 'react';
import {
  ClockIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { SearchHistory as SearchHistoryType } from '../../types/permissionSearch';

interface SearchHistoryProps {
  history: SearchHistoryType[];
  onSelectHistory: (item: SearchHistoryType) => void;
  onClearHistory: () => void;
  className?: string;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
  className = '',
}) => {
  if (history.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ClockIcon className="h-8 w-8 text-gray-400 mx-auto" />
        <h3 className="text-sm font-medium text-gray-900 mt-2">No search history</h3>
        <p className="text-sm text-gray-500 mt-1">
          Your recent searches will appear here
        </p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <ClockIcon className="h-4 w-4 mr-2" />
          Search History
        </h3>
        
        <button
          onClick={onClearHistory}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Clear all history"
        >
          <TrashIcon className="h-3 w-3" />
          <span>Clear</span>
        </button>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectHistory(item)}
            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <MagnifyingGlassIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900 truncate font-medium">
                    {item.query}
                  </span>
                </div>
                
                <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                  <span>{formatTimestamp(new Date(item.timestamp))}</span>
                  <span>•</span>
                  <span>
                    {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
                  </span>
                  {item.filters && Object.keys(item.filters).some(key => {
                    const value = item.filters![key as keyof typeof item.filters];
                    return Array.isArray(value) ? value.length > 0 : value !== true;
                  }) && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600">Filtered</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <XMarkIcon className="h-3 w-3 text-gray-400" />
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Click any search to repeat it
      </div>
    </div>
  );
};

export default SearchHistory;
