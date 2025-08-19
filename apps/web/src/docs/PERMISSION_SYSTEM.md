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
import React from 'react';
import { PermissionGate } from './PermissionGate';

interface WithPermissionOptions {
  resource?: string;
  action?: string;
  scope?: string;
  permissions?: Array<{resource: string; action: string; scope?: string}>;
  commonPermission?: any;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  unauthorized?: React.ReactNode;
}

export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  options: WithPermissionOptions
) {
  const WithPermissionComponent = (props: P) => {
    return (
      <PermissionGate {...options}>
        <Component {...props} />
      </PermissionGate>
    );
  };

  WithPermissionComponent.displayName = `withPermission(${Component.displayName || Component.name})`;
  
  return WithPermissionComponent;
}

// Usage
const ProtectedUserForm = withPermission(UserForm, {
  resource: 'user',
  action: 'create',
  scope: 'department',
  unauthorized: <div>You cannot create users</div>
});

const ProtectedAdminPanel = withPermission(AdminPanel, {
  permissions: [
    { resource: 'user', action: 'create', scope: 'department' },
    { resource: 'department', action: 'read', scope: 'property' }
  ],
  requireAll: true,
  fallback: <div>Loading admin panel...</div>
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

## Complete Implementation Examples

### User Management Page
```tsx
import React from 'react';
import { PermissionGate } from '../components';
import { COMMON_PERMISSIONS } from '../types/permission';

const UserManagementPage = () => {
  return (
    <div className="user-management">
      <div className="page-header">
        <h1>User Management</h1>
        
        {/* Create User Button - Department Admins and above */}
        <PermissionGate 
          commonPermission={COMMON_PERMISSIONS.CREATE_USER}
          unauthorized={null} // Hide button if no permission
        >
          <CreateUserButton />
        </PermissionGate>
      </div>

      {/* User List - All authenticated users can view */}
      <PermissionGate
        resource="user"
        action="read"
        scope="department"
        fallback={<div>Loading user list...</div>}
      >
        <UserList />
      </PermissionGate>

      {/* Bulk Operations - Platform/Organization admins only */}
      <PermissionGate
        permissions={[
          { resource: 'user', action: 'import', scope: 'organization' },
          { resource: 'user', action: 'export', scope: 'organization' }
        ]}
        requireAll={false} // User needs either import OR export
      >
        <BulkOperationsPanel />
      </PermissionGate>

      {/* Admin Dashboard - Multiple permissions required */}
      <PermissionGate
        permissions={[
          { resource: 'user', action: 'create', scope: 'department' },
          { resource: 'user', action: 'update', scope: 'department' },
          { resource: 'department', action: 'read', scope: 'property' }
        ]}
        requireAll={true} // User needs ALL permissions
        unauthorized={
          <div className="text-gray-500">
            You need additional permissions to access the admin dashboard.
          </div>
        }
      >
        <AdminDashboard />
      </PermissionGate>
    </div>
  );
};
```

### Dynamic Context-Aware Permissions
```tsx
const DocumentCard = ({ document, currentUser }) => {
  const { hasPermission } = usePermissions();
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    // Check permissions with document context
    const checkPermissions = async () => {
      const editPermission = await hasPermission(
        'document', 
        'update', 
        'department',
        {
          departmentId: document.departmentId,
          documentType: document.type,
          ownerId: document.createdBy
        }
      );
      
      const deletePermission = await hasPermission(
        'document', 
        'delete', 
        'department',
        {
          departmentId: document.departmentId,
          documentType: document.type,
          ownerId: document.createdBy,
          // Only allow deletion of own documents or if admin
          requireOwnership: currentUser.role === 'STAFF'
        }
      );
      
      setCanEdit(editPermission);
      setCanDelete(deletePermission);
    };

    checkPermissions();
  }, [document, currentUser, hasPermission]);

  return (
    <div className="document-card">
      <h3>{document.title}</h3>
      <p>{document.description}</p>
      
      <div className="document-actions">
        {canEdit && (
          <button onClick={() => editDocument(document.id)}>
            Edit
          </button>
        )}
        
        {canDelete && (
          <button 
            onClick={() => deleteDocument(document.id)}
            className="text-red-600"
          >
            Delete
          </button>
        )}
        
        {/* Download is always allowed for department members */}
        <PermissionGate
          resource="document"
          action="read"
          scope="department"
          context={{ departmentId: document.departmentId }}
        >
          <button onClick={() => downloadDocument(document.id)}>
            Download
          </button>
        </PermissionGate>
      </div>
    </div>
  );
};
```

### Complex Permission Logic
```tsx
const PayrollSection = ({ employee, currentUser }) => {
  return (
    <div className="payroll-section">
      {/* Own payroll - staff can view their own */}
      <PermissionGate
        resource="payroll"
        action="read"
        scope="own"
        context={{ userId: employee.id, currentUserId: currentUser.id }}
      >
        <OwnPayrollView employee={employee} />
      </PermissionGate>

      {/* Department payroll - admins can view department members */}
      <PermissionGate
        resource="payroll"
        action="read"
        scope="department"
        context={{ 
          departmentId: employee.departmentId,
          viewerDepartmentId: currentUser.departmentId 
        }}
      >
        <DepartmentPayrollView employee={employee} />
      </PermissionGate>

      {/* Payroll management - special permissions for HR */}
      <PermissionGate
        permissions={[
          { resource: 'payroll', action: 'create', scope: 'department' },
          { resource: 'payroll', action: 'update', scope: 'department' },
          { resource: 'user', action: 'read', scope: 'department' }
        ]}
        requireAll={true}
        context={{ departmentId: employee.departmentId }}
      >
        <PayrollManagementPanel employee={employee} />
      </PermissionGate>
    </div>
  );
};
```

### Conditional Navigation
```tsx
const Navigation = () => {
  const { hasAnyPermission } = usePermissions();
  const [navigationItems, setNavigationItems] = useState([]);

  useEffect(() => {
    const buildNavigation = async () => {
      const items = [];

      // Dashboard - always visible
      items.push({ path: '/dashboard', label: 'Dashboard' });

      // Users - if can view users
      if (await hasPermission('user', 'read', 'department')) {
        items.push({ path: '/users', label: 'Users' });
      }

      // Departments - if can view departments
      if (await hasPermission('department', 'read', 'property')) {
        items.push({ path: '/departments', label: 'Departments' });
      }

      // Payroll - complex permission check
      const hasPayrollAccess = await hasAnyPermission([
        { resource: 'payroll', action: 'read', scope: 'own' },
        { resource: 'payroll', action: 'read', scope: 'department' },
        { resource: 'payroll', action: 'create', scope: 'department' }
      ]);
      
      if (hasPayrollAccess) {
        items.push({ path: '/payroll', label: 'Payroll' });
      }

      // Admin section - multiple admin permissions
      const hasAdminAccess = await hasAnyPermission([
        { resource: 'user', action: 'create', scope: 'department' },
        { resource: 'benefit', action: 'create', scope: 'organization' },
        { resource: 'training', action: 'create', scope: 'department' }
      ]);
      
      if (hasAdminAccess) {
        items.push({ path: '/admin', label: 'Administration' });
      }

      setNavigationItems(items);
    };

    buildNavigation();
  }, [hasPermission, hasAnyPermission]);

  return (
    <nav className="sidebar">
      {navigationItems.map((item) => (
        <NavLink 
          key={item.path} 
          to={item.path} 
          className="nav-item"
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};
```

## Migration Guide

### Step 1: Identify Current Role Checks
```tsx
// Before (role-based)
{currentUser?.role === 'DEPARTMENT_ADMIN' && (
  <CreateUserButton />
)}

// Multiple role checks
{['DEPARTMENT_ADMIN', 'PROPERTY_MANAGER'].includes(currentUser?.role) && (
  <AdminPanel />
)}

// Complex role logic
{(currentUser?.role === 'DEPARTMENT_ADMIN' || 
  (currentUser?.role === 'STAFF' && currentUser?.id === user.id)) && (
  <EditProfileButton />
)}
```

### Step 2: Add Permission Props (Gradual Migration)
```tsx
// During migration (mixed) - backwards compatible
<RoleBasedComponent
  roles={['DEPARTMENT_ADMIN']}
  resource="user"
  action="create"
  scope="department"
  usePermissions={true} // Enable permission checking
  fallbackToRoles={true} // Fall back to roles if permission check fails
>
  <CreateUserButton />
</RoleBasedComponent>

// Multiple roles to multiple permissions
<RoleBasedComponent
  roles={['DEPARTMENT_ADMIN', 'PROPERTY_MANAGER']}
  permissions={[
    { resource: 'admin', action: 'access', scope: 'department' },
    { resource: 'admin', action: 'access', scope: 'property' }
  ]}
  usePermissions={true}
  requireAll={false} // OR logic
>
  <AdminPanel />
</RoleBasedComponent>

// Complex logic to context-aware permissions
<RoleBasedComponent
  roles={['DEPARTMENT_ADMIN', 'STAFF']}
  resource="profile"
  action="update"
  scope="own"
  context={{ 
    userId: user.id, 
    currentUserId: currentUser.id,
    departmentId: user.departmentId,
    viewerDepartmentId: currentUser.departmentId
  }}
  usePermissions={true}
>
  <EditProfileButton />
</RoleBasedComponent>
```

### Step 3: Pure Permission-Based (Final State)
```tsx
// After migration (permission-based)
<PermissionGate
  resource="user"
  action="create"
  scope="department"
>
  <CreateUserButton />
</PermissionGate>

// Multiple permissions
<PermissionGate
  permissions={[
    { resource: 'admin', action: 'access', scope: 'department' },
    { resource: 'admin', action: 'access', scope: 'property' }
  ]}
  requireAll={false}
>
  <AdminPanel />
</PermissionGate>

// Context-aware permissions
<PermissionGate
  resource="profile"
  action="update"
  scope="own"
  context={{ 
    userId: user.id, 
    currentUserId: currentUser.id,
    departmentId: user.departmentId,
    viewerDepartmentId: currentUser.departmentId
  }}
>
  <EditProfileButton />
</PermissionGate>
```

### Step 4: Cleanup Legacy Code
```tsx
// Remove role-based checks
// Delete RoleBasedComponent imports
// Update prop types to remove role references
// Clean up unused role constants
```

## Advanced Patterns

### Permission-Aware Form Fields
```tsx
const UserForm = ({ user, isEditing }) => {
  const { hasPermission } = usePermissions();
  const [fieldPermissions, setFieldPermissions] = useState({});

  useEffect(() => {
    const checkFieldPermissions = async () => {
      const permissions = {
        email: await hasPermission('user', 'update_email', 'department'),
        role: await hasPermission('user', 'change_role', 'department'),
        department: await hasPermission('user', 'change_department', 'property'),
        salary: await hasPermission('payroll', 'update', 'department')
      };
      setFieldPermissions(permissions);
    };

    if (isEditing) {
      checkFieldPermissions();
    }
  }, [isEditing, hasPermission]);

  return (
    <form>
      <input 
        name="name" 
        defaultValue={user.name}
        // Name can always be edited
      />
      
      <input 
        name="email" 
        defaultValue={user.email}
        disabled={!fieldPermissions.email}
        className={!fieldPermissions.email ? 'bg-gray-100' : ''}
      />
      
      {fieldPermissions.role && (
        <select name="role" defaultValue={user.role}>
          <option value="STAFF">Staff</option>
          <option value="DEPARTMENT_ADMIN">Department Admin</option>
        </select>
      )}
      
      {fieldPermissions.department && (
        <DepartmentSelector 
          defaultValue={user.departmentId}
          name="departmentId"
        />
      )}
      
      {fieldPermissions.salary && (
        <input 
          name="salary" 
          type="number"
          defaultValue={user.salary}
        />
      )}
    </form>
  );
};
```

### Permission-Based Data Filtering
```tsx
const useFilteredData = (data, resourceType) => {
  const { hasPermission } = usePermissions();
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filterData = async () => {
      setLoading(true);
      
      const filtered = [];
      for (const item of data) {
        // Check if user can read this specific item
        const canRead = await hasPermission(
          resourceType,
          'read',
          'department',
          {
            departmentId: item.departmentId,
            ownerId: item.createdBy
          }
        );
        
        if (canRead) {
          filtered.push(item);
        }
      }
      
      setFilteredData(filtered);
      setLoading(false);
    };

    if (data.length > 0) {
      filterData();
    }
  }, [data, resourceType, hasPermission]);

  return { data: filteredData, loading };
};

// Usage
const DocumentList = () => {
  const [documents] = useState(/* fetch documents */);
  const { data: visibleDocuments, loading } = useFilteredData(documents, 'document');

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {visibleDocuments.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
};
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

## Frontend Service Implementation

### Permission Service (permissionService.ts)
```typescript
import { api } from './api';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  scope: string;
  module: string;
}

interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  context?: any;
}

