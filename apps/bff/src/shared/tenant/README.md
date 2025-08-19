# Global Tenant Context Middleware System

## 🔒 Security Overview

This comprehensive tenant security system prevents cross-tenant data leakage through multiple layers of protection:

1. **TenantInterceptor** - Automatically injects tenant context into every request
2. **TenantContextService** - Request-scoped service providing tenant information
3. **TenantQueryHelper** - Utility for creating tenant-safe database queries
4. **TenantGuard** - Additional endpoint-level tenant validation
5. **TenantService** - Tenant validation and property switching

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Incoming Request                     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              JwtAuthGuard                               │
│          (Validates JWT Token)                          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              TenantInterceptor                          │
│     • Extracts tenant info from JWT                    │
│     • Sets tenant context for request                  │
│     • Validates user has tenant assignment             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              TenantGuard (Optional)                     │
│     • Validates specific resource access               │
│     • Checks organization/property/department access   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Controller                             │
│     • Has access to tenant context via injection       │
│     • Can use request.tenantContext for direct access  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                          │
│     • Uses TenantQueryHelper for all queries           │
│     • Automatic tenant filtering applied               │
│     • Results validated for tenant ownership           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               Database (Prisma)                         │
│     • All queries automatically tenant-scoped          │
│     • organizationId + propertyId filters applied      │
│     • Role-based access control enforced               │
└─────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
src/shared/tenant/
├── tenant.interceptor.ts           # Global request interceptor
├── tenant-context.service.ts       # Request-scoped tenant context
├── tenant-query.helper.ts          # Database query utilities
├── tenant.service.ts               # Tenant validation & management
├── tenant.module.ts                # Module configuration
├── examples/
│   ├── tenant-safe-service.example.ts      # Service patterns
│   └── users-service-migration.example.ts  # Migration guide
└── README.md                       # This file

src/shared/guards/
└── tenant.guard.ts                # Additional endpoint protection
```

## 🚀 Quick Start

### 1. The system is already configured globally

The `TenantModule` is imported in `app.module.ts` and `TenantInterceptor` runs on every request.

### 2. Use in your services

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { TenantQueryHelper } from '../tenant/tenant-query.helper';

@Injectable()
export class MyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService, // Inject this
  ) {}

  async findAll() {
    // ✅ SECURE: Use tenant-safe query builder
    const safeQuery = TenantQueryHelper.createSafeQuery(
      {
        where: { /* your filters */ },
        include: { /* your includes */ },
      },
      this.tenantContext,
      {
        scope: 'property',        // or 'organization', 'department', 'user'
        resourceType: 'generic',  // or 'user', 'department', 'document'
      }
    );

    const results = await this.prisma.myTable.findMany(safeQuery);

    // ✅ SECURITY: Validate results
    TenantQueryHelper.validateTenantOwnership(results, this.tenantContext);

    return results;
  }

  async create(data: any) {
    // ✅ SECURE: Ensure tenant context
    const secureData = TenantQueryHelper.ensureTenantContext(
      data,
      this.tenantContext,
      { scope: 'property' }
    );

    return this.prisma.myTable.create({ data: secureData });
  }
}
```

### 3. Use guards for additional protection

```typescript
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard, RequirePropertyAccess } from '../guards/tenant.guard';

@Controller('properties')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PropertiesController {
  
  @Get(':propertyId/users')
  @RequirePropertyAccess('propertyId') // Validates access to specific property
  async getPropertyUsers(@Param('propertyId') propertyId: string) {
    // Property access already validated by guard
    // Service will use tenant context automatically
    return this.usersService.findByProperty(propertyId);
  }
}
```

## 🛡 Security Features

### Automatic Tenant Isolation

Every database query is automatically scoped to:
- **Organization**: User's organization
- **Property**: User's assigned property (or accessible properties)
- **Department**: User's department (if department-scoped role)

### Role-Based Access Control

| Role | Access Level | Automatic Filtering |
|------|-------------|-------------------|
| **PLATFORM_ADMIN** | Cross-tenant | Can skip filters with explicit permission |
| **ORGANIZATION_OWNER** | Organization-wide | All properties in organization |
| **ORGANIZATION_ADMIN** | Organization-wide | All properties in organization |
| **PROPERTY_MANAGER** | Property-wide | All departments in property |
| **DEPARTMENT_ADMIN** | Department-only | Own department only |
| **STAFF** | Self-only | Own records only |

