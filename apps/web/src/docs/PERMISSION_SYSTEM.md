# Frontend Permission System Documentation

This document provides comprehensive guidance on using the permission-based access control system in the React frontend application.

## Overview

The permission system provides fine-grained access control with the following features:

- **Permission-based access control** - Replace role-based checks with specific permissions
- **Backwards compatibility** - Gradual migration from roles to permissions
- **Performance optimization** - Client-side caching with TTL support
- **Flexible UI rendering** - Conditional components, fallbacks, and loading states
- **Context-aware permissions** - Dynamic permission checking based on resource context
- **Comprehensive error handling** - Graceful fallbacks and error states

## Architecture

### Core Components

1. **permissionService** - API communication and caching layer
2. **usePermissions** - React hook for permission state management
3. **PermissionGate** - Declarative permission checking component
4. **RoleBasedComponent** - Backwards compatibility component
5. **AuthContext** - Enhanced with permission loading

### Permission Flow

```
User Login → Load Permissions → Cache Permissions → Check Permissions → Render UI
     ↓              ↓                ↓               ↓              ↓
   API Call     Local Storage    Memory Cache   API/Cache      Conditional
```

## Usage Guide

### 1. Basic Permission Gate Usage

#### Single Permission Check
```tsx
import { PermissionGate } from '../components';

<PermissionGate
  resource="user"
  action="create"
  scope="department"
  unauthorized={<div>You don't have permission to create users</div>}
>
  <CreateUserButton />
</PermissionGate>
```

#### Common Permission Usage
```tsx
import { COMMON_PERMISSIONS } from '../types/permission';

<PermissionGate
  commonPermission={COMMON_PERMISSIONS.CREATE_USER}
>
  <CreateUserButton />
</PermissionGate>
```

### 2. Multiple Permissions Logic

#### ANY Permission (OR Logic)
```tsx
<PermissionGate
  permissions={[
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'update' },
    { resource: 'user', action: 'delete' }
  ]}
  requireAll={false} // Default: OR logic
>
  <UserManagementPanel />
</PermissionGate>
```

#### ALL Permissions (AND Logic)
```tsx
<PermissionGate
  permissions={[
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'update' }
  ]}
  requireAll={true} // AND logic
>
  <FullUserManagementPanel />
</PermissionGate>
```

### 3. Context-Aware Permissions

```tsx
<PermissionGate
  resource="document"
  action="delete"
  scope="department"
  context={{
    departmentId: user.departmentId,
    documentType: 'policy'
  }}
>
  <DeleteDocumentButton />
</PermissionGate>
```

### 4. Backwards Compatibility

#### Pure Role-Based (Legacy)
```tsx
import { RoleBasedComponent } from '../components';

<RoleBasedComponent
  roles={['DEPARTMENT_ADMIN', 'PROPERTY_MANAGER']}
>
  <AdminPanel />
</RoleBasedComponent>
```

#### Mixed Role + Permission
```tsx
<RoleBasedComponent
  roles={['STAFF']}
  resource="payroll"
  action="read"
  scope="own"
  usePermissions={true}
>
  <PayrollView />
</RoleBasedComponent>
```

### 5. Imperative Permission Checking

```tsx
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const handleAction = async () => {
    const canCreate = await hasPermission('user', 'create', 'department');
    if (canCreate) {
      // Perform action
    }
  };

  const checkMultiple = async () => {
    const hasAny = await hasAnyPermission([
      { resource: 'user', action: 'create' },
      { resource: 'user', action: 'update' }
    ]);

    const hasAll = await hasAllPermissions([
      { resource: 'user', action: 'create' },
      { resource: 'user', action: 'update' }
    ]);
  };
}
```

### 6. Loading States and Error Handling

```tsx
<PermissionGate
  resource="expensive_operation"
  action="execute"
  loading={<div>Checking permissions...</div>}
  unauthorized={<div>Access denied</div>}
  hideOnDenied={false} // Show unauthorized message
  showLoading={true}   // Show loading state
>
  <ExpensiveOperationButton />
</PermissionGate>
```

### 7. Higher-Order Component Pattern

```tsx
import { withPermission } from '../components';

const ProtectedComponent = withPermission(MyComponent, {
  resource: 'user',
  action: 'create',
  scope: 'department'
});
```

## Permission Constants

### Resources
```tsx
export const PERMISSION_RESOURCES = {
  USER: 'user',
  DEPARTMENT: 'department',
  DOCUMENT: 'document',
  PAYROLL: 'payroll',
  VACATION: 'vacation',
  TRAINING: 'training',
  BENEFIT: 'benefit',
  AUDIT: 'audit',
} as const;
```

### Actions
```tsx
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  EXPORT: 'export',
  IMPORT: 'import',
  ASSIGN: 'assign',
  REVOKE: 'revoke',
} as const;
```

### Scopes
```tsx
export const PERMISSION_SCOPES = {
  OWN: 'own',           // User's own resources
  DEPARTMENT: 'department', // Department-scoped
  PROPERTY: 'property',     // Property-scoped
  ORGANIZATION: 'organization', // Organization-scoped
  PLATFORM: 'platform',    // Platform-wide
} as const;
```

### Common Permissions
```tsx
export const COMMON_PERMISSIONS = {
  // User management
  CREATE_USER: { resource: 'user', action: 'create', scope: 'department' },
  VIEW_ALL_USERS: { resource: 'user', action: 'read', scope: 'department' },
  EDIT_USER: { resource: 'user', action: 'update', scope: 'department' },
  
  // Document management
  UPLOAD_DOCUMENT: { resource: 'document', action: 'create', scope: 'department' },
  VIEW_DOCUMENTS: { resource: 'document', action: 'read', scope: 'department' },
  
  // Payroll management
  VIEW_PAYROLL: { resource: 'payroll', action: 'read', scope: 'own' },
  MANAGE_PAYROLL: { resource: 'payroll', action: 'update', scope: 'department' },
  
  // And more...
} as const;
```

