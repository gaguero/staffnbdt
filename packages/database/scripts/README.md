# Permission System Migration Scripts

This directory contains scripts for migrating from the current role-based system to a flexible permission-based system in the Hotel Operations Hub.

## Overview

The Hotel Operations Hub is transitioning from a simple role-based access control (RBAC) system to a more flexible permission-based system that supports:

- **Granular permissions** for specific actions and resources
- **Multi-tenant scoping** (platform, organization, property, department, own)
- **Module-based organization** (HR, Front Desk, Operations, etc.)
- **Hierarchical inheritance** maintaining existing access patterns
- **Future extensibility** for new modules and features

## Scripts

### 1. `seed-permissions.ts`

Creates the complete permission system with all necessary permissions and role mappings.

**What it does:**
- Creates 60+ permissions covering all current `@Roles` usage
- Maps permissions to 6 system roles with proper hierarchy
- Organizes permissions by module (HR, Front Desk, Operations, etc.)
- Sets up proper scoping (platform, organization, property, department, own)

**Usage:**
```bash
cd packages/database/scripts
npx ts-node seed-permissions.ts
```

**Output:**
- Creates `Permission` records for all required permissions
- Creates `RolePermission` mappings for role-based access
- Preserves existing security boundaries

### 2. `migrate-permissions.ts`

Migrates existing users from role-based to permission-based system.

**What it does:**
- Analyzes current user roles
- Maps each user's role to equivalent permissions
- Creates `UserPermission` records preserving current access
- Validates migration results
- Provides rollback capability

**Usage:**
```bash
# Standard migration
cd packages/database/scripts
npx ts-node migrate-permissions.ts

# Rollback migration
ROLLBACK=true npx ts-node migrate-permissions.ts

# Auto-rollback on failure
AUTO_ROLLBACK=true npx ts-node migrate-permissions.ts
```

## Permission Structure

### Permission Format
```
resource.action.scope
```

**Examples:**
- `users.create.platform` - Create users at platform level
- `tasks.read.department` - View tasks within department
- `profile.update.own` - Update personal profile

### Scopes
- **platform**: System-wide access (Platform Admin only)
- **organization**: Hotel chain/group level
- **property**: Individual hotel property
- **department**: Department within property
- **own**: Personal/self-service access

### Modules
- **hr**: User management, departments, profiles
- **benefits**: Commercial benefits directory
- **payroll**: Payroll processing and viewing
- **front_desk**: Guests, units, reservations
- **operations**: Tasks and maintenance
- **self_service**: Personal profile and documents

## Role Hierarchy and Permissions

### PLATFORM_ADMIN
- **All permissions** across all modules and scopes
- Full system administration capabilities
- Can manage platform-level settings and data

### ORGANIZATION_OWNER
- All **organization, property, department, and own** scope permissions
- Cannot access platform-level administrative functions
- Manages entire hotel chain/group

### ORGANIZATION_ADMIN
- Similar to Organization Owner
- Excludes sensitive operations like bulk imports and benefit management
- Focuses on operational management

### PROPERTY_MANAGER
- **Property, department, and own** scope permissions
- Manages individual hotel operations
- Full front desk and operational capabilities

### DEPARTMENT_ADMIN
- **Department and own** scope permissions
- Manages users and operations within their department
- Can verify documents and assign tasks

### STAFF
- **Own scope only** permissions
- Self-service access to personal information
- Can view assigned tasks and complete training

## Migration Safety

### Pre-Migration Checks
1. Validates all permissions exist in database
2. Analyzes current user role distribution
3. Verifies permission mappings are complete

### Migration Process
1. **Backup**: Current role assignments preserved
2. **Granular**: Each user gets exact permission set for their role
3. **Auditable**: All permissions tagged with migration source
4. **Validated**: Post-migration verification ensures correctness

### Rollback Capability
- Full rollback removes all migration-created permissions
- Original roles remain unchanged
- System reverts to role-based access

## Implementation Notes

### Current @Roles Coverage

**60+ endpoints mapped across 10+ controllers:**

#### Users Module (14 endpoints)
- User CRUD operations
- Role and department management
- Bulk import/export
- Statistics and reporting

#### Departments Module (5 endpoints)
- Department creation and management
- Hierarchy and statistics
- Manager assignments

#### Invitations Module (6 endpoints)
- Invitation lifecycle management
- Department-scoped invitations
- Statistics and cleanup

#### Profile Module (4 endpoints)
- Profile viewing and management
- ID document verification
- Admin oversight capabilities

#### Benefits Module (3 endpoints)
- Platform-level benefit management
- Commercial directory administration

#### Payroll Module (2 endpoints)
- CSV import capabilities
- Statistics and reporting

#### Front Desk Modules (14 endpoints)
- Guest management
- Unit/room management
- Reservation lifecycle
- Check-in/check-out processes

#### Operations Module (8 endpoints)
- Task creation and assignment
- Department-scoped viewing
- Statistics and reporting
- Maintenance workflows

### Permission Inheritance

The system maintains role hierarchy while allowing granular control:

```
PLATFORM_ADMIN
├── ORGANIZATION_OWNER
│   ├── ORGANIZATION_ADMIN
│   └── PROPERTY_MANAGER
│       └── DEPARTMENT_ADMIN
└── STAFF (self-service only)
```

### Database Schema Requirements

The migration assumes these models exist:
```prisma
model Permission {
  id          String @id
  name        String
  description String
  resource    String
  action      String
  scope       String
  module      String
  // ... timestamps and relations
}

model RolePermission {
  role         Role
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id])
  // ... constraints
}

model UserPermission {
  userId       String
  permissionId String
  grantedAt    DateTime
  grantedBy    String
  user         User       @relation(fields: [userId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  // ... constraints
}
```

## Running the Migration

### Step 1: Database Schema
Ensure permission models are added to Prisma schema and migrated.

### Step 2: Seed Permissions
```bash
cd packages/database/scripts
npx ts-node seed-permissions.ts
```

### Step 3: Migrate Users
```bash
npx ts-node migrate-permissions.ts
```

### Step 4: Update Code
Replace `@Roles()` decorators with `@RequirePermission()` in controllers.

### Step 5: Test
Verify all functionality works with permission-based system.

## Troubleshooting

### Common Issues

**Permission not found errors:**
- Ensure `seed-permissions.ts` ran successfully
- Check for typos in permission IDs

**Migration validation failures:**
- Verify Prisma schema is up to date
- Check database connectivity

**Access denied after migration:**
- Confirm user has expected permissions
- Check permission scope matches operation

### Debug Commands

```bash
# Check permission count
npx prisma db seed --preview-feature

# View user permissions
SELECT u.email, p.id, p.name 
FROM User u 
JOIN UserPermission up ON u.id = up.userId 
JOIN Permission p ON up.permissionId = p.id 
WHERE u.email = 'user@example.com';

# Check role mappings
SELECT r.role, COUNT(*) as permission_count 
FROM RolePermission r 
GROUP BY r.role;
```

## Future Enhancements

The permission system is designed to support:

1. **Custom Permissions**: Property-specific permission overrides
2. **Temporary Grants**: Time-limited permission assignments
3. **Delegation**: Manager delegation of specific permissions
4. **Module Marketplace**: Dynamic permission registration for new modules
5. **Multi-Property Access**: Users with access to multiple properties
6. **Advanced Scoping**: Complex permission contexts and conditions

This foundation supports the evolution from single-tenant HR portal to multi-tenant Hotel Operations Hub platform.