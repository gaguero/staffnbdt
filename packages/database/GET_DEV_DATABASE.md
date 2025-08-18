# Get Development Database URL

To complete the setup, we need the development database URL from Railway.

## Steps to Get Dev Database URL:

1. **Go to Railway Dashboard**: https://railway.app
2. **Find the dev environment**: Look for "frontend-copy-production" or similar
3. **Open PostgreSQL service** in the dev environment
4. **Copy the DATABASE_URL** from the Environment Variables or Connection tab
5. **Update .env.dev** with the correct dev database URL

## Current Status:

- ✅ **Production database** properly identified and protected
- ✅ **Safety systems** working correctly (blocks production seeding)
- ✅ **Cleanup script** ready (identifies 140 test records to remove)
- ⏳ **Dev database URL** needed to complete setup

## Expected Dev Database URL Format:

```
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
```

Where:
- HOST will be different from production (not nozomi.proxy.rlwy.net)
- PASSWORD will be the dev database password
- PORT will be the dev database port

## After Getting Dev URL:

1. Update `packages/database/.env.dev` with the correct DATABASE_URL
2. Test seeding: `npm run seed:dev`
3. Verify it works without affecting production

## Alternative: Create New Dev Database

If no dev database exists:

1. **Create new PostgreSQL service** in Railway dev environment
2. **Copy the DATABASE_URL** from the new service
3. **Run migrations** to set up the schema: `npm run migrate:deploy`
4. **Test seeding** with `npm run seed:dev`