# Permission Search Component

A comprehensive, production-ready React component for searching and selecting permissions in the Hotel Operations Hub. This component provides intelligent search capabilities, advanced filtering, and a rich user experience for managing the system's 82+ granular permissions.

## Features

### 🔍 **Intelligent Search**
- **Fuzzy Search**: Handles typos and partial matches
- **Multi-field Scoring**: Searches across permission names, descriptions, categories, and keywords
- **Contextual Keywords**: Automatic synonym expansion (e.g., "staff" finds "user" permissions)
- **Regex Support**: Advanced pattern matching for power users
- **Real-time Results**: Debounced search with 300ms delay

### 🔧 **Advanced Filtering**
- **Resource Filtering**: Filter by permission resources (user, document, vacation, etc.)
- **Action Filtering**: Filter by actions (create, read, update, delete, approve, etc.)
- **Scope Filtering**: Filter by permission scopes (own, department, property, organization, platform)
- **Category Filtering**: Organize by business categories (HR, Training, Operations, etc.)
- **System/Custom Toggle**: Include or exclude system vs. custom permissions
- **Conditional Permissions**: Handle permissions with conditions

### 📊 **Smart Recommendations**
- **Popular Permissions**: Show most frequently used permissions
- **Recent Permissions**: Display recently accessed permissions
- **Context-Aware**: Boost relevant permissions based on usage context
- **Category Browsing**: Quick access to permission categories

### 💾 **Search Management**
- **Search History**: Automatic history with timestamps and result counts
- **Saved Searches**: Save and organize complex searches with descriptions
- **Export Results**: Export search results in JSON format
- **Copy Functionality**: Copy selected permission names to clipboard

### ♿ **Accessibility & UX**
- **Keyboard Navigation**: Full keyboard support with shortcuts
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Multiple Variants**: Full, compact, and minimal layouts
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Loading States**: Smooth loading animations and skeletons

### ⚡ **Performance**
- **Result Caching**: Intelligent caching with TTL
- **Debounced Search**: Prevents excessive API calls
- **Virtual Scrolling**: Handles large result sets efficiently
- **Memoized Components**: Optimized React rendering

## Quick Start

```tsx
import { PermissionSearch } from '../components/PermissionSearch';

function MyComponent() {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  return (
    <PermissionSearch
      mode="multi-select"
      selectedPermissions={selectedPermissions}
      onSelect={setSelectedPermissions}
      placeholder="Search permissions..."
    />
  );
}
```

## Component Variants

### Full Variant (Default)
Complete interface with all features including tabs, filters, history, and saved searches.

```tsx
<PermissionSearch
  variant="full"
  mode="multi-select"
  showFilters={true}
  showHistory={true}
  showSavedSearches={true}
  showCategories={true}
  showPopularPermissions={true}
  showRecent={true}
/>
```

### Compact Variant
Condensed layout with essential features, perfect for modal dialogs.

```tsx
<PermissionSearch
  variant="compact"
  mode="single-select"
  showFilters={true}
  maxHeight={300}
/>
```

### Minimal Variant
Just search input and results, ideal for inline usage.

```tsx
<PermissionSearch
  variant="minimal"
  mode="filter"
  placeholder="Quick permission search..."
/>
```

## Usage Contexts

### Role Creation
Optimized for selecting multiple permissions when creating custom roles.

```tsx
<PermissionSearch
  mode="multi-select"
  context="role-creation"
  onSelect={(permissions) => addToRole(permissions)}
  showCategories={true}
  showPopularPermissions={true}
/>
```

### User Management
Focused on user-related permissions for user management workflows.

```tsx
<PermissionSearch
  mode="multi-select"
  context="user-management"
  filters={{ resources: ['user'] }}
  showRecent={true}
/>
```

### Permission Audit
Advanced search and filtering for compliance and audit purposes.

```tsx
<PermissionSearch
  mode="filter"
  context="audit"
  allowRegex={true}
  allowExport={true}
  showSavedSearches={true}
/>
```

