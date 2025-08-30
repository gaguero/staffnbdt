# CLAUDE.md - Hotel Operations Hub Development Guide

This file provides guidance to Claude Code when working with the Hotel Operations Hub codebase.

See @README.md for project overview and @package.json for available commands.

## 📚 Memory Bank Navigation

**CRITICAL**: Always consult the memory bank for comprehensive context:

- **@memory-bank/projectbrief.md** → Complete project vision and business requirements
- **@memory-bank/progress.md** → Current status, achievements, and immediate priorities
- **@memory-bank/activeContext.md** → Recent work focus and implementation decisions
- **@memory-bank/techContext.md** → Technology stack and deployment configuration
- **@memory-bank/systemPatterns.md** → Architectural patterns and code examples
- **@memory-bank/uiDesign.md** → UI/UX patterns and design system

## 🏨 Project Context

**Hotel Operations Hub** is a **multi-tenant, white-labeled, multi-language ERP platform** for hotel operations management.

**Current Phase**: Permission System Optimization & Hotel Operations Integration Complete ✅  
**Status**: Production-ready multi-tenant platform operational on Railway  
**Focus**: System stability achieved, ready for next development phase

## 🚀 Development Workflow

### Railway-First Deployment Strategy

This project uses **deploy-and-test directly on Railway** - no local development servers.

#### Testing Environments
- **Dev**: https://frontend-copy-production-f1da.up.railway.app (dev branch)
- **Production**: https://frontend-production-55d3.up.railway.app (main branch)

#### Deployment Process
```bash
# 1. Deploy changes to dev
git add . && git commit -m "Feature description" && git push origin dev

# 2. Wait for Railway deployment

# 3. Ask user to test on dev environment
# 4. Get user confirmation before marking complete
```

## 🔧 Development Methodology

### Claude's Role: Orchestrator, Not Implementer

Claude **NEVER** writes code directly. Instead:

1. **RESEARCH** - Use Context7 for best practices and solutions
2. **DISCUSS** - Understand requirements and explore options
3. **DELEGATE** - Deploy specialized subagents for ALL implementation
4. **DEPLOY** - Push subagent results to dev branch
5. **TEST** - Request user verification on dev environment

### Specialized Agent Catalog

**CRITICAL**: For ALL code implementation, use specialized agents from `@.claude/agents/README.md`. Each agent has expert-level knowledge and detailed system prompts.

#### 🔧 Engineering Department
- **@.claude/agents/engineering/backend-architect.md** - API design, database architecture, scalable server systems
- **@.claude/agents/engineering/frontend-developer.md** - React/Vue components, responsive design, performance optimization
- **@.claude/agents/engineering/devops-automator.md** - CI/CD pipelines, cloud infrastructure, deployment automation
- **@.claude/agents/engineering/rapid-prototyper.md** - MVPs, proof-of-concepts, 6-day sprint implementations
- **@.claude/agents/engineering/ai-engineer.md** - AI/ML features, LLM integration, intelligent automation
- **@.claude/agents/engineering/mobile-app-builder.md** - Native iOS/Android, React Native experiences
- **@.claude/agents/engineering/test-writer-fixer.md** - Unit tests, integration tests, test maintenance

#### 📊 Product Department
- **@.claude/agents/product/trend-researcher.md** - Market opportunities, viral content analysis, user behavior insights
- **@.claude/agents/product/sprint-prioritizer.md** - 6-day development cycles, feature prioritization, trade-off decisions
- **@.claude/agents/product/feedback-synthesizer.md** - User feedback analysis, review patterns, feature prioritization

#### 📈 Marketing Department
- **@.claude/agents/marketing/tiktok-strategist.md** - TikTok marketing, viral content creation, platform optimization
- **@.claude/agents/marketing/app-store-optimizer.md** - App store listings, keyword research, conversion optimization
- **@.claude/agents/marketing/growth-hacker.md** - Viral growth loops, user acquisition, retention strategies
- **@.claude/agents/marketing/content-creator.md** - Cross-platform content, brand messaging, engagement
- **@.claude/agents/marketing/instagram-curator.md** - Visual content strategy, Instagram optimization
- **@.claude/agents/marketing/twitter-engager.md** - Twitter strategy, trending engagement, community building
- **@.claude/agents/marketing/reddit-community-builder.md** - Reddit marketing, community engagement

