# Role Badge System Documentation

## Overview

The Role Badge System provides a comprehensive, reusable component library for displaying user roles throughout the Hotel Operations Hub application. It supports both system roles (built-in hierarchy) and custom roles (user-defined) with consistent styling, accessibility features, and responsive design.

## Components

### 1. RoleBadge (`components/RoleBadge.tsx`)

The core badge component for displaying individual roles.

#### Props
```typescript
interface RoleBadgeProps {
  role: string | Role;              // Role name or enum value
  isCustomRole?: boolean;           // Whether this is a custom role
  size?: 'sm' | 'md' | 'lg';       // Badge size variant
  showTooltip?: boolean;            // Show description on hover
  customRoles?: CustomRole[];       // Custom role data for tooltips
  className?: string;               // Additional CSS classes
}
```

#### Usage Examples
```tsx
// System role
<RoleBadge role={Role.PROPERTY_MANAGER} size="md" />

// Custom role
<RoleBadge 
  role="Night Manager"
  isCustomRole={true}
  customRoles={customRoleData}
  showTooltip={true}
/>
```

### 2. RoleBadgeGroup (`components/RoleBadgeGroup.tsx`)

Displays multiple roles for users with both system and custom role assignments.

#### Props
```typescript
interface RoleBadgeGroupProps {
  systemRole: string | Role;       // Primary system role
  customRoles?: CustomRole[];      // Additional custom roles
  size?: 'sm' | 'md' | 'lg';      // Size for all badges
  maxVisible?: number;             // Max badges before collapsing
  showTooltips?: boolean;          // Show tooltips on all badges
  direction?: 'horizontal' | 'vertical'; // Layout direction
  className?: string;              // Additional CSS classes
}
```

#### Usage Examples
```tsx
// Multiple roles with overflow handling
<RoleBadgeGroup
  systemRole={Role.DEPARTMENT_ADMIN}
  customRoles={[nightManager, eventCoordinator]}
  maxVisible={2}
  direction="horizontal"
/>
```

### 3. UserCard (`components/UserCard.tsx`)

Enhanced user profile card with integrated role badge display.

#### Props
```typescript
interface UserCardProps {
  user: User;                      // User data
  customRoles?: CustomRole[];      // User's custom roles
  showDetails?: boolean;           // Show additional user details
  showActions?: boolean;           // Show action buttons
  onClick?: (user: User) => void;  // Card click handler
  onEdit?: (user: User) => void;   // Edit button handler
  onDelete?: (user: User) => void; // Delete/restore handler
  className?: string;              // Additional CSS classes
}
```

## System Roles Hierarchy

The system supports 6 built-in roles with defined hierarchy and permissions:

| Role | Level | Icon | Description |
|------|-------|------|-------------|
| `PLATFORM_ADMIN` | 0 | 🌐 | Manages entire platform and all tenants |
| `ORGANIZATION_OWNER` | 1 | 👑 | Manages hotel chain/group operations |
| `ORGANIZATION_ADMIN` | 2 | ⚙️ | Manages organization settings and policies |
| `PROPERTY_MANAGER` | 3 | 🏨 | Manages individual hotel property operations |
| `DEPARTMENT_ADMIN` | 4 | 📋 | Manages specific department within property |
| `STAFF` | 5 | 👤 | Self-service access to own resources |

## Custom Roles

Custom roles are user-defined roles that extend the system capabilities:
- Unique styling (violet color scheme with ✨ indicator)
- Custom descriptions and tooltips
- Flexible level assignment
- Integration with permission system

## Styling & Theming

### Color Scheme
- **System Roles**: Color-coded by hierarchy level (red → purple → blue → green → gray)
- **Custom Roles**: Consistent violet color scheme with sparkle indicator
- **Dark Mode**: Automatic color adjustments for dark themes
- **Accessibility**: WCAG-compliant contrast ratios

### Size Variants
- **Small (`sm`)**: `px-2 py-0.5 text-xs` - For compact displays
- **Medium (`md`)**: `px-2.5 py-1 text-sm` - Default size for most uses
- **Large (`lg`)**: `px-3 py-1.5 text-base` - For prominent displays

## Accessibility Features

✅ **Screen Reader Support**
- Proper ARIA labels and roles
- Descriptive tooltip content
- Icon alternatives with aria-hidden

✅ **Keyboard Navigation**
- Focus management for interactive elements
- Logical tab order
- Keyboard-accessible tooltips

✅ **Visual Accessibility**
- High contrast colors (WCAG AA compliant)
- Clear visual hierarchy
- Scalable text and spacing

✅ **Responsive Design**
- Mobile-friendly touch targets
- Flexible layouts
- Breakpoint-aware sizing

## Integration Examples

