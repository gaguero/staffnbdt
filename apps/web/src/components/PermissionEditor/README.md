# Permission Editor Component

A sophisticated, drag-and-drop permission management interface for creating and editing roles in the Hotel Operations Hub system. This component serves as the crown jewel of the permission management system, providing an intuitive visual interface for complex role configurations.

## Features

### 🎨 Visual Interface
- **Drag & Drop**: Intuitive drag-and-drop permission management
- **Categorization**: Permissions organized by resource categories
- **Real-time Feedback**: Visual feedback for conflicts, dependencies, and validation
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 🔍 Smart Validation
- **Conflict Detection**: Real-time detection of conflicting permissions
- **Dependency Analysis**: Automatic identification of permission dependencies
- **Role Hierarchy Validation**: Ensures permissions match role levels
- **Auto-fix Suggestions**: Intelligent suggestions to resolve issues

### ⚡ Advanced Features
- **Role Templates**: Pre-built role configurations for common use cases
- **Permission Search**: Advanced search and filtering capabilities
- **Undo/Redo**: Complete history management with unlimited undo/redo
- **Export/Preview**: Role testing and configuration export

### ♿ Accessibility
- **Keyboard Navigation**: Full keyboard-only operation support
- **Screen Reader**: Complete screen reader compatibility
- **High Contrast**: WCAG AA contrast compliance
- **Touch Support**: Optimized for touch devices

## Components

### Core Components

#### `PermissionEditor`
The main container component that orchestrates all permission editing functionality.

```tsx
import { PermissionEditor, EditorMode } from './components/PermissionEditor';

<PermissionEditor
  mode={EditorMode.CREATE}
  onSave={handleSave}
  onCancel={handleCancel}
  showAdvancedFeatures={true}
  allowTemplateCreation={true}
  context="role-management"
/>
```

#### `PermissionPalette`
A browsable interface for available permissions, organized by category with search and filtering.

#### `PermissionWorkspace`
The workspace where selected permissions are displayed and managed, with conflict detection and grouping.

#### `ValidationPanel`
Real-time validation feedback with auto-fix suggestions and detailed error reporting.

#### `RoleMetadataEditor`
Form interface for editing role name, description, level, and other metadata.

#### `PreviewPanel`
Role testing interface with scenario simulation and export capabilities.

### Supporting Components

- **`PermissionCard`**: Individual permission display with drag/drop support
- **`RoleTemplates`**: Template selection interface
- **`SaveRoleDialog`**: Role saving with template creation options

## Hooks

### `usePermissionEditor`
Core state management hook for the permission editor.

```tsx
const {
  state,
  workspace,
  palette,
  addPermission,
  removePermission,
  validateRole,
  saveRole,
  undo,
  redo
} = usePermissionEditor({
  mode: 'create',
  autoSave: true,
  validateOnChange: true
});
```

### `useDragAndDrop`
Advanced drag-and-drop functionality with touch and keyboard support.

```tsx
const {
  dragState,
  handleMouseDown,
  handleTouchStart,
  handleKeyDown,
  registerDropZone
} = useDragAndDrop({
  onDrop: handlePermissionDrop,
  enableTouch: true,
  enableKeyboard: true
});
```

### `useRoleValidation`
Comprehensive validation engine with customizable rules.

```tsx
const {
  validateRole,
  findPermissionConflicts,
  generateSuggestions,
  autoFixIssues
} = useRoleValidation({
  enableRealTimeValidation: true,
  strictMode: true
});
```

## Usage Examples

### Basic Usage

```tsx
import React from 'react';
import { PermissionEditor, EditorMode } from './components/PermissionEditor';

function RoleManagement() {
  const handleSave = async (role) => {
    await fetch('/api/roles', {
      method: 'POST',
      body: JSON.stringify(role)
    });
  };

  return (
    <PermissionEditor
      mode={EditorMode.CREATE}
      onSave={handleSave}
      onCancel={() => history.back()}
      maxHeight={800}
    />
  );
}
```

### Advanced Configuration

```tsx
import React from 'react';
import { 
  PermissionEditor, 
  EditorMode, 
  RoleLevel,
  ValidationRule
} from './components/PermissionEditor';

// Custom validation rule
const customValidationRules: ValidationRule[] = [
  {
    name: 'hotel-specific-validation',
    severity: 'warning',
    check: (permissions, role) => {
      // Custom validation logic
      return {
        isValid: true,
        errors: [],
        suggestions: []
      };
    }
  }
];

function AdvancedRoleEditor() {
  return (
    <PermissionEditor
      mode={EditorMode.CREATE}
      onSave={handleSave}
      onCancel={handleCancel}
      onPreview={handlePreview}
      showAdvancedFeatures={true}
      allowTemplateCreation={true}
      enableComparison={true}
      context="role-management"
      customValidationRules={customValidationRules}
      maxHeight={900}
    />
  );
}
```

### Template Integration

