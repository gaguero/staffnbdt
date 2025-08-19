# Hotel Operations Hub - Permission System

## Overview

The Hotel Operations Hub implements a comprehensive, hybrid RBAC (Role-Based Access Control) + ABAC (Attribute-Based Access Control) permission system designed for multi-tenant hotel operations. This system provides granular, condition-based access control while maintaining backwards compatibility with the existing role system.

## Architecture & Design

### Hybrid RBAC + ABAC Model

The permission system combines the best of both models:

- **Role-Based (RBAC)**: Users inherit permissions through roles
- **Attribute-Based (ABAC)**: Permissions can have conditions based on context
- **Custom Roles**: Tenant-specific roles beyond system defaults
- **Direct Permissions**: Override role permissions for specific users

### Permission Structure

```typescript
// Permission format: resource.action.scope
{
  resource: string,    // What (user, guest, task, document)
  action: string,      // How (create, read, update, delete)
  scope: string,       // Where (platform, organization, property, department, own)
  conditions?: object  // When/Why (time, department, ownership)
}
```

### Examples

```typescript
// Platform-level user creation (Platform Admin only)
'users.create.platform'

// Property-level guest management
'guests.update.property'

// Department-scoped task viewing
'tasks.read.department'

// Self-service profile updates
'profile.update.own'

// Conditional permission with time restrictions
{
  permission: 'front_desk.checkin.property',
  conditions: {
    time: { startTime: '06:00', endTime: '22:00' },
    departments: ['front-desk', 'management']
  }
}
```

## Complete Permission Catalog

### 82 System Permissions Across 9 Categories

#### 1. HR Module (25 permissions)
```typescript
// User Management
'users.create.platform'        // Platform user creation
'users.create.organization'    // Organization user creation  
'users.create.property'        // Property user creation
'users.create.department'      // Department user creation
'users.read.platform'          // View all users
'users.read.organization'      // View organization users
'users.read.property'          // View property users
'users.read.department'        // View department users
'users.read.own'               // View own profile
'users.update.platform'        // Update any user
'users.update.organization'    // Update organization users
'users.update.property'        // Update property users
'users.update.department'      // Update department users
'users.update.own'             // Update own profile
'users.delete.platform'        // Delete any user
'users.delete.organization'    // Delete organization users
'users.delete.property'        // Delete property users
'users.delete.department'      // Delete department users

// Department Management
'departments.create.platform'  // Create any department
'departments.create.organization' // Create org departments
'departments.create.property'  // Create property departments
'departments.read.platform'    // View all departments
'departments.read.organization' // View org departments
'departments.read.property'    // View property departments
'departments.update.property'  // Update property departments

// Profile & ID Verification
'profiles.read.department'     // View department profiles
'id_verification.manage.property' // Manage ID verification
```

#### 2. Benefits Module (6 permissions)
```typescript
'benefits.create.platform'     // Create platform benefits
'benefits.read.platform'       // View all benefits
'benefits.read.property'       // View property benefits
'benefits.update.platform'     // Update benefits
'benefits.delete.platform'     // Delete benefits
'benefits.admin.platform'      // Full benefits administration
```

#### 3. Payroll Module (4 permissions)
```typescript
'payroll.import.platform'      // Import payroll data
'payroll.import.property'      // Property payroll import
'payroll.read.platform'        // View all payroll
'payroll.read.own'             // View own payslips
```

#### 4. Front Desk Module (20 permissions)
```typescript
// Guest Management
'guests.create.property'       // Create guests
'guests.read.property'         // View property guests
'guests.update.property'       // Update guest info
'guests.delete.property'       // Delete guests
'guests.stats.property'        // Guest statistics

// Unit/Room Management  
'units.create.property'        // Create units/rooms
'units.read.property'          // View units
'units.update.property'        // Update unit status
'units.delete.property'        // Delete units
'units.stats.property'         // Unit statistics

// Reservation Management
'reservations.create.property' // Create reservations
'reservations.read.property'   // View reservations
'reservations.update.property' // Update reservations
'reservations.delete.property' // Cancel reservations
'reservations.checkin.property' // Check-in guests
'reservations.checkout.property' // Check-out guests
'reservations.stats.property'  // Reservation stats

// Front Desk Operations
'front_desk.checkin.property'  // Front desk check-in
'front_desk.checkout.property' // Front desk check-out
'front_desk.reports.property'  // Front desk reports
```

