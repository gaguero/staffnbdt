# Hotel Operations Hub - System Patterns

## Core Architectural Patterns

### 1. Multi-Tenant Architecture

**Pattern**: Single database with tenant isolation via foreign keys, enforced by a global middleware.
**Implementation**: All tenant-scoped tables include `organization_id` and `property_id`. API requests are processed by a `TenantInterceptor` that injects and validates tenant context, which is then used by a `TenantContextService` to automatically apply filters to all database queries.

**Tenant Hierarchy**:
```
Platform Level (Super Admin)
├── Organizations (Hotel Chains/Groups)
│   ├── Branding Configuration
│   ├── Module Subscriptions
│   └── Properties (Individual Hotels)
│       ├── Property-Specific Settings
│       ├── Module Configurations
│       └── Departments
│           ├── Users (Staff, Managers)
│           └── Department-Specific Data
```

**Benefits**:
- Cost-effective for smaller tenants
- Simplified backup and maintenance
- Shared schema updates
- Query optimization across tenants

**Security**:
- **API-level tenant validation** on every request via `TenantInterceptor`.
- **Database queries automatically filtered** by `TenantContextService`.
- No direct database access from the frontend.
- Audit logging for all sensitive tenant operations.

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

### 3. Enhanced Modal Implementation Pattern

The system follows a standardized approach for modal components with real-time validation, consistent error handling, and enhanced user feedback.

#### Key Features:
- **Real-time Validation**: Zod schemas with react-hook-form for immediate feedback
- **Consistent Error Handling**: Centralized toastService for all user notifications
- **Loading States**: Skeleton loaders and progress indicators for better UX
- **Visual Feedback**: Success/error icons and validation states
- **Form State Management**: react-hook-form with automatic validation

#### Example Implementation:
```typescript
const EnhancedModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isValid, isValidating },
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange', // Real-time validation
  });

  const onSubmit = async (data: FormData) => {
    const loadingToast = toastService.loading('Processing...');

    try {
      await apiService.submit(data);
      toastService.dismiss(loadingToast);
      toastService.success('Operation completed successfully');
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toastService.dismiss(loadingToast);
      toastService.actions.operationFailed('operation', error.response?.data?.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="Field Name"
              type="text"
              register={register('fieldName')}
              error={errors.fieldName}
              success={!!watch('fieldName') && !errors.fieldName}
              validating={isValidating}
            />

            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="submit"
                disabled={!isValid || loading}
                className="btn btn-primary flex-1"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Submit'}
              </button>
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
```

#### Migration Checklist for Existing Modals:
- [ ] Add validation schema with Zod
- [ ] Convert to react-hook-form
- [ ] Replace manual inputs with FormField components
- [ ] Update error handling to use toastService
- [ ] Add skeleton loaders for async content
- [ ] Implement visual feedback indicators
- [ ] Test real-time validation
- [ ] Verify toast notifications
- [ ] Check mobile responsiveness

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

## Hotel Operations Module Patterns

This section outlines the specific architectural and implementation patterns for the core hotel operations modules, including Guests, Units (Rooms), and Reservations. These patterns extend the core multi-tenant architecture with domain-specific logic.

### 1. API Endpoint Specifications (Example: GuestsController)

Controllers for hotel modules should be fully protected by permission guards and automatically handle tenant context. They should also include audit logging for sensitive operations.

```typescript
@Controller('guests')
@UseGuards(JwtAuthGuard, PermissionGuard, TenantInterceptor)
@ApiBearerAuth()
export class GuestsController {

  @Post()
  @RequirePermission('guest.create.property')
  @Audit({ action: 'CREATE', entity: 'Guest' })
  async create(@Body() createGuestDto: CreateGuestDto, @CurrentUser() currentUser: User) {
    // ...
  }

  @Get()
  @RequirePermission('guest.read.property')
  @PermissionScope('property')
  async findAll(@Query() filterDto: GuestFilterDto, @CurrentUser() currentUser: User) {
    // ...
  }

  @Patch(':id')
  @RequirePermission('guest.update.property')
  @Audit({ action: 'UPDATE', entity: 'Guest' })
  async update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto, @CurrentUser() currentUser: User) {
    // ...
  }

  @Delete(':id')
  @RequirePermission('guest.delete.property')
  @Audit({ action: 'DELETE', entity: 'Guest' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    // ...
  }
}
```

### 2. Service Layer Business Logic (Example: Availability Checking)

Service layers should contain the core business logic, including complex operations like checking unit availability, which involves filtering by multiple criteria and checking for reservation conflicts.

