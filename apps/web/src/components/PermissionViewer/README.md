# Permission Viewer Component

A comprehensive, production-ready React component for displaying and managing the 82 granular permissions in the Hotel Operations Hub. The Permission Viewer provides a hierarchical tree interface with advanced search, filtering, selection, and export capabilities.

## 🌟 Features

### Core Features
- **Hierarchical Tree View**: Resource → Action → Scope structure
- **Advanced Search**: Real-time filtering with auto-suggestions
- **Smart Filters**: Filter by resource, action, scope, and custom criteria
- **Multi-Select**: Checkbox selection with bulk operations
- **Export Options**: JSON, CSV, YAML, and Markdown formats
- **Permission Details**: Comprehensive permission information panel
- **Responsive Design**: Mobile-first responsive layout
- **Performance Optimized**: Virtual scrolling and efficient caching

### Advanced Features
- **Search Debouncing**: 300ms delay for smooth search experience
- **Keyboard Navigation**: Arrow keys, Enter, Space for accessibility
- **Context Menus**: Right-click operations for power users
- **State Persistence**: Maintains expansion and selection state
- **Real-time Updates**: Automatic refresh and cache invalidation
- **Role Context**: Shows which roles have each permission
- **Usage Analytics**: Permission usage statistics and insights

## 🏗️ Architecture

### Component Structure
```
PermissionViewer/
├── PermissionViewer.tsx        # Main container component
├── PermissionTreeNode.tsx      # Individual tree nodes
├── PermissionSearch.tsx        # Search interface
├── PermissionFilters.tsx       # Advanced filtering
├── PermissionDetails.tsx       # Permission detail panel
├── PermissionExport.tsx        # Export functionality
├── index.ts                    # Component exports
└── README.md                   # This documentation
```

### Data Flow
```
API → usePermissionViewer Hook → PermissionViewer Component → Child Components
```

### Type System
- **Complete TypeScript Support**: Full type safety with comprehensive interfaces
- **Permission Viewer Types**: `PermissionTreeNode`, `PermissionFilter`, `PermissionViewerState`
- **Integration Types**: Compatible with existing permission system types

## 📦 Installation & Setup

### 1. Import the Component
```typescript
import { PermissionViewer } from '../components/PermissionViewer';
import { Permission } from '../types/permission';
```

### 2. Basic Usage
```typescript
function MyComponent() {
  const handlePermissionSelect = (permission: Permission) => {
    console.log('Selected permission:', permission);
  };

  return (
    <PermissionViewer
      onPermissionSelect={handlePermissionSelect}
      height={600}
      showToolbar={true}
      showFooter={true}
    />
  );
}
```

### 3. Advanced Usage with Custom Options
```typescript
function AdvancedComponent() {
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);

  const handleBulkSelect = (permissions: Permission[]) => {
    setSelectedPermissions(permissions);
  };

  const handleExport = async (permissions: Permission[], format: string) => {
    // Custom export logic
    console.log(`Exporting ${permissions.length} permissions as ${format}`);
  };

  return (
    <PermissionViewer
      onPermissionSelect={(permission) => console.log(permission)}
      onBulkSelect={handleBulkSelect}
      onExport={handleExport}
      height={800}
      options={{
        showSearch: true,
        showFilters: true,
        showExport: true,
        showPermissionDetails: true,
        showRoleContext: true,
        showUserContext: true,
        multiSelect: true,
        expandAll: false,
        showCounts: true,
        showDescriptions: true,
      }}
      className="custom-permission-viewer"
    />
  );
}
```

## 🎛️ Props Reference

### PermissionViewerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `permissions` | `Permission[]?` | `undefined` | Optional permissions array (auto-loads if not provided) |
| `options` | `Partial<PermissionViewerOptions>?` | `{}` | Component configuration options |
| `onPermissionSelect` | `(permission: Permission) => void?` | `undefined` | Callback for single permission selection |
| `onBulkSelect` | `(permissions: Permission[]) => void?` | `undefined` | Callback for bulk selection |
| `onExport` | `(permissions: Permission[], format: string) => void?` | `undefined` | Custom export handler |
| `className` | `string?` | `''` | Additional CSS classes |
| `height` | `number?` | `600` | Component height in pixels |
| `showToolbar` | `boolean?` | `true` | Show/hide toolbar |
| `showFooter` | `boolean?` | `true` | Show/hide footer |

### PermissionViewerOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showSearch` | `boolean` | `true` | Enable search functionality |
| `showFilters` | `boolean` | `true` | Enable advanced filters |
| `showExport` | `boolean` | `true` | Enable export functionality |
| `showPermissionDetails` | `boolean` | `true` | Show permission details panel |
| `showRoleContext` | `boolean` | `true` | Display role associations |
| `showUserContext` | `boolean` | `true` | Display user assignments |
| `multiSelect` | `boolean` | `true` | Enable multi-selection |
| `expandAll` | `boolean` | `false` | Expand all nodes by default |
| `showCounts` | `boolean` | `true` | Show permission counts |
| `showDescriptions` | `boolean` | `true` | Show permission descriptions |

## 🔍 Search & Filtering

### Search Examples
```typescript
// Search by permission pattern
"user.create"           // Find all user creation permissions
"document"              // Find all document-related permissions  
"department"            // Find all department-scoped permissions
"approve"               // Find all approval permissions
"*.read.own"           // Find all read permissions for own scope
```

### Filter Categories
- **Resources**: user, role, document, schedule, payroll, vacation, analytics, audit, system
- **Actions**: create, read, update, delete, manage, approve, reject, export, import, assign, revoke
- **Scopes**: platform, organization, property, department, own

### Advanced Filtering
```typescript
const customFilter: PermissionFilter = {
  searchQuery: 'user',
  selectedResources: ['user', 'role'],
  selectedActions: ['create', 'read'],
  selectedScopes: ['department', 'property'],
  showOnlyUserPermissions: false,
  showOnlyRolePermissions: true,
};
```

## 📤 Export Capabilities

### Supported Formats
- **JSON**: Structured data format for integration
- **CSV**: Spreadsheet-compatible format
- **YAML**: Human-readable configuration format
- **Markdown**: Documentation-friendly format

### Export Options
```typescript
const exportOptions: PermissionExportOptions = {
  format: 'json',
  includeDescriptions: true,
  includeRoleContext: true,
  includeUserContext: false,
  filterBySelection: true,
};
```

### Custom Export Handler
```typescript
const handleCustomExport = async (permissions: Permission[], format: string) => {
  try {
    const exportData = await customExportLogic(permissions, format);
    downloadFile(exportData, `permissions.${format}`);
    showSuccessMessage(`Exported ${permissions.length} permissions`);
  } catch (error) {
    showErrorMessage('Export failed');
  }
};
```

## 🎨 Styling & Theming

### CSS Classes
The component uses Tailwind CSS classes and can be customized:

```css
/* Custom styling example */
.custom-permission-viewer {
  @apply border-2 border-blue-200 rounded-xl;
}

.custom-permission-viewer .permission-node {
  @apply hover:bg-blue-50 transition-colors;
}

.custom-permission-viewer .permission-selected {
  @apply bg-blue-100 border-blue-300;
}
```

### Theme Integration
The component respects your existing theme configuration and supports dark mode through CSS variables.

## 🧩 Integration Examples

### Integration with Role Management
```typescript
function RolePermissionAssignment({ roleId }: { roleId: string }) {
  const [assignedPermissions, setAssignedPermissions] = useState<string[]>([]);

  const handlePermissionSelect = (permission: Permission) => {
    // Toggle permission assignment
    if (assignedPermissions.includes(permission.id)) {
      setAssignedPermissions(prev => prev.filter(id => id !== permission.id));
      revokePermissionFromRole(roleId, permission.id);
    } else {
      setAssignedPermissions(prev => [...prev, permission.id]);
      grantPermissionToRole(roleId, permission.id);
    }
  };

  return (
    <div className="role-permission-assignment">
      <h2>Assign Permissions to Role</h2>
      <PermissionViewer
        onPermissionSelect={handlePermissionSelect}
        options={{
          multiSelect: true,
          showExport: false,
          showPermissionDetails: true,
        }}
      />
    </div>
  );
}
```

### Integration with User Management
```typescript
function UserPermissionViewer({ userId }: { userId: string }) {
  const { data: userPermissions } = useQuery(['user-permissions', userId], () =>
    permissionService.getUserPermissions(userId)
  );

  return (
    <PermissionViewer
      permissions={userPermissions?.permissions}
      options={{
        multiSelect: false,
        showExport: true,
        showUserContext: true,
        showRoleContext: true,
      }}
      height={400}
    />
  );
}
```

