# User Role Matrix Component

A comprehensive, production-ready React component for managing user role assignments in a grid interface. Features include bulk operations, real-time updates, search/filtering, and performance optimizations for large datasets.

## Features

- **Interactive Grid Interface**: Click checkboxes to assign/unassign roles
- **Bulk Operations**: Select multiple users and roles for batch operations
- **Real-time Updates**: Optimistic UI updates with rollback on failure
- **Search & Filtering**: Filter users by department, role, status, etc.
- **Performance Optimized**: Pagination for large datasets (100+ users)
- **Permission-based Access**: Integration with the permission system
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Audit Trail**: Tracks all role assignment changes

## Quick Start

```tsx
import { UserRoleMatrix } from '@/components/UserRoleMatrix';

function UserManagementPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Role Management</h1>
      
      {/* Basic usage - component handles all data fetching */}
      <UserRoleMatrix />
    </div>
  );
}
```

## Advanced Usage

```tsx
import { UserRoleMatrix } from '@/components/UserRoleMatrix';
import { toast } from 'react-hot-toast';

function AdvancedUserManagement() {
  // Custom handlers for role operations
  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await myApi.assignRole({ userId, roleId });
      toast.success('Role assigned successfully');
    } catch (error) {
      toast.error('Failed to assign role');
      throw error; // Re-throw to let component handle optimistic rollback
    }
  };

  const handleBulkAssign = async (userIds: string[], roleIds: string[]) => {
    try {
      await myApi.bulkAssignRoles({ userIds, roleIds });
      toast.success(`Assigned ${roleIds.length} roles to ${userIds.length} users`);
    } catch (error) {
      toast.error('Bulk assignment failed');
      throw error;
    }
  };

  return (
    <UserRoleMatrix
      // Custom event handlers
      onAssignRole={handleAssignRole}
      onUnassignRole={handleUnassignRole}
      onBulkAssign={handleBulkAssign}
      onBulkUnassign={handleBulkUnassign}
      
      // Permission overrides
      permissions={{
        canAssignRoles: true,
        canUnassignRoles: true,
        canViewAuditLog: true,
        canBulkAssign: true,
      }}
      
      // Performance and UX configuration
      configuration={{
        search: {
          searchFields: ['firstName', 'lastName', 'email'],
          fuzzySearch: true,
          debounceMs: 300,
        },
        filters: {
          showSystemRoles: true,
          showCustomRoles: true,
          sortBy: 'name',
          sortOrder: 'asc',
        },
        performance: {
          batchSize: 50,
          maxVisibleUsers: 100,
          cacheTimeout: 5 * 60 * 1000, // 5 minutes
        },
      }}
      
      className="bg-white shadow rounded-lg p-6"
    />
  );
}
```

## Component Architecture

### Main Components

- **UserRoleMatrix**: Main container component
- **UserRoleMatrixHeader**: Column headers with role selection
- **UserRoleMatrixRow**: Individual user row with role checkboxes
- **BulkActionBar**: Fixed bottom bar for bulk operations

### Hooks

- **useUserRoleMatrix**: Main state management hook
- **usePermissions**: Permission checking integration

### Types

All TypeScript types are available in `types/userRoleMatrix.ts`:

```tsx
import type {
  UserRoleMatrixProps,
  MatrixUser,
  MatrixRole,
  UserRoleAssignment,
  MatrixFilters,
  BulkSelection,
} from '@/types/userRoleMatrix';
```

## Data Flow

1. **Data Fetching**: Component fetches users, roles, and assignments via TanStack Query
2. **State Management**: `useUserRoleMatrix` hook manages all matrix state
3. **User Interaction**: Click events trigger optimistic updates
4. **API Calls**: Background API calls with rollback on failure
5. **Cache Invalidation**: Successful operations refresh cached data

## Permission Integration

The component integrates with the hotel operations permission system:

```tsx
// Required permissions for full functionality
const requiredPermissions = {
  'user-roles:create': 'Assign roles to users',
  'user-roles:delete': 'Remove role assignments', 
  'user-roles:bulk': 'Perform bulk operations',
  'audit:read': 'View assignment history',
};
```

Permissions are checked automatically. Users without permissions see read-only interface.

## Performance Considerations

### Large Datasets

- **Pagination**: Automatically enabled for 100+ users
- **Debounced Search**: 300ms delay on search input
- **Optimized Rendering**: Only renders visible users
- **Query Caching**: TanStack Query caches API responses

### Memory Usage

- **Assignment Map**: O(1) lookups using Map data structure
- **Bulk Operations**: Batched API calls reduce network overhead
- **Component Memoization**: Prevents unnecessary re-renders

## Customization

### Styling

The component uses Tailwind CSS classes and can be customized:

