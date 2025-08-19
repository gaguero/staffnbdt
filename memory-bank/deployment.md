# Hotel Operations Hub - Deployment Guide

## Deployment Overview

Hotel Operations Hub is deployed on Railway platform with a multi-service architecture supporting auto-scaling, continuous deployment, and comprehensive monitoring. The system is designed for zero-downtime deployments with global CDN distribution.

## Railway Platform Architecture

### Current Deployment Structure

We maintain **two Railway environments** for safe development and testing:

#### 🚀 **Production Environment** (main branch)
- **URL**: `https://backend-copy-production-328d.up.railway.app`
- **Branch**: `main` 
- **Auto-deploy**: On push to main branch
- **Database**: Production PostgreSQL with live data
- **Purpose**: Live system for actual hotel operations

#### 🧪 **Development Environment** (dev branch)  
- **URL**: `https://frontend-production-55d3.up.railway.app`
- **Branch**: `dev`
- **Auto-deploy**: On push to dev branch  
- **Database**: Development PostgreSQL with test data
- **Purpose**: Testing new features, permission system validation, safe experimentation

### Development Workflow
1. **Develop on dev branch** → Auto-deploys to dev Railway environment
2. **Test on dev deployment** → Verify features work correctly
3. **Merge dev to main** → Deploy to production when ready

### Service Configuration

```yaml
# railway.toml - Multi-service deployment
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

# Backend API Service
[[services]]
name = "bff"
source = "apps/bff"
rootDirectory = "apps/bff"
buildCommand = "npm install && npm run build"
startCommand = "npm run start:prod"

[services.variables]
NODE_ENV = "production"
PORT = "3000"

# Frontend Web Service  
[[services]]
name = "web"
source = "apps/web"
rootDirectory = "apps/web"
buildCommand = "npm install && npm run build"
startCommand = "npm run preview"

[services.variables]
VITE_API_URL = "${{bff.RAILWAY_STATIC_URL}}"

# Background Worker Service
[[services]]
name = "worker"
source = "apps/worker"
rootDirectory = "apps/worker"
buildCommand = "npm install && npm run build"
startCommand = "npm run start:prod"

[services.variables]
NODE_ENV = "production"

# PostgreSQL Database
[[services]]
name = "postgres"
template = "postgresql"
version = "15"

# Redis Cache & Queues
[[services]]
name = "redis"
template = "redis"
version = "7"
```

### Railway Service URLs

- **Frontend**: https://frontend-production-55d3.up.railway.app
- **Backend API**: https://bff-production-a8f2.up.railway.app
- **Worker Service**: Internal (no public URL)
- **Database**: Internal PostgreSQL (Railway managed)
- **Redis**: Internal Redis (Railway managed)

## Environment Configuration

### Production Environment Variables

```bash
# === Core Application ===
NODE_ENV=production
PORT=3000

# === Database Configuration ===
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
REDIS_URL=redis://default:password@redis.railway.internal:6379

# === JWT Authentication ===
JWT_SECRET=your-super-secure-256-bit-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# === Multi-Tenant Configuration ===
DEFAULT_ORGANIZATION_ID=org-default-uuid
TENANT_ISOLATION_MODE=strict
ENABLE_CROSS_TENANT_ADMIN=false

# === Permission System ===
FORCE_PERMISSION_SYSTEM=false
SKIP_PERMISSION_INIT=false
PERMISSION_CACHE_TTL=3600
PERMISSION_MAX_CACHE_SIZE=10000

# === Cloudflare R2 Storage ===
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=hotel-ops-hub-production
R2_PUBLIC_URL=https://cdn.hotel-ops-hub.com

# === Email Services ===
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@hotel-ops-hub.com
EMAIL_REPLY_TO=support@hotel-ops-hub.com

# === AI Translation ===
OPENAI_API_KEY=your-openai-api-key
DEEPL_API_KEY=your-deepl-api-key
AI_TRANSLATION_ENABLED=true

# === White-Label Configuration ===
ALLOW_CUSTOM_BRANDING=true
ALLOW_CUSTOM_DOMAINS=true
ALLOW_CUSTOM_CSS=true

# === Internationalization ===
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es
FALLBACK_LANGUAGE=en

# === Monitoring & Logging ===
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
SENTRY_DSN=your-sentry-dsn

# === Rate Limiting ===
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
RATE_LIMIT_STRICT=true

# === File Upload Limits ===
MAX_FILE_SIZE=10485760  # 10MB
MAX_PHOTO_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,gif

# === Security ===
CORS_ORIGINS=https://your-domain.com,https://app.hotel-ops-hub.com
TRUSTED_PROXIES=cloudflare
ENABLE_HELMET=true
```

