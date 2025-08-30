# Hotel Operations Hub - Technology Context

## Technology Stack Overview

Hotel Operations Hub is built on a modern, scalable technology stack optimized for multi-tenant SaaS deployment with global performance requirements.

## Frontend Technology Stack

### Core Framework
- **React 18.3.1+** with Concurrent Features
- **TypeScript 5.6.3+** for type safety
- **Vite 5.4.11+** for fast development and building
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

### Permission Engine - PRODUCTION OPTIMIZED (August 27, 2025)
- **Hybrid RBAC/ABAC** permission system - FULLY OPERATIONAL
- **Condition Evaluators** for time, department, ownership rules
- **Permission Caching** with Redis-like performance
- **Migration Tools** for role-to-permission transition
- **Validation Suite** ensuring 100% coverage
- **PLATFORM_ADMIN Optimization**: Unrestricted access to all system features
- **TypeScript Enhancement**: Resolved source field mapping conflicts
- **Hotel Operations Integration**: Complete permission set for hotel operations
- **System Role API**: All roles properly exposed in management endpoints
- **React Compliance**: Hooks order violations resolved
- **Frontend Stability**: Bulletproof components preventing errors

### Database & ORM
- **PostgreSQL 15+** on Railway
- **Prisma 5.0+** as ORM and query builder
- **Prisma Migrate** for database migrations
- **Connection pooling** via PgBouncer (Railway managed)
- **Multi-Tenant Schema** - organizationId/propertyId on ALL tables (100% complete)
- **Tenant Isolation** - TenantContextService enforces automatic filtering (production ready)
- **Data Security** - Zero cross-tenant data leakage verified (comprehensive testing complete)
- **Production Achievement** - Complete multi-tenant transformation successful (August 19, 2025)

### Authentication & Authorization
- **Passport.js** with JWT strategy
- **@nestjs/jwt** for token management
- **bcrypt** for password hashing
- **Advanced Permission System** (RBAC + ABAC hybrid) - PRODUCTION READY
- **82 Granular Permissions** across 9 categories
- **7 System Roles** with inheritance hierarchy
- **Condition-based Evaluation** with caching
- **Custom Roles & Direct Permissions** for flexibility
- **Multi-Tenant Security** - TenantInterceptor and TenantContextService (production operational)
- **Data Isolation** - Automatic tenant context enforcement (zero cross-tenant access)
- **JWT Tenant Context** - organizationId, propertyId, departmentId in tokens (complete)
- **Security Achievement** - Multi-tenant hotel platform is production-ready and secure

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

### Railway Platform - MULTI-TENANT PRODUCTION READY
- **Automatic deployments** from GitHub main branch
- **Multi-service architecture**:
  - `web` service: NestJS BFF API - MULTI-TENANT PRODUCTION READY
  - `worker` service: Background job processor
  - `postgres` service: Managed PostgreSQL - MULTI-TENANT SCHEMA OPERATIONAL
  - `redis` service: Managed Redis
- **Multi-Tenant Security**: TenantInterceptor and TenantContextService operational
- **Data Isolation**: Zero cross-tenant data access verified in production
- **Technical Issues Resolved**: CORS, TypeScript compilation, dependency injection
- **Production Status**: Complete multi-tenant hotel operations platform operational (August 19, 2025)

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

# Multi-tenant Configuration - PRODUCTION ACTIVE
DEFAULT_ORGANIZATION_ID=<default-org-uuid>
TENANT_ISOLATION_MODE=strict
TENANT_INTERCEPTOR_ENABLED=true
TENANT_CONTEXT_VALIDATION=strict
CROSS_TENANT_PROTECTION=enabled

# Cloudflare R2 Storage
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET_NAME=hotel-ops-hub-production
R2_PUBLIC_URL=https://cdn.hotel-ops-hub.com

# Storage Strategy
STORAGE_USE_R2=false
STORAGE_HYBRID_MODE=false

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

