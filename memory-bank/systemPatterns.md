# Hotel Operations Hub - System Patterns

## Core Architectural Patterns

### 1. Multi-Tenant Shared Database Pattern

**Pattern**: Single database with tenant isolation via foreign keys
**Implementation**: All tenant-scoped tables include `organization_id` and `property_id`

```sql
-- Example tenant-scoped table
users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id), -- Tenant isolation
  property_id UUID REFERENCES properties(id),       -- Property scoping
  email CITEXT UNIQUE NOT NULL,
  -- other fields...
)
```

**Tenant Context Middleware**:
```typescript
@Injectable()
export class TenantContextMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user; // From JWT
    req.tenantContext = {
      organizationId: user.organizationId,
      propertyId: req.headers['x-property-id'] || user.primaryPropertyId,
      userId: user.id,
      role: user.globalRole,
    };
    next();
  }
}
```

**Benefits**:
- Cost-effective for smaller tenants
- Simplified backup and maintenance
- Shared schema updates
- Query optimization across tenants

**Security**:
- API-level tenant validation on every request
- Database queries automatically filtered by tenant context
- No direct database access from frontend
- Audit logging for all tenant operations

### 2. Backend-for-Frontend (BFF) Pattern

**Pattern**: Dedicated API layer optimized for frontend needs
**Implementation**: NestJS BFF with tenant context, pre-signed URLs, and aggregated responses

```typescript
// BFF handles complex frontend requirements
@Controller('api/dashboard')
export class DashboardController {
  @Get('summary')
  async getDashboardSummary(@Req() req: TenantRequest) {
    const { organizationId, propertyId } = req.tenantContext;
    
    // Aggregate data from multiple services for frontend
    return {
      userStats: await this.userService.getStats(organizationId, propertyId),
      recentActivity: await this.auditService.getRecent(organizationId),
      documents: await this.documentService.getRecent(propertyId),
      notifications: await this.notificationService.getPending(req.user.id)
    };
  }
}
```

**Benefits**:
- Reduces frontend complexity
- Optimizes network requests
- Handles tenant context centrally
- Provides security boundary

### 3. Dynamic White-Labeling Pattern

**Pattern**: Runtime CSS variable injection with tenant-specific branding
**Implementation**: CSS variables overridden per tenant with fallbacks

```css
/* Base theme with fallbacks */
:root {
  --primary-color: var(--tenant-primary, #f5ebd7);
  --secondary-color: var(--tenant-secondary, #aa8e67);
  --logo-url: var(--tenant-logo, url('/default-logo.png'));
}
```

```typescript
// Theme injection service
@Injectable()
export class ThemeService {
  async injectTenantTheme(organizationId: string, propertyId?: string) {
    const branding = await this.getBrandingConfig(organizationId, propertyId);
    
    // Inject CSS variables
    Object.entries(branding.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--tenant-${key}`, value);
    });
    
    // Load custom fonts
    if (branding.typography.fontUrl) {
      this.loadFont(branding.typography.fontUrl);
    }
  }
}
```

**Benefits**:
- Real-time theme switching
- No build-time requirements
- Tenant-specific customization
- Performance optimization through CSS

### 4. AI-Powered Translation Pattern

**Pattern**: Fallback translation system with AI generation and tenant overrides
**Implementation**: Hierarchical translation resolution

```typescript
class TranslationService {
  async getTranslation(key: string, language: string, context: TenantContext) {
    // 1. Check property-specific override
    if (context.propertyId) {
      const propertyTranslation = await this.getPropertyTranslation(key, language, context.propertyId);
      if (propertyTranslation) return propertyTranslation;
    }
    
    // 2. Check organization-specific override
    const orgTranslation = await this.getOrganizationTranslation(key, language, context.organizationId);
    if (orgTranslation) return orgTranslation;
    
    // 3. Check platform default
    const defaultTranslation = await this.getDefaultTranslation(key, language);
    if (defaultTranslation) return defaultTranslation;
    
    // 4. AI translation fallback
    return this.aiTranslate(key, language, context);
  }
}
```

**Benefits**:
- Handles missing translations gracefully
- Supports tenant-specific terminology
- Scalable to new languages
- Maintains translation quality

### 5. Modular Architecture Pattern

**Pattern**: Independent modules with event-driven communication
**Implementation**: Module registry with inter-module messaging

```typescript
// Module registration
interface Module {
  code: string;
  name: string;
  version: string;
  dependencies: string[];
  routes: ModuleRoute[];
  permissions: Permission[];
}