```typescript
@Injectable()
export class UnitService {
  async checkAvailability(availabilityDto: CheckAvailabilityDto, currentUser: User): Promise<AvailabilityResult> {
    const tenantContext = this.tenantContextService.getTenantContext();
    const { checkInDate, checkOutDate, adults, children } = availabilityDto;

    // 1. Build a Prisma query to filter units based on criteria (occupancy, type, amenities, etc.)
    const potentialUnits = await this.prisma.unit.findMany({
      where: {
        propertyId: tenantContext.propertyId,
        isActive: true,
        maxOccupancy: { gte: (adults || 1) + (children || 0) },
        // ... other filters
      },
      include: {
        reservations: { // Include potentially conflicting reservations
          where: {
            status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] },
            AND: [
              { checkInDate: { lte: checkOutDate } },
              { checkOutDate: { gte: checkInDate } }
            ],
          },
        },
      },
    });

    // 2. Filter out units that have conflicting reservations
    const availableUnits = potentialUnits.filter(unit => unit.reservations.length === 0);

    // 3. Format and return the results
    return {
      totalAvailableUnits: availableUnits.length,
      availabilityByType: this.groupAvailabilityByType(availableUnits),
      // ... other result data
    };
  }
}
```

### 3. State Transition Logic

For entities with status fields (like Reservations), business logic must enforce valid state transitions to maintain data integrity.

```typescript
// Example for Reservation status transitions
const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.CONFIRMED]: [ReservationStatus.CHECKED_IN, ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
  [ReservationStatus.CHECKED_IN]: [ReservationStatus.CHECKED_OUT],
  [ReservationStatus.CHECKED_OUT]: [], // Terminal state
  [ReservationStatus.CANCELLED]: [], // Terminal state
  [ReservationStatus.NO_SHOW]: [ReservationStatus.CHECKED_IN], // Can still check in late
};

private validateStatusTransition(from: ReservationStatus, to: ReservationStatus): void {
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(`Cannot change status from ${from} to ${to}`);
  }
}
```

### 4. Hotel-Specific Permissions

New modules require new sets of granular permissions that follow the established `resource.action.scope` pattern.

```typescript
// Example Guest Management Permissions
export const HOTEL_PERMISSIONS = {
  GUEST: {
    CREATE_PROPERTY: 'guest.create.property',
    READ_PROPERTY: 'guest.read.property',
    UPDATE_PROPERTY: 'guest.update.property',
    DELETE_PROPERTY: 'guest.delete.property',
    BLACKLIST_PROPERTY: 'guest.blacklist.property',
    MERGE_PROPERTY: 'guest.merge.property',
  },
  // ... permissions for UNIT, RESERVATION, etc.
} as const;
```

### 5. Frontend Component Hierarchy

Frontend modules should be built with a clear hierarchy of components, including pages, specialized components for hotel operations (e.g., `RoomStatusGrid`, `ReservationCalendar`), and extensions of shared components (e.g., `DataTable`, `FilterBar`).

```typescript
// Example Component Structure
├── pages/
│   ├── FrontDeskDashboard.tsx
│   └── RoomManagementPage.tsx
├── components/
│   ├── hotel/
│   │   ├── RoomStatusGrid/
│   │   │   ├── RoomStatusGrid.tsx
│   │   │   └── RoomCard.tsx
│   │   └── ReservationCalendar/
│   │       ├── ReservationCalendar.tsx
│   │       └── ReservationBlock.tsx
│   └── shared/
│       └── DataTable/
│           └── ReservationTable.tsx
```

### 6. Frontend State Management (TanStack Query)

Server state for hotel modules should be managed with TanStack Query, using structured query keys for caching and invalidation. Real-time updates can be handled via polling or WebSockets.

```typescript
// Hotel-specific query keys
export const hotelQueryKeys = {
  rooms: {
    all: ['rooms'] as const,
    lists: () => [...hotelQueryKeys.rooms.all, 'list'] as const,
    status: () => [...hotelQueryKeys.rooms.all, 'status'] as const,
  },
  reservations: {
    all: ['reservations'] as const,
    calendar: (date: string) => [...hotelQueryKeys.reservations.all, 'calendar', date] as const,
  },
};

// Custom hook for real-time room status
export const useRoomStatus = () => {
  return useQuery({
    queryKey: hotelQueryKeys.rooms.status(),
    queryFn: () => roomService.getRoomStatus(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
};
```

### 7. Mobile-First and Responsive Design

Components must be designed with a mobile-first approach to support operational staff on tablets and phones. Layouts should be responsive, and interactions should be touch-friendly.

```typescript
// Responsive room status grid that switches to a list on mobile
const ResponsiveRoomGrid: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const viewMode = isMobile ? 'list' : 'grid';

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-12 gap-2' : 'space-y-2'}>
      {/* ... render rooms as cards or list items based on viewMode ... */}
    </div>
  );
};
```

These patterns form the foundation of Hotel Operations Hub's architecture, ensuring scalability, security, and maintainability while supporting the complex requirements of multi-tenant hotel operations.

## Role System UI & Management Patterns

### Role Badges and Role Display

Reusable UI components standardize how system and custom roles are displayed throughout the app.

