# Permission System

## Overview

The Hotel Operations Hub Permission System provides a flexible, multi-tenant, role-based access control (RBAC) system with support for:

- **Custom Roles**: Tenant-specific roles beyond the legacy Role enum
- **Granular Permissions**: Resource.action.scope permission format
- **Conditional Permissions**: Time-based, location-based, and attribute-based conditions
- **High-Performance Caching**: Redis-backed permission caching with automatic expiration
- **Multi-Tenant Support**: Organization and property-scoped permissions
- **Audit Logging**: Complete audit trail for all permission changes

## Architecture

### Core Models

1. **Permission**: Individual permissions with resource.action.scope format
2. **CustomRole**: Tenant-defined roles with priority and inheritance
3. **RolePermission**: Maps roles to permissions with conditions
4. **UserPermission**: Direct user permission overrides
5. **UserCustomRole**: Assigns custom roles to users
6. **PermissionCondition**: Conditional rules for dynamic permission evaluation
7. **PermissionCache**: High-performance permission caching

### Permission Format

Permissions follow the format: `resource.action.scope`

- **Resource**: The entity type (user, payslip, training, unit, etc.)
- **Action**: The operation (create, read, update, delete, approve, assign, etc.)
- **Scope**: The access level (own, department, property, organization, all)

Examples:
- `user.create.department` - Create users within own department
- `payslip.read.own` - View own payslips
- `vacation.approve.department` - Approve department vacation requests
- `unit.update.property` - Update units within property

## Usage

### Service Integration

```typescript
import { PermissionService } from './modules/permissions';

@Injectable()
export class SomeService {
  constructor(private permissionService: PermissionService) {}

  async someMethod(userId: string) {
    // Check single permission
    const canCreateUsers = await this.permissionService.hasPermission(
      userId,
      'user',
      'create',
      'department'
    );

    if (!canCreateUsers) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Get all user permissions
    const permissions = await this.permissionService.getUserPermissions(userId);

    // Bulk permission check
    const bulkResult = await this.permissionService.checkBulkPermissions(
      userId,
      [
        { resource: 'user', action: 'create', scope: 'department' },
        { resource: 'payslip', action: 'read', scope: 'department' },
      ]
    );
  }
}
```

### Controller Guards

```typescript
import { RequirePermissions, PermissionGuard } from './modules/permissions';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  
  @Post()
  @RequirePermissions('user.create.department')
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Only users with user.create.department permission can access
  }

  @Get()
  @RequirePermissions(
    { resource: 'user', action: 'read', scope: 'department' },
    { resource: 'user', action: 'read', scope: 'property', operator: 'OR' }
  )
  async getUsers() {
    // Users need either department OR property level read access
  }
}
```

### Manual Permission Grants

```typescript
// Grant permission to user
await this.permissionService.grantPermission({
  userId: 'user123',
  permissionId: 'perm456',
  grantedBy: 'admin789',
  expiresAt: new Date('2024-12-31'),
  conditions: {
    timeRestricted: true,
    startTime: '09:00',
    endTime: '17:00'
  }
});

// Assign role to user
await this.permissionService.assignRole({
  userId: 'user123',
  roleId: 'role456',
  assignedBy: 'admin789',
  expiresAt: new Date('2024-12-31'),
  conditions: {
    departmentRestricted: true,
    allowedDepartments: ['hr', 'finance']
  }
});
```

## API Endpoints

### Permission Checking

- `POST /permissions/check` - Check single permission for current user
- `POST /permissions/check/bulk` - Check multiple permissions for current user
- `POST /permissions/user/:userId/check` - Check permission for specific user (admin)

### Permission Management

- `GET /permissions/my` - Get current user's permissions
- `GET /permissions/my/summary` - Get detailed permission summary for current user
- `GET /permissions/user/:userId` - Get user's permissions (admin)
- `GET /permissions/user/:userId/summary` - Get user's permission summary (admin)

### Permission Administration

- `POST /permissions/grant` - Grant permission to user
- `POST /permissions/revoke` - Revoke permission from user
- `POST /permissions/role/assign` - Assign role to user
- `DELETE /permissions/user/:userId/cache` - Clear user's permission cache
- `DELETE /permissions/my/cache` - Clear current user's permission cache

## Conditional Permissions

### Time-Based Conditions

```json
{
  "conditionType": "time",
  "operator": "between",
  "value": {
    "startTime": "09:00",
    "endTime": "17:00"
  }
}
```

### Department-Based Conditions