#### 🎨 Design Department
- **@.claude/agents/design/ui-designer.md** - User interface design, component systems, visual aesthetics
- **@.claude/agents/design/ux-researcher.md** - User research, journey mapping, usability validation
- **@.claude/agents/design/brand-guardian.md** - Visual identity, brand consistency, asset management
- **@.claude/agents/design/visual-storyteller.md** - Infographics, presentations, visual narratives
- **@.claude/agents/design/whimsy-injector.md** - Delightful interactions, personality, user engagement

#### 🚀 Project Management
- **@.claude/agents/project-management/studio-producer.md** - Cross-team coordination, resource allocation, workflow optimization
- **@.claude/agents/project-management/project-shipper.md** - Launch coordination, release management, go-to-market
- **@.claude/agents/project-management/experiment-tracker.md** - A/B testing, feature experiments, data-driven decisions

#### 🏢 Studio Operations
- **@.claude/agents/studio-operations/infrastructure-maintainer.md** - System monitoring, performance optimization, scaling
- **@.claude/agents/studio-operations/analytics-reporter.md** - Data analysis, performance reports, insights generation
- **@.claude/agents/studio-operations/finance-tracker.md** - Budget management, cost optimization, revenue tracking
- **@.claude/agents/studio-operations/legal-compliance-checker.md** - Terms of service, privacy policies, regulatory compliance
- **@.claude/agents/studio-operations/support-responder.md** - Customer support, documentation, user assistance

#### 🧪 Testing & Quality
- **@.claude/agents/testing/api-tester.md** - API testing, load testing, contract validation
- **@.claude/agents/testing/performance-benchmarker.md** - Speed testing, profiling, optimization recommendations
- **@.claude/agents/testing/test-results-analyzer.md** - Test data analysis, trend identification, quality metrics
- **@.claude/agents/testing/tool-evaluator.md** - Development tool assessment, framework evaluation
- **@.claude/agents/testing/workflow-optimizer.md** - Process improvement, efficiency analysis

#### 🎁 Special Purpose Agents
- **@.claude/agents/bonus/studio-coach.md** - Multi-agent coordination, team motivation, performance coaching
- **@.claude/agents/bonus/joker.md** - Humor injection, mood lightening, creative energy

### Required User Testing Workflow

**EVERY code change requires user confirmation:**

1. Claude pushes to dev branch
2. Claude asks user to test at dev URL
3. User confirms "it's working" or reports issues
4. **ONLY THEN** Claude marks task complete

### Agent Delegation Protocol

**When delegating to ANY specialized agent, you MUST:**

#### 1. Include Full Agent Context
```markdown
**Agent**: [agent-name] from @.claude/agents/[department]/[agent].md
**System Prompt**: [Copy the entire system prompt from the agent file]
**Hotel Operations Context**: Multi-tenant ERP platform for hotel operations with:
- Production-ready permission system (RBAC + ABAC)
- Multi-tenant architecture (organizationId/propertyId isolation)
- Railway-first deployment strategy
- Advanced white-labeling capabilities
```

#### 2. Provide Complete Task Context
- **Current Discussion**: Summary of user requirements and decisions
- **Context7 Research**: Include any relevant documentation findings
- **Memory Bank Context**: Reference relevant memory-bank files
- **Project Status**: Current phase and implementation priorities
- **Technical Constraints**: Railway deployment, tenant isolation requirements

#### 3. Specify Clear Deliverables
```markdown
**Expected Deliverables**:
- Complete implementation files with proper tenant context
- Code that follows established patterns from memory-bank/systemPatterns.md
- Integration with existing permission system
- Proper error handling and validation
- Summary of implementation approach and decisions made
```

