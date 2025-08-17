# CLAUDE.md - Hotel Operations Hub Navigation Guide

This file provides guidance to Claude Code (claude.ai/code) when working with the Hotel Operations Hub codebase.

## 📚 Documentation Navigation Map

**CRITICAL**: Always read the appropriate documentation below for your specific task. Each file covers a specific aspect of the system:

### 🏗️ Core Architecture & Vision
- **README.md** → Project overview, quick start, tech stack, deployment info
- **ARCHITECTURE.md** → Multi-tenant system design, data models, API architecture
- **specs.md** → Complete technical specifications, detailed requirements

### 🧩 Features & Modules
- **MODULES.md** → All available modules (HR, Inventory, Maintenance, Front Desk, etc.)
- **mvp.md** → MVP features organized by modules, implementation priorities

### 🔧 Technical Implementation Guides
- **MULTI_TENANT.md** → Multi-tenancy implementation, tenant isolation, hierarchy
- **WHITE_LABEL.md** → White-labeling system, theming, branding customization
- **I18N.md** → Internationalization setup, translation management, AI integration

### 🚀 Development & Deployment
- **DEVELOPMENT_PLAN.md** → Implementation phases, current status, roadmap
- **RAILWAY_DEPLOYMENT.md** → Railway-specific deployment configuration
- **setup.md** → Local development environment setup

### 🎨 User Interface & Design
- **ui.md** → Design system, component guidelines, responsive design
- **NAVIGATION_IMPLEMENTATION.md** → Navigation patterns, routing structure

### 📝 Credentials & Configuration
- **LOGIN_CREDENTIALS.md** → Test accounts and authentication details

## 🏨 Project Overview

**Hotel Operations Hub** is a comprehensive, **multi-tenant, white-labeled, multi-language ERP platform** designed specifically for hotel operations management. This evolved from a single-tenant HR portal into a complete suite of modules for managing every aspect of hotel operations.

### Key Characteristics
- **Multi-Tenant**: Supports hotel chains, property groups, and independent hotels
- **White-Labeled**: Complete branding customization per tenant/property
- **Multi-Language**: English/Spanish initially, AI-powered translation system
- **Modular**: Module marketplace with HR, Inventory, Maintenance, Front Desk, etc.
- **Scalable**: From single property to international hotel chains

### Current Transformation Status
- **From**: Single-tenant "Nayara HR Portal" (staffnbdt)
- **To**: Multi-tenant "Hotel Operations Hub" (hotel-ops-hub)
- **Progress**: HR module implemented, multi-tenant architecture in progress
- **Storage**: Migrating from local filesystem to Cloudflare R2
- **Deployment**: Railway-based with auto-deployment

### Key Technical Decisions
- **Tenant Isolation**: Shared database with organization_id/property_id columns
- **File Storage**: Cloudflare R2 (NOT local filesystem) with CDN
- **White-Labeling**: Dynamic CSS variables, runtime theme switching
- **Internationalization**: react-i18next with AI translation preparation
- **Module System**: Independent modules with inter-module communication

## Railway-First Development Workflow

### NO LOCAL DEVELOPMENT - WE TEST ON RAILWAY

This project uses a **deploy-and-test approach directly on Railway**. We do NOT run local development servers.

#### Workflow:
1. **Make Code Changes** → Commit and push to repository
2. **Railway Auto-Deploys** → Services automatically rebuild on push
3. **Test on Production URLs** → Use browser automation on live Railway URLs
4. **Verify Success** → Screenshots and console checks on deployed services

#### Railway Service URLs:
- **Frontend**: https://frontend-production-55d3.up.railway.app
- **Backend API**: Automatically configured via Railway internal networking
- **Database**: Railway PostgreSQL service (nozomi.proxy.rlwy.net)
- **Redis**: Railway Redis service (for worker queues)

#### Testing Process:
```bash
# 1. Push changes to trigger deployment
git add .
git commit -m "Feature/fix description"
git push

# 2. Wait for Railway deployment (check Railway dashboard)

# 3. Test with browser automation on Railway URLs
playwright.navigate("https://frontend-production-55d3.up.railway.app")
playwright.screenshot("railway-deployment.png")
playwright.checkConsole() # Must have no errors
```

## CRITICAL INSTRUCTIONS FOR ALL AGENTS

### MANDATORY: Documentation Research with Context7
**ALWAYS** use Context7 MCP server to search for updated documentation before attempting to fix any issues:
- When encountering errors → First search Context7 for related error messages and solutions
- Before implementing features → Search Context7 for best practices and examples
- When debugging → Look up the latest framework/library documentation
- For deployment issues → Check for recent platform updates and changes

Example workflow:
1. Error occurs: "Module not found" or "CORS issue"
2. IMMEDIATELY use Context7 to search: "Railway deployment module not found" or "CORS NestJS React"
3. Review updated documentation and community solutions
4. Apply fixes based on latest information
5. Verify with browser automation