```json
{
  "conditionType": "department",
  "operator": "in_list",
  "value": {
    "departments": ["hr", "finance", "management"]
  }
}
```

### Resource Ownership Conditions

```json
{
  "conditionType": "resource_owner",
  "operator": "equals",
  "value": {
    "field": "userId",
    "compare": "context.userId"
  }
}
```

## Caching Strategy

The permission system includes aggressive caching for high performance:

- **Permission Results**: Individual permission evaluations cached with TTL
- **User Permissions**: Complete user permission lists cached
- **Bulk Operations**: Optimized bulk checks with cache warming
- **Automatic Cleanup**: Hourly cleanup of expired cache entries

### Cache Configuration

```typescript
// Environment variables
PERMISSION_CACHE_TTL=3600 // 1 hour default
PERMISSION_MAX_CACHE_SIZE=10000
```

### Cache Management

```typescript
// Clear user cache
await this.permissionService.clearUserPermissionCache(userId);

// Cache is automatically invalidated when:
// - User permissions are granted/revoked
// - User roles are assigned/removed
// - Role permissions are modified
```

## Multi-Tenant Support

Permissions are automatically scoped to the user's tenant context:

```typescript
const evaluationContext = {
  userId: user.sub,
  organizationId: user.organizationId,
  propertyId: user.propertyId,
  departmentId: user.departmentId,
  // Additional context...
};
```

Tenant isolation ensures:
- Users can only access resources within their organization/property
- Role assignments respect tenant boundaries
- Permission grants are scoped appropriately

## Performance Considerations

### Bulk Operations

Use bulk permission checks for better performance:

```typescript
// ❌ Inefficient - multiple database queries
const canCreate = await hasPermission(userId, 'user', 'create', 'department');
const canRead = await hasPermission(userId, 'user', 'read', 'department');
const canUpdate = await hasPermission(userId, 'user', 'update', 'department');

// ✅ Efficient - single bulk operation with caching
const { permissions } = await checkBulkPermissions(userId, [
  { resource: 'user', action: 'create', scope: 'department' },
  { resource: 'user', action: 'read', scope: 'department' },
  { resource: 'user', action: 'update', scope: 'department' },
]);
```

### Cache Warming

The system automatically warms caches for frequently accessed permissions:

- User login triggers permission cache warming
- Bulk operations populate cache for future single checks
- Background processes maintain hot cache entries

### Database Optimization

- Indexed permission lookups
- Optimized joins for role and user permissions
- Efficient cache key generation
- Batch operations for bulk grants/revokes

## Security Considerations

### Permission Elevation

- Users cannot grant permissions they don't possess
- Role assignments require appropriate administrative permissions
- All permission changes are audit logged

### Condition Evaluation

- Conditions are evaluated server-side only
- No client-side condition logic to prevent tampering
- Condition failures are logged for security monitoring

### Cache Security

- Cache entries include user context to prevent cross-user access
- Cache keys are hashed to prevent enumeration
- Sensitive permission data is not exposed in cache metadata

## Migration from Legacy Roles

The system maintains backward compatibility with the existing Role enum:

```typescript
// Legacy roles are mapped to permission sets
const legacyPermissions = await this.getLegacyRolePermissions(user.role);

// Users gradually migrated to custom role system
// Both systems work simultaneously during transition
```

## Development and Testing

### Seeding

Run the permission seed to populate default permissions and roles:

```bash
npm run seed:permissions
```

### Testing

```typescript
describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PermissionService, ...testProviders],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  it('should grant permissions correctly', async () => {
    const result = await service.hasPermission(
      'userId',
      'user',
      'create',
      'department'
    );
    expect(result).toBe(true);
  });
});
```

## Monitoring and Observability

### Metrics

- Permission check latency
- Cache hit/miss ratios
- Failed permission attempts
- Bulk operation performance

### Logging

- All permission grants/revokes logged
- Failed permission checks logged with context
- Cache performance metrics logged
- Condition evaluation failures logged

### Health Checks

- Cache connectivity and performance
- Database query performance
- Permission evaluation latency

## Future Enhancements

### Planned Features

- **Dynamic Permissions**: Runtime permission creation
- **Permission Templates**: Reusable permission sets
- **Advanced Conditions**: Location-based, device-based conditions
- **Permission Analytics**: Usage patterns and optimization suggestions
- **External Integration**: SSO and external permission providers

### Performance Improvements

- **Distributed Caching**: Redis cluster support
- **Permission Compilation**: Pre-compiled permission sets
- **Lazy Loading**: On-demand permission resolution
- **Batch Processing**: Background permission updates