```tsx
import { RoleTemplates } from './components/PermissionEditor';

function TemplateSelector() {
  const handleTemplateSelect = (template) => {
    // Apply template to create new role
    const newRole = {
      ...DEFAULT_ROLE_CONFIGURATION,
      name: template.name,
      description: template.description,
      permissions: template.permissions
    };
    
    setCurrentRole(newRole);
  };

  return (
    <RoleTemplates
      onSelectTemplate={handleTemplateSelect}
      onStartFromScratch={() => setShowTemplates(false)}
      showSystemTemplates={true}
      showCustomTemplates={true}
    />
  );
}
```

## API Reference

### Props

#### PermissionEditorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `EditorMode` | - | Editor mode: create, edit, view, clone |
| `roleId` | `string` | - | ID of role to edit (for edit/view/clone modes) |
| `templateId` | `string` | - | ID of template to use as starting point |
| `onSave` | `(role: RoleConfiguration) => Promise<void>` | - | Save handler |
| `onCancel` | `() => void` | - | Cancel handler |
| `onPreview` | `(role: RoleConfiguration) => void` | - | Preview handler |
| `maxHeight` | `number` | `800` | Maximum editor height |
| `showAdvancedFeatures` | `boolean` | `true` | Show advanced features |
| `allowTemplateCreation` | `boolean` | `true` | Allow creating templates |
| `enableComparison` | `boolean` | `true` | Enable role comparison |
| `context` | `'role-management' \| 'user-assignment' \| 'audit'` | `'role-management'` | Usage context |

### Types

#### RoleConfiguration
```tsx
interface RoleConfiguration {
  id?: string;
  name: string;
  displayName?: string;
  description: string;
  level: RoleLevel;
  isCustomRole: boolean;
  permissions: string[];
  conditions: PermissionCondition[];
  metadata: RoleMetadata;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  version: number;
}
```

#### ValidationError
```tsx
interface ValidationError {
  type: 'error' | 'warning' | 'info';
  field?: string;
  code: string;
  message: string;
  suggestions?: string[];
  permissionIds?: string[];
}
```

## Customization

### Custom Validation Rules

```tsx
const customRule: ValidationRule = {
  name: 'my-custom-rule',
  severity: 'warning',
  check: (permissions, role) => {
    const errors: ValidationError[] = [];
    
    // Your validation logic here
    if (someCondition) {
      errors.push({
        type: 'warning',
        code: 'custom-warning',
        message: 'Custom validation message'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      suggestions: []
    };
  }
};
```

### Custom Permission Categories

```tsx
const customCategories: Record<string, CategoryGroup> = {
  'custom-category': {
    id: 'custom-category',
    name: 'Custom Category',
    description: 'Custom permissions category',
    icon: '🏷️',
    color: 'green',
    permissions: [],
    count: 0,
    selectedCount: 0,
    isExpanded: true
  }
};
```

### Custom Role Templates

```tsx
const customTemplates: PermissionTemplate[] = [
  {
    id: 'custom-template',
    name: 'Custom Template',
    description: 'Custom role template',
    category: 'custom',
    permissions: ['permission1', 'permission2'],
    roleLevel: RoleLevel.DEPARTMENT,
    tags: ['custom'],
    popularity: 100,
    isSystemTemplate: false
  }
];
```

## Accessibility

The Permission Editor is built with accessibility as a first-class concern:

### Keyboard Navigation
- `Tab` / `Shift+Tab`: Navigate between elements
- `Enter` / `Space`: Activate buttons and selections
- `Escape`: Close dialogs and cancel operations
- `Arrow Keys`: Navigate within lists and menus
- `/`: Focus search input
- `Ctrl+Z` / `Ctrl+Y`: Undo/Redo
- `Ctrl+S`: Save role
- `Delete`: Remove selected permissions

### Screen Reader Support
- Comprehensive ARIA labels and descriptions
- Live regions for dynamic content updates
- Proper heading hierarchy
- Clear focus indicators

### Visual Accessibility
- High contrast color scheme
- Consistent focus indicators
- Scalable interface elements
- Reduced motion support

## Performance

### Optimization Features
- Virtual scrolling for large permission lists
- Debounced search and validation
- Memoized calculations for complex operations
- Efficient re-rendering with React.memo
- Lazy loading of templates and advanced features

### Performance Metrics
- Initial load: < 2s
- Search response: < 100ms
- Validation feedback: < 200ms
- Drag operations: 60fps
- Memory usage: Optimized for large datasets

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with touch support

## Contributing

When contributing to the Permission Editor:

1. Maintain TypeScript strict mode compliance
2. Add comprehensive tests for new features
3. Follow accessibility guidelines (WCAG 2.1 AA)
4. Update documentation for new props/features
5. Ensure mobile responsiveness
6. Test with screen readers

## Testing

### Unit Tests
```bash
npm run test -- --testPathPattern=PermissionEditor
```

### E2E Tests
```bash
npm run test:e2e -- --spec="permission-editor"
```

### Accessibility Tests
```bash
npm run test:a11y -- --component="PermissionEditor"
```

## Changelog

### v1.0.0 (Current)
- Initial release with full feature set
- Drag-and-drop permission management
- Real-time validation engine
- Role templates system
- Comprehensive accessibility support
- Mobile-responsive design

## License

This component is part of the Hotel Operations Hub and follows the project's licensing terms.