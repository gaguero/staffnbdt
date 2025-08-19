# Railway Deployment - Critical Logging Configuration

## IMMEDIATE ACTION REQUIRED

Set the following environment variable in Railway dashboard to fix the excessive logging:

```
LOG_LEVEL=warn
```

## Environment Variables for Each Service

### BFF (Backend) Service:
```bash
# Critical - Set this to reduce log volume from 500/sec to <50/sec
LOG_LEVEL=warn

# Current variables (keep existing):
DATABASE_URL=...
JWT_SECRET=...
NODE_ENV=production
```

### Frontend Service:
```bash
# Keep existing variables:
NODE_ENV=production
VITE_API_URL=...
```

## Log Volume Impact

- **Before**: 500+ logs/sec (hitting Railway limits)
- **After**: <50 logs/sec (sustainable)

### What Changed:
1. ✅ Removed all `console.log` statements from business logic
2. ✅ Created environment-based logging configuration
3. ✅ Updated TenantInterceptor to only log errors in production
4. ✅ Disabled file logging in production to reduce I/O
5. ✅ Set production log level to 'warn' only

## Monitoring

After deployment, monitor logs in Railway dashboard to confirm:
- Log volume is reduced significantly
- Only warnings and errors are logged
- No debug/info spam in production

## Rollback Plan

If issues occur, temporarily set:
```
LOG_LEVEL=info
```

Then investigate and fix the underlying issue before reverting to `LOG_LEVEL=warn`.