### Development Environment

```bash
# === Development Overrides ===
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/hotel_ops_dev
REDIS_URL=redis://localhost:6379

# === Frontend Development ===
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# === Debug Settings ===
LOG_LEVEL=debug
SKIP_PERMISSION_INIT=false
FORCE_PERMISSION_SYSTEM=true
```

## Permission System Deployment

### Database Migration

```bash
# 1. Apply database schema changes
cd packages/database
npm run db:migrate:deploy

# 2. Verify schema is applied
npm run db:studio
```

### Permission System Setup

```bash
# Complete permission system setup
npm run permissions:setup

# Step-by-step deployment
npm run permissions:seed      # Create all 82 permissions
npm run permissions:migrate   # Migrate users to permissions  
npm run permissions:validate  # Ensure 100% coverage
```

### Validation Script

```typescript
// deploy-permissions.ts - Production deployment script
async function deployPermissionSystem() {
  console.log('🚀 Starting permission system deployment...');
  
  try {
    // 1. Check database connectivity
    await validateDatabaseConnection();
    console.log('✅ Database connection verified');
    
    // 2. Apply schema migrations
    await runDatabaseMigrations();
    console.log('✅ Database migrations completed');
    
    // 3. Seed permissions
    const seedResult = await seedPermissions();
    console.log(`✅ Seeded ${seedResult.permissions} permissions and ${seedResult.roles} roles`);
    
    // 4. Migrate users
    const migrationResult = await migrateUsersToPermissions();
    console.log(`✅ Migrated ${migrationResult.users} users to permission system`);
    
    // 5. Validate coverage
    const coverage = await validatePermissionCoverage();
    if (coverage.percentage < 100) {
      throw new Error(`Permission coverage incomplete: ${coverage.percentage}%`);
    }
    console.log('✅ 100% permission coverage validated');
    
    // 6. Test permission system
    await testPermissionSystem();
    console.log('✅ Permission system functional tests passed');
    
    console.log('🎉 Permission system deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Permission system deployment failed:', error);
    
    // Attempt rollback
    try {
      await rollbackPermissionMigration();
      console.log('✅ Rollback completed - system restored to role-based auth');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError);
    }
    
    process.exit(1);
  }
}
```

## Build & Deployment Process

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate:deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
      
      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          REDIS_URL: redis://localhost:6379
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy to Railway
        run: |
          railway login --token $RAILWAY_TOKEN
          railway up --service bff
          railway up --service web
          railway up --service worker
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Run post-deployment health checks
        run: npm run health:check:production
        env:
          API_URL: ${{ secrets.PRODUCTION_API_URL }}
```

### Railway Deployment Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Connect to project
railway link

# Deploy specific service
railway up --service bff
railway up --service web
railway up --service worker

# Deploy all services
railway up

# View deployment logs
railway logs --service bff
railway logs --service web

# Check service status
railway status

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret
```

## Database Deployment

### Migration Strategy

```bash
# Production-safe migration process
# 1. Backup current database
railway db:backup

# 2. Run migrations in dry-run mode first
cd packages/database
npx prisma migrate diff --preview-feature
npx prisma migrate deploy --preview

# 3. Apply migrations
npx prisma migrate deploy

# 4. Verify migration success
npx prisma db seed --preview
```

### Database Configuration

```typescript
// prisma/schema.prisma - Production configuration
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "jsonProtocol"]
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Railway-specific
}
```

### Database Indexes for Production

```sql
-- Essential indexes for production performance
-- User lookups by tenant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_active 
ON users(organization_id, property_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Permission system performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_lookup 
ON user_permissions(user_id, permission_id, granted, is_active) 
WHERE is_active = true;

-- Audit log queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tenant_date 
ON audit_logs(organization_id, created_at DESC, action);

-- Document access patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tenant_category 
ON documents(organization_id, property_id, category, created_at DESC);

-- Cache performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_cache_user 
ON permission_cache(user_id, expires_at);

-- Reservation system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_property_date 
ON reservations(property_id, check_in_date, status) 
WHERE status IN ('confirmed', 'checked_in');
```