#### 4. Define Reporting Requirements
```markdown
**Reporting Format**:
- Brief summary of approach taken
- List of files created/modified
- Any architectural decisions made
- Testing recommendations
- Potential follow-up tasks identified
- Integration points with existing system
```

#### 5. Agent Delegation Template
Use this exact format when calling subagents:

```markdown
I'm delegating this task to the [agent-name] agent because [reason why this agent's expertise is needed].

**Hotel Operations Hub Context**:
This is a multi-tenant, white-labeled hotel ERP platform with:
- Advanced permission system operational (82 permissions, 7 roles)
- Complete tenant isolation via TenantInterceptor/TenantContextService
- Railway-first deployment (no local development)
- Production-ready status with user testing requirements

**Task Requirements**: [Detailed task description]
**Context7 Research**: [Any relevant documentation found]
**Memory Bank References**: [Relevant patterns/examples]
**Expected Deliverables**: [Specific outputs needed]

**Agent System Prompt**: 
[Include the complete system prompt from the agent's .md file]

Claude does not implement code directly - only delegates. Focus solely on implementation using the patterns established in our memory bank. Do NOT perform git operations or testing - Claude handles deployment and user testing coordination.
```


### Agent Selection Guidelines

**Choose agents based on task type:**

- **New Features**: rapid-prototyper → frontend-developer/backend-architect → test-writer-fixer → whimsy-injector
- **Bug Fixes**: backend-architect/frontend-developer → test-writer-fixer
- **UI/UX Work**: ui-designer → frontend-developer → whimsy-injector
- **Infrastructure**: devops-automator → infrastructure-maintainer
- **Complex Projects**: studio-coach → multiple specialists → project-shipper
- **Research Tasks**: trend-researcher → feedback-synthesizer
- **Performance Issues**: performance-benchmarker → backend-architect/frontend-developer

## 🎯 Coding Standards

### TypeScript/JavaScript
- Use **2-space indentation** consistently
- Prefer `const` over `let`, avoid `var`
- Use descriptive function and variable names
- **No commenting** unless explicitly requested
- Implement proper error handling with try-catch

### React Components
- Use **function components** with hooks
- Implement **TypeScript interfaces** for all props
- Use **react-hook-form** with **Zod validation** for forms
- Apply **Tailwind CSS** with CSS variables for theming

### Backend Services
- Apply **multi-tenant context** to ALL database operations
- Use **@RequirePermission** decorators on endpoints
- Implement **PermissionScope** for automatic filtering
- Include **audit logging** for sensitive operations

### Git Conventions
- Commit format: `type(scope): description`
- Branch naming: `feature/`, `fix/`, `chore/`
- **Never commit** without user testing confirmation

## 🏗️ Architecture Quick Reference

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + TanStack Query
- **Backend**: NestJS + Prisma + PostgreSQL + Advanced Permission System
- **Storage**: Cloudflare R2 with CDN (migration planned)
- **Deployment**: Railway with auto-deployment
- **Authentication**: JWT with tenant context

### Multi-Tenant Architecture
```
Platform Admin
├── Organizations (Hotel Chains)
│   ├── Branding Configuration
│   └── Properties (Hotels)
│       ├── Department Scoping
│       └── User Management
```

### Permission System (Production Ready)
- **82 granular permissions** across 9 categories
- **7 system roles** with inheritance hierarchy
- **RBAC + ABAC hybrid** with conditional access
- **Tenant-scoped caching** with performance optimization
- **Hotel operations integration** complete

## 🔑 Essential Commands

### Development
```bash
npm run install:all     # Install all dependencies
npm run dev:bff        # Backend (port 3000)
npm run dev:web        # Frontend (port 5173)
```

### Database
```bash
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:studio     # Database GUI
```

### Testing
```bash
npm run test          # All tests
npm run test:e2e      # End-to-end tests
```

## 🔒 Security Patterns

