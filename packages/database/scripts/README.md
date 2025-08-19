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

### 3. `validate-permission-coverage.ts`

Validates that all endpoints are properly covered by permission checks.

**What it does:**
- Scans all controller endpoints for permission decorators
- Identifies missing permission checks
- Validates permission definitions match usage
- Generates coverage report

**Usage:**
```bash
cd packages/database/scripts
npx ts-node validate-permission-coverage.ts
```

**Output:**
- Coverage report showing protected/unprotected endpoints
- List of missing permissions
- Recommendations for improving security

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

## Production Deployment Procedures

### Pre-Deployment Checklist

1. **Environment Variables**
   ```bash
   # Verify all required environment variables are set
   DATABASE_URL
   REDIS_URL
   JWT_SECRET
   NODE_ENV=production
   ```

2. **Database Backup**
   ```bash
   # Create backup before migration
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Schema Migration**
   ```bash
   # Deploy schema changes
   cd packages/database
   npx prisma migrate deploy
   npx prisma generate
   ```

### Deployment Steps

#### Step 1: Deploy Schema Changes
```bash
cd packages/database
npx prisma migrate deploy
```

#### Step 2: Seed Permissions
```bash
cd packages/database/scripts
NODE_ENV=production npx ts-node seed-permissions.ts
```

#### Step 3: Migrate Users (Production)
```bash
# Run with production safety checks
PRODUCTION=true AUTO_ROLLBACK=true npx ts-node migrate-permissions.ts
```

#### Step 4: Validate Coverage
```bash
# Ensure all endpoints are protected
npx ts-node validate-permission-coverage.ts
```

#### Step 5: Deploy Application
```bash
# Deploy backend with new permission system
git push origin main  # Triggers Railway deployment
```

### Post-Deployment Verification

1. **Health Check**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **Permission System Status**
   ```bash
   curl https://your-app.railway.app/api/permissions/health
   ```

3. **Test User Access**
   ```bash
   # Test with different role users
   curl -H "Authorization: Bearer $JWT_TOKEN" \
        https://your-app.railway.app/api/users
   ```

### Rollback Procedures

#### Immediate Rollback (if issues detected)
```bash
# 1. Rollback application deployment
git revert HEAD
git push origin main

# 2. Rollback permission migration
ROLLBACK=true npx ts-node migrate-permissions.ts

# 3. Restore database if needed
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

#### Gradual Rollback
```bash
# 1. Switch backend to role-based mode
export USE_LEGACY_ROLES=true

# 2. Deploy with feature flag
# 3. Monitor for 24 hours
# 4. Complete rollback if needed
```

## Troubleshooting Guide

### Common Issues

#### 1. Permission Not Found Errors
**Symptoms:**
- 403 errors with "Permission not found" message
- Missing permission IDs in logs

**Diagnosis:**
```bash
# Check if permissions were seeded
psql $DATABASE_URL -c "SELECT COUNT(*) FROM Permission;"

# Expected: 60+ permissions
```

**Resolution:**
```bash
# Re-run permission seeding
cd packages/database/scripts
npx ts-node seed-permissions.ts
```

#### 2. Migration Validation Failures
**Symptoms:**
- Migration script fails with validation errors
- User count mismatches

**Diagnosis:**
```bash
# Check database schema
npx prisma db pull
npx prisma generate

# Verify user count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM User;"
```

**Resolution:**
```bash
# Update schema and retry
npx prisma migrate deploy
npx prisma generate
npx ts-node migrate-permissions.ts
```

#### 3. Access Denied After Migration
**Symptoms:**
- Users cannot access previously available features
- 403 errors for legitimate operations

**Diagnosis:**
```sql
-- Check user permissions
SELECT u.email, u.role, p.id as permission_id, p.name
FROM User u
LEFT JOIN UserPermission up ON u.id = up.userId
LEFT JOIN Permission p ON up.permissionId = p.id
WHERE u.email = 'user@example.com'
ORDER BY p.name;

-- Check role permissions
SELECT rp.role, COUNT(*) as permission_count
FROM RolePermission rp
GROUP BY rp.role;
```