### Basic Usage in User Lists
```tsx
// In UserManagementPage.tsx
const getRoleBadge = (role: string) => (
  <RoleBadge
    role={role}
    size="sm"
    showTooltip={true}
  />
);

// Usage in table
<td className="px-6 py-4">{getRoleBadge(user.role)}</td>
```

### Role Management Interface
```tsx
// In RolesManagementPage.tsx
<RoleBadge
  role={userRole?.role?.name}
  isCustomRole={true}
  customRoles={[{
    id: userRole?.role?.id,
    name: userRole?.role?.name,
    description: userRole?.role?.description
  }]}
  size="sm"
/>
```

### User Profile Cards
```tsx
// Grid of user cards with role badges
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {users.map(user => (
    <UserCard
      key={user.id}
      user={user}
      customRoles={userCustomRoles[user.id]}
      onEdit={handleEditUser}
      onDelete={handleDeleteUser}
    />
  ))}
</div>
```

## Utility Functions

### Role Helper Hook (`hooks/useRoleHelpers.ts`)
```typescript
const {
  isSystemRole,
  formatRoleName,
  getRoleLevel,
  canManageRole,
  sortRolesByLevel,
  getAvailableRolesToAssign
} = useRoleHelpers(customRoles);
```

### Role UI Hook
```typescript
const {
  canCreateRole,
  canAssignRole,
  canViewRoleAnalytics,
  canManageCustomRoles
} = useRoleUI(userRole, customRoles);
```

## Data Types

### Core Types (`types/role.ts`)
```typescript
interface SystemRole {
  id: Role;
  label: string;
  description: string;
  level: number;
  icon: string;
}

interface CustomRole {
  id: string;
  name: string;
  description?: string;
  level?: number;
  permissions: Permission[];
}

interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  roleType: 'system' | 'custom';
  assignedAt: Date;
}
```

## Performance Considerations

### Optimizations
- **Memoized Components**: Role badges use React.memo for re-render prevention
- **Efficient Sorting**: Role helper functions use optimized sorting algorithms
- **Lazy Loading**: Tooltip content loaded only when needed
- **CSS-in-JS Avoided**: Uses Tailwind for better performance

### Best Practices
1. **Batch Updates**: Group role assignments for bulk operations
2. **Prop Drilling**: Use context for deeply nested role data
3. **Caching**: Cache role permissions and hierarchy data
4. **Virtualization**: Use virtual scrolling for large user lists

## Testing Strategy

### Unit Tests
- Component rendering with different props
- Role hierarchy logic validation
- Accessibility compliance checks
- Tooltip behavior verification

### Integration Tests
- Role assignment workflows
- Permission system integration
- Multi-role user scenarios
- Responsive design validation

### E2E Tests
- Complete role management workflows
- User card interactions
- Badge display across different pages
- Mobile device compatibility

## Migration Guide

### From Legacy Role Badges
1. **Replace inline role styling**:
   ```tsx
   // Old
   <span className="badge bg-blue-100">Manager</span>
   
   // New
   <RoleBadge role={Role.PROPERTY_MANAGER} size="sm" />
   ```

2. **Update role display logic**:
   ```tsx
   // Old
   const getRoleBadge = (role) => {
     switch(role) {
       case 'MANAGER': return <span>Manager</span>;
       // ...
     }
   };
   
   // New
   const getRoleBadge = (role) => (
     <RoleBadge role={role} showTooltip={true} />
   );
   ```

3. **Integrate custom roles**:
   ```tsx
   // Add custom role support
   <RoleBadgeGroup
     systemRole={user.systemRole}
     customRoles={user.customRoles}
     maxVisible={3}
   />
   ```

## Troubleshooting

### Common Issues

**Badge not displaying correctly**
- Check that role value matches enum or custom role name
- Verify customRoles prop is passed for custom roles
- Ensure proper isCustomRole flag

**Tooltip not showing**
- Confirm showTooltip={true}
- Check that description exists for the role
- Verify z-index conflicts

**Styling inconsistencies**
- Ensure Tailwind classes are not being purged
- Check for CSS conflicts with parent components
- Verify responsive breakpoints

**Performance issues**
- Use React DevTools to check for unnecessary re-renders
- Implement proper key props in lists
- Consider memoization for expensive role calculations

## Future Enhancements

### Planned Features
- **Role Templates**: Pre-configured role sets for common scenarios
- **Visual Role Hierarchy**: Tree view of role relationships
- **Bulk Role Assignment**: Multi-select operations for role management
- **Role Analytics**: Usage statistics and assignment trends
- **Custom Badge Colors**: User-configurable color schemes
- **Role Expiration**: Time-based role assignments

### API Extensions
- GraphQL fragments for efficient role data fetching
- WebSocket subscriptions for real-time role updates
- Bulk operations API for performance improvements
- Role audit trail and versioning system

---

For implementation questions or feature requests, please refer to the project's main documentation or contact the development team.