### MANDATORY: Automated Testing with Browser Automation
**ALWAYS** use Playwright or Puppeteer MCP servers to verify success of any changes:

#### When to Use Browser Automation:
- After ANY frontend changes → Take screenshots, check console for errors
- After backend API changes → Test the full flow from UI
- After fixing bugs → Automate the reproduction steps and verify fix
- Before marking tasks complete → Run automated UI tests
- For deployment verification → Navigate to deployed URLs and test functionality

#### Required Testing Steps:
1. **Start the application**: Ensure both frontend and backend are running
2. **Navigate with Playwright/Puppeteer**: Open the application in automated browser
3. **Check console for errors**: Monitor browser console for any JavaScript errors
4. **Take screenshots**: Capture visual proof of working features
5. **Test user flows**: Automate clicking, form filling, navigation
6. **Verify API responses**: Check network tab for successful API calls
7. **Test responsive design**: Check mobile and desktop views

#### Example Testing Commands:
```javascript
// Using Playwright MCP on Railway
playwright.navigate("https://frontend-production-55d3.up.railway.app")
playwright.screenshot("homepage-loaded.png")
playwright.checkConsole() // Should return no errors
playwright.click("button[data-testid='login']")
playwright.fill("input[name='email']", "test@example.com")
playwright.screenshot("login-form-filled.png")

// Using Puppeteer MCP on Railway
puppeteer.goto("https://frontend-production-55d3.up.railway.app")
puppeteer.evaluate(() => console.error) // Check for console errors
puppeteer.screenshot({ path: "app-state.png", fullPage: true })
```

### NEVER Mark Tasks Complete Without:
1. ✅ Searching Context7 for relevant documentation
2. ✅ Running automated browser tests
3. ✅ Taking screenshots as proof of success
4. ✅ Checking browser console for errors
5. ✅ Testing the complete user flow
6. ✅ Verifying both desktop and mobile views

### Debugging Workflow
1. **Identify Issue** → Error message or unexpected behavior
2. **Search Context7** → Look for updated docs, known issues, solutions
3. **Implement Fix** → Apply solution based on research
4. **Test with Browser Automation** → Verify fix works
5. **Document Success** → Screenshots and console logs as proof

## Architecture

### System Design
- **Frontend**: React SPA with TypeScript, Vite, Tailwind CSS, TanStack Query (React Query)
- **Backend**: NestJS BFF (Backend-for-Frontend) pattern with Passport JWT
- **Worker**: Bull queue processor with Redis for background jobs
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: S3-compatible object storage (R2/S3) for documents, IDs, training assets
- **Deployment**: Railway services with Nixpacks (web, worker, postgres, redis)
- **Auth**: JWT/Magic-link with role-based access control (RBAC)

### Monorepo Structure (Actual)
```
apps/
  bff/          # NestJS backend-for-frontend API
  web/          # React SPA with Vite, TypeScript, Tailwind CSS
  worker/       # Background job processor (Bull/Redis)
packages/
  database/     # Prisma ORM and shared database client
  types/        # Shared TypeScript types (to be created)
  ui/           # Shared UI components (to be created)
```

### Multi-Level Role Hierarchy
1. **Platform Admin**: Manages entire platform, all tenants
2. **Organization Owner**: Manages hotel chain/group
3. **Organization Admin**: Manages organization settings  
4. **Property Manager**: Manages individual hotel property
5. **Department Admin**: Manages department within property
6. **Staff**: Self-service access to own resources

### Tenant Hierarchy
```
Platform (Super Admin Portal)
├── Organization (Hotel Chain/Group)
│   ├── Properties (Individual Hotels)
│   │   ├── Departments (Front Desk, Housekeeping, etc.)
│   │   │   └── Users (Staff, Managers)
│   │   └── Modules (HR, Inventory, Maintenance)
│   └── Branding (White-label theming)
└── Languages (Multi-language support)
```

### Hotel Operations Hub Modules

#### Core Platform Features
- **Multi-Tenant Management**: Organization/property hierarchy, tenant isolation
- **White-Label Branding**: Custom logos, colors, fonts, CSS per tenant
- **Multi-Language Support**: English/Spanish with AI translation system
- **Module Marketplace**: Enable/disable modules per property
- **Super Admin Portal**: Platform-wide tenant and usage management

#### HR Module (Implemented)
- **User Management**: Multi-level roles, department scoping
- **Profile Management**: Photos, ID verification, emergency contacts
- **Payroll**: CSV import, payslip generation, multi-property support
- **Vacation Management**: Request/approval workflow
- **Training Sessions**: Modular content with progress tracking
- **Commercial Benefits**: Partner directory
- **Document Library**: Scoped access with audit trails

