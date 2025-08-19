# Production Authorization Debug Guide

This guide helps diagnose and fix authorization issues in the production environment.

## Quick Diagnosis Commands

### 1. Check Overall Permission System Health
```bash
cd packages/database
npm run permissions:check:production
```

**Expected Output:**
- Total Permissions: 81
- Total Custom Roles: 7 system roles
- Role-Permission Mappings: ~297

### 2. Check Specific User Permissions
```bash
npm run permissions:verify:user -- user@example.com
npm run permissions:verify:user -- user@example.com --show-all-permissions
```

### 3. Quick Fix for Common Issues
```bash
# Dry run to see what would be fixed
npm run permissions:fix:production -- --dry-run

# Apply fixes (requires confirmation)
npm run permissions:fix:production -- --force
```

## Common Issues and Solutions

### Issue 1: User with PROPERTY_MANAGER role getting 403 errors

**Symptoms:**
- User has legacy role PROPERTY_MANAGER
- Getting 403 on `/users/stats`, `/departments/{id}`, `/users/{id}/status`
- Console shows "Insufficient permissions" errors

**Diagnosis:**
```bash
npm run permissions:verify:user -- user@example.com
```

**Expected Problems:**
- No custom role assigned (`customRoleName: null`)
- Missing property-scoped permissions

**Solutions:**

1. **Quick Fix - Assign Property Manager Role:**
```bash
npm run permissions:fix:production -- --update-users --force
```

2. **Manual Fix - Direct Database Update:**
```sql
UPDATE users 
SET custom_role_id = (
    SELECT id FROM custom_roles 
    WHERE name = 'Property Manager' AND is_system_role = true
) 
WHERE email = 'user@example.com';
```

3. **Temporary Admin Access for Testing:**
```bash
npm run permissions:fix:production -- --grant-admin=USER_ID --force
```

### Issue 2: Permission System Not Initialized

**Symptoms:**
```bash
npm run permissions:check:production
# Shows: Total Permissions: 0, Total Custom Roles: 0
```

**Solution:**
```bash
# Re-seed the entire permission system
npm run permissions:fix:production -- --reseed-permissions --force
```

### Issue 3: Partial Permission Data

**Symptoms:**
- Some permissions exist but not all 81
- Some roles exist but missing permission mappings

**Solution:**
```bash
# Complete fix of all permission data
npm run permissions:fix:production -- --force
```

## Environment Variables for Permission System

Add these to Railway environment variables if missing:

```bash
# Permission System Configuration
PERMISSION_SYSTEM_ENABLED=true
ROLE_BASED_ACCESS_CONTROL=true
TENANT_ISOLATION_MODE=strict

# Debug Settings (remove in production)
DEBUG_PERMISSIONS=true
LOG_AUTHORIZATION_FAILURES=true
```

## Permission System Architecture

### Role Hierarchy (in order of permissions):

1. **Super Administrator** (PLATFORM_ADMIN)
   - All 81 permissions
   - Platform-wide access

2. **Organization Manager** (ORGANIZATION_ADMIN/OWNER)
   - ~60 permissions
   - Organization and property scope

3. **Property Manager** (PROPERTY_MANAGER)
   - ~45 permissions  
   - Property and department scope

4. **Department Supervisor** (DEPARTMENT_ADMIN)
   - ~25 permissions
   - Department scope + some property tasks

5. **Front Desk Agent**
   - ~15 permissions
   - Guest/reservation operations

6. **Housekeeping Staff**
   - ~10 permissions
   - Unit/task operations

7. **Staff Member** (STAFF)
   - ~8 permissions
   - Self-service only

### Permission Format: `resource.action.scope`

**Resources:** user, department, role, payslip, vacation, guest, reservation, unit, task, training, document, benefit

**Actions:** create, read, update, delete, assign, approve, import, enroll, complete, checkin, checkout

**Scopes:** all, organization, property, department, own

### Critical Endpoints and Required Permissions:

| Endpoint | Method | Required Permission | Notes |
|----------|--------|-------------------|-------|
| `/users/stats` | GET | `user.read.all` | Platform admin only |
| `/departments/{id}` | PUT | `department.update.property` | Property manager+ |
| `/users/{id}/status` | PATCH | `user.update.property` | Property manager+ |
| `/users/{id}/role` | PATCH | `role.assign.property` | Property manager+ |
| `/users` | POST | `user.create.property` | Property manager+ |
| `/vacation/{id}/approve` | PATCH | `vacation.approve.property` | Property manager+ |