## Cloudflare R2 Configuration

### R2 Bucket Setup

```bash
# Create production bucket
wrangler r2 bucket create hotel-ops-hub-production

# Create staging bucket  
wrangler r2 bucket create hotel-ops-hub-staging

# Configure CORS for web uploads
wrangler r2 bucket cors set hotel-ops-hub-production --rules '[{
  "AllowedOrigins": ["https://your-domain.com", "https://app.hotel-ops-hub.com"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}]'
```

### CDN Configuration

```javascript
// Cloudflare Worker for R2 CDN
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Security: Validate tenant access
    const tenantId = request.headers.get('X-Tenant-ID');
    if (!tenantId || !path.startsWith(`/org-${tenantId}/`)) {
      return new Response('Access denied', { status: 403 });
    }
    
    // Fetch from R2
    const object = await env.R2_BUCKET.get(path.slice(1));
    if (!object) {
      return new Response('File not found', { status: 404 });
    }
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata.contentType || 'application/octet-stream');
    headers.set('Content-Length', object.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    headers.set('ETag', object.httpEtag);
    
    return new Response(object.body, { headers });
  }
};
```

## Health Checks & Monitoring

### Application Health Endpoints

```typescript
// health.controller.ts
@Controller('api/health')
export class HealthController {
  
  @Get()
  @Public()
  async healthCheck(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(), 
      this.checkR2Storage(),
      this.checkPermissionSystem(),
    ]);
    
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date(),
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
      checks: {
        database: this.getCheckResult(checks[0]),
        redis: this.getCheckResult(checks[1]),
        storage: this.getCheckResult(checks[2]),
        permissions: this.getCheckResult(checks[3]),
      }
    };
    
    // Overall health based on critical services
    const criticalFailed = [health.checks.database, health.checks.permissions]
      .some(check => check.status === 'unhealthy');
    
    if (criticalFailed) {
      health.status = 'unhealthy';
    } else if (Object.values(health.checks).some(check => check.status === 'degraded')) {
      health.status = 'degraded';
    }
    
    return health;
  }
  
  @Get('detailed')
  @RequirePermission('system.health.platform')
  async detailedHealth(): Promise<DetailedHealthStatus> {
    return {
      ...(await this.healthCheck()),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
      },
      database: await this.getDatabaseStats(),
      cache: await this.getCacheStats(),
      permissions: await this.getPermissionSystemStats(),
    };
  }
  
  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;
      
      return {
        status: duration < 1000 ? 'healthy' : 'degraded',
        responseTime: duration,
        message: `Database responding in ${duration}ms`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        message: 'Database connection failed',
      };
    }
  }
  
  private async checkPermissionSystem(): Promise<ServiceHealth> {
    try {
      const status = await this.permissionService.getSystemStatus();
      
      if (!status.permissionTablesExist) {
        return {
          status: 'unhealthy',
          message: 'Permission tables not found',
          details: status,
        };
      }
      
      if (status.tableStats?.permissions === 0) {
        return {
          status: 'degraded',
          message: 'No permissions seeded',
          details: status,
        };
      }
      
      return {
        status: 'healthy',
        message: 'Permission system operational',
        details: status,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        message: 'Permission system check failed',
      };
    }
  }
}
```

### Railway Health Check Configuration

```javascript
// railway-health.js - Custom health check script
const axios = require('axios');

async function runHealthChecks() {
  const services = [
    { name: 'API', url: process.env.API_URL + '/api/health' },
    { name: 'Frontend', url: process.env.FRONTEND_URL },
  ];
  
  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 10000 });
      
      if (response.status === 200) {
        console.log(`✅ ${service.name}: Healthy`);
      } else {
        console.log(`⚠️ ${service.name}: Degraded (${response.status})`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ ${service.name}: Unhealthy - ${error.message}`);
      process.exit(1);
    }
  }
  
  console.log('🎉 All services healthy');
}

runHealthChecks().catch(console.error);
```

## Backup & Recovery

### Database Backup Strategy

```bash
# Automated daily backups (Railway)
railway db:backup create --schedule "0 2 * * *"  # Daily at 2 AM UTC

# Manual backup before deployments
railway db:backup create --label "pre-deployment-$(date +%Y%m%d)"