#### 5. Operations Module (12 permissions)
```typescript
// Task Management
'tasks.create.platform'        // Create any task
'tasks.create.property'        // Create property tasks
'tasks.create.department'      // Create department tasks
'tasks.read.platform'          // View all tasks
'tasks.read.property'          // View property tasks
'tasks.read.department'        // View department tasks
'tasks.read.own'               // View assigned tasks
'tasks.update.property'        // Update property tasks
'tasks.update.department'      // Update department tasks
'tasks.update.own'             // Update own tasks
'tasks.delete.property'        // Delete property tasks
'tasks.stats.property'         // Task statistics
```

#### 6. Invitations Module (6 permissions)
```typescript
'invitations.create.platform'  // Send any invitation
'invitations.create.property'  // Send property invitations
'invitations.create.department' // Send department invitations
'invitations.read.property'    // View property invitations
'invitations.accept.own'       // Accept own invitation
'invitations.stats.property'   // Invitation statistics
```

#### 7. Documents Module (4 permissions)
```typescript
'documents.read.platform'      // View all documents
'documents.read.property'      // View property documents
'documents.read.department'    // View department documents
'documents.read.own'           // View own documents
```

#### 8. Training Module (3 permissions)
```typescript
'training.read.department'     // View department training
'training.complete.own'        // Complete own training
'training.admin.property'      // Training administration
```

#### 9. Self-Service Module (2 permissions)
```typescript
'vacation.create.own'          // Create vacation requests
'notifications.read.own'       // View own notifications
```

## System Roles & Hierarchy

### 7 System Roles with Inheritance

#### 1. PLATFORM_ADMIN (All 82 permissions)
- Complete platform control
- Multi-tenant management
- System configuration
- All scopes: platform, organization, property, department, own

#### 2. ORGANIZATION_OWNER (68 permissions)
- Organization-wide control
- Property management
- Cross-property operations
- Scopes: organization, property, department, own

#### 3. ORGANIZATION_ADMIN (62 permissions)
- Similar to owner
- Excludes sensitive platform operations
- Cannot manage platform users
- Scopes: organization, property, department, own

#### 4. PROPERTY_MANAGER (48 permissions)
- Single property control
- Department management
- Front desk operations
- Scopes: property, department, own

#### 5. DEPARTMENT_ADMIN (28 permissions)
- Department-specific control
- Team management
- Limited operational access
- Scopes: department, own

#### 6. STAFF (12 permissions)
- Self-service only
- Personal profile management
- Own task updates
- Scope: own only

#### 7. GUEST (2 permissions)
- Minimal access for guest portals
- View own information only
- Future guest-facing features

### Role Permission Matrix

```typescript
// Complete mapping of roles to permission counts
const rolePermissionCounts = {
  PLATFORM_ADMIN: 82,     // All permissions
  ORGANIZATION_OWNER: 68, // Org/property/dept/own scopes
  ORGANIZATION_ADMIN: 62, // Reduced platform access
  PROPERTY_MANAGER: 48,   // Property/dept/own scopes
  DEPARTMENT_ADMIN: 28,   // Dept/own scopes + management
  STAFF: 12,              // Own scope only
  GUEST: 2                // Minimal guest access
};
```

## Frontend Integration

### Permission Gates & Components

#### PermissionGate Component
```tsx
import { PermissionGate } from '@/components/PermissionGate';

// Conditional rendering based on permissions
<PermissionGate permission="users.create.department">
  <button onClick={createUser}>Create User</button>
</PermissionGate>

// Multiple permissions (OR logic)
<PermissionGate permissions={['users.update.department', 'users.update.property']}>
  <EditUserForm />
</PermissionGate>

// With fallback content
<PermissionGate 
  permission="payroll.read.platform"
  fallback={<div>Access denied</div>}
>
  <PayrollDashboard />
</PermissionGate>
```

