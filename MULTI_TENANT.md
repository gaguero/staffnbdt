# Multi-Tenancy Implementation Guide

## Overview

Hotel Operations Hub implements a **shared database multi-tenancy model** with tenant isolation through organization and property IDs. This approach provides cost-effectiveness while ensuring complete data isolation and security.

## Tenant Hierarchy

```
Platform
├── Organizations (Hotel Chains/Groups)
│   ├── Properties (Individual Hotels)
│   │   ├── Departments (Front Desk, Housekeeping, etc.)
│   │   │   └── Users (Staff, Managers)
│   │   └── Modules (Enabled features per property)
│   └── Branding (Organization-level theming)
└── Settings (Platform-wide configuration)
```

## Database Schema Design

### Core Tenant Tables

```sql
-- Organizations (Hotel chains, management groups)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    type TEXT NOT NULL CHECK (type IN ('CHAIN', 'INDEPENDENT', 'MANAGEMENT_GROUP')),
    tier TEXT NOT NULL DEFAULT 'STARTER' CHECK (tier IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
    
    -- Subscription and billing
    subscription_status TEXT NOT NULL DEFAULT 'TRIAL' CHECK (subscription_status IN ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED')),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    billing_email TEXT,
    
    -- Settings and configuration
    settings JSONB NOT NULL DEFAULT '{}',
    
    -- Contact information
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Address
    address JSONB, -- {street, city, state, country, postal_code}
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID, -- Can be NULL for system-created orgs
    
    -- Indexes
    CONSTRAINT organizations_name_check CHECK (LENGTH(name) > 0),
    CONSTRAINT organizations_slug_check CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Properties (Individual hotels/locations)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic information
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- Property code for identification (e.g., "NYC-001")
    slug TEXT NOT NULL, -- URL-friendly identifier
    type TEXT NOT NULL CHECK (type IN ('HOTEL', 'RESORT', 'MOTEL', 'BOUTIQUE', 'HOSTEL')),
    
    -- Property details
    rooms INTEGER,
    floors INTEGER,
    year_built INTEGER,
    year_renovated INTEGER,
    
    -- Location and contact
    location JSONB NOT NULL, -- {address, city, state, country, postal_code, timezone, coordinates}
    contact JSONB, -- {phone, email, website, fax}
    
    -- Operational details
    currency TEXT NOT NULL DEFAULT 'USD',
    locale TEXT NOT NULL DEFAULT 'en-US',
    check_in_time TIME DEFAULT '15:00',
    check_out_time TIME DEFAULT '11:00',
    
    -- Settings
    settings JSONB NOT NULL DEFAULT '{}',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'COMING_SOON')),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE (organization_id, slug),
    CONSTRAINT properties_name_check CHECK (LENGTH(name) > 0),
    CONSTRAINT properties_code_check CHECK (code ~ '^[A-Z0-9-]+$'),
    CONSTRAINT properties_rooms_check CHECK (rooms IS NULL OR rooms > 0)
);

-- Property groups (for organizing properties within chains)
CREATE TABLE property_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    UNIQUE (organization_id, name)
);

-- Many-to-many relationship between property groups and properties
CREATE TABLE property_group_members (
    group_id UUID REFERENCES property_groups(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by UUID REFERENCES users(id),
    
    PRIMARY KEY (group_id, property_id)
);
```

### Tenant-Aware Tables Pattern

All tenant-scoped tables follow this pattern:

```sql
-- Example: Documents table with tenant isolation
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- REQUIRED: Tenant isolation fields
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- NULL for org-level documents
    
    -- Business logic fields
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    
    -- Access control
    scope TEXT NOT NULL CHECK (scope IN ('ORGANIZATION', 'PROPERTY', 'DEPARTMENT', 'USER')),
    department_ids TEXT[], -- Array of department IDs for department scope
    user_ids UUID[], -- Array of user IDs for user scope
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Indexes for tenant queries
    INDEX idx_documents_tenant (organization_id, property_id),
    INDEX idx_documents_scope (organization_id, property_id, scope),
    
    -- Ensure property belongs to organization
    CONSTRAINT documents_property_org_check 
        CHECK (property_id IS NULL OR 
               EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.organization_id = documents.organization_id))
);
```

### User Management with Multi-Tenancy

