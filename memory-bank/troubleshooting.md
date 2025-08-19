# Hotel Operations Hub - Troubleshooting Guide

## Common Issues & Solutions

This guide provides solutions for common problems encountered in development, deployment, and production environments of the Hotel Operations Hub.

## Permission System Issues

### 1. Permission Tables Not Found

#### Problem
```
Error: Permission tables do not exist, running in legacy mode with @Roles decorators only
```

#### Diagnosis
```bash
# Check permission system status
curl https://your-api.railway.app/api/permissions/system/status

# Check database tables
psql $DATABASE_URL -c "\dt" | grep -i permission
```

#### Solutions

**Option A: Force Enable Permission System**
```bash
# Set environment variable
railway variables set FORCE_PERMISSION_SYSTEM=true

# Redeploy service
railway up --service bff
```

**Option B: Run Database Migration**
```bash
# Apply schema changes
cd packages/database
npm run db:migrate:deploy

# Verify tables exist
npm run db:studio
```

**Option C: Force Reinitialize**
```bash
# Via API endpoint
curl -X POST https://your-api.railway.app/api/permissions/system/reinitialize

# Via local script
npm run permissions:setup
```

### 2. Permission Migration Failed

#### Problem
```
Error: User migration failed - permissions not found
```

#### Diagnosis
```bash
# Check seed status
npm run permissions:validate

# Check permission count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Permission\";"
```

#### Solutions

**Step 1: Reseed Permissions**
```bash
# Clean reseed
npm run permissions:seed

# Verify permissions created
psql $DATABASE_URL -c "SELECT resource, action, scope FROM \"Permission\" LIMIT 10;"
```

**Step 2: Retry Migration**
```bash
# Migrate users to permissions
npm run permissions:migrate

# Check migration results
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"UserPermission\";"
```

**Step 3: Validate Coverage**
```bash
# Ensure 100% coverage
npm run permissions:validate

# Check for missing permissions
npm run permissions:validate > coverage-report.txt
cat coverage-report.txt
```

### 3. Permission Cache Issues

#### Problem
```
Permission evaluation taking too long / inconsistent results
```

#### Diagnosis
```typescript
// Check cache stats
const stats = await permissionService.getUserCacheStats(userId);
console.log('Cache stats:', stats);

// Check cache table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"PermissionCache\" WHERE expires_at > NOW();"
```

#### Solutions

**Clear User Cache**
```typescript
// Clear specific user cache
await permissionService.clearUserPermissionCache(userId);

// Clear all expired cache
await permissionService.cleanupExpiredCache();
```

**Reset Cache System**
```sql
-- Clear all cache entries
DELETE FROM "PermissionCache";

-- Verify cache is cleared
SELECT COUNT(*) FROM "PermissionCache";
```

**Optimize Cache Performance**
```bash
# Increase cache TTL
railway variables set PERMISSION_CACHE_TTL=7200  # 2 hours

# Increase max cache size
railway variables set PERMISSION_MAX_CACHE_SIZE=50000
```

## Database Issues

### 1. Connection Pool Exhausted

#### Problem
```
Error: remaining connection slots are reserved for non-replication superuser connections
```

#### Diagnosis
```sql
-- Check active connections
SELECT count(*) as active_connections FROM pg_stat_activity;

-- Check connection limits
SELECT setting FROM pg_settings WHERE name = 'max_connections';

-- Check connection sources
SELECT datname, usename, client_addr, state, count(*)
FROM pg_stat_activity 
GROUP BY datname, usename, client_addr, state;
```

#### Solutions

