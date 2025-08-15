# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Nayara Bocas del Toro HR Portal - a mobile-first staff management system with role-based access control, document management, payroll, vacation tracking, training modules, and commercial benefits directory. This is a Turborepo monorepo with three main applications currently being implemented.

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
- **Notifications**: In-app notification system
- **Audit Logging**: Complete audit trail for sensitive operations

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

# S3 Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET=

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