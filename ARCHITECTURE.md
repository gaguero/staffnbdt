# Hotel Operations Hub - System Architecture

## Overview

Hotel Operations Hub is designed as a **multi-tenant, white-labeled, modular ERP platform** specifically for hotel operations. The architecture supports everything from single independent properties to large international hotel chains with hundreds of properties.

## Multi-Tenant Architecture

### Tenant Hierarchy

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

### Tenant Isolation Strategy

**Database Design: Shared Database with Tenant Isolation**

We use a **shared database model** with tenant isolation through:
- `organization_id` and `property_id` columns on all tenant-scoped tables
- Row-level security enforced at the API layer
- Tenant context passed in JWT tokens
- Middleware validation on every request

**Benefits:**
- Cost-effective for smaller tenants
- Easier maintenance and upgrades
- Efficient resource utilization
- Simplified backup and monitoring

**Security:**
- API-level tenant validation
- No cross-tenant data leakage
- Audit logging for all operations
- Role-based access within tenant scope

### Data Models

#### Core Platform Tables

```sql
-- Platform management
organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type ENUM('CHAIN', 'INDEPENDENT', 'MANAGEMENT_GROUP'),
  tier ENUM('STARTER', 'PROFESSIONAL', 'ENTERPRISE'),
  subscription_status ENUM('ACTIVE', 'SUSPENDED', 'TRIAL'),
  settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Individual hotels/properties
properties (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT UNIQUE, -- Property code for identification
  type ENUM('HOTEL', 'RESORT', 'MOTEL', 'BOUTIQUE'),
  rooms INTEGER,
  location JSONB, -- {country, city, timezone, currency}
  settings JSONB,
  status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Grouping properties (for chains)
property_groups (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL, -- "East Coast Properties"
  description TEXT,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP
)

property_group_members (
  group_id UUID REFERENCES property_groups(id),
  property_id UUID REFERENCES properties(id),
  PRIMARY KEY (group_id, property_id)
)
```

#### Module Management

```sql
-- Available modules in the platform
modules (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE, -- 'hr', 'inventory', 'front_desk'
  description TEXT,
  category ENUM('CORE', 'OPERATIONS', 'ANALYTICS', 'INTEGRATION'),
  base_price DECIMAL(10,2),
  per_property_price DECIMAL(10,2),
  features JSONB,
  created_at TIMESTAMP
)

-- Module subscriptions at organization level
organization_modules (
  organization_id UUID REFERENCES organizations(id),
  module_id UUID REFERENCES modules(id),
  enabled BOOLEAN DEFAULT true,
  settings JSONB,
  subscription_start TIMESTAMP,
  subscription_end TIMESTAMP,
  PRIMARY KEY (organization_id, module_id)
)

-- Module configurations at property level
property_modules (
  property_id UUID REFERENCES properties(id),
  module_id UUID REFERENCES modules(id),
  enabled BOOLEAN DEFAULT true,
  settings JSONB, -- Property-specific overrides
  configured_by UUID REFERENCES users(id),
  configured_at TIMESTAMP,
  PRIMARY KEY (property_id, module_id)
)
```

#### User Management with Tenant Context

```sql
-- Enhanced user model with multi-tenant support
users (
  id UUID PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  global_role ENUM('PLATFORM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN', 'PROPERTY_MANAGER', 'DEPT_ADMIN', 'STAFF'),
  organization_id UUID REFERENCES organizations(id),
  primary_property_id UUID REFERENCES properties(id), -- User's main property
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- User access to multiple properties (for chain employees)
user_property_access (
  user_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  role ENUM('PROPERTY_MANAGER', 'DEPT_ADMIN', 'STAFF'),
  departments TEXT[], -- Array of department IDs
  permissions JSONB, -- Module-specific permissions
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP,
  PRIMARY KEY (user_id, property_id)
)
```

## White-Label Architecture

### Branding System