```sql
-- Enhanced users table for multi-tenant support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT, -- NULL for SSO-only users
    email_verified_at TIMESTAMPTZ,
    
    -- Personal information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    
    -- Tenant association
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    primary_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    
    -- Role and permissions
    global_role TEXT NOT NULL DEFAULT 'STAFF' CHECK (global_role IN (
        'PLATFORM_ADMIN',    -- Platform-wide access
        'ORG_OWNER',         -- Organization owner
        'ORG_ADMIN',         -- Organization administrator
        'PROPERTY_MANAGER',  -- Property manager
        'DEPT_ADMIN',        -- Department administrator
        'STAFF'              -- Regular staff
    )),
    
    -- Status and settings
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')),
    language TEXT NOT NULL DEFAULT 'en',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    settings JSONB NOT NULL DEFAULT '{}',
    
    -- Authentication tracking
    last_login_at TIMESTAMPTZ,
    login_count INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT users_primary_property_org_check 
        CHECK (primary_property_id IS NULL OR 
               EXISTS (SELECT 1 FROM properties p WHERE p.id = primary_property_id AND p.organization_id = users.organization_id))
);

-- User access to multiple properties (for chain employees)
CREATE TABLE user_property_access (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Role at this property
    role TEXT NOT NULL CHECK (role IN ('PROPERTY_MANAGER', 'DEPT_ADMIN', 'STAFF')),
    
    -- Department access
    departments TEXT[], -- Array of department codes user can access
    
    -- Module permissions
    permissions JSONB NOT NULL DEFAULT '{}', -- Module-specific permissions
    
    -- Metadata
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id),
    
    PRIMARY KEY (user_id, property_id),
    
    -- Ensure property belongs to user's organization
    CONSTRAINT user_property_access_org_check 
        CHECK (EXISTS (
            SELECT 1 FROM users u, properties p 
            WHERE u.id = user_id AND p.id = property_id AND u.organization_id = p.organization_id
        ))
);
```

## API Implementation

### Tenant Context Middleware

```typescript
// Tenant context interface
interface TenantContext {
  organizationId: string;
  propertyId?: string;
  userId: string;
  role: string;
  permissions: string[];
}

// Middleware to extract and validate tenant context
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UserService,
    private readonly propertyService: PropertyService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user; // From JWT authentication
      
      if (!user) {
        throw new UnauthorizedException('Authentication required');
      }

      // Get property from header or use user's primary property
      const propertyId = req.headers['x-property-id'] as string || user.primaryPropertyId;
      
      // Validate property access
      if (propertyId) {
        await this.validatePropertyAccess(user.id, propertyId);
      }

      // Build tenant context
      const tenantContext: TenantContext = {
        organizationId: user.organizationId,
        propertyId,
        userId: user.id,
        role: user.globalRole,
        permissions: await this.getUserPermissions(user.id, propertyId),
      };

      // Attach to request
      req.tenantContext = tenantContext;
      
      next();
    } catch (error) {
      throw new ForbiddenException('Invalid tenant context');
    }
  }

  private async validatePropertyAccess(userId: string, propertyId: string): Promise<void> {
    const hasAccess = await this.propertyService.userHasAccess(userId, propertyId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to property');
    }
  }

  private async getUserPermissions(userId: string, propertyId?: string): Promise<string[]> {
    return this.userService.getUserPermissions(userId, propertyId);
  }
}
```

### Tenant-Aware Base Service

```typescript
// Base service for tenant-aware operations
export abstract class TenantBaseService<T> {
  constructor(protected readonly prisma: PrismaService) {}

  protected addTenantFilter(
    where: any,
    tenantContext: TenantContext,
    options: {
      includeOrgLevel?: boolean;
      requireProperty?: boolean;
    } = {}
  ): any {
    const filter = {
      ...where,
      organizationId: tenantContext.organizationId,
    };

    if (options.requireProperty && !tenantContext.propertyId) {
      throw new BadRequestException('Property context required');
    }

    if (tenantContext.propertyId) {
      if (options.includeOrgLevel) {
        // Include both org-level and property-level records
        filter.OR = [
          { propertyId: tenantContext.propertyId },
          { propertyId: null },
        ];
      } else {
        // Only property-level records
        filter.propertyId = tenantContext.propertyId;
      }
    } else {
      // Only org-level records when no property context
      filter.propertyId = null;
    }

    return filter;
  }

  protected async findManyWithTenant(
    args: any,
    tenantContext: TenantContext,
    options?: any
  ) {
    const where = this.addTenantFilter(args.where || {}, tenantContext, options);
    return this.prisma[this.getModelName()].findMany({
      ...args,
      where,
    });
  }

  protected async findUniqueWithTenant(
    args: any,
    tenantContext: TenantContext,
    options?: any
  ) {
    const where = this.addTenantFilter(args.where, tenantContext, options);
    return this.prisma[this.getModelName()].findUnique({
      ...args,
      where,
    });
  }

  protected async createWithTenant(
    data: any,
    tenantContext: TenantContext
  ) {
    const tenantData = {
      ...data,
      organizationId: tenantContext.organizationId,
      propertyId: tenantContext.propertyId || null,
      createdBy: tenantContext.userId,
    };

    return this.prisma[this.getModelName()].create({
      data: tenantData,
    });
  }

  protected abstract getModelName(): string;
}

// Example implementation
@Injectable()
export class DocumentsService extends TenantBaseService<Document> {
  protected getModelName(): string {
    return 'document';
  }

  async getDocuments(tenantContext: TenantContext, filters: any = {}) {
    return this.findManyWithTenant(
      {
        where: filters,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      tenantContext,
      { includeOrgLevel: true } // Include both org and property level documents
    );
  }

  async createDocument(
    data: CreateDocumentDto,
    tenantContext: TenantContext
  ) {
    return this.createWithTenant(data, tenantContext);
  }
}
```