#### Hotel Operations Modules (Planned)
- **Front Desk**: Check-in/out, reservations, guest services
- **Housekeeping**: Room status, cleaning schedules, inventory
- **Maintenance**: Work orders, preventive maintenance, asset tracking
- **Inventory**: Stock management, purchase orders, suppliers
- **F&B**: Restaurant, bar, room service, event management
- **Concierge**: Guest requests, local recommendations
- **Revenue Management**: Dynamic pricing, forecasting
- **Analytics**: Cross-property reporting, KPI dashboards

## Development Commands

### Initial Setup
```bash
# Install all dependencies including workspace packages
npm run install:all

# Generate Prisma client
npm run db:generate

# Push database schema (development)
npm run db:push

# Run database migrations
cd packages/database && npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

### Development Servers
```bash
# Backend (NestJS BFF)
npm run dev:bff
# or
cd apps/bff && npm run dev

# Frontend (React/Vite)
npm run dev:web
# or  
cd apps/web && npm run dev

# Worker (Background jobs)
cd apps/worker && npm run dev
```

### Testing
```bash
# Backend tests
cd apps/bff
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # E2E tests

# Frontend tests
cd apps/web
npm run test           # Run Vitest tests

# Worker tests
cd apps/worker
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
```

### Code Quality
```bash
# Backend linting
cd apps/bff && npm run lint

# Frontend linting and type checking
cd apps/web
npm run lint           # ESLint
npm run typecheck      # TypeScript checking

# Worker linting
cd apps/worker && npm run lint
```

### Build & Production
```bash
# Backend build
cd apps/bff && npm run build
npm run start:prod     # Run production build

# Frontend build
cd apps/web && npm run build
npm run preview        # Preview production build

# Worker build
cd apps/worker && npm run build
npm run start          # Run production build
```

### Database Operations
```bash
# From packages/database directory
npm run db:generate         # Generate Prisma Client
npm run db:push            # Push schema changes (dev)
npm run db:migrate         # Create migration
npm run db:migrate:deploy  # Deploy migrations (production)
npm run db:studio          # Open Prisma Studio GUI
```

## Key Technical Decisions

### Security & Authorization
- All authorization checks happen server-side via policy engine (Casbin/Oso)
- Department-scoped operations enforced at API level
- Signed URLs for file access (5-minute expiry)
- PII data (IDs, payslips) encrypted at rest with audit logging

### Data Management
- Soft deletes with `deletedAt` timestamps
- Immutable payslips (append-only, versioned)
- Training session versioning (edits create new versions)
- Idempotent CSV payroll ingestion with batch IDs
- Audit logging with AuditLog model tracking all sensitive operations

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
- Version tracking: New edits create new versions
- Progress tracking via JSON field

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
# Common
NODE_ENV=development|production
DATABASE_URL=postgresql://...

# BFF specific
JWT_SECRET=
JWT_EXPIRES_IN=7d
PORT=3000
AUTH_PROVIDER=auth0|cognito|magic-link
AUTH_DOMAIN=
AUTH_CLIENT_ID=
AUTH_CLIENT_SECRET=

# Cloudflare R2 Storage (NOT S3)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Multi-Tenant Configuration
DEFAULT_ORGANIZATION_ID=
DEFAULT_PROPERTY_ID=
TENANT_ISOLATION_MODE=strict

# White-Label Configuration
ALLOW_CUSTOM_BRANDING=true
ALLOW_CUSTOM_DOMAINS=true
ALLOW_CUSTOM_CSS=true

# Internationalization
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es
AI_TRANSLATION_ENABLED=false
AI_TRANSLATION_PROVIDER=openai

# Email (for magic links)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
NOTIFICATION_PROVIDER=sendgrid|twilio

# Worker specific
REDIS_URL=redis://...

# Frontend specific
VITE_API_URL=http://localhost:3000
```

## Common Development Tasks

### Debugging and Fixing Issues (MANDATORY WORKFLOW)

1. **Research Phase with Context7**
   ```bash
   # Search for error solutions
   context7.search("exact error message")
   context7.search("framework + error type")
   context7.search("deployment platform + issue")
   ```

2. **Implementation Phase**
   - Apply fixes based on latest documentation from Context7
   - Use current best practices found in search results
   - Check for version-specific solutions

3. **Verification Phase with Browser Automation**
   ```javascript
   // Push changes to Railway
   git add . && git commit -m "Fix applied" && git push
   
   // Wait for Railway deployment, then test
   playwright.goto("https://frontend-production-55d3.up.railway.app")
   playwright.screenshot("before-fix.png")
   // Test the fix
   playwright.click("#feature")
   playwright.screenshot("after-fix.png")
   // Check console
   playwright.getConsoleErrors() // Must be empty
   ```