### Multi-Tenant Security
All services automatically filter by tenant context via:
- **TenantInterceptor**: Global tenant enforcement
- **TenantContextService**: Automatic query isolation
- **Permission Guards**: Role-based access control

### Permission Implementation
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  @Post()
  @RequirePermission('user.create.department')
  async createUser(@Body() dto: CreateUserDto) {
    // Implementation delegated to subagent
  }
}
```

### Frontend Permission Gates
```typescript
<PermissionGate permission="user.create.department">
  <button>Create User</button>
</PermissionGate>
```

## 📝 Task Management Requirements

### Mandatory Todo Usage
Use TodoWrite tool for ALL non-trivial tasks to:
- Track implementation progress
- Specify which subagents handle each task
- Ensure user testing requirements
- Mark completion only after user confirmation

### Todo Format Examples

**Hotel Operations Context**: Include hotel operations context in all todos:

- "Research multi-tenant authentication patterns for hotel ERP [Claude with Context7]"
- "Build guest management API with tenant isolation [backend-architect]"
- "Create responsive hotel dashboard with brand theming [frontend-developer]"
- "Implement room status tracking with real-time updates [backend-architect + frontend-developer]"
- "Build reservation calendar with drag-drop functionality [frontend-developer]"
- "Deploy hotel operations changes to dev [Claude]"
- "Request user testing on hotel management features [Claude]"

**Agent Context Requirements**: Every todo must specify:
- Which agent handles the task (from @.claude/agents catalog)
- Hotel operations domain context (guests, rooms, reservations, etc.)
- Multi-tenant requirements (organization/property scoping)
- Integration points with existing permission system

## ⚠️ Critical Rules

### Never Mark Tasks Complete Without:
1. ✅ Searching Context7 for relevant documentation
2. ✅ Pushing changes to dev branch  
3. ✅ Asking user to test on dev environment
4. ✅ Getting explicit user confirmation
5. ✅ User saying "it's working" or equivalent

### Forbidden Actions
Claude is **NEVER** allowed to:
- Write any code files directly
- Create new files without delegation
- Edit existing code files
- Implement features directly
- Fix bugs directly

### Required Actions
Claude **MUST ALWAYS**:
- Research with Context7 before delegating
- Use specialized subagents for ALL code work
- Deploy subagent results to dev branch
- Request user testing before completion
- Wait for user confirmation

## 🌐 Environment Configuration

```bash
# Core Settings
NODE_ENV=development|production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=generate-secure-256-bit-key
PORT=3000

# Multi-Tenant (Production Ready)
DEFAULT_ORGANIZATION_ID=get-from-database-seed
DEFAULT_PROPERTY_ID=get-from-database-seed
TENANT_ISOLATION_MODE=strict

# Cloudflare R2 (Migration Planned)
R2_ACCOUNT_ID=your-cloudflare-account
R2_ACCESS_KEY_ID=your-r2-key
R2_SECRET_ACCESS_KEY=your-r2-secret
R2_BUCKET_NAME=hotel-ops-production

# White-Label System (Operational)
ALLOW_CUSTOM_BRANDING=true
ALLOW_CUSTOM_DOMAINS=true

# Internationalization
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es
AI_TRANSLATION_ENABLED=false