# Storage Migration (from root CLOUDFLARE_R2_MIGRATION.md)
# Run these commands from the apps/bff directory
npm run script:migrate-storage -- --health-check
npm run script:migrate-storage -- --migrate --dry-run
npm run script:migrate-storage -- --migrate
npm run script:migrate-storage -- --verify

### Database Migration Commands (Manual Railway Process)
# Step 1: Backup Production Database
# railway link --environment production
# railway service (Select "Postgres")
# railway shell
# pg_dump $DATABASE_URL > /tmp/prod_backup_$(date +%Y%m%d_%H%M%S).sql
# exit

# Step 2: Export Dev Database
# railway link --environment dev
# railway service (Select "Postgres Copy")
# railway shell
# pg_dump --clean $DATABASE_URL > /tmp/dev_export_$(date +%Y%m%d_%H%M%S).sql
# exit

# Step 3: Copy Dev Export to Production and Import
# Download the dev export file first, then upload to production
# railway link --environment production
# railway service (Select "Postgres")
# railway shell
# psql $DATABASE_URL < dev_export_file.sql
# exit

### Railway Deployment
- Uses Nixpacks configuration (`nixpacks.toml`) for builds.
- Monorepo support with workspace packages.
- Environment variables are set in the Railway dashboard.
- PostgreSQL and Redis are provisioned as Railway services.
- A Railway Volume must be mounted at `/app/storage` for local file storage fallback.

### Permission System Seeding (Development)
- To seed the Railway database with initial permissions and roles, run the following command from the `packages/database` directory:
- `DATABASE_URL="<your-railway-db-url>" npx tsx scripts/seed-remote-permissions.ts`
```

### Railway URLs
- **Production Frontend**: https://frontend-production-55d3.up.railway.app (main branch)

## Quick Setup Guide (Consolidated)

1. Get Railway DATABASE_URL from your project's Postgres service Variables.
2. Create `.env.local` in project root:
```bash
DATABASE_URL=<your Railway DATABASE_URL>
JWT_SECRET=<change-me>
PORT=3000
NODE_ENV=development
VITE_API_URL=http://localhost:3000
```
3. Install and initialize database:
```bash
cd packages/database && npm install
cd ../.. && npm run db:generate && npm run db:push
```
4. Run backend:
```bash
cd apps/bff && npm install && npm run dev
```
5. Run frontend:
```bash
cd apps/web && npm install && npm run dev
```

### Alternative: Railway CLI
```bash
railway link
# Select project/services, then
railway run npm run db:push
```

## Test Accounts (Dev)

Seeded example accounts for development/testing (password for all: `password123`):
- Platform Admins (Superadmin):
  - admin@nayararesorts.com
  - admin@tasogroup.com
- Department Admins:
  - maria.gonzalez@nayararesorts.com (Front Office)
  - ana.castro@nayararesorts.com (Housekeeping)
  - pedro.sanchez@tasogroup.com (Front Desk)
- Staff:
  - juan.rodriguez@nayararesorts.com (Reception)
  - sofia.martinez@nayararesorts.com (Room Service)
  - laura.fernandez@tasogroup.com (Reception)

## Permission System Fix Verification Checklist

Objective: Verify PostgreSQL permission table detection fix in Railway production.

1) Backend health:
```bash
curl -I https://bff-production-d034.up.railway.app/api
```
2) Logs should include:
```
Permission service initialized with system permissions and roles
All required permission tables found in database
System permissions initialization completed successfully
```
3) Frontend login:
- Open https://frontend-production-55d3.up.railway.app
- Login as PLATFORM_ADMIN; browser console must have no permission errors

4) Debug endpoints (with auth token):
- /api/permissions/system/status should include `permissionTablesExist: true` and table counts

5) Verify functionality:
- User management works
- RBAC checks pass
- No legacy mode warnings

Troubleshooting:
- Set `FORCE_PERMISSION_SYSTEM=true`, restart, call `/api/permissions/system/reinitialize`
- Verify DATABASE_URL and service connectivity

Success criteria:
- Backend starts cleanly; status shows `permissionTablesExist: true`; frontend works without warnings