**Option A: Optimize Connection Pool**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Add connection pooling
  connectionLimit = 10
  poolTimeout = 30
}
```

**Option B: Configure Railway Database**
```bash
# Increase connection limit (Railway Pro plan)
railway variables set DATABASE_POOL_SIZE=20
```

**Option C: Add Connection Retry Logic**
```typescript
// prisma.service.ts
async onModuleInit() {
  await this.$connect()
    .catch(async (error) => {
      console.warn('Initial connection failed, retrying...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return this.$connect();
    });
}
```

### 2. Migration Failures

#### Problem
```
Error: Migration failed to apply - constraint violation
```

#### Diagnosis
```bash
# Check migration status
cd packages/database
npx prisma migrate status

# Check migration history
npx prisma migrate resolve --preview

# Check constraint violations
psql $DATABASE_URL -c "SELECT conname, contype, conrelid::regclass FROM pg_constraint WHERE NOT convalidated;"
```

#### Solutions

**Reset Migration State**
```bash
# Mark migration as applied (if already manually applied)
npx prisma migrate resolve --applied 20231201000000_migration_name

# Reset database (development only)
npx prisma migrate reset --force
```

**Fix Data Before Migration**
```sql
-- Example: Fix null values before adding NOT NULL constraint
UPDATE users SET organization_id = 'default-org-id' WHERE organization_id IS NULL;

-- Then rerun migration
npx prisma migrate deploy
```

### 3. Performance Issues

#### Problem
Slow database queries affecting application performance

#### Diagnosis
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### Solutions

**Add Missing Indexes**
```sql
-- Common performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_active 
ON users(organization_id, property_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tenant_date 
ON audit_logs(organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_cache_lookup 
ON permission_cache(user_id, cache_key, expires_at);
```

**Optimize Queries**
```typescript
// Use findMany with proper filtering instead of findFirst in loops
const users = await this.prisma.user.findMany({
  where: {
    organizationId: context.organizationId,
    propertyId: context.propertyId,
    deletedAt: null,
  },
  include: {
    profile: true,
    department: true,
  },
});
```

## File Storage (R2) Issues

### 1. CORS Errors

#### Problem
```
CORS error: Access blocked by CORS policy
```

#### Diagnosis
```bash
# Test CORS configuration
curl -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: PUT" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-bucket.r2.cloudflarestorage.com/
```

#### Solutions

**Configure CORS for R2 Bucket**
```bash
# Update CORS rules
wrangler r2 bucket cors set hotel-ops-hub-production --rules '[{
  "AllowedOrigins": [
    "https://your-domain.com",
    "https://app.hotel-ops-hub.com",
    "http://localhost:5173"
  ],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag", "Content-Length"],
  "MaxAgeSeconds": 86400
}]'
```

**Verify CORS Configuration**
```bash
# Check current CORS rules
wrangler r2 bucket cors get hotel-ops-hub-production
```

### 2. File Upload Failures

#### Problem
```
Error: Pre-signed URL generation failed
```

#### Diagnosis
```typescript
// Test R2 connectivity
try {
  const result = await this.s3Client.putObject({
    Bucket: 'hotel-ops-hub-production',
    Key: 'test-connectivity',
    Body: 'test',
  }).promise();
  console.log('R2 connectivity test passed:', result);
} catch (error) {
  console.error('R2 connectivity test failed:', error);
}
```

#### Solutions

**Verify R2 Credentials**
```bash
# Check environment variables
railway variables --service bff | grep R2

# Test credentials
wrangler r2 object list hotel-ops-hub-production --limit 1
```

**Fix Pre-signed URL Service**
```typescript
// file-storage.service.ts
async getPresignedUploadUrl(fileName: string, context: TenantContext) {
  try {
    const key = this.buildTenantPath(fileName, context);
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: 'application/octet-stream',
      Metadata: {
        'uploaded-by': context.userId,
        'organization-id': context.organizationId,
      },
    });
    
    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300, // 5 minutes
    });
    
    return { uploadUrl: url, key };
  } catch (error) {
    this.logger.error('Pre-signed URL generation failed:', error);
    throw new InternalServerErrorException('File upload preparation failed');
  }
}
```

### 3. File Access Permission Issues

#### Problem
```
Error: Access denied to file - tenant boundary violation
```

#### Diagnosis
```typescript
// Check file path structure
console.log('File key:', fileKey);
console.log('User context:', tenantContext);

// Verify tenant path
const expectedPrefix = `org-${tenantContext.organizationId}/`;
console.log('Expected prefix:', expectedPrefix);
console.log('Key starts with prefix:', fileKey.startsWith(expectedPrefix));
```

#### Solutions

**Fix Tenant Path Validation**
```typescript
// file-storage.service.ts
validateTenantFileAccess(fileKey: string, context: TenantContext): boolean {
  // Check organization access
  const orgPrefix = `org-${context.organizationId}/`;
  if (!fileKey.startsWith(orgPrefix)) {
    return false;
  }
  
  // Check property access if specified
  if (context.propertyId) {
    const propertyPrefix = `org-${context.organizationId}/property-${context.propertyId}/`;
    const sharedPrefix = `org-${context.organizationId}/shared/`;
    
    return fileKey.startsWith(propertyPrefix) || fileKey.startsWith(sharedPrefix);
  }
  
  return true;
}
```

## Authentication Issues

### 1. JWT Token Expired

#### Problem
```
Error: jwt expired
```

#### Solutions

**Implement Token Refresh**
```typescript
// auth.service.ts
async refreshToken(refreshToken: string): Promise<TokenPair> {
  const payload = this.jwtService.verify(refreshToken, {
    secret: this.configService.get('JWT_REFRESH_SECRET'),
  });
  
  const user = await this.usersService.findById(payload.sub);
  if (!user) {
    throw new UnauthorizedException('User not found');
  }
  
  return this.generateTokenPair(user);
}