### Integration with Security Audit
```typescript
function SecurityAuditComponent() {
  const [auditResults, setAuditResults] = useState<Permission[]>([]);

  const handleBulkSelect = async (permissions: Permission[]) => {
    const auditData = await performSecurityAudit(permissions);
    setAuditResults(auditData);
  };

  const handleExport = async (permissions: Permission[], format: string) => {
    const auditReport = await generateAuditReport(permissions, format);
    downloadAuditReport(auditReport);
  };

  return (
    <div className="security-audit">
      <PermissionViewer
        onBulkSelect={handleBulkSelect}
        onExport={handleExport}
        options={{
          multiSelect: true,
          showFilters: true,
          showExport: true,
        }}
      />
    </div>
  );
}
```

## 🔧 Customization

### Custom Node Renderer
```typescript
function CustomPermissionViewer() {
  return (
    <PermissionViewer
      renderNode={(node, props) => (
        <CustomPermissionNode {...props} node={node} />
      )}
      options={{
        showCustomRenderer: true,
      }}
    />
  );
}
```

### Custom Search Logic
```typescript
const customSearchLogic = (permissions: Permission[], query: string) => {
  // Implement custom search algorithm
  return permissions.filter(permission => 
    customSearchAlgorithm(permission, query)
  );
};
```

### Custom Export Format
```typescript
const customExportFormats = {
  xml: (permissions: Permission[]) => generateXML(permissions),
  pdf: (permissions: Permission[]) => generatePDF(permissions),
};
```

## ⚡ Performance Considerations

### Optimization Features
- **Virtual Scrolling**: Handles 1000+ permissions efficiently
- **Debounced Search**: 300ms delay prevents excessive API calls
- **Intelligent Caching**: 5-minute TTL with automatic invalidation
- **Lazy Loading**: Tree nodes loaded on demand
- **Memoization**: Optimized re-rendering of tree components

### Best Practices
- Use the `multiSelect` option only when necessary
- Implement pagination for large datasets (1000+ permissions)
- Cache API responses at the application level
- Use React.memo for custom node renderers
- Implement error boundaries for robust error handling

## 🧪 Testing

### Unit Testing Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionViewer } from '../PermissionViewer';

describe('PermissionViewer', () => {
  it('renders permission tree correctly', () => {
    render(<PermissionViewer />);
    expect(screen.getByText('Permission Explorer')).toBeInTheDocument();
  });

  it('handles permission selection', () => {
    const onSelect = jest.fn();
    render(<PermissionViewer onPermissionSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('user.create.department'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'user',
      action: 'create',
      scope: 'department',
    }));
  });
});
```

### Integration Testing
```typescript
describe('PermissionViewer Integration', () => {
  it('loads permissions from API', async () => {
    mockAPI.get('/permissions/my/summary').mockResolvedValue({
      data: { permissions: mockPermissions }
    });

    render(<PermissionViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('82 permissions')).toBeInTheDocument();
    });
  });
});
```

## 🐛 Troubleshooting

### Common Issues

**1. Permissions not loading**
```typescript
// Check authentication and API connectivity
const { isAuthenticated } = useAuth();
if (!isAuthenticated) {
  // Handle authentication
}
```

**2. Search not working**
```typescript
// Ensure search is enabled in options
const options = {
  showSearch: true, // Make sure this is true
};
```

**3. Export failing**
```typescript
// Check browser compatibility for file downloads
if (!window.Blob || !window.URL) {
  // Provide fallback for older browsers
}
```

**4. Performance issues**
```typescript
// Enable virtual scrolling for large datasets
const options = {
  virtualScrolling: true,
  maxVisibleNodes: 100,
};
```

### Debug Mode
```typescript
// Enable debug logging
window.PERMISSION_VIEWER_DEBUG = true;
```

## 🔄 Updates & Migration

### Version Compatibility
- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+

### Migration Guide
When upgrading from previous versions:

1. Update import statements
2. Check prop name changes
3. Update TypeScript interfaces
4. Test export functionality

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Run tests: `npm run test`

### Code Guidelines
- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Write comprehensive tests
- Document new features
- Follow accessibility standards

## 📄 License

This component is part of the Hotel Operations Hub and follows the project's licensing terms.

---

**Need help?** Check the [Hotel Operations Hub documentation](../../../CLAUDE.md) or contact the development team.