```sql
-- Branding configurations
branding_configs (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  property_id UUID REFERENCES properties(id), -- NULL for org-level branding
  
  -- Basic branding
  company_name TEXT,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  
  -- Color system
  colors JSONB, -- Complete color palette
  
  -- Typography
  typography JSONB, -- Font families, sizes, weights
  
  -- Component styling
  components JSONB, -- Border radius, shadows, spacing
  
  -- Custom CSS
  custom_css TEXT,
  
  -- Domain configuration
  custom_domain TEXT,
  
  status ENUM('ACTIVE', 'DRAFT'),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Dynamic Theming Implementation

**CSS Variables Approach:**
```css
:root {
  --primary-color: var(--tenant-primary, #f5ebd7);
  --secondary-color: var(--tenant-secondary, #aa8e67);
  --background-color: var(--tenant-background, #ffffff);
  /* ... more variables ... */
}
```

**Runtime Theme Injection:**
```typescript
// Theme provider loads tenant branding and injects CSS variables
const ThemeProvider: React.FC = ({ children }) => {
  const { organizationId, propertyId } = useAuth();
  const { data: branding } = useQuery(['branding', organizationId, propertyId]);
  
  useEffect(() => {
    if (branding) {
      // Inject CSS variables
      Object.entries(branding.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--tenant-${key}`, value);
      });
      
      // Load custom fonts
      if (branding.typography.fontUrl) {
        loadFont(branding.typography.fontUrl);
      }
      
      // Apply custom CSS
      if (branding.customCSS) {
        injectCustomCSS(branding.customCSS);
      }
    }
  }, [branding]);
  
  return <ThemeContext.Provider value={branding}>{children}</ThemeContext.Provider>;
};
```

## Internationalization Architecture

### Translation System

```sql
-- Language configurations
languages (
  code TEXT PRIMARY KEY, -- 'en', 'es', 'fr'
  name TEXT NOT NULL, -- 'English', 'Español'
  native_name TEXT NOT NULL,
  direction ENUM('ltr', 'rtl') DEFAULT 'ltr',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)

-- Translation keys and values
translations (
  id UUID PRIMARY KEY,
  key TEXT NOT NULL, -- 'dashboard.welcome'
  namespace TEXT NOT NULL, -- 'common', 'hr', 'front_desk'
  language_code TEXT REFERENCES languages(code),
  value TEXT NOT NULL,
  plurals JSONB, -- For languages with complex plural rules
  context TEXT, -- Additional context for translators
  status ENUM('VERIFIED', 'PENDING', 'AI_GENERATED'),
  created_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE (key, namespace, language_code)
)

-- Organization-specific translation overrides
organization_translations (
  organization_id UUID REFERENCES organizations(id),
  translation_id UUID REFERENCES translations(id),
  custom_value TEXT NOT NULL, -- Override default translation
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  PRIMARY KEY (organization_id, translation_id)
)

-- Property-specific translation overrides
property_translations (
  property_id UUID REFERENCES properties(id),
  translation_id UUID REFERENCES translations(id),
  custom_value TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  PRIMARY KEY (property_id, translation_id)
)
```

### AI Translation Integration

```typescript
// Translation service with AI fallback
class TranslationService {
  async getTranslation(
    key: string,
    language: string,
    organizationId?: string,
    propertyId?: string
  ): Promise<string> {
    // 1. Check property-specific override
    if (propertyId) {
      const propertyTranslation = await this.getPropertyTranslation(key, language, propertyId);
      if (propertyTranslation) return propertyTranslation;
    }
    
    // 2. Check organization-specific override
    if (organizationId) {
      const orgTranslation = await this.getOrganizationTranslation(key, language, organizationId);
      if (orgTranslation) return orgTranslation;
    }
    
    // 3. Check default translation
    const defaultTranslation = await this.getDefaultTranslation(key, language);
    if (defaultTranslation) return defaultTranslation;
    
    // 4. AI translation fallback
    return this.aiTranslate(key, language, { organizationId, propertyId });
  }
  
  private async aiTranslate(key: string, targetLanguage: string, context: any): Promise<string> {
    // Use OpenAI/DeepL for translation
    // Cache result for future use
    // Mark as AI_GENERATED for human review
  }
}
```

## Storage Architecture

### Cloudflare R2 Integration

**Benefits over local filesystem:**
- Global CDN distribution
- Infinite scalability
- Zero egress fees
- Multi-region replication
- Integration with Cloudflare security

**Implementation:**
```typescript
// R2 storage service
class R2StorageService {
  private s3Client: S3Client;
  
  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  
  async uploadFile(
    file: Buffer,
    key: string,
    organizationId: string,
    propertyId?: string
  ): Promise<string> {
    // Add tenant isolation to file path
    const tenantPath = propertyId 
      ? `${organizationId}/${propertyId}/${key}`
      : `${organizationId}/${key}`;
    
    await this.s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: tenantPath,
      Body: file,
      ContentType: 'application/octet-stream',
    }));
    
    return `https://${process.env.R2_PUBLIC_URL}/${tenantPath}`;
  }
  
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn }
    );
  }
}
```

**File Organization:**
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
    ├── shared/
    └── property-3/
```

## API Architecture

### Tenant Context Middleware

```typescript
// Tenant context middleware
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user; // From JWT authentication
    
    // Extract tenant context from JWT or headers
    req.tenantContext = {
      organizationId: user.organizationId,
      propertyId: req.headers['x-property-id'] || user.primaryPropertyId,
      userId: user.id,
      role: user.globalRole,
    };
    
    // Validate property access
    if (req.tenantContext.propertyId) {
      this.validatePropertyAccess(user.id, req.tenantContext.propertyId);
    }
    
    next();
  }
}

// Tenant-aware base service
export abstract class TenantBaseService {
  protected addTenantFilter(query: any, tenantContext: TenantContext): any {
    return {
      ...query,
      organizationId: tenantContext.organizationId,
      ...(tenantContext.propertyId && { propertyId: tenantContext.propertyId }),
    };
  }
}
```

### Module System

**Module Registration:**
```typescript
// Module registry
interface Module {
  code: string;
  name: string;
  version: string;
  dependencies: string[];
  routes: ModuleRoute[];
  permissions: Permission[];
  databaseSchema?: string;
}

@Injectable()
export class ModuleRegistry {
  private modules = new Map<string, Module>();
  
  registerModule(module: Module): void {
    // Validate dependencies
    // Register routes
    // Setup permissions
    this.modules.set(module.code, module);
  }
  
  getEnabledModules(organizationId: string, propertyId?: string): Module[] {
    // Query organization_modules and property_modules
    // Return only enabled modules
  }
}
```

## Performance & Scalability

### Caching Strategy

**Redis Caching:**
- Tenant branding configurations (30 min TTL)
- Translation cache (1 hour TTL)
- User permissions (15 min TTL)
- Module configurations (1 hour TTL)

**CDN Caching:**
- Static assets (1 year)
- Profile photos (1 month)
- Document previews (1 week)

### Database Optimization

**Indexing Strategy:**
```sql
-- Critical tenant-aware indexes
CREATE INDEX idx_users_org_property ON users(organization_id, property_id);
CREATE INDEX idx_documents_tenant ON documents(organization_id, property_id);
CREATE INDEX idx_audit_logs_tenant_date ON audit_logs(organization_id, created_at);

-- Module-specific indexes
CREATE INDEX idx_payslips_user_date ON payslips(user_id, month);
CREATE INDEX idx_reservations_property_date ON reservations(property_id, check_in_date);
```

**Query Optimization:**
- Always include tenant filters in WHERE clauses
- Use prepared statements for common queries
- Implement query result caching for expensive operations
- Monitor slow queries and optimize accordingly

### Monitoring & Observability

**Key Metrics:**
- Tenant isolation violations
- Cross-tenant data access attempts
- API response times per tenant
- Storage usage per organization
- Module usage analytics
- Translation cache hit rates

**Alerting:**
- Failed tenant validation attempts
- Unusual cross-property access patterns
- High API error rates per tenant
- Storage quota approaching limits

## Security Architecture

### Tenant Isolation Security

**API Level:**
- JWT tokens include tenant context
- Middleware validates tenant access on every request
- No direct database access from frontend
- All queries filtered by tenant context

**Database Level:**
- No shared primary keys across tenants
- Tenant ID required on all tenant-scoped tables
- Foreign key constraints respect tenant boundaries
- Audit logging for all tenant operations

**File Storage:**
- Tenant-specific directory structures
- Pre-signed URLs with tenant validation
- File access audit logging
- Automatic encryption at rest

### Authentication & Authorization

**Multi-Level Permissions:**
```typescript
interface TenantPermissions {
  platformLevel: PlatformPermission[]; // PLATFORM_ADMIN only
  organizationLevel: OrganizationPermission[]; // ORG_OWNER, ORG_ADMIN
  propertyLevel: PropertyPermission[]; // PROPERTY_MANAGER, DEPT_ADMIN
  moduleLevel: ModulePermission[]; // Per-module permissions
}
```

**JWT Structure:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "PROPERTY_MANAGER",
  "organizationId": "org-123",
  "propertyId": "prop-456",
  "permissions": ["hr:read", "hr:write", "inventory:read"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

This architecture provides a solid foundation for the Hotel Operations Hub platform, ensuring scalability, security, and flexibility while maintaining performance and ease of development.