### Controller Implementation

```typescript
// Base controller with tenant context
export abstract class TenantBaseController {
  protected getTenantContext(req: Request): TenantContext {
    return req.tenantContext;
  }

  protected validateTenantAccess(
    resource: any,
    tenantContext: TenantContext
  ): void {
    if (resource.organizationId !== tenantContext.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    if (resource.propertyId && resource.propertyId !== tenantContext.propertyId) {
      // Allow access if user has cross-property permissions
      // This would be checked against user_property_access table
      throw new ForbiddenException('Access denied to property resource');
    }
  }
}

// Example controller
@Controller('documents')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantContextInterceptor)
export class DocumentsController extends TenantBaseController {
  constructor(private readonly documentsService: DocumentsService) {
    super();
  }

  @Get()
  async getDocuments(
    @Req() req: Request,
    @Query() filters: GetDocumentsDto
  ) {
    const tenantContext = this.getTenantContext(req);
    return this.documentsService.getDocuments(tenantContext, filters);
  }

  @Post()
  async createDocument(
    @Req() req: Request,
    @Body() createDocumentDto: CreateDocumentDto
  ) {
    const tenantContext = this.getTenantContext(req);
    return this.documentsService.createDocument(createDocumentDto, tenantContext);
  }

  @Get(':id')
  async getDocument(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const tenantContext = this.getTenantContext(req);
    const document = await this.documentsService.getDocumentById(id, tenantContext);
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Validate tenant access
    this.validateTenantAccess(document, tenantContext);
    
    return document;
  }
}
```

## Frontend Implementation

### Tenant Context Provider

```typescript
// Tenant context for React
interface TenantContextType {
  organization: Organization | null;
  property: Property | null;
  properties: Property[];
  switchProperty: (propertyId: string) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: organization } = useQuery(
    ['organization', user?.organizationId],
    () => organizationService.getById(user!.organizationId),
    { enabled: !!user?.organizationId }
  );

  const { data: userProperties } = useQuery(
    ['user-properties', user?.id],
    () => propertyService.getUserProperties(user!.id),
    { enabled: !!user?.id }
  );

  useEffect(() => {
    if (userProperties) {
      setProperties(userProperties);
      
      // Set current property from localStorage or user's primary property
      const savedPropertyId = localStorage.getItem('currentPropertyId');
      const currentProperty = savedPropertyId
        ? userProperties.find(p => p.id === savedPropertyId)
        : userProperties.find(p => p.id === user?.primaryPropertyId);
      
      setProperty(currentProperty || userProperties[0] || null);
      setIsLoading(false);
    }
  }, [userProperties, user?.primaryPropertyId]);

  const switchProperty = useCallback((propertyId: string) => {
    const newProperty = properties.find(p => p.id === propertyId);
    if (newProperty) {
      setProperty(newProperty);
      localStorage.setItem('currentPropertyId', propertyId);
      
      // Invalidate all queries that depend on property context
      queryClient.invalidateQueries();
    }
  }, [properties]);

  return (
    <TenantContext.Provider
      value={{
        organization: organization || null,
        property,
        properties,
        switchProperty,
        isLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
```

### Property Selector Component

```typescript
// Property selector for switching between properties
export const PropertySelector: React.FC = () => {
  const { property, properties, switchProperty } = useTenant();

  if (properties.length <= 1) {
    return null; // Don't show selector if user only has access to one property
  }

  return (
    <Select
      value={property?.id || ''}
      onValueChange={switchProperty}
      className="w-64"
    >
      <SelectTrigger>
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4" />
          <SelectValue placeholder="Select property" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {properties.map((prop) => (
          <SelectItem key={prop.id} value={prop.id}>
            <div className="flex flex-col">
              <span className="font-medium">{prop.name}</span>
              <span className="text-xs text-muted-foreground">
                {prop.location.city}, {prop.location.country}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

### API Client with Tenant Context

```typescript
// Enhanced API client with tenant context
class ApiClient {
  private baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseURL = process.env.VITE_API_URL || 'http://localhost:3000';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add tenant context
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      const propertyId = localStorage.getItem('currentPropertyId');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (propertyId) {
        config.headers['X-Property-Id'] = propertyId;
      }