## Props API

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'single-select' \| 'multi-select' \| 'filter' \| 'standalone' \| 'inline' \| 'modal'` | `'single-select'` | Selection behavior |
| `variant` | `'full' \| 'compact' \| 'minimal'` | `'full'` | Component layout variant |
| `context` | `'role-creation' \| 'user-management' \| 'audit' \| 'generic'` | `'generic'` | Usage context for relevance boosting |

### Selection Props

| Prop | Type | Description |
|------|------|-------------|
| `selectedPermissions` | `string[]` | Currently selected permission names |
| `onSelect` | `(permissions: string[]) => void` | Callback for selection changes |
| `onPermissionSelect` | `(permission: PermissionSearchIndex) => void` | Individual permission selection |
| `onPermissionDeselect` | `(permission: PermissionSearchIndex) => void` | Individual permission deselection |

### Search Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `'Search permissions...'` | Search input placeholder |
| `searchOptions` | `Partial<SearchOptions>` | `{}` | Search algorithm configuration |
| `filters` | `Partial<SearchFilters>` | `{}` | Initial filter state |
| `onSearch` | `(query: string, results: SearchResult[]) => void` | Search callback |
| `onFilterChange` | `(filters: Partial<SearchFilters>) => void` | Filter change callback |

### Feature Toggles

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showFilters` | `boolean` | `true` | Show advanced filters |
| `showHistory` | `boolean` | `true` | Show search history |
| `showSavedSearches` | `boolean` | `true` | Show saved searches |
| `showCategories` | `boolean` | `true` | Show category browser |
| `showPopularPermissions` | `boolean` | `true` | Show popular permissions tab |
| `showRecent` | `boolean` | `true` | Show recent permissions tab |
| `showKeyboardShortcuts` | `boolean` | `false` | Enable keyboard shortcuts |

### Advanced Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `allowRegex` | `boolean` | `false` | Enable regex search patterns |
| `allowExport` | `boolean` | `true` | Allow exporting search results |
| `debounceMs` | `number` | `300` | Search debounce delay in milliseconds |
| `cacheResults` | `boolean` | `true` | Enable result caching |
| `maxHeight` | `number` | `400` | Maximum component height in pixels |

## Search Options

Configure the search algorithm behavior:

```tsx
const searchOptions: SearchOptions = {
  mode: 'fuzzy',           // 'simple' | 'advanced' | 'fuzzy'
  maxResults: 50,          // Maximum results to return
  includeDescriptions: true, // Search in descriptions
  caseSensitive: false,    // Case sensitive matching
  exactMatch: false,       // Require exact matches
  useWildcards: false,     // Enable * and ? wildcards
  searchScope: 'all',      // 'name' | 'description' | 'all'
  minScore: 0.1,          // Minimum relevance score (0-1)
  sortBy: 'relevance',    // 'relevance' | 'alphabetical' | 'category' | 'popularity'
  sortOrder: 'desc'       // 'asc' | 'desc'
};

<PermissionSearch searchOptions={searchOptions} />
```

## Search Filters

Control which permissions are shown:

```tsx
const filters: SearchFilters = {
  resources: ['user', 'document'],           // Specific resources
  actions: ['create', 'read', 'update'],    // Specific actions
  scopes: ['department', 'property'],       // Specific scopes
  categories: ['HR', 'Operations'],         // Specific categories
  includeSystemPermissions: true,           // Include system permissions
  includeConditionalPermissions: true,      // Include conditional permissions
  popularityThreshold: 50                   // Minimum popularity score
};

<PermissionSearch filters={filters} />
```

## Keyboard Shortcuts

When `showKeyboardShortcuts={true}`:

| Shortcut | Action |
|----------|--------|
| `/` | Focus search input |
| `Escape` | Clear search and close |
| `Ctrl+F` | Toggle advanced filters |
| `Ctrl+H` | Toggle search history |
| `Ctrl+A` | Select all results (multi-select mode) |
| `Ctrl+C` | Copy selected permission names |
| `↑/↓` | Navigate search suggestions |
| `Enter` | Select highlighted suggestion |

## Styling and Theming

The component uses Tailwind CSS classes and can be customized:

```tsx
<PermissionSearch
  className="shadow-xl border-2 border-blue-200"    // Outer container
  inputClassName="text-lg"                          // Search input
  dropdownClassName="border-gray-300"               // Results dropdown
/>
```

## Integration Examples

### With React Hook Form

