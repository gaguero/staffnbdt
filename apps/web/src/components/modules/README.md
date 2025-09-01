# Module Management System

A comprehensive UI system for managing module subscriptions and property-level overrides in the Hotel Operations Hub platform.

## Features

### 🎯 Core Functionality
- **Visual Precedence Indicators**: Clear color coding to distinguish organization vs property settings
- **Override Management**: Create, update, and remove property-level module overrides
- **Dependency Tracking**: Visualize module dependencies and their satisfaction status
- **Permission-Based Access**: Role-based controls for different user types
- **Real-time Updates**: Live status updates with loading states and error handling

### 🎨 Visual Design System
- **Color Coding**: 
  - 🔵 Blue: Organization-level settings
  - 🟢 Green: Property-level overrides  
  - 🟣 Purple: System modules
- **Status Indicators**: ✅ Enabled, ❌ Disabled, 🔄 Override Active, 📋 System Module
- **Responsive Design**: Mobile-first approach with tablet/desktop optimizations

## Components

### ModuleStatusCard
Main card component displaying module information with toggle controls.

```tsx
<ModuleStatusCard
  moduleStatus={moduleStatusResponse}
  onToggle={handleToggle}
  onRemoveOverride={handleRemoveOverride}
  className="h-full"
/>
```

**Props:**
- `moduleStatus`: Complete module status including org/property settings
- `onToggle`: Handler for enabling/disabling modules
- `onRemoveOverride`: Handler for removing property overrides
- `className`: Additional CSS classes

### ModuleOverrideDialog
Confirmation dialog for override operations with clear impact explanation.

```tsx
<ModuleOverrideDialog
  isOpen={showDialog}
  onClose={closeDialog}
  onConfirm={confirmAction}
  moduleName="hotel-operations"
  action="enable"
  currentOrgSetting={false}
  proposedPropertySetting={true}
  isLoading={false}
/>
```

**Props:**
- `action`: 'enable' | 'disable' | 'remove'
- `currentOrgSetting`: Current organization-level setting
- `proposedPropertySetting`: Proposed property-level setting

### PropertyModuleSettings
Focused view for managing property-specific module overrides.

```tsx
<PropertyModuleSettings className="space-y-6" />
```

### ModuleManagementDashboard
Complete dashboard with tabs, search, filtering, and stats.

```tsx
<ModuleManagementDashboard className="max-w-7xl mx-auto" />
```

### ModuleStatusBadge
Reusable badge component for status display.

```tsx
<ModuleStatusBadge
  status="enabled"
  source="property"
  size="md"
  showIcon={true}
  showTooltip={true}
/>
```

### ModuleDependencyIndicator
Visual dependency tracker with satisfaction status.

```tsx
<ModuleDependencyIndicator
  dependencies={moduleDependencies}
  showDetails={true}
  maxVisible={3}
/>
```

## Hooks

### useModuleManagement
Comprehensive hook for module state management.

```tsx
const {
  moduleStatuses,
  isLoading,
  error,
  toggleModule,
  updatePropertyOverride,
  removePropertyOverride,
  getModulesWithOverrides,
  canManage
} = useModuleManagement();
```

**Returns:**
- **Data**: `moduleStatuses`, `availableModules`
- **State**: `isLoading`, `error`
- **Actions**: `toggleModule`, `updatePropertyOverride`, `removePropertyOverride`
- **Permissions**: `canManage`, `canManageOrganization`, `canManageProperty`
- **Utilities**: `getModulesByCategory`, `getModulesWithOverrides`, etc.

## Services

### moduleService
API service for module operations.

```tsx
// Get module statuses for a property
const statuses = await moduleService.getModulesStatus(propertyId);

// Update organization-level module
await moduleService.updateOrganizationModule(orgId, 'module-name', true);

// Create property override
await moduleService.updatePropertyOverride({
  moduleName: 'module-name',
  isEnabled: true,
  propertyId: 'prop-123'
});

// Remove property override
await moduleService.removePropertyOverride(propertyId, 'module-name');
```

## Usage Patterns

### Basic Module Card
```tsx
import { ModuleStatusCard } from './components/modules';

const MyModuleList = () => {
  const { moduleStatuses, toggleModule, removePropertyOverride } = useModuleManagement();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {moduleStatuses.map((status) => (
        <ModuleStatusCard
          key={status.module.id}
          moduleStatus={status}
          onToggle={toggleModule}
          onRemoveOverride={removePropertyOverride}
        />
      ))}
    </div>
  );
};
```

### Property Override Management
```tsx
import { PropertyModuleSettings } from './components/modules';

const PropertySettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1>Property Module Settings</h1>
      <PropertyModuleSettings />
    </div>
  );
};
```

### Full Dashboard
```tsx
import { ModuleManagementDashboard } from './components/modules';

const AdminModulesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <ModuleManagementDashboard />
      </div>
    </div>
  );
};
```

## Permissions

The module management system respects the existing permission framework:

- `module.manage.organization`: Can manage org-level modules
- `module.manage.property`: Can manage property overrides
- `module.read.organization`: Can view org-level settings
- `module.read.property`: Can view property settings

## TypeScript Types

```tsx
interface ModuleInfo {
  id: string;
  name: string;
  description?: string;
  category: string;
  version: string;
  isSystemModule: boolean;
  dependencies?: string[];
}

interface ModuleSubscription {
  id: string;
  organizationId: string;
  propertyId?: string;
  moduleName: string;
  isEnabled: boolean;
  settings?: Record<string, any>;
}

interface ModuleStatusResponse {
  module: ModuleInfo;
  orgSubscription?: ModuleSubscription;
  propertySubscription?: ModuleSubscription;
  effectiveStatus: {
    isEnabled: boolean;
    source: 'organization' | 'property' | 'system';
    hasOverride: boolean;
  };
  dependencies: ModuleDependency[];
}
```

## Styling

The components use the established design system with:

- **CSS Variables**: Brand-aware colors via `var(--brand-primary)`, etc.
- **Tailwind Classes**: Consistent spacing and responsive design
- **Animation**: Framer Motion for smooth interactions
- **Loading States**: Skeleton components and spinners
- **Hover Effects**: Lift, glow, and scale transformations

## Testing

Components include comprehensive accessibility features:
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly
- Focus management

## Mobile Optimization

- Touch-friendly toggle switches
- Responsive grid layouts
- Collapsible sections for small screens
- Swipe gestures where appropriate
- Bottom sheet modals on mobile

This system provides a complete solution for managing the complex module subscription and override system while maintaining excellent user experience and visual clarity.