// Main Permission Search Component
export { default as PermissionSearch, PermissionSearch } from './PermissionSearch';

// Sub-components
export { default as PermissionSearchInput, PermissionSearchInput } from './PermissionSearchInput';
export { default as PermissionSearchResults, PermissionSearchResults } from './PermissionSearchResults';
export { default as PermissionSearchFilters, PermissionSearchFilters } from './PermissionSearchFilters';
export { default as SearchHistory, SearchHistory } from './SearchHistory';
export { default as SavedSearches, SavedSearches } from './SavedSearches';
export { default as PopularPermissions, PopularPermissions } from './PopularPermissions';
export { default as RecentPermissions, RecentPermissions } from './RecentPermissions';

// Types
export type {
  PermissionSearchProps,
  PermissionSearchIndex,
  SearchOptions,
  SearchResult,
  SearchFilters,
  SearchHistory as SearchHistoryType,
  SavedSearch,
  PermissionSearchState,
  SearchAlgorithm,
  FuzzySearchOptions,
  SearchCategory,
  PermissionSearchMode,
  SearchVariant,
  SearchContext,
} from '../../types/permissionSearch';

// Hooks
export { default as usePermissionSearch, usePermissionSearch } from '../../hooks/usePermissionSearch';
export { default as useSearchHistory, useSearchHistory } from '../../hooks/useSearchHistory';
export { default as useDebounce, useDebounce } from '../../hooks/useDebounce';

// Constants
export {
  SEARCH_SHORTCUTS,
  PERMISSION_CATEGORIES,
} from '../../types/permissionSearch';