4. **Documentation Phase**
   - Save screenshots as proof
   - Document console output
   - Record successful API calls

### Automated Testing Verification (REQUIRED FOR ALL CHANGES)

#### For Frontend Changes:
```bash
# 1. Push changes to Railway
git add . && git commit -m "Frontend update" && git push

# 2. Wait for Railway deployment, then test
playwright.goto("https://frontend-production-55d3.up.railway.app")
playwright.screenshot("ui-change.png")
playwright.checkConsole() # No errors allowed
playwright.click("[data-test='new-feature']")
playwright.screenshot("feature-working.png")

# 3. Test responsive design on Railway
playwright.setViewport(375, 667) # Mobile
playwright.screenshot("mobile-view.png")
playwright.setViewport(1920, 1080) # Desktop
playwright.screenshot("desktop-view.png")
```

#### For Backend Changes:
```bash
# 1. Push backend changes to Railway
git add . && git commit -m "Backend API update" && git push

# 2. Wait for Railway deployment, then test via UI
playwright.goto("https://frontend-production-55d3.up.railway.app")
# Trigger API calls through UI
playwright.click("#api-action")
# Verify in network tab
playwright.getNetworkRequests()
# Confirm success
playwright.waitForSelector(".api-success")
playwright.screenshot("api-verified.png")
```

#### For Bug Fixes:
```bash
# 1. First reproduce the bug
playwright.goto("/buggy-page")
playwright.screenshot("bug-reproduction.png")

# 2. Apply the fix
# ... code changes ...

# 3. Verify bug is fixed
playwright.reload()
playwright.click("#previously-buggy-action")
playwright.screenshot("bug-fixed.png")
const errors = playwright.getConsoleErrors()
assert(errors.length === 0)
```

### Adding a New API Module
1. Generate module: `cd apps/bff && nest g module modules/[name]`
2. Generate service: `nest g service modules/[name]`
3. Generate controller: `nest g controller modules/[name]`
4. Create DTOs with class-validator decorators
5. Add to app.module.ts imports
6. Implement repository pattern with Prisma

### Implementing Department-Scoped Operations
1. Add `@UseGuards(DepartmentGuard)` to controller
2. Filter queries by user's departmentId in service
3. Validate cross-department operations return 403
4. Add audit log entry for sensitive operations

### Working with Training Sessions
1. Sessions have versioned content blocks
2. Active enrollments pinned to specific version
3. Edits create new version, don't modify existing
4. FORM grading happens asynchronously via worker

### Adding Background Jobs
1. Define job processor in apps/worker/src/processors/
2. Register processor with queue manager
3. Add job to queue from BFF service
4. Handle success/failure callbacks
5. Implement retry logic and error handling

## Development Methodology - Using Subagents

### IMPORTANT: Always Use Specialized Subagents

This project uses specialized engineering subagents located in `.claude/agents/engineering/`. You MUST use these agents for complex tasks to ensure high-quality, efficient development.

### Available Subagents

1. **backend-architect**: API design, database architecture, server-side logic, microservices
2. **frontend-developer**: React components, UI/UX implementation, responsive design, state management
3. **test-writer-fixer**: Writing new tests, fixing failing tests, maintaining test coverage
4. **devops-automator**: CI/CD setup, Docker configuration, deployment automation
5. **rapid-prototyper**: Quick MVPs, proof-of-concepts, initial implementations
6. **ai-engineer**: ML/AI integrations, data processing pipelines
7. **mobile-app-builder**: React Native or mobile web optimizations

### Mandatory Subagent Usage

**ALWAYS use subagents for:**
- Building complete feature modules → Use the relevant specialist agent
- After ANY code changes → Use test-writer-fixer to ensure tests pass
- Complex architectural decisions → Use backend-architect
- UI component development → Use frontend-developer
- Deployment and infrastructure → Use devops-automator

**CRITICAL: All subagents MUST:**
1. Use Context7 to research solutions before implementing
2. Use Playwright/Puppeteer to verify all changes work
3. Take screenshots as proof of success
4. Check browser console for errors
5. Test both mobile and desktop views

### Subagent Implementation Examples for This Project

#### User Management Module
```
Use backend-architect agent with prompt:
"Implement the complete user management module for the NestJS BFF in apps/bff including:
- FIRST: Use Context7 to research NestJS best practices for user management
- User CRUD operations with Prisma using the schema in packages/database
- Role-based access control (RBAC) with SUPERADMIN, DEPARTMENT_ADMIN, and STAFF roles
- Department scoping for admin operations
- DTOs with class-validator for all endpoints
- JWT authentication guards
- Audit logging for sensitive operations
- Soft delete functionality with deletedAt timestamps
- VERIFY: Use Playwright to test all endpoints work via UI
- VERIFY: Take screenshots proving user CRUD operations work
- VERIFY: Check browser console for any errors"
```