**Resolution:**
```bash
# Re-assign permissions based on role
psql $DATABASE_URL -c "
INSERT INTO UserPermission (userId, permissionId, grantedAt, grantedBy)
SELECT u.id, rp.permissionId, NOW(), 'system'
FROM User u
JOIN RolePermission rp ON u.role = rp.role
WHERE NOT EXISTS (
  SELECT 1 FROM UserPermission up 
  WHERE up.userId = u.id AND up.permissionId = rp.permissionId
);"
```

#### 4. Performance Issues
**Symptoms:**
- Slow permission checks
- High database load
- Timeout errors

**Diagnosis:**
```sql
-- Check permission query performance
EXPLAIN ANALYZE
SELECT p.* FROM Permission p
JOIN UserPermission up ON p.id = up.permissionId
WHERE up.userId = 'user-id';

-- Check index usage
\d+ UserPermission
\d+ RolePermission
```

**Resolution:**
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permission_user_id 
ON UserPermission(userId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permission_role 
ON RolePermission(role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_resource_action 
ON Permission(resource, action);
```

#### 5. Cache Issues
**Symptoms:**
- Stale permission data
- Inconsistent access behavior
- Permission changes not reflected

**Diagnosis:**
```bash
# Check Redis cache
redis-cli -u $REDIS_URL
> KEYS permission:*
> TTL permission:user:123
```

**Resolution:**
```bash
# Clear permission cache
redis-cli -u $REDIS_URL FLUSHDB

# Or specific user
redis-cli -u $REDIS_URL DEL permission:user:123
```

### Debug Commands

#### Database Queries
```sql
-- Check permission count by module
SELECT module, COUNT(*) as permission_count 
FROM Permission 
GROUP BY module 
ORDER BY permission_count DESC;

-- Check user permission distribution
SELECT u.role, COUNT(DISTINCT up.permissionId) as permission_count
FROM User u
LEFT JOIN UserPermission up ON u.id = up.userId
GROUP BY u.role
ORDER BY permission_count DESC;

-- Find users without permissions
SELECT u.id, u.email, u.role
FROM User u
LEFT JOIN UserPermission up ON u.id = up.userId
WHERE up.userId IS NULL;

-- Check permission conflicts
SELECT p1.id, p1.name, p2.id, p2.name
FROM Permission p1, Permission p2
WHERE p1.resource = p2.resource 
  AND p1.action = p2.action 
  AND p1.scope = p2.scope 
  AND p1.id != p2.id;
```

#### Application Health
```bash
# Check permission service health
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://your-app.railway.app/api/permissions/health

# Test specific permission
curl -X POST \
     -H "Authorization: Bearer $USER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"resource":"user","action":"create","scope":"department"}' \
     https://your-app.railway.app/api/permissions/check

# Get user permissions
curl -H "Authorization: Bearer $USER_TOKEN" \
     https://your-app.railway.app/api/permissions/user
```

### Monitoring and Alerts

#### Key Metrics
- Permission check latency (should be < 100ms)
- Cache hit rate (should be > 90%)
- Failed permission checks rate
- Permission grant/revoke operations

#### Log Patterns to Monitor
```bash
# Permission denied events
grep "Permission denied" /var/log/app.log

# Permission system errors
grep "PermissionService error" /var/log/app.log

# Slow permission queries
grep "Slow permission query" /var/log/app.log
```

### Maintenance Tasks

#### Daily
- Monitor permission check error rates
- Check cache performance metrics
- Review permission denied logs

#### Weekly
- Audit permission assignments
- Clean up expired cache entries
- Review performance metrics

#### Monthly
- Update permission definitions
- Review and update role mappings
- Optimize database queries
- Security audit of permission grants

## Future Enhancements

The permission system is designed to support:

1. **Custom Permissions**: Property-specific permission overrides
2. **Temporary Grants**: Time-limited permission assignments
3. **Delegation**: Manager delegation of specific permissions
4. **Module Marketplace**: Dynamic permission registration for new modules
5. **Multi-Property Access**: Users with access to multiple properties
6. **Advanced Scoping**: Complex permission contexts and conditions

This foundation supports the evolution from single-tenant HR portal to multi-tenant Hotel Operations Hub platform.