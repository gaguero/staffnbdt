# Hotel Operations Hub - Technology Context

## Technology Stack Overview

Hotel Operations Hub is built on a modern, scalable technology stack optimized for multi-tenant SaaS deployment with global performance requirements.

## Frontend Technology Stack

### Core Framework
- **React 18.2+** with Concurrent Features
- **TypeScript 5.0+** for type safety
- **Vite 4.0+** for fast development and building
- **React Router v6** for routing

### Permission Integration
- **PermissionGate** component for conditional rendering
- **usePermissions** hook for permission checking
- **Permission Service** for bulk permission validation
- **Context-aware** permission evaluation

### UI & Styling
- **Tailwind CSS 3.3+** with CSS variables for theming
- **HeadlessUI** for accessible components
- **Lucide React** for icons
- **React Hook Form** for form management
- **Zod** for form validation

### State Management & Data Fetching
- **TanStack Query (React Query) v4** for server state
- **Context API** for global state (tenant context, auth)
- **Zustand** for complex client state (if needed)

### Internationalization
- **react-i18next** for multi-language support
- **i18next** with namespace support
- **AI translation integration** via OpenAI API

### Development Tools
- **ESLint** with TypeScript rules
- **Prettier** for code formatting
- **Playwright** for E2E testing
- **Vitest** for unit testing

### Build & Deployment
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## Backend Technology Stack

### Core Framework
- **NestJS 10.0+** with dependency injection
- **TypeScript 5.0+** for end-to-end type safety
- **Express.js** as HTTP server (NestJS default)
- **Helmet** for security headers

### Permission Engine
- **Hybrid RBAC/ABAC** permission system
- **Condition Evaluators** for time, department, ownership rules
- **Permission Caching** with Redis-like performance
- **Migration Tools** for role-to-permission transition
- **Validation Suite** ensuring 100% coverage

### Database & ORM
- **PostgreSQL 15+** on Railway
- **Prisma 5.0+** as ORM and query builder
- **Prisma Migrate** for database migrations
- **Connection pooling** via PgBouncer (Railway managed)

### Authentication & Authorization
- **Passport.js** with JWT strategy
- **@nestjs/jwt** for token management
- **bcrypt** for password hashing
- **Advanced Permission System** (RBAC + ABAC hybrid)
- **82 Granular Permissions** across 9 categories
- **7 System Roles** with inheritance hierarchy
- **Condition-based Evaluation** with caching
- **Custom Roles & Direct Permissions** for flexibility

### Validation & Serialization
- **class-validator** for DTO validation
- **class-transformer** for serialization
- **Zod** for runtime type validation

### Background Jobs & Queues
- **Bull/BullMQ** with Redis
- **@nestjs/bull** for job processing
- **Cron jobs** for scheduled tasks

### File Storage & CDN
- **AWS SDK v3** for S3-compatible operations
- **Cloudflare R2** as storage backend
- **Pre-signed URLs** for secure file access
- **Global CDN** via Cloudflare

### Communication & Notifications
- **SendGrid** for email services
- **Twilio** for SMS (future)
- **WebSockets** for real-time features (planned)

### Development & Testing
- **Jest** for unit and integration testing
- **Supertest** for API testing
- **ESLint** with NestJS rules
- **Prettier** for code formatting

## Database Architecture

### PostgreSQL Configuration
```sql
-- Multi-tenant optimized settings
shared_preload_libraries = 'pg_stat_statements'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

-- Indexing strategy for tenant isolation
CREATE INDEX CONCURRENTLY idx_users_tenant ON users(organization_id, property_id);
CREATE INDEX CONCURRENTLY idx_documents_tenant ON documents(organization_id, property_id);
CREATE INDEX CONCURRENTLY idx_audit_tenant_date ON audit_logs(organization_id, created_at);
```

### Prisma Configuration
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "jsonProtocol"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Multi-tenant model example
model User {
  id               String   @id @default(cuid())
  organizationId   String   @map("organization_id")
  propertyId       String?  @map("property_id")
  email            String   @unique
  role             Role     @default(STAFF)
  
  organization     Organization @relation(fields: [organizationId], references: [id])
  property         Property?    @relation(fields: [propertyId], references: [id])
  
  @@index([organizationId, propertyId])
  @@map("users")
}
```

## Infrastructure & Deployment

### Railway Platform
- **Automatic deployments** from GitHub main branch
- **Multi-service architecture**:
  - `web` service: NestJS BFF API
  - `worker` service: Background job processor
  - `postgres` service: Managed PostgreSQL
  - `redis` service: Managed Redis

### Environment Configuration
```bash
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/db
REDIS_URL=redis://host:port