#### usePermissions Hook
```tsx
import { usePermissions } from '@/hooks/usePermissions';

function UserManagementPage() {
  const { hasPermission, checkPermissions, loading } = usePermissions();
  
  const canCreateUsers = hasPermission('users.create.department');
  const canManagePayroll = hasPermission('payroll.import.property');
  
  // Bulk permission check
  const permissions = checkPermissions([
    'users.create.department',
    'users.update.department',
    'users.delete.department'
  ]);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {canCreateUsers && <CreateUserButton />}
      {permissions.users_update_department && <EditUserForm />}
    </div>
  );
}
```

### Permission Service
```typescript
// Frontend permission service
class PermissionService {
  // Check single permission
  async hasPermission(permission: string): Promise<boolean> {
    return api.get(`/permissions/check/${permission}`);
  }
  
  // Bulk permission check
  async checkPermissions(permissions: string[]): Promise<Record<string, boolean>> {
    return api.post('/permissions/check-bulk', { permissions });
  }
  
  // Get all user permissions
  async getUserPermissions(): Promise<Permission[]> {
    return api.get('/permissions/user');
  }
  
  // Permission with context
  async hasPermissionWithContext(
    permission: string, 
    context: PermissionContext
  ): Promise<boolean> {
    return api.post(`/permissions/check/${permission}`, { context });
  }
}
```

## Backend Integration

### API Decorators & Guards

#### @RequirePermission Decorator
```typescript
import { RequirePermission } from '@/shared/decorators';

@Controller('users')
export class UsersController {
  
  @Get()
  @RequirePermission('users.read.department')
  async findAll(@CurrentUser() user: User) {
    return this.usersService.findByDepartment(user.departmentId);
  }
  
  @Post()
  @RequirePermission('users.create.department')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  
  @Put(':id/role')
  @RequirePermission('users.update.department')
  async changeRole(@Param('id') id: string, @Body() roleDto: ChangeRoleDto) {
    return this.usersService.changeRole(id, roleDto);
  }
}
```

#### @ConditionalPermission Decorator
```typescript
import { ConditionalPermission } from '@/shared/decorators';

@Controller('front-desk')
export class FrontDeskController {
  
  @Post('checkin')
  @ConditionalPermission('front_desk.checkin.property', {
    timeWindow: { start: '06:00', end: '23:00' },
    departments: ['front-desk', 'management']
  })
  async checkIn(@Body() checkinDto: CheckInDto) {
    return this.frontDeskService.checkIn(checkinDto);
  }
}
```

#### @PermissionScope Decorator
```typescript
import { PermissionScope } from '@/shared/decorators';

@Controller('tasks')
export class TasksController {
  
  @Get()
  @RequirePermission('tasks.read.department')
  @PermissionScope('department') // Auto-filter by user's department
  async findAll(@CurrentUser() user: User) {
    // Automatically scoped to user's department
    return this.tasksService.findByDepartment(user.departmentId);
  }
}
```

### Permission Guard
```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    
    if (!requiredPermission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      return false;
    }

    // Check permission with context
    const permissionContext = {
      userId: user.id,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId,
      currentTime: new Date(),
      resource: request.params,
      metadata: request.headers,
    };

    return this.permissionService.hasPermission(
      user.id,
      requiredPermission,
      permissionContext,
    );
  }
}
```

## Permission Engine & Service