```tsx
import { useForm, Controller } from 'react-hook-form';

function RoleForm() {
  const { control, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="permissions"
        control={control}
        render={({ field }) => (
          <PermissionSearch
            mode="multi-select"
            selectedPermissions={field.value || []}
            onSelect={field.onChange}
            context="role-creation"
          />
        )}
      />
    </form>
  );
}
```

### With State Management (Redux/Zustand)

```tsx
import { usePermissionStore } from '../store/permissionStore';

function PermissionManager() {
  const { selectedPermissions, setSelectedPermissions } = usePermissionStore();

  return (
    <PermissionSearch
      mode="multi-select"
      selectedPermissions={selectedPermissions}
      onSelect={setSelectedPermissions}
      onSearch={(query, results) => {
        // Track search analytics
        analytics.track('permission_search', { query, resultCount: results.length });
      }}
    />
  );
}
```

### Modal Integration

```tsx
import { Dialog } from '@headlessui/react';

function PermissionSelectionModal({ isOpen, onClose, onSelect }) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Panel className="max-w-4xl mx-auto">
        <Dialog.Title>Select Permissions</Dialog.Title>
        
        <PermissionSearch
          variant="compact"
          mode="multi-select"
          maxHeight={500}
          onSelect={(permissions) => {
            onSelect(permissions);
            onClose();
          }}
        />
      </Dialog.Panel>
    </Dialog>
  );
}
```

## Performance Considerations

### Large Permission Sets

For systems with hundreds of permissions:

```tsx
<PermissionSearch
  searchOptions={{
    maxResults: 25,        // Limit initial results
    minScore: 0.3         // Higher relevance threshold
  }}
  debounceMs={500}        // Longer debounce for slower networks
  cacheResults={true}     // Enable aggressive caching
/>
```

### Memory Usage

The component automatically manages memory through:
- Result pagination for large sets
- Cleanup of expired cache entries
- Debounced search to prevent excessive renders
- Memoized components to prevent unnecessary re-renders

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionSearch } from '../PermissionSearch';

test('searches permissions and displays results', async () => {
  render(<PermissionSearch mode="single-select" />);
  
  const searchInput = screen.getByPlaceholderText('Search permissions...');
  fireEvent.change(searchInput, { target: { value: 'user.create' } });
  
  await waitFor(() => {
    expect(screen.getByText('Create Department Users')).toBeInTheDocument();
  });
});
```

### Integration Tests

```tsx
test('complete permission selection workflow', async () => {
  const onSelect = jest.fn();
  
  render(
    <PermissionSearch 
      mode="multi-select" 
      onSelect={onSelect}
    />
  );
  
  // Search for permissions
  fireEvent.change(screen.getByRole('searchbox'), { 
    target: { value: 'user' }
  });
  
  // Select multiple permissions
  await waitFor(() => {
    fireEvent.click(screen.getByText('Create Department Users'));
    fireEvent.click(screen.getByText('View Department Users'));
  });
  
  expect(onSelect).toHaveBeenCalledWith([
    'user.create.department',
    'user.read.department'
  ]);
});
```

## Troubleshooting

### Common Issues

1. **No search results**: Check if permissions are loaded and filters are not too restrictive
2. **Slow search**: Increase `debounceMs` or reduce `maxResults`
3. **Memory leaks**: Ensure components are properly unmounted and cleanup is called
4. **Keyboard shortcuts not working**: Set `showKeyboardShortcuts={true}` and ensure proper focus management

### Debug Mode

Enable debug information in development:

```tsx
// This shows search scores and matched fields in development
<PermissionSearch
  searchOptions={{ 
    includeDebugInfo: process.env.NODE_ENV === 'development' 
  }}
/>
```

## Contributing

When contributing to the Permission Search component:

1. **Maintain backward compatibility** in props API
2. **Add comprehensive tests** for new features
3. **Update TypeScript types** for new functionality
4. **Document performance implications** of changes
5. **Test accessibility** with screen readers
6. **Verify mobile responsiveness** on different devices

## Related Components

- `PermissionViewer`: For viewing and exploring the permission tree
- `PermissionGate`: For conditional rendering based on permissions
- `RoleManager`: For managing custom roles with permission selection
- `UserPermissions`: For viewing and editing user-specific permissions

---

**Built for Hotel Operations Hub** - A comprehensive, multi-tenant, white-labeled hotel ERP platform.
