# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Nayara Bocas del Toro HR Portal - a mobile-first staff management system with role-based access control, document management, payroll, vacation tracking, training modules, and commercial benefits directory.

## Architecture

### System Design
- **Frontend**: React SPA with TypeScript, Tailwind CSS, React Query
- **Backend**: Node.js BFF (Backend-for-Frontend) pattern, preferably NestJS
- **Database**: PostgreSQL on Railway
- **Storage**: S3-compatible object storage (R2/S3) for documents, IDs, training assets
- **Deployment**: Railway services (web, worker, postgres, optional redis)
- **Auth**: OIDC/Magic-link with role-based access control (RBAC)

### Role Hierarchy
1. **Superadmin**: Full system access, manages departments/positions
2. **Department Admin**: Manages users within their department only
3. **Staff**: Self-service access to their own resources

### Core Features
- **Document Library**: Scoped document access (general/department/user-specific)
- **Payroll**: CSV bulk import with validation, payslip generation
- **Vacation Management**: Request/approval workflow with department scoping
- **Training Sessions**: Modular content blocks (TEXT/FILE/VIDEO/LINK/FORM) with grading
- **Commercial Benefits**: Partner perks directory
- **Profile Management**: PII-safe profile with ID verification

## Development Commands

Since this is a specification project without implementation yet, here are the recommended commands for when development begins:

### Initial Setup (once codebase exists)
```bash
# Install dependencies
npm install

# Database setup
npm run db:migrate
npm run db:seed

# Environment setup
cp .env.example .env.local
```

### Development
```bash
# Start development servers
npm run dev           # Runs both frontend and backend in dev mode
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
npm run dev:worker    # Background worker

# Database operations
npm run db:migrate    # Run pending migrations
npm run db:generate   # Generate Prisma client
npm run db:studio     # Open Prisma Studio
```

### Testing & Quality
```bash
# Run tests
npm run test          # All tests
npm run test:unit     # Unit tests only
npm run test:e2e      # E2E tests
npm run test:watch    # Watch mode

# Code quality
npm run lint          # ESLint
npm run typecheck     # TypeScript type checking
npm run format        # Prettier formatting
```

### Build & Deploy
```bash
# Build for production
npm run build

# Deploy to Railway
npm run deploy:staging
npm run deploy:production
```

## Project Structure (Recommended)

```
apps/
  web/          # React SPA frontend
  bff/          # NestJS backend-for-frontend
  worker/       # Background jobs (CSV, PDF, grading)
packages/
  ui/           # Shared UI components & Tailwind config
  types/        # Shared TypeScript types & Zod schemas
  config/       # Shared configs (ESLint, TSConfig)
```

## Key Technical Decisions

### Security & Authorization
- All authorization checks happen server-side via policy engine (Casbin/Oso)
- Department-scoped operations enforced at API level
- Signed URLs for file access (5-minute expiry)
- PII data (IDs, payslips) encrypted at rest with audit logging

### Data Management
- Soft deletes with `deleted_at` timestamps
- Immutable payslips (append-only, versioned)
- Training session versioning (edits create new versions)
- Idempotent CSV payroll ingestion with batch IDs

### File Handling
- Pre-signed URLs for uploads/downloads via BFF
- AV scanning on upload via worker queue
- CDN fronting for cached assets
- Metadata in Postgres, files in object storage

### CSV Payroll Ingestion Flow
1. Admin uploads CSV → staged in storage
2. Worker validates (dry-run) → returns row-level errors
3. Admin reviews and commits → Worker creates payslips
4. Optional PDF generation for payslips

### Training Module System
- Ordered content blocks with different types
- FORM blocks use JSON schema for questions
- Grading worker processes submissions
- Completion rules: view all blocks + pass score

## Design System

### Colors
- **Primary**: Sand #F5EBD7, Charcoal #4A4A4A, Warm Gold #AA8E67
- **Property-specific**: Forest Green #7C8E67, Ocean Teal #A4C4C8, Sky Blue #DCFEF4
- **Semantic**: Success #2E7D32, Warning #ED6C02, Error #C62828, Info #0277BD

### Typography
- **Headings**: Gotham Black (all caps)
- **Subheadings**: Georgia Italic
- **Body**: Proxima Nova
- **Fallbacks**: Tahoma, Georgia, Arial

### Component Guidelines
- Mobile-first responsive design
- 8px base spacing unit
- 12-16px rounded corners for buttons/cards
- 200-300ms transitions with ease-in-out
- WCAG AA accessibility compliance

## Environment Variables

```bash
# Auth
AUTH_PROVIDER=auth0|cognito|magic-link
AUTH_DOMAIN=
AUTH_CLIENT_ID=
AUTH_CLIENT_SECRET=

# Database
DATABASE_URL=postgresql://...

# Storage
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Services
REDIS_URL=
NOTIFICATION_PROVIDER=sendgrid|twilio
```

## Common Development Tasks

### Adding a New Feature Module
1. Create module in `bff/src/modules/[feature]/`
2. Define DTOs and validation schemas
3. Implement service with repository pattern
4. Add controller with proper guards
5. Create corresponding frontend components
6. Add e2e tests covering the flow

### Implementing Department-Scoped Operations
1. Check user's role and department in guard/middleware
2. Filter queries by department_id in repository
3. Validate cross-department operations return 403
4. Add audit log entries for sensitive operations

### Working with Training Sessions
1. Sessions have versioned content blocks
2. Active enrollments pinned to specific version
3. Edits create new version, don't modify existing
4. FORM grading happens asynchronously via worker

## Testing Strategy

- **Unit Tests**: Services, utilities, validation logic
- **Integration Tests**: API endpoints with mocked dependencies
- **E2E Tests**: Critical user flows (login, document upload, payroll import)
- **Performance Tests**: CSV ingestion, bulk operations
- **Security Tests**: Authorization boundaries, input validation

## Deployment Checklist

- [ ] Environment variables configured in Railway
- [ ] Database migrations run successfully
- [ ] Object storage bucket created with proper CORS
- [ ] CDN configured for static assets
- [ ] Health checks passing
- [ ] Monitoring/alerting configured
- [ ] Backup strategy verified
- [ ] Rate limiting enabled
- [ ] WAF rules configured