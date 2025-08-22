# Database Migration Commands

Since PostgreSQL tools aren't available locally, you'll need to run these commands one by one and manually select the services:

## Step 1: Backup Production Database
```bash
railway link --environment production
railway service  # Select "Postgres"
railway shell
# Inside the postgres container:
pg_dump $DATABASE_URL > /tmp/prod_backup_$(date +%Y%m%d_%H%M%S).sql
exit
```

## Step 2: Export Dev Database
```bash
railway link --environment dev
railway service  # Select "Postgres Copy"
railway shell
# Inside the postgres container:
pg_dump --clean $DATABASE_URL > /tmp/dev_export_$(date +%Y%m%d_%H%M%S).sql
exit
```

## Step 3: Copy Dev Export to Production and Import
```bash
# You'll need to download the dev export first, then upload to production
railway link --environment production
railway service  # Select "Postgres"
railway shell
# Upload the dev export file and then:
psql $DATABASE_URL < dev_export_file.sql
exit
```

## Alternative: Use Railway Connect
```bash
# Connect to production database
railway link --environment production
railway service  # Select "Postgres"
railway connect

# In another terminal, connect to dev database
railway link --environment dev
railway service  # Select "Postgres Copy"
railway connect
```