## Migration Guide

### Step 1: Identify Current Role Checks
```tsx
// Before (role-based)
{currentUser?.role === 'DEPARTMENT_ADMIN' && (
  <CreateUserButton />
)}
```

### Step 2: Add Permission Props
```tsx
// During migration (mixed)
<RoleBasedComponent
  roles={['DEPARTMENT_ADMIN']}
  resource="user"
  action="create"
  scope="department"
  usePermissions={true}
>
  <CreateUserButton />
</RoleBasedComponent>
```

### Step 3: Pure Permission-Based
```tsx
// After migration (permission-based)
<PermissionGate
  resource="user"
  action="create"
  scope="department"
>
  <CreateUserButton />
</PermissionGate>
```

## Performance Considerations

### Caching Strategy
- **Client-side caching** with 5-minute TTL
- **Memory-based cache** for runtime performance
- **Automatic cache invalidation** on role changes
- **Cache statistics** for monitoring

### Best Practices

1. **Use bulk permission checks** for multiple permissions
2. **Leverage common permissions** for consistency
3. **Implement proper loading states** for UX
4. **Use context for dynamic permissions** when needed
5. **Cache permission results** in component state when possible

### Avoiding Anti-Patterns

❌ **Don't check permissions in loops**
```tsx
// Bad
{users.map(user => (
  <PermissionGate resource="user" action="edit">
    <EditButton user={user} />
  </PermissionGate>
))}
```

✅ **Check once and conditionally render**
```tsx
// Good
const canEditUsers = await hasPermission('user', 'edit', 'department');
{users.map(user => (
  canEditUsers && <EditButton user={user} />
))}
```

## Error Handling

### Permission Service Errors
```tsx
const { error, refreshPermissions } = usePermissions();

if (error) {
  return (
    <div className="error-container">
      <p>Failed to load permissions: {error}</p>
      <button onClick={refreshPermissions}>Retry</button>
    </div>
  );
}
```

### Network Failures
- **Graceful degradation** - Fall back to role-based checks
- **Retry mechanisms** - Automatic retry with exponential backoff
- **Error boundaries** - Prevent permission errors from crashing the app

## Testing

### Unit Testing Permission Components
```tsx
import { render } from '@testing-library/react';
import { PermissionGate } from '../components';

// Mock the permission service
jest.mock('../services/permissionService');

test('renders children when permission is granted', async () => {
  // Mock hasPermission to return true
  mockPermissionService.hasPermission.mockResolvedValue(true);
  
  const { getByText } = render(
    <PermissionGate resource="user" action="create">
      <div>Protected Content</div>
    </PermissionGate>
  );
  
  await waitFor(() => {
    expect(getByText('Protected Content')).toBeInTheDocument();
  });
});
```

### Integration Testing
```tsx
test('user management flow with permissions', async () => {
  // Test complete user management workflow
  // including permission checks and UI updates
});
```

## Debugging

### Debug Mode
```tsx
<PermissionGate
  resource="user"
  action="create"
  debug={true} // Enables console logging
>
  <CreateUserButton />
</PermissionGate>
```

### Cache Statistics
```tsx
const { getCacheStats } = usePermissions();
const stats = getCacheStats();
console.log('Cache stats:', stats);
```

### Permission Audit
```tsx
const { userPermissionSummary } = usePermissions();
console.log('User permissions:', userPermissionSummary);
```

## Security Considerations

1. **Client-side permissions are NOT security** - Always validate on the server
2. **Use for UI enhancement only** - Hide/show UI elements
3. **Fail closed** - Default to deny access when in doubt
4. **Regular permission refresh** - Keep permissions up to date
5. **Audit permission usage** - Track permission checks for debugging

## API Reference

### PermissionGate Props
```tsx
interface PermissionGateProps {
  children: ReactNode;
  
  // Single permission
  resource?: string;
  action?: string;
  scope?: string;
  context?: PermissionContext;
  
  // Multiple permissions
  permissions?: PermissionSpec[];
  commonPermission?: CommonPermission;
  commonPermissions?: CommonPermission[];
  
  // Logic
  requireAll?: boolean; // AND vs OR logic
  
  // UI
  fallback?: ReactNode;
  unauthorized?: ReactNode;
  loading?: ReactNode;
  hideOnDenied?: boolean;
  showLoading?: boolean;
  
  // Debugging
  debug?: boolean;
}
```

### usePermissions Hook
```tsx
interface UsePermissionsReturn {
  // State
  permissions: Permission[];
  userPermissionSummary: UserPermissionSummary | null;
  isLoading: boolean;
  error: string | null;

  // Permission checking
  hasPermission: (resource: string, action: string, scope?: string, context?: PermissionContext) => Promise<boolean>;
  hasAnyPermission: (permissions: PermissionSpec[]) => Promise<boolean>;
  hasAllPermissions: (permissions: PermissionSpec[]) => Promise<boolean>;
  checkPermission: (resource: string, action: string, scope?: string, context?: PermissionContext) => Promise<PermissionEvaluationResult>;
  checkBulkPermissions: (permissions: PermissionSpec[], globalContext?: PermissionContext) => Promise<BulkPermissionResult>;

  // Management
  getUserPermissions: () => Promise<Permission[]>;
  refreshPermissions: () => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheStats: () => CacheStats;
}
```

This permission system provides a robust foundation for implementing fine-grained access control in the React frontend while maintaining backwards compatibility and performance.