#### Frontend Dashboard
```
Use frontend-developer agent with prompt:
"Build the React dashboard in apps/web with:
- FIRST: Use Context7 to research React dashboard best practices and Tailwind CSS patterns
- Mobile-first responsive layout using Tailwind CSS
- Role-based UI elements (hide/show based on user role)
- Design system colors: Sand #F5EBD7, Charcoal #4A4A4A, Warm Gold #AA8E67
- TanStack Query (React Query) for data fetching from the BFF
- TypeScript types from packages/types
- Loading states, error boundaries, and offline support
- Accessibility WCAG AA compliance
- VERIFY: Use Playwright to navigate the dashboard and take screenshots
- VERIFY: Test on mobile (375px) and desktop (1920px) viewports
- VERIFY: Ensure no console errors in browser
- VERIFY: Confirm all API calls succeed in network tab"
```

#### Payroll System
```
Use backend-architect agent with prompt:
"Implement the payroll system in apps/bff/src/modules/payroll with:
- FIRST: Use Context7 to research CSV processing best practices and S3 pre-signed URLs
- CSV import endpoint with validation
- Bulk payslip generation with idempotent batch IDs
- Immutable payslip records (append-only)
- Pre-signed S3 URLs for CSV uploads
- Background job queuing for processing
- Row-level error reporting for CSV validation
- PDF generation for payslips
- VERIFY: Use Playwright to upload a test CSV and process it
- VERIFY: Take screenshots of CSV upload, validation, and payslip generation
- VERIFY: Check console for errors during the entire flow
- VERIFY: Confirm PDF generation works correctly"
```

#### Test Coverage
```
Use test-writer-fixer agent after each module with prompt:
"Write comprehensive tests for the [module name] including:
- FIRST: Use Context7 to research testing best practices for [framework]
- Unit tests for all services with > 80% coverage
- Integration tests for API endpoints
- E2E tests for critical user flows
- Fix any failing tests from recent changes
- Ensure all tests follow existing patterns in the codebase
- VERIFY: Use Playwright to run the application and ensure no runtime errors
- VERIFY: Take screenshots of the working features being tested
- VERIFY: Confirm all tests pass with npm test
- VERIFY: Check test coverage meets requirements"
```

### Integration with Todo List

When using TodoWrite, specify which subagent to use in brackets:
- "Build user management module [backend-architect]"
- "Create responsive navigation [frontend-developer]"
- "Fix failing tests [test-writer-fixer]"
- "Setup Railway deployment [devops-automator]"

### Subagent Workflow

1. **Plan**: Break down the task and identify which subagent to use
2. **Execute**: Use the Task tool to launch the appropriate subagent with detailed prompts
3. **Test**: Always follow up with test-writer-fixer agent
4. **Review**: Check the subagent's output and integrate changes

### Example Task Tool Usage

```typescript
// For backend development
Task({
  subagent_type: "general-purpose",
  description: "Build user module",
  prompt: "Acting as a backend-architect agent, implement the complete user management module. MANDATORY: First use Context7 to research best practices, then implement, then verify with Playwright browser automation including screenshots and console checks..."
})

// For frontend development
Task({
  subagent_type: "general-purpose", 
  description: "Create dashboard UI",
  prompt: "Acting as a frontend-developer agent, build the dashboard with React and Tailwind. MANDATORY: First use Context7 for UI patterns research, implement the dashboard, then use Playwright to test on mobile and desktop, take screenshots, and verify no console errors..."
})

// For test maintenance
Task({
  subagent_type: "general-purpose",
  description: "Fix test suite",
  prompt: "Acting as a test-writer-fixer agent, run all tests and fix any failures. MANDATORY: Use Context7 to research testing patterns, fix the tests, then use Playwright to verify the application runs without errors and take screenshots as proof..."
})
```

## Testing Strategy

### Test Types and Requirements

- **Unit Tests**: Services, utilities, validation logic
- **Integration Tests**: API endpoints with mocked dependencies (supertest)
- **E2E Tests**: Critical user flows (login, document upload, payroll import)
- **Performance Tests**: CSV ingestion, bulk operations
- **Security Tests**: Authorization boundaries, input validation
- **Browser Automation Tests**: MANDATORY for all UI changes using Playwright/Puppeteer

### Browser Automation Testing Requirements

**Every code change MUST be verified with browser automation:**

#### Frontend Changes Testing Checklist:
```bash
# 1. Deploy to Railway
git add . && git commit -m "Frontend changes" && git push

# 2. Wait for Railway deployment to complete

# 3. Use Playwright/Puppeteer to:
- Navigate to https://frontend-production-55d3.up.railway.app
- Take initial screenshot
- Check browser console for errors
- Test the specific feature/fix
- Take screenshots of each step
- Verify responsive design (mobile/tablet/desktop)
- Check network requests succeed
```

