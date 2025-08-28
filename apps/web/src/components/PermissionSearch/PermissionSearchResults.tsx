import React, { useState, useMemo } from 'react';
import {
  Check,
  Shield,
  Users,
  Building,
  File,
  GraduationCap,
  Settings,
  AlertCircle,
  Search,
} from 'lucide-react';
import { SearchResult, PermissionSearchIndex } from '../../types/permissionSearch';

interface PermissionSearchResultsProps {
  results: SearchResult[];
  selectedPermissions: Set<string>;
  onPermissionSelect: (permission: PermissionSearchIndex) => void;
  mode: 'single-select' | 'multi-select' | 'filter' | 'standalone' | 'inline' | 'modal';
  isLoading?: boolean;
  maxHeight?: number;
  className?: string;
  query?: string;
  showEmptyState?: boolean;
  groupByCategory?: boolean;
}

const RESOURCE_ICONS: Record<string, React.ComponentType<any>> = {
  user: Users,
  document: File,
  training: GraduationCap,
  permission: Shield,
  role: Shield,
  organization: Building,
  property: Building,
  default: Settings,
};

const CATEGORY_COLORS: Record<string, string> = {
  HR: 'blue',
  Training: 'green',
  Documents: 'purple',
  Operations: 'orange',
  Admin: 'red',
  Inventory: 'yellow',
  Maintenance: 'gray',
  'Front Desk': 'indigo',
  Financial: 'emerald',
};

export const PermissionSearchResults: React.FC<PermissionSearchResultsProps> = ({
  results,
  selectedPermissions,
  onPermissionSelect,
  mode,
  isLoading = false,
  maxHeight = 400,
  className = '',
  query = '',
  showEmptyState = false,
  groupByCategory = false,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group results by category if requested
  const groupedResults = useMemo(() => {
    if (!groupByCategory) {
      return { ungrouped: results };
    }

    const groups: Record<string, SearchResult[]> = {};
    
    results.forEach(result => {
      const category = result.permission.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
    });

    return groups;
  }, [results, groupByCategory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getResourceIcon = (resource: string) => {
    const Icon = RESOURCE_ICONS[resource] || RESOURCE_ICONS.default;
    return Icon;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || 'gray';
  };

  const renderPermissionItem = (result: SearchResult, index: number) => {
    const { permission } = result;
    const isSelected = selectedPermissions.has(permission.name);
    const Icon = getResourceIcon(permission.resource);
    const categoryColor = getCategoryColor(permission.category);

    return (
      <button
        key={permission.id}
        onClick={() => onPermissionSelect(permission)}
        className={`
          w-full text-left p-3 border-b border-gray-100 last:border-b-0
          hover:bg-gray-50 transition-colors
          focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-inset
          ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
        `}
      >
        <div className="flex items-start space-x-3">
          {/* Selection Indicator */}
          {mode === 'multi-select' && (
            <div className={`
              flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center
              ${isSelected 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300'
              }
            `}>
              {isSelected && <Check className="h-3 w-3" />}
            </div>
          )}

          {/* Icon */}
          <div className={`
            flex-shrink-0 p-2 rounded-md bg-${categoryColor}-100 text-${categoryColor}-600
          `}>
            <Icon className="h-4 w-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Display Name */}
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {result.highlightedText ? (
                  <span dangerouslySetInnerHTML={{ __html: result.highlightedText }} />
                ) : (
                  permission.displayName || permission.name
                )}
              </h4>
              
              {/* Score Badge (for debugging/admin) */}
              {process.env.NODE_ENV === 'development' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {(result.score * 100).toFixed(0)}%
                </span>
              )}
            </div>

            {/* Permission Name */}
            <div className="mt-1">
              <code className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                {permission.name}
              </code>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {permission.description}
            </p>

            {/* Metadata */}
            <div className="flex items-center space-x-4 mt-2">
              <span className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                bg-${categoryColor}-100 text-${categoryColor}-800
              `}>
                {permission.category}
              </span>
              
              <span className="text-xs text-gray-400">
                {permission.scope}
              </span>
              
              {permission.isConditional && (
                <span className="inline-flex items-center text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Conditional
                </span>
              )}
            </div>

            {/* Matched Fields (for debugging) */}
            {process.env.NODE_ENV === 'development' && result.matchedFields.length > 0 && (
              <div className="mt-1">
                <span className="text-xs text-gray-400">
                  Matched: {result.matchedFields.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderGroupedResults = () => {
    return Object.entries(groupedResults).map(([category, categoryResults]) => {
      if (category === 'ungrouped') {
        return categoryResults.map(renderPermissionItem);
      }

      const isExpanded = expandedCategories.has(category);
      const categoryColor = getCategoryColor(category);

      return (
        <div key={category} className="border-b border-gray-200">
          {/* Category Header */}
          <button
            onClick={() => toggleCategory(category)}
            className={`
              w-full text-left p-3 bg-${categoryColor}-50 hover:bg-${categoryColor}-100
              transition-colors flex items-center justify-between
            `}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 rounded bg-${categoryColor}-200 text-${categoryColor}-700`}>
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{category}</h3>
                <p className="text-xs text-gray-600">
                  {categoryResults.length} permission{categoryResults.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Category Results */}
          {isExpanded && (
            <div className="bg-white">
              {categoryResults.map(renderPermissionItem)}
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`} style={{ maxHeight }}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto" />
          <p className="text-sm text-gray-600 mt-3">Searching permissions...</p>
        </div>
      </div>
    );
  }

  if (showEmptyState && results.length === 0 && !query) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`} style={{ maxHeight }}>
        <div className="p-8 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">Search for permissions</h3>
          <p className="text-sm text-gray-600 mt-2">
            Start typing to search through available permissions
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">user.create</span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">approve</span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">documents</span>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`} style={{ maxHeight }}>
        <div className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No permissions found</h3>
          <p className="text-sm text-gray-600 mt-2">
            No permissions match your search for <strong>"{query}"</strong>
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Try:</p>
            <ul className="mt-2 space-y-1">
              <li>• Using different keywords</li>
              <li>• Checking your spelling</li>
              <li>• Using broader terms</li>
              <li>• Removing filters</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Results Header */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {results.length} permission{results.length !== 1 ? 's' : ''}
            {query && <span className="font-normal"> for "{query}"</span>}
          </span>
          
          {results.length > 10 && (
            <button
              onClick={() => setExpandedCategories(new Set(Object.keys(groupedResults)))}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Expand All
            </button>
          )}
        </div>
      </div>

      {/* Results List */}
      <div 
        className="overflow-y-auto" 
        style={{ maxHeight: maxHeight - 60 }}
      >
        {renderGroupedResults()}
      </div>
    </div>
  );
};

export default PermissionSearchResults;