```tsx
<UserRoleMatrix 
  className="custom-matrix-styles"
  // Component accepts all standard div props
/>
```

### Custom Role Display

Role badges automatically detect system vs custom roles:

- **System Roles**: Use predefined icons and colors
- **Custom Roles**: Use custom styling with organization branding

### Search Configuration

```tsx
const searchConfig = {
  searchFields: ['firstName', 'lastName', 'email', 'department.name'],
  fuzzySearch: true, // Enable fuzzy matching
  highlightMatches: true, // Highlight search terms
  debounceMs: 300, // Delay before search
};
```

## API Integration

The component works with the following API endpoints:

```typescript
// Required service methods
roleService.getRoles() // Get all roles
roleService.getUserRoles() // Get user-role assignments
roleService.assignRole(assignment) // Assign single role
roleService.bulkAssignRoles(assignments) // Bulk assign
roleService.removeUserRole(userRoleId) // Remove assignment
roleService.bulkRemoveRoles(userRoleIds) // Bulk remove

userService.getUsers(filter) // Get filtered users
```

## Error Handling

### Optimistic Updates

```tsx
// Component shows immediate feedback
user.assignRole(roleId) // ✅ Shows immediately
  .then(() => {
    // Success - update confirmed
  })
  .catch(() => {
    // Error - rollback optimistic update
    // Show error toast
  });
```

### Network Errors

- **Automatic Retry**: Failed requests are retried with exponential backoff
- **Error Boundaries**: Graceful degradation on component errors
- **Fallback UI**: Shows error state with retry button

## Accessibility

### WCAG Compliance

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order
- **High Contrast**: Works with system accessibility settings

### Screen Reader Support

```html
<!-- Example of generated accessible markup -->
<table role="grid" aria-label="User role assignment matrix">
  <thead>
    <tr role="row">
      <th scope="col">Users</th>
      <th scope="col">Platform Admin - Manages entire platform</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="gridcell">John Smith</td>
      <td role="gridcell">
        <input 
          type="checkbox" 
          aria-label="Assign Platform Admin role to John Smith"
        />
      </td>
    </tr>
  </tbody>
</table>
```

## Testing

### Unit Tests

```tsx
// Example test structure
describe('UserRoleMatrix', () => {
  it('renders user list correctly', () => {
    render(<UserRoleMatrix />);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('handles role assignment', async () => {
    const onAssignRole = jest.fn();
    render(<UserRoleMatrix onAssignRole={onAssignRole} />);
    
    const checkbox = screen.getByLabelText(/assign.*role/i);
    fireEvent.click(checkbox);
    
    expect(onAssignRole).toHaveBeenCalled();
  });
});
```

### Integration Tests

```tsx
// Test with real API data
it('performs bulk operations', async () => {
  const mockUsers = [/* ... */];
  const mockRoles = [/* ... */];
  
  render(
    <QueryClient client={queryClient}>
      <UserRoleMatrix />
    </QueryClient>
  );
  
  // Select users and roles
  // Click bulk assign
  // Verify API calls
});
```

## Troubleshooting

### Common Issues

1. **Slow Performance**
   - Enable pagination for large datasets
   - Increase debounce delay for search
   - Check network requests in dev tools

2. **Permission Errors**
   - Verify user has required permissions
   - Check permission service integration
   - Review console for permission errors

3. **State Not Updating**
   - Check TanStack Query cache invalidation
   - Verify API endpoints return correct data
   - Review optimistic update logic

### Debug Mode

```tsx
// Enable query devtools for debugging
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <UserRoleMatrix />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

## Migration Guide

### From Legacy Role Management

```tsx
// Before: Manual state management
const [users, setUsers] = useState([]);
const [roles, setRoles] = useState([]);
const [assignments, setAssignments] = useState([]);

// After: UseUserRoleMatrix hook
const { state, actions } = useUserRoleMatrix();
```

### API Changes

If your existing API differs from the expected format:

```tsx
// Adapt your data format
const adaptedUsers = users.map(user => ({
  id: user.userId,
  firstName: user.first_name, // Convert snake_case to camelCase
  lastName: user.last_name,
  email: user.email_address,
  // ... other fields
}));

<UserRoleMatrix users={adaptedUsers} />
```

## Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck
```

### Adding Features

1. **New Filter Types**: Add to `MatrixFilters` interface
2. **Custom Actions**: Extend `BulkActionBar` component
3. **New Permissions**: Update permission checking logic
4. **Performance Improvements**: Modify `useUserRoleMatrix` hook

### Code Style

The component follows the project's coding standards:

- **TypeScript**: Strict type checking enabled
- **ESLint**: Enforced code style rules
- **Prettier**: Automatic code formatting
- **Tailwind**: Utility-first CSS classes

## License

This component is part of the Hotel Operations Hub platform and follows the same licensing terms.
