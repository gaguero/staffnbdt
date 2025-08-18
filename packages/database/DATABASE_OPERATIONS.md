# Database Operations Guide

## Overview

This guide covers safe database operations for the Hotel Operations Hub multi-tenant system. After accidentally seeding production data, strict safety measures have been implemented.

## Environment Configuration

### Environment Files

- **`.env`** - ⚠️ POINTS TO PRODUCTION - Handle with extreme care!
- **`.env.production`** - Production database (same as .env)
- **`.env.dev`** - Development database (Railway dev environment)
- **`.env.local`** - Local PostgreSQL for development

### Safety Rules

1. **NEVER** run seed scripts without specifying the environment
2. **ALWAYS** use environment-specific npm scripts
3. **BACKUP** production before any operations
4. **VERIFY** the database URL before running operations

## Database Operations

### 1. Cleanup Production (URGENT)

Remove test data accidentally seeded to production:

```bash
# Step 1: Review what will be deleted
cd packages/database
npm run cleanup:production

# Step 2: Confirm and execute cleanup
npm run cleanup:confirm
```

### 2. Safe Seeding

#### Development Environment
```bash
# Make sure .env.dev has correct dev database URL
npm run seed:dev
```

#### Local Development
```bash
# Make sure .env.local points to local PostgreSQL
npm run seed:local
```

#### Production (DANGEROUS - Only for emergencies)
```bash
# This will DESTROY all production data!
FORCE_SEED_PRODUCTION=true CONFIRM_PRODUCTION_DESTROY=true npm run seed:production
```

### 3. Database Studio

Open Prisma Studio for different environments:

```bash
npm run studio:dev          # Dev database
npm run studio:local        # Local database
npm run studio:production   # Production (READ-ONLY!)
```

### 4. Migrations

```bash
# Deploy migrations (safe for all environments)
npm run migrate:deploy

# Create new migration
npm run migrate:create

# Check migration status
npm run migrate:status
```

## Safety Features

### Seeding Script Protection

The `seed-complete-data.js` script includes multiple safety checks:

1. **Database URL Detection**: Automatically detects production databases
2. **Explicit Confirmation Required**: Production seeding requires multiple environment variables
3. **Clear Instructions**: Shows exactly how to seed safely
4. **Environment Validation**: Validates NODE_ENV and existing data

### Cleanup Script Protection

The `cleanup-test-data.js` script includes:

1. **Analysis Phase**: Shows exactly what will be deleted
2. **Confirmation Required**: Requires `CONFIRM_CLEANUP=true`
3. **Verification**: Confirms cleanup completed successfully
4. **Foreign Key Safety**: Deletes in proper order

## Emergency Procedures

### Production Data Recovery

If production data is accidentally modified:

1. **Stop all operations immediately**
2. **Check Railway backups**: Railway PostgreSQL has automatic backups
3. **Restore from backup**: Use Railway dashboard to restore
4. **Run verification**: Ensure data integrity after restore

### Railway Backup Management

1. **Access Railway Dashboard**: https://railway.app
2. **Navigate to PostgreSQL service**
3. **Backups tab**: View available automated backups
4. **Restore**: Select backup and restore to new service if needed

### Environment Validation

Before any database operation, verify:

```bash
# Check current database connection
npx prisma studio
# Look at the connection URL in Prisma Studio

# Count organizations (production should have real data)
npx prisma db seed --preview-feature
```

## Best Practices

### Development Workflow

1. **Always use environment-specific scripts**
2. **Verify database URL before operations**
3. **Keep production .env separate from development**
4. **Test on dev/local before production**
5. **Document any schema changes**

### Production Safety

1. **Never run experiments on production**
2. **Always backup before migrations**
3. **Test migrations on dev first**
4. **Monitor production after changes**
5. **Have rollback plan ready**

## Troubleshooting

### "Database does not exist" Error

This typically means migrations haven't been applied:

```bash
# Deploy migrations
npm run migrate:deploy

# Or push schema (development only)
npm run db:push
```

### "Production seeding blocked" Error

The safety system detected a production database:

```bash
# For development, use:
npm run seed:dev

# For local development:
npm run seed:local

# For production (DANGEROUS):
FORCE_SEED_PRODUCTION=true CONFIRM_PRODUCTION_DESTROY=true npm run seed:production
```

### Railway Deployment Issues

If Railway deployment fails due to database issues:

1. Check `deploy-migrations.js` script
2. Verify environment variables in Railway
3. Check Railway PostgreSQL service status
4. Review Railway build logs

## Scripts Reference

| Script | Purpose | Safety Level |
|--------|---------|--------------|
| `npm run seed:dev` | Seed dev database | ✅ Safe |
| `npm run seed:local` | Seed local database | ✅ Safe |
| `npm run seed:production` | Seed production | ⚠️ DANGEROUS |
| `npm run cleanup:production` | Preview cleanup | ✅ Read-only |
| `npm run cleanup:confirm` | Execute cleanup | ⚠️ Destructive |
| `npm run studio:dev` | Open dev studio | ✅ Safe |
| `npm run studio:production` | Open prod studio | ⚠️ Read carefully |
| `npm run migrate:deploy` | Deploy migrations | ⚠️ Test first |

## Contact

If you encounter database issues:

1. **Check this guide first**
2. **Review Railway dashboard**
3. **Check environment configuration**
4. **Verify database connectivity**
5. **Document the issue for future reference**

---

**Remember**: Production data is irreplaceable. When in doubt, don't execute the operation.