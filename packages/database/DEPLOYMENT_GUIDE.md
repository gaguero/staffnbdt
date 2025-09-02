# Concierge & Vendors Module Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Verification
```bash
# Ensure you have the correct DATABASE_URL
echo $DATABASE_URL

# Or check Railway environment variables
railway variables
```

### 2. Schema Validation
```bash
# Generate and validate Prisma client
cd packages/database
npm run db:generate
```

### 3. Backup Production Database (Recommended)
```bash
# Connect to Railway production database
railway shell
pg_dump $DATABASE_URL > concierge_vendors_backup_$(date +%Y%m%d_%H%M%S).sql
exit
```

## Deployment Steps

### Step 1: Deploy Schema Changes
```bash
# From packages/database directory
npm run migrate:concierge-vendors
```

**Expected Output**:
```
🏨 Hotel Operations Hub - Concierge & Vendors Migration
============================================================
🚀 Executing migration: 000_create_migration_logs
✅ Successfully executed: 000_create_migration_logs
🚀 Executing migration: 002_concierge_vendors_optimization
✅ Successfully executed: 002_concierge_vendors_optimization

🔍 Running verification checks...
✅ Table ConciergeObject exists
✅ Table ConciergeAttribute exists
✅ EAV constraint exists
✅ Concierge module manifest: exists
✅ Vendors module manifest: exists

🎉 All migrations completed successfully!
```

### Step 2: Verify Deployment
```bash
npm run verify:concierge-vendors
```

**Expected Output**:
```
🔍 Running Concierge & Vendors Schema Verification
============================================================
✅ ConciergeObject Table: OK (Required)
✅ ConciergeAttribute EAV Table: OK (Required)
✅ EAV Value Constraint: OK (Required)
✅ ObjectType Table: OK (Required)
✅ Playbook Table: OK (Required)
✅ Vendor Table: OK (Required)
✅ VendorLink Table: OK (Required)
✅ VendorPortalToken Table: OK (Required)
✅ ModuleSubscription Property Override: OK (Required)
✅ Concierge Module Manifest: OK (Required)
✅ Vendors Module Manifest: OK (Required)
✅ Performance Indexes: OK (Optional)
✅ Tenant Isolation Indexes: OK (Required)

📊 Summary:
   ✅ Passed: 13
   ❌ Failed: 0
   📊 Total: 13

🎉 All required checks passed!
The Concierge & Vendors schema is ready for development.
```

### Step 3: Update Application Code
```bash
# Regenerate Prisma client with new schema
npm run db:generate

# Update BFF application
cd ../../apps/bff
npm install

# Update frontend application
cd ../web
npm install
```

### Step 4: Deploy to Railway
```bash
# Commit and push changes
git add .
git commit -m "feat: implement Concierge & Vendors database schema

- Add EAV pattern for ConciergeObject with typed attributes
- Add Vendor directory and link management
- Add VendorPortalToken for magic-link access
- Add ModuleSubscription property-level overrides
- Add performance indexes and constraints
- Add module manifests and sample data
- Enable modules for existing organizations

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin dev
```

## Post-Deployment Verification

### 1. Health Check
```bash
# Verify API health
curl -I https://bff-copy-production-328d.up.railway.app/api/health
```

### 2. Database Connection
```bash
# Test database connection
railway shell
psql $DATABASE_URL -c "SELECT COUNT(*) FROM module_manifests WHERE \"moduleId\" IN ('concierge', 'vendors');"
```

### 3. Module Enablement
```bash
# Check module subscriptions
psql $DATABASE_URL -c "SELECT o.name, ms.moduleName, ms.isEnabled FROM \"Organization\" o JOIN \"ModuleSubscription\" ms ON o.id = ms.\"organizationId\" WHERE ms.\"moduleName\" IN ('concierge', 'vendors');"
```

## Rollback Procedure (If Needed)

### Option 1: Restore from Backup
```bash
railway shell
psql $DATABASE_URL < concierge_vendors_backup_YYYYMMDD_HHMMSS.sql
```

### Option 2: Manual Rollback
```sql
-- Remove module manifests
DELETE FROM module_manifests WHERE "moduleId" IN ('concierge', 'vendors');

-- Remove module subscriptions
DELETE FROM "ModuleSubscription" WHERE "moduleName" IN ('concierge', 'vendors');

-- Drop tables (careful - this loses all data)
DROP TABLE IF EXISTS "VendorPortalToken";
DROP TABLE IF EXISTS "VendorLink";
DROP TABLE IF EXISTS "Vendor";
DROP TABLE IF EXISTS "Playbook";
DROP TABLE IF EXISTS "ObjectType";
DROP TABLE IF EXISTS "ConciergeAttribute";
DROP TABLE IF EXISTS "ConciergeObject";

-- Remove property column from ModuleSubscription
ALTER TABLE "ModuleSubscription" DROP COLUMN IF EXISTS "propertyId";
```

## Common Issues & Solutions

### Issue 1: Migration Already Executed
**Error**: Migration already exists in migration_logs
**Solution**: This is expected if re-running. The script skips already executed migrations.

### Issue 2: Permission Denied
**Error**: Database connection refused
**Solution**: Verify DATABASE_URL and Railway connection:
```bash
railway status
railway link
```

### Issue 3: Prisma Generate Fails
**Error**: Schema validation errors
**Solution**: Check for syntax errors in schema.prisma:
```bash
npx prisma validate
```

### Issue 4: Table Already Exists
**Error**: Relation already exists
**Solution**: The tables were already created by Prisma. This is normal if the schema was already pushed.

## Monitoring

### Performance Monitoring
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE tablename IN ('ConciergeObject', 'ConciergeAttribute', 'Vendor', 'VendorLink')
ORDER BY idx_tup_read DESC;
```

### Data Growth Monitoring
```sql
-- Monitor table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN ('ConciergeObject', 'ConciergeAttribute', 'Vendor', 'VendorLink')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Success Criteria

- ✅ All migrations execute without errors
- ✅ Schema verification passes all required checks
- ✅ Prisma client generates successfully
- ✅ Module manifests are created
- ✅ Module subscriptions are enabled for existing organizations
- ✅ Performance indexes are created
- ✅ EAV constraints are enforced
- ✅ API health check passes
- ✅ No existing functionality is broken

## Next Development Steps

1. **API Controllers**: Implement NestJS controllers for Concierge and Vendors
2. **Services**: Create business logic services with tenant isolation
3. **Workers**: Implement playbook execution and SLA monitoring
4. **Frontend**: Build React components for operational views
5. **Testing**: Create comprehensive test suite
6. **Documentation**: Update API documentation

The database schema is now ready to support the full Concierge and Vendors module implementation!