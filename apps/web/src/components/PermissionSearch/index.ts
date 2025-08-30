// Main Permission Search Component
export { default as PermissionSearch } from './PermissionSearch';

// Sub-components
export { default as PermissionSearchInput } from './PermissionSearchInput';
export { default as PermissionSearchResults } from './PermissionSearchResults';
export { default as PermissionSearchFilters } from './PermissionSearchFilters';
export { default as SearchHistory } from './SearchHistory';
export { default as SavedSearches } from './SavedSearches';
export { default as PopularPermissions } from './PopularPermissions';
export { default as RecentPermissions } from './RecentPermissions';

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
export { default as usePermissionSearch } from '../../hooks/usePermissionSearch';
export { default as useSearchHistory } from '../../hooks/useSearchHistory';
export { useDebounce } from '../../hooks/useDebounce';

// Constants
export {
  SEARCH_SHORTCUTS,
  PERMISSION_CATEGORIES,
} from '../../types/permissionSearch';