### Multiple Security Layers

1. **JWT Level**: Token includes `organizationId` and `propertyId`
2. **Interceptor Level**: Validates and sets tenant context
3. **Guard Level**: Additional endpoint-specific validation
4. **Query Level**: Automatic filtering applied to all database queries
5. **Result Level**: Post-query validation of returned data

## 📚 API Reference

### TenantContextService

```typescript
// Get tenant information
const orgId = tenantContext.getOrganizationId();
const propertyId = tenantContext.getPropertyId();
const deptId = tenantContext.getDepartmentId(); // May be undefined
const userId = tenantContext.getUserId();
const role = tenantContext.getUserRole();

// Check permissions
const canAccessMultiProperty = tenantContext.canAccessMultiProperty();
const canAccessMultiDepartment = tenantContext.canAccessMultiDepartment();
const isDeptScoped = tenantContext.isDepartmentScoped();

// Validate access
const hasOrgAccess = tenantContext.validateOrganizationAccess(orgId);
const hasPropertyAccess = tenantContext.validatePropertyAccess(propertyId);
const hasDeptAccess = tenantContext.validateDepartmentAccess(deptId);

// Get filters
const baseFilters = tenantContext.getBaseTenantFilters();
const orgFilters = tenantContext.getOrganizationFilters();
const propertyFilters = tenantContext.getPropertyFilters();
```

### TenantQueryHelper

```typescript
// Create safe queries
const safeQuery = TenantQueryHelper.createSafeQuery(baseQuery, tenantContext, {
  scope: 'property' | 'organization' | 'department' | 'user',
  resourceType: 'user' | 'department' | 'document' | 'generic',
  skipTenantFilters: false, // Only for platform admins
});

// Ensure data has tenant context
const secureData = TenantQueryHelper.ensureTenantContext(data, tenantContext, {
  scope: 'property',
  includeUserId: false,
});

// Validate results
const isValid = TenantQueryHelper.validateTenantOwnership(
  results, 
  tenantContext, 
  'resource name'
);

// Create WHERE clauses with soft delete support
const whereClause = TenantQueryHelper.createTenantAwareWhereClause(
  baseWhere,
  tenantContext,
  {
    includeDeleted: false,
    scope: 'property',
  }
);
```

### TenantGuard Decorators

```typescript
// Require tenant access validation
@RequireTenantAccess('organization', 'orgId')
@RequireTenantAccess('property', 'propertyId')
@RequireTenantAccess('department', 'deptId')

// Convenience decorators
@RequireOrganizationAccess('orgId')
@RequirePropertyAccess('propertyId')
@RequireDepartmentAccess('deptId')

// Allow cross-tenant access (platform admins only)
@AllowCrossTenant()
```

## 🔄 Migration Guide

### Step 1: Update Service Constructor

```typescript
// Before
constructor(
  private readonly prisma: PrismaService,
  private readonly auditService: AuditService,
) {}

// After
constructor(
  private readonly prisma: PrismaService,
  private readonly auditService: AuditService,
  private readonly tenantContext: TenantContextService, // Add this
) {}
```

### Step 2: Replace Manual Tenant Filtering

```typescript
// ❌ Before (Manual filtering - security risk)
const users = await this.prisma.user.findMany({
  where: {
    propertyId: currentUser.propertyId, // Manual filtering
    // Other filters...
  },
});

// ✅ After (Automatic filtering - secure)
const safeQuery = TenantQueryHelper.createSafeQuery(
  {
    where: {
      // Other filters... (no manual tenant filtering needed)
    },
  },
  this.tenantContext,
  { resourceType: 'user' }
);

const users = await this.prisma.user.findMany(safeQuery);
TenantQueryHelper.validateTenantOwnership(users, this.tenantContext);
```

### Step 3: Update Create/Update Operations

```typescript
// ❌ Before
const user = await this.prisma.user.create({
  data: {
    ...userData,
    organizationId: currentUser.organizationId, // Manual assignment
    propertyId: currentUser.propertyId,         // Manual assignment
  },
});

// ✅ After
const secureData = TenantQueryHelper.ensureTenantContext(
  userData,
  this.tenantContext
);

const user = await this.prisma.user.create({ data: secureData });
```