#### API Changes Testing Checklist:
```bash
# 1. Test via UI automation
- Navigate to feature using the API
- Perform actions that call the API
- Verify responses in network tab
- Check for console errors
- Confirm UI updates correctly
```

#### Deployment Testing Checklist:
```bash
# 1. Test deployed URLs
- Navigate to https://frontend-production-55d3.up.railway.app
- Verify all pages load
- Test critical user flows
- Check console for production errors
- Take screenshots as deployment proof
```

### Required Test Evidence

Before marking ANY task complete, you MUST have:
1. **Screenshots** showing the working feature
2. **Console logs** proving no errors
3. **Network logs** showing successful API calls
4. **Mobile/Desktop views** confirming responsive design
5. **User flow automation** demonstrating the complete feature

### Testing Workflow with MCP Servers

```javascript
// Example: Testing a login fix on Railway
// 1. Search for solutions
context7.search("NestJS JWT authentication issues Railway")

// 2. Apply fix and deploy
// ... code changes ...
// git add . && git commit -m "Fix login" && git push

// 3. Verify on Railway deployment
playwright.launch()
playwright.goto("https://frontend-production-55d3.up.railway.app")
playwright.screenshot("before-login.png")
playwright.click("#login-button")
playwright.fill("#email", "test@example.com")
playwright.fill("#password", "password123")
playwright.click("#submit")
playwright.waitForNavigation()
playwright.screenshot("after-login-success.png")
const errors = playwright.getConsoleErrors()
assert(errors.length === 0, "No console errors")
```

### Automated Test Patterns

#### Pattern 1: Feature Verification
```javascript
// Always test new features end-to-end
playwright.goto("/feature-page")
playwright.screenshot("feature-initial.png")
// Interact with feature
playwright.click("[data-test='feature-button']")
// Verify result
playwright.waitForSelector("[data-test='success-message']")
playwright.screenshot("feature-success.png")
```

#### Pattern 2: Bug Fix Verification
```javascript
// Reproduce the bug first
playwright.goto("/problematic-page")
// Try to trigger the bug
playwright.click("#trigger-bug")
// Verify bug is fixed
const consoleErrors = playwright.getConsoleErrors()
assert(consoleErrors.length === 0)
playwright.screenshot("bug-fixed.png")
```

#### Pattern 3: Responsive Design Testing
```javascript
// Test mobile view
playwright.setViewport(375, 667) // iPhone SE
playwright.screenshot("mobile-view.png")

// Test tablet view
playwright.setViewport(768, 1024) // iPad
playwright.screenshot("tablet-view.png")

// Test desktop view
playwright.setViewport(1920, 1080)
playwright.screenshot("desktop-view.png")
```

## Deployment Notes

### Railway Deployment
- Uses Nixpacks configuration (nixpacks.toml)
- Monorepo support with workspace packages
- Environment variables set in Railway dashboard
- PostgreSQL and Redis provisioned as Railway services

### Build Process
1. Install all dependencies (including dev for build)
2. Generate Prisma client
3. Build TypeScript applications
4. Run production with compiled JavaScript

## Current Implementation Focus

### Prioritized Features (In Development Order)

#### 1. Profile & User Management - Week 1
**Status**: 🔴 Not Started

**Scope**:
- **Profile Management**: Personal info, emergency contacts, photo/ID upload
- **User Creation**: Admin-created users with department scoping
- **Role Management**: Staff, Department Admin, Superadmin hierarchy
- **Invitation System**: Email invites with 7-day expiry
- **Bulk Import**: CSV user upload with validation
- **ID Verification**: Admin workflow for document approval
- **Audit Logging**: Complete trail for all sensitive operations

**Technical Implementation**:
- **Database**: 
  - User model with profilePhoto, emergencyContact JSON
  - Role-based access control with department scoping
  - Audit log for all user/profile changes
- **Storage**: Pre-signed URLs for photos/IDs (5MB photos, 10MB documents)
- **Security**: 
  - ID documents encrypted at rest
  - Department-scoped data access
  - Role validation and permission matrix
- **API Endpoints**:
  - **Profile**: GET/PUT /api/profile, POST /api/profile/photo, POST /api/profile/id
  - **Users**: GET/POST /api/users, PUT /api/users/:id, PUT /api/users/:id/role
  - **Bulk**: POST /api/users/bulk, GET /api/users/export
  - **Verification**: POST /api/profile/id/verify, GET /api/admin/verifications
  - **Invitations**: POST /api/users/:id/invite, POST /api/users/:id/resend

**Frontend Components**:
- **User Views**:
  - ProfileView.tsx - Complete profile display
  - ProfileEdit.tsx - Multi-tab edit form
  - ProfilePhotoUpload.tsx - Drag & drop with crop
  - IDDocumentUpload.tsx - Secure upload with encryption
  - EmergencyContactForm.tsx - Dynamic contact management