// Inter-module communication
eventBus.emit('user.created', {
  userId: 'user-123',
  organizationId: 'org-456',
  propertyId: 'prop-789'
});

// Other modules listen and react
eventBus.on('user.created', async (event) => {
  await this.profileService.createDefaultProfile(event.userId);
  await this.trainingService.assignOnboardingTraining(event.userId);
});
```

**Benefits**:
- Loose coupling between modules
- Independent deployment capability
- Scalable feature addition
- Clear module boundaries

## Data Access Patterns

### 1. Repository Pattern with Tenant Scoping

```typescript
@Injectable()
export class TenantAwareRepository<T> {
  constructor(private prisma: PrismaService) {}
  
  async findMany(where: any, tenantContext: TenantContext): Promise<T[]> {
    return this.prisma[this.tableName].findMany({
      where: {
        ...where,
        organizationId: tenantContext.organizationId,
        ...(tenantContext.propertyId && { propertyId: tenantContext.propertyId })
      }
    });
  }
}
```

### 2. Audit Logging Pattern

```typescript
@Injectable()
export class AuditService {
  async logActivity(action: string, entity: any, context: TenantContext) {
    await this.prisma.auditLog.create({
      data: {
        actorId: context.userId,
        action,
        entityType: entity.constructor.name,
        entityId: entity.id,
        organizationId: context.organizationId,
        propertyId: context.propertyId,
        oldValues: entity._originalValues,
        newValues: entity._currentValues,
        timestamp: new Date(),
        ipAddress: context.ipAddress
      }
    });
  }
}
```

## File Storage Patterns

### 1. Tenant-Scoped Storage Organization

```
R2 Bucket Structure:
├── organization-1/
│   ├── shared/           # Organization-level files
│   ├── property-1/       # Property-specific files
│   │   ├── documents/
│   │   ├── profiles/
│   │   └── training/
│   └── property-2/
└── organization-2/
```

### 2. Pre-signed URL Pattern

```typescript
@Injectable()
export class FileStorageService {
  async getPresignedUploadUrl(
    filename: string,
    context: TenantContext
  ): Promise<PresignedUrl> {
    const key = this.buildTenantPath(filename, context);
    
    return getSignedUrl(this.s3Client, new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Expires: 300 // 5 minutes
    }));
  }
  
  private buildTenantPath(filename: string, context: TenantContext): string {
    const basePath = `${context.organizationId}`;
    const propertyPath = context.propertyId ? `/${context.propertyId}` : '/shared';
    return `${basePath}${propertyPath}/${filename}`;
  }
}
```

## Security Patterns

### 1. Role-Based Access Control (RBAC)

```typescript
// Role hierarchy
enum Role {
  PLATFORM_ADMIN = 'platform_admin',
  ORG_OWNER = 'org_owner',
  ORG_ADMIN = 'org_admin',
  PROPERTY_MANAGER = 'property_manager',
  DEPT_ADMIN = 'dept_admin',
  STAFF = 'staff'
}