### Core Permission Service
```typescript
@Injectable()
export class PermissionService {
  
  // Check single permission
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    scope: string,
    context?: PermissionEvaluationContext,
  ): Promise<boolean> {
    const result = await this.evaluatePermission(userId, resource, action, scope, context);
    return result.allowed;
  }
  
  // Evaluate permission with full context
  async evaluatePermission(
    userId: string,
    resource: string,
    action: string,
    scope: string,
    context?: PermissionEvaluationContext,
  ): Promise<PermissionEvaluationResult> {
    // 1. Check cache first
    const cached = await this.getCachedPermission(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }
    
    // 2. Get user with roles and permissions
    const user = await this.getUserWithRoles(userId);
    
    // 3. Find the specific permission
    const permission = await this.findPermission(resource, action, scope);
    
    // 4. Check legacy role permissions first
    const hasLegacyPermission = await this.checkLegacyRolePermission(user.role, permission.id);
    
    // 5. Check custom role permissions
    for (const userRole of user.customRoles) {
      const rolePermission = userRole.role.permissions.find(rp => rp.permissionId === permission.id);
      if (rolePermission) {
        const result = await this.evaluatePermissionConditions(permission, context);
        if (result.allowed) {
          await this.cachePermissionResult(cacheKey, result);
          return result;
        }
      }
    }
    
    // 6. Check direct user permissions (override role permissions)
    const userPermission = user.userPermissions.find(up => up.permissionId === permission.id);
    if (userPermission) {
      const result = await this.evaluatePermissionConditions(permission, context);
      await this.cachePermissionResult(cacheKey, result);
      return result;
    }
    
    // 7. Default deny
    return { allowed: false, reason: 'No matching permission found' };
  }
  
  // Bulk permission check for performance
  async checkBulkPermissions(
    userId: string,
    checks: BulkPermissionCheck[],
    globalContext?: PermissionEvaluationContext,
  ): Promise<BulkPermissionResult> {
    const results = {};
    await Promise.all(
      checks.map(async (check) => {
        const result = await this.evaluatePermission(
          userId,
          check.resource,
          check.action,
          check.scope,
          { ...globalContext, ...check.context }
        );
        results[`${check.resource}.${check.action}.${check.scope}`] = result;
      })
    );
    return results;
  }
}
```

### Condition Engine
```typescript
// Built-in condition evaluators
class ConditionEvaluators {
  
  // Time-based conditions
  timeCondition = {
    evaluate: (condition, context) => {
      const { startTime, endTime } = condition.value;
      const currentTime = context.currentTime || new Date();
      const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
      
      const start = this.parseTimeString(startTime);
      const end = this.parseTimeString(endTime);
      
      return currentHour >= start && currentHour <= end;
    }
  };
  
  // Department-based conditions
  departmentCondition = {
    evaluate: (condition, context) => {
      const allowedDepartments = condition.value.departments || [];
      return allowedDepartments.includes(context.departmentId);
    }
  };
  
  // Resource ownership conditions
  ownershipCondition = {
    evaluate: (condition, context) => {
      return context.resourceId === context.userId;
    }
  };
  
  // Custom business logic conditions
  businessHoursCondition = {
    evaluate: (condition, context) => {
      const now = context.currentTime || new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Sunday
      
      // Business hours: Mon-Fri 8AM-6PM
      return day >= 1 && day <= 5 && hour >= 8 && hour <= 18;
    }
  };
}
```

## Caching System

### High-Performance Permission Caching

```typescript
// Permission cache with TTL and cleanup
@Injectable()
export class PermissionCacheService {
  
  // Cache permission result
  async cachePermission(
    cacheKey: string,
    result: PermissionEvaluationResult,
    ttl: number = 3600, // 1 hour default
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl * 1000);
    
    await this.prisma.permissionCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        userId: result.userId,
        resource: result.resource,
        action: result.action,
        scope: result.scope,
        allowed: result.allowed,
        conditions: result.conditions,
        expiresAt,
      },
      update: {
        allowed: result.allowed,
        conditions: result.conditions,
        expiresAt,
      },
    });
  }
  
  // Get cached permission
  async getCachedPermission(cacheKey: string): Promise<CachedPermission | null> {
    const cached = await this.prisma.permissionCache.findUnique({
      where: { cacheKey },
    });
    
    if (!cached || cached.expiresAt < new Date()) {
      return null;
    }
    
    return cached;
  }
  
  // Clear user cache (on role/permission changes)
  async clearUserCache(userId: string): Promise<void> {
    await this.prisma.permissionCache.deleteMany({
      where: { userId },
    });
  }
  
  // Cleanup expired cache entries (cron job)
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredCache(): Promise<void> {
    const deleted = await this.prisma.permissionCache.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    
    this.logger.log(`Cleaned up ${deleted.count} expired permission cache entries`);
  }
}
```