## Troubleshooting Steps

### Step 1: Verify Database Connection
```bash
npm run permissions:check:production -- --check-env
```

### Step 2: Check User Context
```bash
npm run permissions:verify:user -- user@example.com --show-all-permissions
```

### Step 3: Verify Role Assignment
Look for these in the output:
- `customRoleName` should not be null
- `effectivePermissions` should match role expectations
- `endpointAccess` should show allowed access for relevant endpoints

### Step 4: Fix Issues
```bash
# Start with dry run
npm run permissions:fix:production -- --dry-run

# Apply fixes if dry run looks good
npm run permissions:fix:production -- --force
```

### Step 5: Verify Fix
```bash
npm run permissions:verify:user -- user@example.com
```

## Manual Database Queries for Emergency Fixes

### Grant Property Manager Role to User:
```sql
-- Find user ID
SELECT id, email, role FROM users WHERE email = 'user@example.com';

-- Find Property Manager role ID
SELECT id, name FROM custom_roles WHERE name = 'Property Manager' AND is_system_role = true;

-- Assign role
UPDATE users SET custom_role_id = 'ROLE_ID_HERE' WHERE id = 'USER_ID_HERE';
```

### Grant Temporary Platform Admin Access:
```sql
-- Find Super Administrator role
SELECT id, name FROM custom_roles WHERE name = 'Super Administrator' AND is_system_role = true;

-- Grant admin access
UPDATE users SET 
  custom_role_id = 'SUPER_ADMIN_ROLE_ID', 
  role = 'PLATFORM_ADMIN'
WHERE email = 'user@example.com';
```

### Check User's Effective Permissions:
```sql
SELECT 
  u.email,
  u.role as legacy_role,
  cr.name as custom_role,
  p.resource,
  p.action,
  p.scope,
  CONCAT(p.resource, '.', p.action, '.', p.scope) as permission_key
FROM users u
LEFT JOIN custom_roles cr ON u.custom_role_id = cr.id
LEFT JOIN role_permissions rp ON cr.id = rp.role_id AND rp.granted = true
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'user@example.com'
ORDER BY p.resource, p.action, p.scope;
```

## Testing Authorization Fixes

After applying fixes, test these endpoints:

1. **User Stats (Platform Admin only):**
```bash
curl -H "Authorization: Bearer TOKEN" https://api.domain.com/users/stats
```

2. **Department Update (Property Manager+):**
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Updated Department"}' \
  https://api.domain.com/departments/DEPT_ID
```

3. **User Status Change (Property Manager+):**
```bash
curl -X PATCH -H "Authorization: Bearer TOKEN" \
  -d '{"isActive":false}' \
  https://api.domain.com/users/USER_ID/status
```

## Monitoring and Alerts

Set up monitoring for these metrics:

1. **Permission Check Failures:** Should be < 1% of requests
2. **Users Without Custom Roles:** Should be 0
3. **Failed Authorization Attempts:** Monitor for unusual spikes
4. **Role Assignment Distribution:** Property Managers should have proper permissions

## Production Deployment Checklist

Before deploying permission system changes:

- [ ] Test permission scripts in staging environment
- [ ] Backup production database
- [ ] Run dry-run of permission fixes
- [ ] Verify critical user accounts have proper access
- [ ] Test critical endpoints after deployment
- [ ] Monitor error logs for authorization failures
- [ ] Have rollback plan ready

## Emergency Contacts

If permission system is completely broken:

1. **Immediate Fix:** Grant Platform Admin to yourself:
```bash
npm run permissions:fix:production -- --grant-admin=YOUR_USER_ID --force
```

2. **Database Recovery:** Restore from backup and re-run:
```bash
npm run permissions:setup
```

3. **Complete Reset:** Only if absolutely necessary:
```bash
npm run permissions:migrate -- --reset
npm run permissions:setup
```

---

**Last Updated:** August 19, 2025
**Version:** 1.0
**Environment:** Production Railway Deployment