### Step 4: Add Guards to Controllers

```typescript
// Add to sensitive endpoints
@UseGuards(JwtAuthGuard, TenantGuard)
@RequirePropertyAccess('propertyId')
async getSensitiveData(@Param('propertyId') propertyId: string) {
  // Access pre-validated by guard
}
```

## ⚡ Performance Considerations

### Optimizations Included

- **Request-scoped caching** of tenant context
- **Single database query** with combined filters
- **Indexed tenant columns** (organizationId, propertyId)
- **Lazy evaluation** of tenant information
- **Connection pooling** friendly patterns

### Database Indexes Required

Ensure these indexes exist for optimal performance:

```sql
-- Users table
CREATE INDEX idx_users_tenant ON users(organization_id, property_id, deleted_at);
CREATE INDEX idx_users_dept_tenant ON users(organization_id, property_id, department_id, deleted_at);

-- Generic pattern for all tenant-aware tables
CREATE INDEX idx_{table}_tenant ON {table}(organization_id, property_id, deleted_at);
CREATE INDEX idx_{table}_dept_tenant ON {table}(organization_id, property_id, department_id, deleted_at);
```

## 🐛 Debugging

### Enable Debug Logging

Set log level to `debug` to see tenant context operations:

```typescript
// In your service
this.tenantContext.logContext('Operation description');
```

### Common Issues

1. **"Tenant context not set"** - Ensure request went through TenantInterceptor
2. **Cross-tenant data found** - Check if manual filtering is bypassing security
3. **Performance issues** - Verify database indexes are in place
4. **Permission errors** - Check user roles and department assignments

### Security Monitoring

Monitor logs for these patterns:
- `SECURITY VIOLATION:` - Cross-tenant data detected
- `Skipping tenant filters` - Platform admin bypass (should be rare)
- `Failed to set tenant context` - Authentication or assignment issues

## 🧪 Testing

### Unit Tests

```typescript
// Mock the tenant context service
const mockTenantContext = {
  getOrganizationId: () => 'org-123',
  getPropertyId: () => 'prop-456',
  getUserRole: () => Role.STAFF,
  // ... other methods
};

// Test that queries are properly filtered
it('should apply tenant filters to user queries', () => {
  const baseQuery = { where: {} };
  const safeQuery = TenantQueryHelper.createSafeQuery(
    baseQuery,
    mockTenantContext
  );
  
  expect(safeQuery.where.organizationId).toBe('org-123');
  expect(safeQuery.where.propertyId).toBe('prop-456');
});
```

### Integration Tests

```typescript
// Test cross-tenant isolation
it('should not return users from other tenants', async () => {
  // Create users in different tenants
  const tenant1User = await createUserInTenant('tenant-1');
  const tenant2User = await createUserInTenant('tenant-2');
  
  // Login as tenant-1 user
  const token = await getAuthToken(tenant1User);
  
  // Query users
  const response = await request(app)
    .get('/users')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  
  // Should only see tenant-1 users
  const userIds = response.body.data.map(u => u.id);
  expect(userIds).toContain(tenant1User.id);
  expect(userIds).not.toContain(tenant2User.id);
});
```

## 📋 Checklist for Services

For each service in your application:

- [ ] Inject `TenantContextService`
- [ ] Replace manual `propertyId`/`organizationId` filtering
- [ ] Use `TenantQueryHelper.createSafeQuery()` for SELECT operations
- [ ] Use `TenantQueryHelper.ensureTenantContext()` for CREATE/UPDATE
- [ ] Add `validateTenantOwnership()` for critical operations
- [ ] Remove hardcoded tenant assignments
- [ ] Add `TenantGuard` to sensitive endpoints
- [ ] Update unit tests to include tenant mocking
- [ ] Test with multiple tenants
- [ ] Verify no cross-tenant data leakage

## 🔗 Related Files

- **JWT Strategy**: `/src/modules/auth/strategies/jwt.strategy.ts`
- **User Model**: Includes `organizationId` and `propertyId`
- **Database Schema**: All tables have tenant columns
- **Permission System**: Works alongside tenant isolation

---

**🔒 Security is not optional. Every database query MUST go through the tenant-safe patterns to prevent data breaches.**