# Tenant Security Examples

This directory contains example patterns for implementing tenant-safe operations.

## Key Patterns

### 1. Service with Tenant Context

```typescript
@Injectable()
export class MyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findAll() {
    const safeQuery = TenantQueryHelper.createSafeQuery(
      { where: {} },
      this.tenantContext,
      { resourceType: 'user' }
    );
    
    const results = await this.prisma.user.findMany(safeQuery);
    TenantQueryHelper.validateTenantOwnership(results, this.tenantContext);
    
    return results;
  }
}
```

### 2. Controller with Guards

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UsersController {
  @Get()
  async getUsers() {
    return this.usersService.findAll();
  }
}
```

### 3. Migration Checklist

When updating existing services:

1. ✅ Inject `TenantContextService`
2. ✅ Replace manual `propertyId` filtering with `TenantQueryHelper.createSafeQuery()`
3. ✅ Use `TenantQueryHelper.ensureTenantContext()` for create/update operations
4. ✅ Add `validateTenantOwnership()` validation
5. ✅ Test with multiple tenants
6. ✅ Add `TenantGuard` to sensitive endpoints

See the main README.md for complete documentation.