# JWT Configuration
JWT_SECRET=<generated-256-bit-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Multi-tenant Configuration
DEFAULT_ORGANIZATION_ID=<default-org-uuid>
TENANT_ISOLATION_MODE=strict

# Cloudflare R2 Storage
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET_NAME=hotel-ops-hub-production
R2_PUBLIC_URL=https://cdn.hotel-ops-hub.com

# AI Translation
OPENAI_API_KEY=<openai-key>
DEEPL_API_KEY=<deepl-key>

# Email Services
SENDGRID_API_KEY=<sendgrid-key>
EMAIL_FROM=noreply@hotel-ops-hub.com

# White-label Support
ALLOW_CUSTOM_BRANDING=true
ALLOW_CUSTOM_DOMAINS=true

# Internationalization
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es
AI_TRANSLATION_ENABLED=true
```

### Build & Deployment Process
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
        
      - name: Deploy to Railway
        run: railway up --service web
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Development Environment

### Local Development Setup
```bash
# Project structure
hotel-ops-hub/
├── apps/
│   ├── web/          # React frontend
│   ├── bff/          # NestJS backend
│   └── worker/       # Background jobs
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   └── database/     # Prisma schema
└── tools/
    └── scripts/      # Development scripts
```

### Package Manager & Workspaces
```json
// package.json (root)
{
  "name": "hotel-ops-hub",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:bff\" \"npm run dev:web\"",
    "dev:bff": "cd apps/bff && npm run start:dev",
    "dev:web": "cd apps/web && npm run dev",
    "build": "npm run build:types && npm run build:bff && npm run build:web",
    "test": "npm run test --workspaces"
  }
}
```

### Development Commands
```bash
# Initial setup
npm install
cd packages/database && npx prisma generate
cd packages/database && npx prisma db push

# Development servers
npm run dev                    # Start both frontend and backend
npm run dev:bff               # Backend only (port 3000)
npm run dev:web               # Frontend only (port 5173)

# Database operations
cd packages/database
npx prisma studio             # Database GUI
npx prisma migrate dev        # Create migration
npx prisma db seed            # Seed database

# Testing
npm run test                  # All tests
npm run test:e2e             # End-to-end tests
npm run test:watch           # Watch mode

# Production build
npm run build                # Build all apps
npm run start:prod           # Start production servers
```

## Performance Optimization

### Frontend Optimization
- **Code splitting** with React.lazy()
- **Bundle analysis** with webpack-bundle-analyzer
- **Service Worker** for caching (planned)
- **Image optimization** with sharp
- **CDN delivery** via Cloudflare

### Backend Optimization
- **Database connection pooling**
- **Redis caching** for frequent queries
- **Response compression** with gzip
- **API rate limiting** with Redis
- **Horizontal scaling** capability

### Database Optimization
```sql
-- Performance monitoring
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Tenant-aware indexes
CREATE INDEX CONCURRENTLY idx_users_org_property_active 
ON users(organization_id, property_id) 
WHERE deleted_at IS NULL;

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_documents_recent 
ON documents(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '6 months';
```

## Security Configuration

### API Security
- **CORS** configured for specific origins
- **Rate limiting** via Redis
- **Helmet** for security headers
- **Input validation** on all endpoints
- **SQL injection protection** via Prisma

### Authentication Security
```typescript
// JWT configuration
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      algorithms: ['HS256']
    });
  }
}
```

### File Upload Security
- **Virus scanning** with ClamAV
- **File type validation**
- **Size limits** enforced
- **Pre-signed URLs** with expiration
- **Content-Type validation**

## Monitoring & Observability

### Application Monitoring
- **Railway logs** for basic monitoring
- **Custom metrics** via Prometheus (planned)
- **Error tracking** with Sentry (planned)
- **Performance monitoring** with APM tools

### Database Monitoring
```sql
-- Monitor tenant data distribution
SELECT 
  organization_id,
  COUNT(*) as user_count,
  MAX(created_at) as latest_user
FROM users 
GROUP BY organization_id
ORDER BY user_count DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Third-Party Integrations

### AI Services
- **OpenAI GPT-4** for translations
- **DeepL API** as translation fallback
- **Future**: AI insights for hotel operations

### Communication Services
- **SendGrid** for transactional emails
- **Twilio** for SMS notifications (planned)
- **WhatsApp Business API** (planned)

### Payment Processing
- **Stripe** for subscription billing (planned)
- **PayPal** as alternative payment method (planned)

This technology context ensures Hotel Operations Hub is built on a solid, scalable foundation that can grow from single-property installations to international hotel chain deployments while maintaining performance and security.