## Migration & Deployment

### Migration from Roles to Permissions

#### 1. Safe Migration Script
```bash
# Complete migration process
npm run permissions:setup

# Step-by-step migration
npm run permissions:seed      # Create permissions and role mappings
npm run permissions:migrate   # Migrate users to permissions  
npm run permissions:validate  # Validate 100% coverage
```

#### 2. Migration Process
```typescript
// migrate-permissions.ts - Safe migration with rollback
class PermissionMigration {
  
  async migrateUsers(): Promise<MigrationResult> {
    const users = await this.prisma.user.findMany();
    const migrationLog = [];
    
    for (const user of users) {
      const legacyRole = user.role;
      const permissions = await this.getRolePermissions(legacyRole);
      
      // Create UserPermission records
      for (const permission of permissions) {
        await this.prisma.userPermission.create({
          data: {
            userId: user.id,
            permissionId: permission.id,
            granted: true,
            source: 'MIGRATION',
            migratedFrom: legacyRole,
            metadata: {
              migratedAt: new Date(),
              originalRole: legacyRole,
            },
          },
        });
      }
      
      migrationLog.push({
        userId: user.id,
        email: user.email,
        role: legacyRole,
        permissionsGranted: permissions.length,
      });
    }
    
    return { success: true, migrated: users.length, log: migrationLog };
  }
  
  // Safe rollback capability
  async rollbackMigration(): Promise<RollbackResult> {
    // Remove all migrated permissions
    const deleted = await this.prisma.userPermission.deleteMany({
      where: { source: 'MIGRATION' },
    });
    
    return { success: true, removedPermissions: deleted.count };
  }
}
```

#### 3. Validation Tools
```typescript
// validate-permission-coverage.ts - Ensure 100% coverage
class PermissionValidator {
  
  async validateCoverage(): Promise<ValidationReport> {
    // Scan codebase for @Roles usage
    const rolesUsage = await this.scanCodebaseForRoles();
    
    // Check permission mappings
    const coverage = await this.checkPermissionCoverage(rolesUsage);
    
    // Generate report
    return {
      totalEndpoints: coverage.total,
      coveredEndpoints: coverage.covered,
      missingPermissions: coverage.missing,
      duplicatePermissions: coverage.duplicates,
      coveragePercentage: (coverage.covered / coverage.total) * 100,
    };
  }
  
  async generateMissingPermissions(missing: RoleUsage[]): Promise<Permission[]> {
    return missing.map(usage => ({
      resource: this.extractResource(usage.endpoint),
      action: this.extractAction(usage.method),
      scope: this.mapRoleToScope(usage.roles),
      name: this.generatePermissionName(usage),
      category: this.inferCategory(usage.controller),
    }));
  }
}
```

## Database Schema

### Permission Tables
```sql
-- Core permission definition
CREATE TABLE "Permission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  scope VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource, action, scope)
);

-- Custom roles for tenants
CREATE TABLE "CustomRole" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Role-permission mapping
CREATE TABLE "RolePermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES "CustomRole"(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES "Permission"(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- User-role assignments
CREATE TABLE "UserCustomRole" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES "CustomRole"(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB,
  metadata JSONB,
  UNIQUE(user_id, role_id)
);

-- Direct user permissions (overrides)
CREATE TABLE "UserPermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES "Permission"(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB,
  source VARCHAR(50) DEFAULT 'MANUAL',
  metadata JSONB,
  UNIQUE(user_id, permission_id)
);

-- Permission conditions
CREATE TABLE "PermissionCondition" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_id UUID REFERENCES "Permission"(id) ON DELETE CASCADE,
  condition_type VARCHAR(50) NOT NULL,
  condition_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Permission cache for performance
CREATE TABLE "PermissionCache" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(500) UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  organization_id UUID,
  property_id UUID,
  resource VARCHAR(50),
  action VARCHAR(50),
  scope VARCHAR(50),
  allowed BOOLEAN NOT NULL,
  conditions JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_permission_resource_action_scope ON "Permission"(resource, action, scope);
CREATE INDEX idx_role_permission_lookup ON "RolePermission"(role_id, permission_id, granted);
CREATE INDEX idx_user_permission_lookup ON "UserPermission"(user_id, permission_id, granted, is_active);
CREATE INDEX idx_permission_cache_key ON "PermissionCache"(cache_key);
CREATE INDEX idx_permission_cache_expires ON "PermissionCache"(expires_at);
CREATE INDEX idx_permission_cache_user ON "PermissionCache"(user_id);
```