private generateTokenPair(user: User): TokenPair {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    propertyId: user.propertyId,
  };
  
  return {
    accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
    refreshToken: this.jwtService.sign(payload, { 
      expiresIn: '7d',
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    }),
  };
}
```

**Frontend Token Management**
```typescript
// auth.service.ts (frontend)
class AuthService {
  async request<T>(config: RequestConfig): Promise<T> {
    try {
      return await this.apiClient.request(config);
    } catch (error) {
      if (error.response?.status === 401) {
        // Try to refresh token
        await this.refreshToken();
        
        // Retry original request
        return this.apiClient.request(config);
      }
      throw error;
    }
  }
  
  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.logout();
      return;
    }
    
    try {
      const tokens = await this.apiClient.post('/auth/refresh', { refreshToken });
      this.setTokens(tokens.accessToken, tokens.refreshToken);
    } catch (error) {
      this.logout();
      throw error;
    }
  }
}
```

### 2. Permission Denied Errors

#### Problem
```
Error: Insufficient permissions for this operation
```

#### Diagnosis
```typescript
// Debug user permissions
const permissions = await permissionService.getUserPermissions(userId);
console.log('User permissions:', permissions.map(p => `${p.resource}.${p.action}.${p.scope}`));

// Check specific permission
const hasPermission = await permissionService.hasPermission(
  userId,
  'users',
  'create', 
  'department'
);
console.log('Has permission:', hasPermission);
```

#### Solutions

**Grant Missing Permissions**
```typescript
// Grant permission via service
await permissionService.grantPermission({
  userId: 'user-id',
  permissionId: 'permission-id',
  grantedBy: 'admin-id',
  expiresAt: null, // Permanent
});

// Or assign role with permissions
await permissionService.assignRole({
  userId: 'user-id',
  roleId: 'department-admin-role-id',
  assignedBy: 'admin-id',
});
```

**Check Role Mappings**
```sql
-- Verify role has required permissions
SELECT r.name, p.resource, p.action, p.scope
FROM "CustomRole" r
JOIN "RolePermission" rp ON r.id = rp.role_id
JOIN "Permission" p ON rp.permission_id = p.id
WHERE r.name = 'Department Admin' AND rp.granted = true;
```

## Frontend Issues

### 1. Infinite Loading States

#### Problem
React components stuck in loading state

#### Diagnosis
```typescript
// Check API responses
const { data, isLoading, error } = useUsers();
console.log('Query state:', { data, isLoading, error });

// Check network requests
// Open browser DevTools -> Network tab
```

#### Solutions

**Fix Query Dependencies**
```typescript
// Ensure proper dependencies
const { currentTenant } = useTenant();
const { data: users, isLoading } = useQuery({
  queryKey: ['users', currentTenant?.propertyId],
  queryFn: () => userService.findAll(),
  enabled: !!currentTenant, // Only run when tenant is loaded
});
```

**Add Error Boundaries**
```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 2. Permission Gates Not Working

#### Problem
```
PermissionGate always shows "access denied" or always shows content
```

#### Diagnosis
```typescript
// Debug permission loading
const { permissions, loading, error } = usePermissions();
console.log('Permission state:', { permissions, loading, error });

// Check specific permission
const hasPermission = permissions.includes('users.create.department');
console.log('Has create permission:', hasPermission);
```

#### Solutions

**Fix Permission Hook**
```typescript
// usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth();
  
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions', user?.id],
    queryFn: () => permissionService.getUserPermissions(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const hasPermission = useCallback((permission: string) => {
    if (isLoading) return false;
    return permissions.some(p => `${p.resource}.${p.action}.${p.scope}` === permission);
  }, [permissions, isLoading]);
  
  return { permissions, hasPermission, loading: isLoading };
};
```

**Fix PermissionGate Component**
```typescript
// PermissionGate.tsx
export const PermissionGate: React.FC<{
  permission?: string;
  permissions?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, permissions, children, fallback = null }) => {
  const { hasPermission, loading } = usePermissions();
  
  if (loading) {
    return <div>Loading permissions...</div>;
  }
  
  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  // Check multiple permissions (OR logic)
  if (permissions && !permissions.some(p => hasPermission(p))) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

## Railway Deployment Issues

### 1. Build Failures

#### Problem
```
Error: Build failed - npm install failed
```

#### Diagnosis
```bash
# Check build logs
railway logs --service bff | grep -i error