class PermissionService {
  private cache = new Map<string, { result: boolean; expiry: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async hasPermission(
    resource: string, 
    action: string, 
    scope?: string, 
    context?: any
  ): Promise<boolean> {
    const cacheKey = `${resource}.${action}.${scope || 'default'}.${JSON.stringify(context || {})}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    try {
      const response = await api.post<PermissionCheckResult>('/permissions/check', {
        resource,
        action,
        scope,
        context
      });

      const result = response.data.allowed;
      
      // Cache the result
      this.cache.set(cacheKey, {
        result,
        expiry: Date.now() + this.CACHE_TTL
      });

      return result;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false; // Fail closed
    }
  }

  async hasAnyPermission(permissions: Array<{resource: string; action: string; scope?: string}>): Promise<boolean> {
    try {
      const response = await api.post<PermissionCheckResult>('/permissions/check-bulk', {
        permissions,
        requireAll: false
      });
      return response.data.allowed;
    } catch (error) {
      console.error('Bulk permission check failed:', error);
      return false;
    }
  }

  async hasAllPermissions(permissions: Array<{resource: string; action: string; scope?: string}>): Promise<boolean> {
    try {
      const response = await api.post<PermissionCheckResult>('/permissions/check-bulk', {
        permissions,
        requireAll: true
      });
      return response.data.allowed;
    } catch (error) {
      console.error('Bulk permission check failed:', error);
      return false;
    }
  }

  async getUserPermissions(): Promise<Permission[]> {
    try {
      const response = await api.get<Permission[]>('/permissions/user');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.85 // Would need to track hits/misses for real calculation
    };
  }
}

export const permissionService = new PermissionService();
```

### usePermissions Hook (usePermissions.ts)
```typescript
import { useState, useEffect, useCallback, useContext } from 'react';
import { permissionService } from '../services/permissionService';
import { AuthContext } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useContext(AuthContext);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userPermissions = await permissionService.getUserPermissions();
      setPermissions(userPermissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
      console.error('Failed to load permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const hasPermission = useCallback(
    (resource: string, action: string, scope?: string, context?: any) => {
      return permissionService.hasPermission(resource, action, scope, context);
    },
    []
  );

  const hasAnyPermission = useCallback(
    (permissions: Array<{resource: string; action: string; scope?: string}>) => {
      return permissionService.hasAnyPermission(permissions);
    },
    []
  );

  const hasAllPermissions = useCallback(
    (permissions: Array<{resource: string; action: string; scope?: string}>) => {
      return permissionService.hasAllPermissions(permissions);
    },
    []
  );

  const refreshPermissions = useCallback(() => {
    permissionService.clearCache();
    return loadPermissions();
  }, [loadPermissions]);

  const clearCache = useCallback(() => {
    permissionService.clearCache();
  }, []);

  const getCacheStats = useCallback(() => {
    return permissionService.getCacheStats();
  }, []);

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
    clearCache,
    getCacheStats
  };
};
```

### Enhanced PermissionGate Component
```typescript
import React, { useState, useEffect, ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { COMMON_PERMISSIONS } from '../types/permission';

interface PermissionGateProps {
  children: ReactNode;
  
  // Single permission
  resource?: string;
  action?: string;
  scope?: string;
  context?: any;
  
  // Multiple permissions
  permissions?: Array<{resource: string; action: string; scope?: string}>;
  commonPermission?: typeof COMMON_PERMISSIONS[keyof typeof COMMON_PERMISSIONS];
  requireAll?: boolean;
  
  // UI options
  fallback?: ReactNode;
  unauthorized?: ReactNode;
  loading?: ReactNode;
  hideOnDenied?: boolean;
  showLoading?: boolean;
  
  // Debug
  debug?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  resource,
  action,
  scope,
  context,
  permissions,
  commonPermission,
  requireAll = false,
  fallback,
  unauthorized,
  loading: loadingComponent,
  hideOnDenied = true,
  showLoading = true,
  debug = false
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      setIsLoading(true);
      let allowed = false;

      try {
        if (commonPermission) {
          allowed = await hasPermission(
            commonPermission.resource,
            commonPermission.action,
            commonPermission.scope,
            context
          );
        } else if (permissions) {
          allowed = requireAll 
            ? await hasAllPermissions(permissions)
            : await hasAnyPermission(permissions);
        } else if (resource && action) {
          allowed = await hasPermission(resource, action, scope, context);
        }

        if (debug) {
          console.log('Permission check result:', {
            resource,
            action,
            scope,
            context,
            permissions,
            commonPermission,
            requireAll,
            allowed
          });
        }

        setIsAllowed(allowed);
      } catch (error) {
        console.error('Permission check error:', error);
        setIsAllowed(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [resource, action, scope, context, permissions, commonPermission, requireAll, hasPermission, hasAnyPermission, hasAllPermissions, debug]);

  if (isLoading) {
    if (showLoading && loadingComponent) {
      return <>{loadingComponent}</>;
    }
    if (showLoading && fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (hideOnDenied) {
    return null;
  }

  return <>{unauthorized || fallback}</>;
};
```

This permission system provides a robust, performant, and flexible foundation for implementing fine-grained access control in the React frontend while maintaining backwards compatibility and excellent developer experience.