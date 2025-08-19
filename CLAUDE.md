# CLAUDE.md - Hotel Operations Hub Navigation Guide

This file provides guidance to Claude Code (claude.ai/code) when working with the Hotel Operations Hub codebase.

## 📚 Memory Bank Navigation Index

**CRITICAL**: Always consult the memory bank for comprehensive context. The memory bank contains the complete system knowledge organized into focused files:

### Memory Bank Quick Reference
- **[projectbrief.md](memory-bank/projectbrief.md)** → Complete project vision, requirements, and business context
- **[progress.md](memory-bank/progress.md)** → Current status, what's working, known issues, immediate next steps
- **[activeContext.md](memory-bank/activeContext.md)** → Current work focus, recent decisions, implementation priorities
- **[techContext.md](memory-bank/techContext.md)** → Complete technology stack, infrastructure, and deployment details
- **[systemPatterns.md](memory-bank/systemPatterns.md)** → Architectural patterns, code examples, best practices
- **[productContext.md](memory-bank/productContext.md)** → Market context, user problems, business case

### Documentation Suite (Detailed Specifications)
- **README.md** → Project overview, quick start, tech stack, deployment info
- **ARCHITECTURE.md** → Multi-tenant system design, data models, API architecture
- **specs.md** → Complete technical specifications, detailed requirements
- **MODULES.md** → All available modules (HR, Inventory, Maintenance, Front Desk, etc.)
- **mvp.md** → MVP features organized by modules, implementation priorities
- **MULTI_TENANT.md** → Multi-tenancy implementation, tenant isolation, hierarchy
- **WHITE_LABEL.md** → White-labeling system, theming, branding customization
- **I18N.md** → Internationalization setup, translation management, AI integration
- **PERMISSION_SYSTEM.md** → Advanced RBAC + ABAC permission system documentation
- **DEVELOPMENT_PLAN.md** → Implementation phases, current status, roadmap
- **RAILWAY_DEPLOYMENT.md** → Railway-specific deployment configuration
- **ui.md** → Design system, component guidelines, responsive design
- **LOGIN_CREDENTIALS.md** → Test accounts and authentication details

## 🏨 Project Quick Context

**Hotel Operations Hub** is a comprehensive, **multi-tenant, white-labeled, multi-language ERP platform** for hotel operations management.

**Current Phase**: Multi-tenant foundation implementation (60% complete)
**Focus**: Transforming from single-tenant HR portal to multi-tenant hotel ERP
**Status**: See [progress.md](memory-bank/progress.md) for detailed status

## Railway-First Development Workflow

### NO LOCAL DEVELOPMENT - WE TEST ON RAILWAY

This project uses a **deploy-and-test approach directly on Railway**. We do NOT run local development servers.

#### Railway Service URLs:
- **Frontend**: https://frontend-production-55d3.up.railway.app
- **Backend API**: Automatically configured via Railway internal networking

#### Testing Process:
```bash
# 1. Push changes to trigger deployment
git add . && git commit -m "Feature/fix description" && git push

# 2. Wait for Railway deployment

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
1. **Navigate with Playwright/Puppeteer**: Open the application in automated browser
2. **Check console for errors**: Monitor browser console for any JavaScript errors
3. **Take screenshots**: Capture visual proof of working features
4. **Test user flows**: Automate clicking, form filling, navigation
5. **Verify API responses**: Check network tab for successful API calls
6. **Test responsive design**: Check mobile and desktop views

#### Railway Deployment Structure:
- **Dev Environment**: `https://frontend-production-55d3.up.railway.app` (dev branch)
- **Production Environment**: `https://backend-copy-production-328d.up.railway.app` (main branch)

#### Example Testing Commands:
```javascript
// Test on Dev Environment (dev branch)
playwright.navigate("https://frontend-production-55d3.up.railway.app")
playwright.screenshot("dev-homepage-loaded.png")
playwright.checkConsole() // Should return no errors
playwright.click("button[data-testid='login']")
playwright.fill("input[name='email']", "test@example.com")
playwright.screenshot("dev-login-form-filled.png")

// Test on Production Environment (main branch)
puppeteer.goto("https://backend-copy-production-328d.up.railway.app")
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

## Architecture Quick Reference

### System Design
- **Frontend**: React SPA with TypeScript, Vite, Tailwind CSS, TanStack Query
- **Backend**: NestJS BFF with Passport JWT and advanced permission system
- **Worker**: Bull queue processor with Redis for background jobs
- **Database**: PostgreSQL with Prisma ORM (multi-tenant schema)
- **Storage**: Cloudflare R2 (NOT local filesystem) with CDN
- **Deployment**: Railway services with auto-deployment

### Multi-Level Role Hierarchy
1. **Platform Admin**: Manages entire platform, all tenants
2. **Organization Owner**: Manages hotel chain/group
3. **Organization Admin**: Manages organization settings  
4. **Property Manager**: Manages individual hotel property
5. **Department Admin**: Manages department within property
6. **Staff**: Self-service access to own resources

## Development Commands

### Essential Commands
```bash
# Setup
npm run install:all
npm run db:generate
npm run db:push