      return config;
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403) {
          // Handle tenant access violations
          if (error.response.data?.message?.includes('tenant')) {
            // Redirect to property selector or show error
            window.location.href = '/select-property';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  // ... other HTTP methods
}

export const apiClient = new ApiClient();
```

## Security Considerations

### Tenant Isolation Validation

```typescript
// Decorator for tenant isolation validation
export function ValidateTenantAccess() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tenantContext = this.getTenantContext(args[0]); // Request object
      const resourceId = args[1]; // Resource ID parameter

      // Validate resource belongs to tenant
      const resource = await this.getResourceForValidation(resourceId);
      if (resource && resource.organizationId !== tenantContext.organizationId) {
        throw new ForbiddenException('Resource access denied');
      }

      return method.apply(this, args);
    };
  };
}

// Usage in controller
@Get(':id')
@ValidateTenantAccess()
async getDocument(@Req() req: Request, @Param('id') id: string) {
  // Method implementation
}
```

### Database Constraints

```sql
-- Row Level Security (RLS) policies for additional protection
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON documents
  FOR ALL
  TO application_role
  USING (
    organization_id = current_setting('app.current_organization_id')::UUID
    AND (
      property_id IS NULL 
      OR property_id = current_setting('app.current_property_id')::UUID
      OR current_setting('app.current_property_id') = ''
    )
  );

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(org_id UUID, prop_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_organization_id', org_id::text, true);
  PERFORM set_config('app.current_property_id', COALESCE(prop_id::text, ''), true);
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

### From Single-Tenant to Multi-Tenant

```sql
-- Step 1: Add tenant columns to existing tables
ALTER TABLE users ADD COLUMN organization_id UUID;
ALTER TABLE users ADD COLUMN property_id UUID;

-- Step 2: Create default organization for existing data
INSERT INTO organizations (id, name, type, tier)
VALUES (gen_random_uuid(), 'Default Organization', 'INDEPENDENT', 'PROFESSIONAL')
RETURNING id AS default_org_id;

-- Step 3: Create default property
INSERT INTO properties (id, organization_id, name, code, location)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM organizations WHERE name = 'Default Organization'),
  'Main Property',
  'MAIN-001',
  '{"city": "Unknown", "country": "Unknown", "timezone": "UTC"}'
)
RETURNING id AS default_property_id;

-- Step 4: Update existing records
UPDATE users SET 
  organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization'),
  property_id = (SELECT id FROM properties WHERE code = 'MAIN-001');

-- Step 5: Add NOT NULL constraints
ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
-- property_id can remain nullable for org-level users

-- Step 6: Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE users ADD CONSTRAINT fk_users_property 
  FOREIGN KEY (property_id) REFERENCES properties(id);
```

## Testing Multi-Tenancy

### Unit Tests

```typescript
describe('TenantBaseService', () => {
  let service: DocumentsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Setup test module
  });

  it('should filter documents by tenant context', async () => {
    const tenantContext: TenantContext = {
      organizationId: 'org-1',
      propertyId: 'prop-1',
      userId: 'user-1',
      role: 'STAFF',
      permissions: [],
    };

    const documents = await service.getDocuments(tenantContext);

    // Verify all returned documents belong to the tenant
    documents.forEach(doc => {
      expect(doc.organizationId).toBe('org-1');
      expect([doc.propertyId, null]).toContain(doc.propertyId);
    });
  });

  it('should prevent cross-tenant access', async () => {
    const tenantContext: TenantContext = {
      organizationId: 'org-1',
      propertyId: 'prop-1',
      userId: 'user-1',
      role: 'STAFF',
      permissions: [],
    };

    // Try to access document from different organization
    await expect(
      service.getDocumentById('doc-from-org-2', tenantContext)
    ).rejects.toThrow(ForbiddenException);
  });
});
```

### Integration Tests

```typescript
describe('Multi-tenant API', () => {
  it('should enforce tenant isolation at API level', async () => {
    const org1User = await createTestUser('org-1', 'prop-1');
    const org2User = await createTestUser('org-2', 'prop-2');

    const org1Document = await createTestDocument('org-1', 'prop-1');

    // User from org-1 should be able to access their document
    const response1 = await request(app.getHttpServer())
      .get(`/documents/${org1Document.id}`)
      .set('Authorization', `Bearer ${org1User.token}`)
      .expect(200);

    // User from org-2 should not be able to access org-1's document
    await request(app.getHttpServer())
      .get(`/documents/${org1Document.id}`)
      .set('Authorization', `Bearer ${org2User.token}`)
      .expect(403);
  });
});
```

This multi-tenancy implementation provides secure, scalable tenant isolation while maintaining performance and development efficiency.