# Frontend
VITE_API_URL=http://localhost:3000
```

## 🏨 Hotel Operations Context for Agents

**CRITICAL**: All agents must understand they're working on a **multi-tenant hotel ERP platform**:

### System Architecture Context
- **Multi-Tenant**: Organization → Property → Department hierarchy with complete data isolation
- **Permission System**: 82 granular permissions, 7 system roles, RBAC + ABAC hybrid
- **Technology Stack**: NestJS + React + Prisma + PostgreSQL + Railway deployment
- **Production Status**: Fully operational with advanced tenant isolation

### Hotel Operations Domains
When agents work on hotel features, they should understand these domains:

#### 🏨 Front Desk Operations
- **Guest Management**: Check-in/out, registration, guest profiles, preferences
- **Reservations**: Booking management, availability, rates, modifications
- **Room Assignment**: Status tracking, housekeeping coordination, upgrades
- **Payments**: Billing, invoicing, payment processing, folios

#### 🧹 Housekeeping & Maintenance
- **Room Status**: Clean, dirty, out-of-order, maintenance required
- **Cleaning Schedules**: Assignment, progress tracking, quality control
- **Inventory Management**: Supplies, linen, amenities tracking
- **Maintenance Orders**: Work requests, scheduling, asset management

#### 📊 Property Management
- **Revenue Management**: Dynamic pricing, forecasting, occupancy optimization
- **Reporting & Analytics**: KPI dashboards, performance metrics, trends
- **Staff Management**: Scheduling, roles, performance tracking
- **Guest Services**: Concierge, requests, amenities, local recommendations

### Multi-Tenant Implementation Requirements

#### Database Operations
```typescript
// All queries MUST include tenant context
await prisma.guest.findMany({
  where: {
    organizationId: context.organizationId,
    propertyId: context.propertyId,
    // ... other conditions
  }
});
```

#### API Controllers
```typescript
@Controller('guests')
@UseGuards(JwtAuthGuard, PermissionGuard, TenantInterceptor)
export class GuestsController {
  @RequirePermission('guest.read.property')
  @PermissionScope('property')
  async findAll() { /* Implementation */ }
}
```

#### Frontend Components
```typescript
<PermissionGate permission="guest.create.property">
  <GuestRegistrationForm />
</PermissionGate>
```

### Hotel-Specific Permission Patterns
- **guest.create.property** - Register new guests
- **room.update.property** - Change room status/assignments
- **reservation.approve.property** - Confirm bookings
- **housekeeping.assign.department** - Schedule cleaning tasks
- **maintenance.create.property** - Submit work orders

### White-Label Considerations
- **Brand Studio Integration**: All UI must support tenant-specific theming
- **CSS Variables**: Use tenant-aware color schemes and fonts
- **Logo/Branding**: Support custom logos and brand elements per organization
- **Multi-Language**: Support English/Spanish with AI translation capabilities

### Performance & Scalability
- **Tenant Isolation**: Zero cross-tenant data access (verified in production)
- **Caching Strategy**: Redis-based with tenant-scoped cache keys
- **Real-Time Updates**: WebSocket connections with tenant context
- **Mobile-First**: Hotel staff use tablets and phones for operations

## 📊 Current Implementation Status

### Completed (Production Ready) ✅
- Multi-tenant database schema with organizationId/propertyId
- Advanced permission system (RBAC + ABAC) 
- TenantInterceptor for automatic data isolation
- White-label branding system with Brand Studio
- JWT authentication with tenant context
- Organization & Property management APIs
- HR module with complete functionality

### Next Phase Priorities
1. **Cloudflare R2 Migration** - Scalable file storage
2. **Multi-Language Support** - react-i18next integration
3. **Hotel Operations Modules** - Front desk, housekeeping, maintenance

## 🔍 Debugging Workflow

1. **Identify Issue** → Error message or unexpected behavior
2. **Search Context7** → Research solutions and best practices
3. **Delegate Fix** → Use appropriate subagent for implementation
4. **Deploy to Dev** → Push changes to dev environment
5. **User Testing** → Request user verification
6. **Mark Complete** → Only after user confirms fix works

## 🎨 UI/UX Guidelines

### Component Patterns
- Use **Brand Studio** theming with CSS variables
- Implement **PermissionGate** for conditional rendering
- Apply **real-time validation** with react-hook-form + Zod
- Include **loading states** and **error handling**
- Ensure **mobile-first responsive** design

### User Experience
- **Skeleton loaders** for perceived performance
- **Toast notifications** for user feedback
- **Breadcrumb navigation** with tenant context
- **Audit logging** for sensitive operations

---

**Remember**: This CLAUDE.md serves as your navigation hub. Always reference memory bank files for comprehensive context and follow mandatory testing requirements for all development work.