# Check package.json dependencies
cat package.json | jq '.dependencies'
```

#### Solutions

**Fix Package Dependencies**
```json
// package.json - Ensure compatible versions
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@prisma/client": "^5.0.0"
  }
}
```

**Add Nixpacks Configuration**
```toml
# nixpacks.toml
[phases.setup]
nixPkgs = ['nodejs-18_x', 'npm-8_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm run start:prod'
```

### 2. Service Communication Issues

#### Problem
```
Error: Cannot connect to internal service
```

#### Diagnosis
```bash
# Check service status
railway status

# Check internal URLs
railway variables | grep RAILWAY_STATIC_URL
```

#### Solutions

**Use Railway Internal URLs**
```bash
# Set correct internal service URLs
railway variables set API_URL="https://bff-production.railway.internal"
railway variables set DATABASE_URL="postgresql://postgres:password@postgres.railway.internal:5432/railway"
```

**Add Health Checks**
```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });
  
  await app.listen(process.env.PORT || 3000);
}
```

## Performance Issues

### 1. Slow API Responses

#### Problem
API endpoints taking >2 seconds to respond

#### Diagnosis
```typescript
// Add performance monitoring
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > 1000) {
          console.warn(`Slow request: ${request.method} ${request.url} - ${duration}ms`);
        }
      }),
    );
  }
}
```

#### Solutions

**Database Query Optimization**
```typescript
// Optimize N+1 queries with includes
const users = await this.prisma.user.findMany({
  where: { organizationId },
  include: {
    profile: true,
    department: true,
    customRoles: {
      include: { role: true }
    }
  }
});

// Use select to limit fields
const users = await this.prisma.user.findMany({
  select: {
    id: true,
    email: true,
    profile: { select: { firstName: true, lastName: true } }
  }
});
```

**Add Response Caching**
```typescript
// Add caching decorator
@Cache(300) // 5 minutes
@Get('users')
async findAll(@TenantContext() context: TenantContext) {
  return this.usersService.findByTenant(context);
}
```

### 2. High Memory Usage

#### Problem
Node.js process consuming excessive memory

#### Diagnosis
```bash
# Check memory usage
railway logs --service bff | grep "memory"

# Monitor memory in production
curl https://your-api.railway.app/api/health/detailed
```

#### Solutions

**Optimize Permission Caching**
```typescript
// Limit cache size
@Injectable()
export class PermissionService {
  private readonly maxCacheSize = 10000;
  
  async cachePermissionResult(key: string, result: PermissionResult) {
    // Check cache size
    const currentSize = await this.prisma.permissionCache.count();
    
    if (currentSize >= this.maxCacheSize) {
      // Remove oldest entries
      await this.prisma.permissionCache.deleteMany({
        where: {
          id: {
            in: await this.prisma.permissionCache.findMany({
              select: { id: true },
              orderBy: { createdAt: 'asc' },
              take: Math.floor(this.maxCacheSize * 0.1), // Remove 10%
            }).then(entries => entries.map(e => e.id))
          }
        }
      });
    }
    
    // Add new cache entry
    await this.prisma.permissionCache.create({
      data: { cacheKey: key, ...result }
    });
  }
}
```

## Emergency Procedures

### System Recovery

#### Complete System Failure
```bash
# 1. Check all service status
railway status

# 2. Restart all services
railway restart --service bff
railway restart --service web
railway restart --service worker

# 3. Check health endpoints
curl https://your-api.railway.app/api/health

# 4. Verify database connectivity
railway connect --service postgres
```

#### Permission System Recovery
```bash
# 1. Force reinitialize permission system
curl -X POST https://your-api.railway.app/api/permissions/system/reinitialize

# 2. If API is down, use direct database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Permission\";"

# 3. Rollback to role-based system if needed
npm run permissions:rollback
```

#### Database Recovery
```bash
# 1. Check database status
railway connect --service postgres

# 2. Restore from backup
railway db:backup restore <backup-id>

# 3. Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Escalation Procedures

#### Level 1: Development Team
- API errors, UI bugs, performance issues
- Response time: 2-4 hours during business hours

#### Level 2: Platform Team  
- Database issues, deployment failures, infrastructure
- Response time: 1-2 hours during business hours

#### Level 3: Emergency Response
- Complete system failure, security breaches, data loss
- Response time: 30 minutes, 24/7

This troubleshooting guide provides comprehensive solutions for the most common issues in the Hotel Operations Hub system. Keep this document updated as new issues are discovered and resolved.