// Permission checking
@Injectable()
export class PermissionService {
  hasPermission(
    user: User,
    action: string,
    resource: any,
    context: TenantContext
  ): boolean {
    // Check role hierarchy
    if (user.role === Role.PLATFORM_ADMIN) return true;
    
    // Check organization boundaries
    if (resource.organizationId !== context.organizationId) return false;
    
    // Check property boundaries for property-scoped roles
    if (user.role === Role.PROPERTY_MANAGER || user.role === Role.DEPT_ADMIN) {
      if (resource.propertyId !== context.propertyId) return false;
    }
    
    // Check action permissions for role
    return this.rolePermissions[user.role].includes(action);
  }
}
```

### 2. Data Encryption Pattern

```typescript
// Sensitive field encryption
@Injectable()
export class EncryptionService {
  encrypt(data: string): string {
    return this.crypto.encrypt(data, this.getEncryptionKey());
  }
  
  decrypt(encryptedData: string): string {
    return this.crypto.decrypt(encryptedData, this.getEncryptionKey());
  }
  
  // Used for ID documents and other PII
  async storeSecure(data: string, context: TenantContext): Promise<string> {
    const encrypted = this.encrypt(data);
    const key = this.generateSecureKey(context);
    await this.storageService.put(key, encrypted);
    return key;
  }
}
```

## Performance Patterns

### 1. Caching Strategy

```typescript
@Injectable()
export class CacheService {
  private readonly TTL = {
    TENANT_CONFIG: 1800,      // 30 minutes
    TRANSLATIONS: 3600,       // 1 hour
    USER_PERMISSIONS: 900,    // 15 minutes
    MODULE_CONFIG: 3600       // 1 hour
  };
  
  async getTenantConfig(organizationId: string): Promise<TenantConfig> {
    const cacheKey = `tenant:${organizationId}:config`;
    
    let config = await this.redis.get(cacheKey);
    if (!config) {
      config = await this.databaseService.getTenantConfig(organizationId);
      await this.redis.setex(cacheKey, this.TTL.TENANT_CONFIG, JSON.stringify(config));
    }
    
    return JSON.parse(config);
  }
}
```

### 2. Database Query Optimization

```typescript
// Optimized queries with proper indexing
class UserRepository {
  async findByTenant(context: TenantContext) {
    return this.prisma.user.findMany({
      where: {
        organizationId: context.organizationId,
        propertyId: context.propertyId,
        deletedAt: null
      },
      include: {
        profile: true,
        department: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
  }
}

// Supporting indexes
CREATE INDEX idx_users_tenant ON users(organization_id, property_id, deleted_at);
CREATE INDEX idx_users_name ON users(last_name, first_name);
```

## Integration Patterns

### 1. External API Integration

```typescript
@Injectable()
export class ExternalAPIService {
  async callExternalAPI(endpoint: string, data: any, context: TenantContext) {
    const config = await this.getTenantAPIConfig(context.organizationId);
    
    return this.httpService.post(endpoint, data, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Tenant-ID': context.organizationId
      },
      timeout: 30000,
      retry: 3
    });
  }
}
```

### 2. Event-Driven Architecture

```typescript
// Event publishing
@Injectable()
export class EventPublisher {
  async publish(event: DomainEvent, context: TenantContext) {
    const enrichedEvent = {
      ...event,
      tenantContext: context,
      timestamp: new Date(),
      eventId: uuid()
    };
    
    await this.eventBus.emit(event.type, enrichedEvent);
    await this.eventStore.save(enrichedEvent); // Event sourcing
  }
}

// Event handling
@EventHandler(UserCreatedEvent)
export class UserCreatedHandler {
  async handle(event: UserCreatedEvent) {
    // Create default profile
    await this.profileService.createDefault(event.userId);
    
    // Send welcome email
    await this.emailService.sendWelcome(event.userEmail, event.tenantContext);
    
    // Log audit event
    await this.auditService.logUserCreated(event);
  }
}
```

These patterns form the foundation of Hotel Operations Hub's architecture, ensuring scalability, security, and maintainability while supporting the complex requirements of multi-tenant hotel operations.