## API Endpoints

### Permission Management API
```typescript
@Controller('api/permissions')
export class PermissionController {
  
  // Check single permission
  @Get('check/:permission')
  @RequirePermission('permissions.check.own')
  async checkPermission(
    @Param('permission') permission: string,
    @CurrentUser() user: User,
    @Body() context?: PermissionContext,
  ) {
    return this.permissionService.hasPermission(user.id, permission, context);
  }
  
  // Bulk permission check
  @Post('check-bulk')
  @RequirePermission('permissions.check.own')
  async checkBulkPermissions(
    @Body() request: BulkPermissionRequest,
    @CurrentUser() user: User,
  ) {
    return this.permissionService.checkBulkPermissions(
      user.id,
      request.permissions,
      request.context,
    );
  }
  
  // Get user permissions
  @Get('user')
  @RequirePermission('permissions.read.own')
  async getUserPermissions(@CurrentUser() user: User) {
    return this.permissionService.getUserPermissions(user.id);
  }
  
  // Get user permission summary
  @Get('user/summary')
  @RequirePermission('permissions.read.own')
  async getUserPermissionSummary(@CurrentUser() user: User) {
    return this.permissionService.getUserPermissionSummary(user.id);
  }
  
  // Grant permission (admin only)
  @Post('grant')
  @RequirePermission('permissions.grant.organization')
  async grantPermission(
    @Body() request: PermissionGrantRequest,
    @CurrentUser() user: User,
  ) {
    return this.permissionService.grantPermission({
      ...request,
      grantedBy: user.id,
    });
  }
  
  // Revoke permission (admin only)
  @Post('revoke')
  @RequirePermission('permissions.revoke.organization')
  async revokePermission(
    @Body() request: PermissionRevokeRequest,
    @CurrentUser() user: User,
  ) {
    return this.permissionService.revokePermission({
      ...request,
      revokedBy: user.id,
    });
  }
  
  // Assign role (admin only)
  @Post('assign-role')
  @RequirePermission('roles.assign.organization')
  async assignRole(
    @Body() request: RoleAssignmentRequest,
    @CurrentUser() user: User,
  ) {
    return this.permissionService.assignRole({
      ...request,
      assignedBy: user.id,
    });
  }
  
  // Get system status (debug)
  @Get('system/status')
  @RequirePermission('system.debug.platform')
  async getSystemStatus() {
    return this.permissionService.getSystemStatus();
  }
  
  // Force reinitialize (emergency)
  @Post('system/reinitialize')
  @RequirePermission('system.admin.platform')
  async forceReinitialize() {
    return this.permissionService.forceReinitialize();
  }
}
```

## Troubleshooting & Maintenance

### Common Issues & Solutions

#### 1. Permission Tables Not Found
```typescript
// Check system status
GET /api/permissions/system/status

// Force reinitialize
POST /api/permissions/system/reinitialize

// Environment variable override
FORCE_PERMISSION_SYSTEM=true
```

#### 2. Permission Cache Issues
```typescript
// Clear user cache
await permissionService.clearUserPermissionCache(userId);

// Manual cache cleanup
await permissionService.cleanupExpiredCache();

// Check cache stats
const stats = await permissionService.getUserCacheStats(userId);
```

#### 3. Migration Rollback
```bash
# Rollback to role-based system
npm run permissions:rollback

# Verify rollback
npm run permissions:validate
```