# Development (Railway deployment preferred)
npm run dev:bff    # Backend (port 3000)
npm run dev:web    # Frontend (port 5173)

# Database
npm run db:studio  # Prisma Studio GUI
npm run db:migrate # Create migration

# Testing
npm run test       # All tests
npm run test:e2e   # End-to-end tests
```

## Advanced Permission System Integration

The system includes a powerful RBAC + ABAC permission system. Key implementation patterns:

### Controller with Permission Protection
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  
  @Post()
  @RequirePermission('user.create.department')
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Only users with user.create.department permission can access
  }

  @Get()
  @RequirePermission(['user.read.department', 'user.read.property'])
  @PermissionScope('department') // Automatic filtering by department
  async getUsers(@Request() req) {
    const filters = getPermissionFilters(req);
    return this.usersService.findAll(filters);
  }
}
```

### Frontend Permission Integration
```typescript
// Permission-based UI rendering
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGate } from '../components/PermissionGate';

export function UserManagementPage() {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      <h1>User Management</h1>
      
      <PermissionGate permission="user.create.department">
        <button>Create User</button>
      </PermissionGate>
      
      {hasPermission('user.read.department') && (
        <UserList showDepartmentUsers={true} />
      )}
    </div>
  );
}
```

### Permission System Files
- **Core Service**: `apps/bff/src/modules/permissions/permission.service.ts`
- **Guards**: `apps/bff/src/modules/permissions/guards/permission.guard.ts`
- **Decorators**: `apps/bff/src/shared/decorators/require-permission.decorator.ts`
- **Frontend Integration**: `apps/web/src/hooks/usePermissions.ts`

## Common Development Tasks

### Adding a New API Module
1. Generate module: `cd apps/bff && nest g module modules/[name]`
2. Generate service: `nest g service modules/[name]`
3. Generate controller: `nest g controller modules/[name]`
4. Create DTOs with class-validator decorators
5. Add to app.module.ts imports
6. Implement repository pattern with Prisma
7. **Add Permission Protection**: Use `@UseGuards(JwtAuthGuard, PermissionGuard)`
8. **Define Endpoint Permissions**: Add `@RequirePermission('resource.action.scope')`
9. **Implement Scope Filtering**: Use `@PermissionScope` for automatic tenant/department filtering
10. **Seed Module Permissions**: Add module permissions to permission seed script

### Implementing Permission-Based Operations
1. Add `@UseGuards(JwtAuthGuard, PermissionGuard)` to controller
2. Use `@RequirePermission('resource.action.scope')` decorator for endpoints
3. Apply automatic scope filtering with `@PermissionScope('department|property|organization')`
4. Use conditional permissions for complex business logic with `@ConditionalPermission`
5. Implement owner-based access with `@OwnerOrPermission`
6. Add audit log entry for sensitive operations

## Development Methodology - Using Subagents

### IMPORTANT: Always Use Specialized Subagents

This project uses specialized engineering subagents. You MUST use these agents for complex tasks to ensure high-quality, efficient development.

### Available Subagents
1. **backend-architect**: API design, database architecture, server-side logic
2. **frontend-developer**: React components, UI/UX implementation, responsive design
3. **test-writer-fixer**: Writing new tests, fixing failing tests, maintaining test coverage
4. **devops-automator**: CI/CD setup, Docker configuration, deployment automation
5. **rapid-prototyper**: Quick MVPs, proof-of-concepts, initial implementations

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

### Integration with Todo List

When using TodoWrite, specify which subagent to use in brackets:
- "Build user management module [backend-architect]"
- "Create responsive navigation [frontend-developer]"
- "Fix failing tests [test-writer-fixer]"
- "Setup Railway deployment [devops-automator]"

## Testing Strategy

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

#### Required Test Evidence

Before marking ANY task complete, you MUST have:
1. **Screenshots** showing the working feature
2. **Console logs** proving no errors
3. **Network logs** showing successful API calls
4. **Mobile/Desktop views** confirming responsive design
5. **User flow automation** demonstrating the complete feature

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

## Environment Variables

```bash
# Common
NODE_ENV=development|production
DATABASE_URL=postgresql://...

# BFF specific
JWT_SECRET=
JWT_EXPIRES_IN=7d
PORT=3000

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

# Worker specific
REDIS_URL=redis://...

# Frontend specific
VITE_API_URL=http://localhost:3000
```

## Current Implementation Focus

For current status, priorities, and next steps, always consult:
- **[progress.md](memory-bank/progress.md)** - Complete current status and what needs to be done
- **[activeContext.md](memory-bank/activeContext.md)** - Current work focus and immediate actions

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

---

**Remember**: This CLAUDE.md serves as your navigation hub. Always reference the memory bank files for comprehensive context, and follow the mandatory testing and documentation research requirements for all development work.