- Components: `RoleBadge`, `RoleBadgeGroup`, enhanced `UserCard`
- Accessibility: ARIA labels, keyboard navigation, contrast-safe colors
- Theming: Tailwind classes driven by CSS variables for white-label compatibility

Example usage:
```tsx
<RoleBadge role={Role.PROPERTY_MANAGER} size="sm" showTooltip />
<RoleBadgeGroup systemRole={Role.DEPARTMENT_ADMIN} customRoles={[nightManager]} maxVisible={2} />
```

### Role Duplication (Clone) System

End-to-end cloning for roles with single and batch operations, previews, and lineage tracking.

- Frontend: `RoleDuplicator`, `CloneOptionsDialog`, `BulkCloneDialog`, `RoleLineageTree`
- Backend endpoints:
```http
POST /api/roles/clone
POST /api/roles/batch-clone
POST /api/roles/clone-preview
GET  /api/roles/:id/lineage
```
- Smart features: name suggestions, level adjustments, permission optimization, conflict detection
- Security: requires `role.create.*` permissions; multi-tenant scoping enforced

### Role Assignment History

Comprehensive audit of role assignments leveraging the existing `AuditLog` with tenant scoping.

- Service/Controller: `roles-history.service.ts`, `roles-history.controller.ts`
- Views: Dashboard, Timeline, Admin Activity, Analytics
- Capabilities: export (CSV/PDF/Excel/JSON), rollback with impact analysis
- Permissions: `role.read.history`, `role.rollback`, `export.create`

### Role Analytics Dashboard

Visual analytics for roles, permissions, and assignment trends.

- Components: `RoleStatsDashboard` with ExecutiveSummary, Role/Permission/User analytics, Security dashboard
- Expected backend endpoints:
```http
GET /roles/analytics
GET /permissions/analytics
GET /roles/trends
GET /roles/security-metrics
GET /roles/optimization
```
- Performance: cached aggregations, lazy-loaded charts, memoized calculations

### Integration Notes

- All role features respect tenant isolation and permission gates
- UI uses brand-aware CSS variables (white-labeling) and mobile-first layouts
- Testing: unit, integration, and E2E coverage with Playwright where applicable

## New Module Patterns

### EAV (Entity-Attribute-Value) Pattern for Concierge Objects

**Implementation**: Dynamic field storage for configurable Concierge Objects
```typescript
// Core object with typed attributes
ConciergeObject {
  id, type, status, dueAt, assignments, files
  // EAV attributes stored separately
}

ConciergeAttribute {
  objectId, fieldKey, fieldType, stringValue, numberValue, 
  booleanValue, dateValue, jsonValue
}
```

**Benefits**:
- Strong indexing per field type
- Type-safe attribute access
- Flexible schema evolution
- Efficient querying for common patterns

**Validation**: `ObjectType.fieldsSchema` defines field types, required flags, and validation rules at API boundary

### Module Enablement Precedence

**Property-Level Override**: Extend `ModuleSubscription` to support property-specific control
```sql
-- Unique constraints
UNIQUE(organizationId, moduleId, propertyId) -- property-level
UNIQUE(organizationId, moduleId) WHERE propertyId IS NULL -- org-level
```

**Precedence Logic**:
1. Check for property-specific subscription: `(org, module, property)`
2. Fall back to organization-level: `(org, module, null)`
3. Property-level `isEnabled` overrides org-level setting

**Use Cases**:
- Organization pays for all properties
- Individual properties manage their own subscriptions
- Mixed models with org defaults and property overrides

### Playbook Automation Pattern

**Worker-Driven Execution**: Background workers handle SLA enforcement and dependency management
```typescript
// Playbook triggers
interface PlaybookTrigger {
  event: 'reservation.created' | 'concierge.object.completed'
  conditions: PlaybookCondition[]
  actions: PlaybookAction[]
}

// SLA enforcement
interface SLAEnforcement {
  objectId: string
  dueAt: DateTime
  workerId: string
  status: 'pending' | 'overdue' | 'completed'
}
```

**Event Flow**:
1. Reservation/object created → trigger playbook evaluation
2. Worker creates required objects and sets SLAs
3. SLA workers monitor due dates and emit overdue events
4. UI surfaces exceptions in Today Board and Reservation 360

### Magic-Link Portal Pattern

**Secure External Access**: Vendor confirmation portal with scoped PII access
```typescript
// Portal session
interface PortalSession {
  token: string // JWT with vendor context
  vendorId: string
  organizationId: string
  propertyId: string
  permissions: string[] // Scoped to vendor operations
  expiresAt: DateTime
}
```

**Security Model**:
- JWT tokens with vendor-specific claims
- PII scoped to vendor's assigned objects
- Time-limited sessions (24-48 hours)
- Audit logging for all portal actions

**Integration Points**:
- Vendor links reference `vendorPolicyRef`
- Concierge objects can link to vendor confirmations
- Event bus handles vendor status changes