# Restore from backup
railway db:backup restore <backup-id>
```

### File Storage Backup

```typescript
// R2 backup strategy using Cloudflare's replication
class BackupService {
  
  async backupTenantData(organizationId: string): Promise<BackupResult> {
    const tenantPrefix = `org-${organizationId}/`;
    
    // List all tenant files
    const objects = await this.r2Client.listObjectsV2({
      Bucket: this.productionBucket,
      Prefix: tenantPrefix,
    }).promise();
    
    // Copy to backup bucket with timestamp
    const backupPrefix = `backup/${new Date().toISOString().split('T')[0]}/`;
    
    for (const object of objects.Contents || []) {
      await this.r2Client.copyObject({
        Bucket: this.backupBucket,
        CopySource: `${this.productionBucket}/${object.Key}`,
        Key: `${backupPrefix}${object.Key}`,
      }).promise();
    }
    
    return {
      organizationId,
      filesBackedUp: objects.Contents?.length || 0,
      backupPath: backupPrefix + tenantPrefix,
      timestamp: new Date(),
    };
  }
}
```

## Troubleshooting & Debugging

### Common Deployment Issues

#### 1. Permission System Not Initializing

```bash
# Debug permission system
curl https://your-api.railway.app/api/permissions/system/status

# Force reinitialize
curl -X POST https://your-api.railway.app/api/permissions/system/reinitialize

# Check Railway logs
railway logs --service bff | grep -i permission
```

#### 2. Database Connection Issues

```bash
# Check database connectivity
railway connect --service postgres

# Verify connection string
railway variables --service bff | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### 3. R2 Storage Issues

```bash
# Test R2 connectivity
wrangler r2 object list hotel-ops-hub-production --prefix "test/"

# Check CORS configuration
curl -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: PUT" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-r2-bucket.r2.cloudflarestorage.com/
```

#### 4. Service Communication Issues

```bash
# Check internal service URLs
railway status

# Test service communication
curl https://bff-production.railway.internal/api/health

# Check environment variables
railway variables --service bff
railway variables --service web
```

### Performance Monitoring

```typescript
// Performance monitoring middleware
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route?.path || req.path;
      
      // Log slow requests
      if (duration > 1000) {
        this.logger.warn(`Slow request: ${req.method} ${route} - ${duration}ms`);
      }
      
      // Metrics collection
      this.metrics.histogram('http_request_duration', duration, {
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      });
    });
    
    next();
  }
}
```

## Production Deployment Checklist

### Pre-Deployment

- [ ] **Database Migration**: Schema changes tested and ready
- [ ] **Permission System**: Seeded and validated (100% coverage)
- [ ] **Environment Variables**: All production variables set
- [ ] **R2 Storage**: Bucket configured with proper CORS
- [ ] **Health Checks**: All endpoints responding correctly
- [ ] **Tests**: Unit, integration, and E2E tests passing
- [ ] **Security**: CORS, rate limiting, and JWT configured
- [ ] **Monitoring**: Logs and metrics collection enabled

### Deployment

- [ ] **Railway Services**: All services building successfully
- [ ] **Database**: Migrations applied without errors
- [ ] **File Storage**: R2 connectivity verified
- [ ] **API Health**: All health checks passing
- [ ] **Frontend**: Static assets served correctly
- [ ] **Worker**: Background jobs processing

### Post-Deployment

- [ ] **Smoke Tests**: Critical user flows working
- [ ] **Performance**: Response times within acceptable limits
- [ ] **Error Monitoring**: No critical errors in logs
- [ ] **Permission System**: Authorization working correctly
- [ ] **File Uploads**: File operations functioning
- [ ] **Background Jobs**: Workers processing queues
- [ ] **Tenant Isolation**: Multi-tenant boundaries enforced

### Rollback Plan

```bash
# Emergency rollback procedure
# 1. Revert to previous deployment
railway rollback --service bff
railway rollback --service web

# 2. Rollback database migrations if needed
cd packages/database
npx prisma migrate reset --force --skip-seed

# 3. Rollback permission system if needed
npm run permissions:rollback

# 4. Verify system stability
npm run health:check:production
```

This deployment guide ensures reliable, secure, and scalable deployment of the Hotel Operations Hub platform on Railway with comprehensive monitoring and recovery procedures.