#### 4. Performance Issues
```sql
-- Check permission query performance
EXPLAIN ANALYZE 
SELECT p.* FROM "Permission" p
JOIN "UserPermission" up ON p.id = up.permission_id
WHERE up.user_id = $1 AND up.granted = true;

-- Monitor cache hit rate
SELECT 
  COUNT(*) as total_checks,
  COUNT(CASE WHEN source = 'cached' THEN 1 END) as cache_hits,
  (COUNT(CASE WHEN source = 'cached' THEN 1 END)::float / COUNT(*)) * 100 as hit_rate
FROM permission_evaluation_log;
```

### Debugging Tools

#### Permission Diagnostic
```typescript
// Debug user permissions
async function debugUserPermissions(userId: string) {
  const summary = await permissionService.getUserPermissionSummary(userId);
  
  console.log('=== Permission Debug Report ===');
  console.log(`User ID: ${userId}`);
  console.log(`Total Permissions: ${summary.permissions.length}`);
  console.log(`Roles: ${summary.roles.map(r => r.name).join(', ')}`);
  console.log(`Direct Permissions: ${summary.directPermissions.length}`);
  console.log(`Denied Permissions: ${summary.deniedPermissions.length}`);
  console.log(`Cache Stats:`, summary.cacheStats);
  
  return summary;
}

// Check specific permission
async function debugPermission(userId: string, permission: string) {
  const result = await permissionService.evaluatePermission(userId, permission);
  
  console.log('=== Permission Evaluation ===');
  console.log(`Permission: ${permission}`);
  console.log(`Allowed: ${result.allowed}`);
  console.log(`Source: ${result.source}`);
  console.log(`Reason: ${result.reason || 'N/A'}`);
  console.log(`Conditions: ${JSON.stringify(result.conditions, null, 2)}`);
  
  return result;
}
```

#### System Health Check
```typescript
// Monitor permission system health
async function healthCheck() {
  const status = await permissionService.getSystemStatus();
  
  if (!status.permissionTablesExist) {
    console.error('❌ Permission tables not found');
    return false;
  }
  
  if (status.tableStats.permissions === 0) {
    console.warn('⚠️ No permissions seeded');
    return false;
  }
  
  if (status.tableStats.customRoles === 0) {
    console.warn('⚠️ No system roles created');
    return false;
  }
  
  console.log('✅ Permission system healthy');
  console.log(`Permissions: ${status.tableStats.permissions}`);
  console.log(`Roles: ${status.tableStats.customRoles}`);
  console.log(`Cache Entries: ${status.tableStats.permissionCache}`);
  
  return true;
}
```

## Performance Optimization

### Caching Strategy
- **Permission Results**: Cached for 1 hour with automatic cleanup
- **User Permissions**: Bulk cached to reduce database queries
- **Role Mappings**: Cached at application startup
- **Condition Evaluations**: Memoized for repeated checks

### Database Optimization
- **Composite Indexes**: Optimized for common query patterns
- **Partial Indexes**: For active-only records
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Minimized N+1 queries

### Best Practices
1. **Use Bulk Checks**: For multiple permissions in single request
2. **Scope Appropriately**: Use narrowest possible scope
3. **Cache Wisely**: Clear cache on permission changes
4. **Monitor Performance**: Track cache hit rates and query times
5. **Condition Efficiency**: Keep condition logic simple and fast

## Future Enhancements

### Phase 2: Advanced Features
- **Dynamic Permissions**: Runtime permission creation
- **Permission Delegation**: Users granting permissions to others
- **Temporary Grants**: Time-limited permission assignments
- **Module Marketplace**: Per-module permission packages

### Phase 3: Enterprise Features
- **External Integration**: SSO and LDAP permission sync
- **Compliance Reporting**: SOX, GDPR, audit reports
- **Permission Analytics**: Usage patterns and optimization
- **API Management**: External system permission grants

### Phase 4: AI & Automation
- **Smart Permissions**: AI-suggested permission assignments
- **Anomaly Detection**: Unusual permission usage alerts
- **Auto-scaling**: Dynamic permission caching
- **Predictive Security**: Proactive permission adjustments

This comprehensive permission system provides the foundation for secure, scalable, multi-tenant hotel operations while maintaining the flexibility to evolve with business needs.