export interface PermissionSearchIndex {
  id: string;
  name: string; // "user.create.department"
  resource: string; // "user"
  action: string; // "create"
  scope: string; // "department" 
  description: string;
  category: string;
  keywords: string[]; // Additional search terms
  popularity: number; // Usage frequency score
  searchableText: string; // Combined text for searching
  displayName?: string; // Human-readable name
  icon?: string; // Icon identifier
  isSystemPermission?: boolean;
  isConditional?: boolean;
}

export interface SearchOptions {
  mode: 'simple' | 'advanced' | 'fuzzy';
  maxResults: number;
  includeDescriptions: boolean;
  caseSensitive: boolean;
  exactMatch: boolean;
  useWildcards: boolean;
  searchScope: 'name' | 'description' | 'all' | 'resource' | 'action' | 'category';
  minScore?: number; // Minimum relevance score
  sortBy?: 'relevance' | 'alphabetical' | 'category' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  permission: PermissionSearchIndex;
  score: number;
  matchedFields: string[];
  highlightedText?: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: Partial<SearchFilters>;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  description?: string;
  filters: Partial<SearchFilters>;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface SearchFilters {
  resources: string[];
  actions: string[];
  scopes: string[];
  categories: string[];
  includeSystemPermissions: boolean;
  includeConditionalPermissions: boolean;
  popularityThreshold?: number;
}

export interface PermissionSearchProps {
  // Mode configuration
  mode?: 'single-select' | 'multi-select' | 'filter' | 'standalone' | 'inline' | 'modal';
  variant?: 'compact' | 'full' | 'minimal';
  
  // Search configuration
  placeholder?: string;
  searchOptions?: Partial<SearchOptions>;
  filters?: Partial<SearchFilters>;
  
  // Selection handling
  selectedPermissions?: string[];
  onSelect?: (permissions: string[]) => void;
  onPermissionSelect?: (permission: PermissionSearchIndex) => void;
  onPermissionDeselect?: (permission: PermissionSearchIndex) => void;
  
  // Search callbacks
  onSearch?: (query: string, results: SearchResult[]) => void;
  onFilterChange?: (filters: Partial<SearchFilters>) => void;
  
  // Data management
  permissions?: PermissionSearchIndex[];
  isLoading?: boolean;
  error?: string | null;
  
  // UI configuration
  showFilters?: boolean;
  showHistory?: boolean;
  showSavedSearches?: boolean;
  showCategories?: boolean;
  showPopularPermissions?: boolean;
  showRecent?: boolean;
  showKeyboardShortcuts?: boolean;
  maxHeight?: number;
  
  // Context
  context?: 'role-creation' | 'user-management' | 'audit' | 'administration' | 'generic';
  
  // Advanced features
  allowRegex?: boolean;
  allowExport?: boolean;
  debounceMs?: number;
  cacheResults?: boolean;
  
  // Styling
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
}

export interface PermissionSearchState {
  query: string;
  results: SearchResult[];
  selectedPermissions: Set<string>;
  filters: SearchFilters;
  isLoading: boolean;
  error: string | null;
  showDropdown: boolean;
  selectedIndex: number;
  searchHistory: SearchHistory[];
  savedSearches: SavedSearch[];
  popularPermissions: PermissionSearchIndex[];
  recentPermissions: PermissionSearchIndex[];
}

// Search algorithm interfaces
export interface SearchAlgorithm {
  search(query: string, permissions: PermissionSearchIndex[], options: SearchOptions): SearchResult[];
  calculateScore(permission: PermissionSearchIndex, query: string, matchedFields: string[]): number;
  highlightText(text: string, query: string): string;
}

export interface FuzzySearchOptions {
  threshold: number; // 0-1, lower = more fuzzy
  location: number;
  distance: number;
  maxPatternLength: number;
  minMatchCharLength: number;
}

// Predefined search categories for quick access
export interface SearchCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  permissions: string[];
  color?: string;
}

// Export utility types
export type PermissionSearchMode = PermissionSearchProps['mode'];
export type SearchVariant = PermissionSearchProps['variant'];
export type SearchContext = PermissionSearchProps['context'];

// Common search shortcuts
export const SEARCH_SHORTCUTS = {
  CLEAR: 'Escape',
  SELECT_ALL: 'Ctrl+A',
  COPY: 'Ctrl+C',
  SEARCH_FOCUS: '/',
  FILTER_TOGGLE: 'Ctrl+F',
  HISTORY_TOGGLE: 'Ctrl+H',
} as const;

// Permission categories for quick filtering
export const PERMISSION_CATEGORIES = {
  HR: {
    id: 'hr',
    name: 'Human Resources',
    description: 'User management, payroll, vacation, and HR operations',
    icon: 'UserGroupIcon',
    color: 'blue',
  },
  TRAINING: {
    id: 'training',
    name: 'Training & Development',
    description: 'Training programs, certification, and learning management',
    icon: 'AcademicCapIcon',
    color: 'green',
  },
  DOCUMENTS: {
    id: 'documents',
    name: 'Document Management',
    description: 'File uploads, document sharing, and library management',
    icon: 'DocumentTextIcon',
    color: 'purple',
  },
  OPERATIONS: {
    id: 'operations',
    name: 'Hotel Operations',
    description: 'Front desk, housekeeping, maintenance, and guest services',
    icon: 'BuildingOfficeIcon',
    color: 'orange',
  },
  ADMIN: {
    id: 'admin',
    name: 'Administration',
    description: 'System administration, permissions, and audit logs',
    icon: 'CogIcon',
    color: 'red',
  },
  INVENTORY: {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Stock management, supplies, and procurement',
    icon: 'CubeIcon',
    color: 'yellow',
  },
  MAINTENANCE: {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Work orders, asset management, and facility maintenance',
    icon: 'WrenchIcon',
    color: 'gray',
  },
  FRONTDESK: {
    id: 'frontdesk',
    name: 'Front Desk',
    description: 'Reservations, check-in/out, and guest management',
    icon: 'BuildingLibraryIcon',
    color: 'indigo',
  },
  FINANCIAL: {
    id: 'financial',
    name: 'Financial',
    description: 'Billing, payments, and financial reporting',
    icon: 'CurrencyDollarIcon',
    color: 'emerald',
  },
} as const;

export type PermissionCategory = typeof PERMISSION_CATEGORIES[keyof typeof PERMISSION_CATEGORIES];