- **Admin Views**:
  - UserManagementDashboard.tsx - Department-scoped user list
  - CreateUserWizard.tsx - 3-step user creation
  - BulkImportModal.tsx - CSV upload with validation
  - RoleChangeModal.tsx - Role management with warnings
  - VerificationQueue.tsx - ID verification workflow

**Role Permissions**:
- **Staff**: View/edit own profile only
- **Department Admin**: Create/edit users in department, verify IDs
- **Superadmin**: Full system access, cross-department management

**Progress Tracking**:
- [ ] User management API module
- [ ] Role-based access control
- [ ] Invitation email system
- [ ] Profile management features
- [ ] Photo/ID upload flows
- [ ] Admin dashboards
- [ ] Bulk import functionality
- [ ] Testing & documentation

#### 2. Commercial Benefits - Week 2
**Status**: 🔴 Not Started

**Scope**:
- Partner benefits directory (Dining, Wellness, Hotels, Shopping)
- Category filtering and search
- Department-specific benefits
- Usage tracking and analytics
- Admin management interface

**Technical Implementation**:
- **Database**: CommercialBenefit model with categories, validity dates
- **Filtering**: Category, department, validity, location
- **Analytics**: Anonymous usage tracking
- **API Endpoints**:
  - GET /api/benefits (with filters)
  - GET /api/benefits/:id (details)
  - POST/PUT/DELETE /api/benefits (admin)
  - POST /api/benefits/:id/track (usage)

**Frontend Components**:
- BenefitsGrid.tsx - Responsive card layout
- BenefitCard.tsx - Preview with logo/discount
- BenefitDetails.tsx - Full modal view
- BenefitFilters.tsx - Category/search sidebar
- BenefitAdmin.tsx - CRUD interface

**Progress Tracking**:
- [ ] Backend API module created
- [ ] Category system implemented
- [ ] Department filtering added
- [ ] Frontend grid & cards
- [ ] Search & filter UI
- [ ] Admin management
- [ ] Usage analytics

#### 3. Training with Integrated Documents - Week 3
**Status**: 🔴 Not Started

**Scope**:
- Modular training sessions with content blocks
- Document integration within training
- Progress tracking and completion rules
- Quiz/form functionality with grading
- Certificate generation
- Department-based assignments

**Technical Implementation**:
- **Database**: TrainingSession with versioning, contentBlocks JSON
- **Content Types**: TEXT, FILE, VIDEO, LINK, FORM, DOCUMENT
- **Progress**: Track viewed blocks, quiz scores, completion
- **Documents**: Attach existing docs to training sessions
- **API Endpoints**:
  - GET/POST /api/training/sessions
  - GET/POST /api/training/enrollments
  - POST /api/training/progress/:id
  - POST /api/training/submit/:id (quiz)
  - GET /api/training/:id/documents
  - GET /api/training/certificate/:id

**Frontend Components**:
- TrainingDashboard.tsx - Overview with progress
- TrainingCard.tsx - Session preview
- TrainingViewer.tsx - Content block renderer
- TrainingDocuments.tsx - Integrated doc viewer
- TrainingQuiz.tsx - Form/quiz component
- TrainingProgress.tsx - Visual progress bar
- TrainingAdmin.tsx - Session builder

**Progress Tracking**:
- [ ] Backend API module created
- [ ] Content block system
- [ ] Document integration
- [ ] Progress tracking
- [ ] Quiz/grading system
- [ ] Frontend viewer
- [ ] Certificate generation
- [ ] Admin builder UI

### Cross-Cutting Concerns

#### Department Integration
All features will respect department boundaries:
- **Profile**: Filter users by department (admin view)
- **Benefits**: Department-specific benefits and usage stats
- **Training**: Department-assigned training, scoped document access

#### Implementation Patterns
- **Authentication**: JWT with role/department claims
- **Authorization**: Policy-based with department scoping
- **File Storage**: Pre-signed URLs via BFF
- **Audit Logging**: All sensitive operations tracked
- **Soft Deletes**: deletedAt timestamps preserve history

### Session Progress Tracking
Use this section to track work across development sessions:

**Last Updated**: August 17, 2025
**Current Task**: Transforming to Hotel Operations Hub Multi-Tenant Platform
**Next Steps**: Complete documentation update and implement multi-tenant foundation
**Blockers**: None - Documentation transformation in progress

#### Current TODO List - Hotel Operations Hub Transformation:

**Phase 1: Documentation Transformation**
- [x] Transform CLAUDE.md into navigation hub
- [ ] Update README.md to Hotel Operations Hub
- [ ] Create ARCHITECTURE.md for multi-tenant design
- [ ] Create MODULES.md for module specifications
- [ ] Create MULTI_TENANT.md for implementation details
- [ ] Create WHITE_LABEL.md for theming system
- [ ] Create I18N.md for internationalization
- [ ] Update specs.md with multi-tenant requirements
- [ ] Update mvp.md to reorganize by modules
- [ ] Update DEVELOPMENT_PLAN.md for new phases

**Phase 2: Multi-Tenant Foundation**
- [ ] Update database schema for organizations/properties
- [ ] Add tenant context to all API endpoints
- [ ] Implement property selector component
- [ ] Add tenant isolation middleware
- [ ] Create super admin portal foundation

**Phase 3: White-Label System**
- [ ] Implement dynamic theming system
- [ ] Create branding configuration schema
- [ ] Build brand studio interface
- [ ] Add CSS variable injection
- [ ] Test custom branding per tenant

**Phase 4: Internationalization**
- [ ] Setup react-i18next
- [ ] Create translation management system
- [ ] Add language selector component
- [ ] Implement locale formatting
- [ ] Prepare AI translation integration

**Phase 5: R2 Storage Migration**
- [ ] Setup Cloudflare R2
- [ ] Update file upload services
- [ ] Migrate from local filesystem
- [ ] Implement CDN delivery
- [ ] Test file operations on Railway

**Phase 6: Module System**
- [ ] Create module registry
- [ ] Implement module permissions
- [ ] Build module marketplace UI
- [ ] Add inter-module communication
- [ ] Test module enable/disable

#### Recently Completed Department Hierarchy:
- [x] Phase 1: Update Prisma schema for department hierarchy
- [x] Phase 1: Create database migration for hierarchy  
- [x] Phase 2: Update DTOs to include parentId field
- [x] Phase 2: Update DepartmentsService with hierarchy logic
- [x] Phase 2: Add new hierarchy endpoints to controller
- [x] Phase 3: Update frontend department service and interface
- [x] Phase 3: Update DepartmentsPage with hierarchy UI
- [x] Phase 3: Update UsersPage to show department hierarchy
- [x] Department dropdown not showing options in Add/Edit User modals
- [x] Manager loading error in Departments page
- [x] Manager dropdown not populating in Add/Edit Department modals

## Development Workflow (Updated: August 17, 2025)

### Branch Strategy

- **main**: Production branch (auto-deploys to Railway)
- **dev**: Development integration branch for testing features together
- **feature/***: Individual feature branches for isolated development

### Local Development Setup

1. **Work on feature branches** created from `dev`
2. **Test locally** with development servers:
   - Backend: `npm run dev:bff` (port 3000)
   - Frontend: `npm run dev:web` (port 5173)
3. **Merge to dev** after thorough local testing
4. **Periodically merge dev to main** for Railway deployment

### Feature Branch Naming Convention

- `feature/profile-photo-upload` - Profile photo upload component
- `feature/id-document-upload` - ID document upload and verification
- `feature/emergency-contacts` - Emergency contacts management
- `feature/verification-queue` - Admin ID verification dashboard
- `feature/user-activity-log` - Audit trail viewing for admins
- `feature/department-stats` - Department analytics dashboard
- `feature/benefits-module` - Commercial benefits directory
- `feature/training-module` - Training sessions and progress tracking

### Testing Strategy

1. **Local Testing**: Develop and test features on local development servers
2. **Integration Testing**: Test feature combinations on `dev` branch locally
3. **Production Testing**: Deploy to Railway from `main` for final validation

### Environment Configuration

#### Local Frontend (.env.local in apps/web/)
```env
VITE_API_URL=http://localhost:3000
```

#### Local Backend (.env.local in apps/bff/)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/staffnbdt_dev
JWT_SECRET=local-dev-secret-change-in-production
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

### Commit Message Conventions

- `feat:` New features and components
- `fix:` Bug fixes and corrections
- `docs:` Documentation updates
- `style:` Code formatting and style changes
- `refactor:` Code refactoring without functionality changes
- `test:` Test additions or modifications
- `chore:` Build process, dependency updates, auxiliary tools

### Development Commands

```bash
# Setup new feature
git checkout dev
git pull origin dev
git checkout -b feature/new-feature-name

# Local development
cd apps/bff && npm run dev    # Start backend
cd apps/web && npm run dev    # Start frontend

# Testing and merging
git add .
git commit -m "feat: implement new feature"
git checkout dev
git merge feature/new-feature-name
git push origin dev

# Production deployment
git checkout main
git merge dev
git push origin main  # Triggers Railway deployment
```

### Quality Checklist

Before merging any feature:
- [ ] Component works in local development
- [ ] All TypeScript errors resolved
- [ ] Console errors cleared
- [ ] Mobile responsive design tested
- [ ] API endpoints function correctly
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Accessibility considerations met

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