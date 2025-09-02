# CLAUDE.md - Hotel Operations Hub Development Guide

## 📚 Smart Context Loading
**Start lean**: Load specific memory bank files only when the task requires that domain knowledge.

**Available Resources**:
- **@memory-bank/activeContext.md** - Current work focus and decisions
- **@memory-bank/progress.md** - Status and priorities  
- **@memory-bank/projectbrief.md** - Complete project vision
- **@memory-bank/techContext.md** - Technology stack details
- **@memory-bank/systemPatterns.md** - Architectural patterns
- **@memory-bank/uiDesign.md** - UI/UX patterns

## 🏨 Project Context
**Hotel Operations Hub** is a multi-tenant, white-labeled ERP platform for hotel operations.
- **Current Phase**: Permission System Optimization Complete ✅
- **Status**: Production-ready on Railway
- **Next**: Ready for new development phase

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

## 🤖 Specialized Agent Delegation

**CRITICAL**: For ALL code implementation, delegate to specialized agents from `@.claude/agents/`.

### Available Agents by Department:

**🔧 Engineering**:
- backend-architect - APIs, databases, scalable systems
- frontend-developer - React/Vue components, responsive design
- devops-automator - CI/CD, infrastructure, deployment
- rapid-prototyper - MVPs, proof-of-concepts
- ai-engineer - AI/ML features, LLM integration
- mobile-app-builder - Native iOS/Android, React Native
- test-writer-fixer - Testing and test maintenance

**📊 Product**:
- trend-researcher - Market opportunities, viral content analysis
- sprint-prioritizer - 6-day cycles, feature prioritization
- feedback-synthesizer - User feedback analysis

**📈 Marketing**:
- tiktok-strategist - Viral content, TikTok optimization
- app-store-optimizer - ASO, keyword research
- growth-hacker, content-creator, instagram-curator, twitter-engager, reddit-community-builder

**🎨 Design**:
- ui-designer - Interface design, component systems
- ux-researcher - User research, journey mapping
- brand-guardian - Visual identity, brand consistency
- visual-storyteller - Infographics, presentations
- whimsy-injector - Delightful interactions, joy

**🚀 Project Management**:
- studio-producer - Cross-team coordination, resource allocation
- project-shipper - Launch coordination, go-to-market
- experiment-tracker - A/B testing, feature experiments

**🏢 Operations**:
- infrastructure-maintainer - System monitoring, performance
- analytics-reporter - Data analysis, insights
- finance-tracker - Budget management, cost optimization
- legal-compliance-checker - Regulatory compliance
- support-responder - Customer support, documentation

**🧪 Testing**:
- api-tester - API testing, load testing
- performance-benchmarker - Speed testing, optimization
- test-results-analyzer - Test data analysis
- tool-evaluator - Development tool assessment
- workflow-optimizer - Process improvement

**🎁 Special**:
- studio-coach - Multi-agent coordination, motivation
- joker - Humor injection, mood lightening

### Agent Delegation Protocol
When delegating ANY task requiring code implementation:
```markdown
I'm delegating this to [agent-name] because [specific expertise needed].

**System Prompt**: [Load from @.claude/agents/category/agent.md]
**Hotel Operations Context**: Multi-tenant ERP platform with production-ready permission system
**Task**: [Detailed requirements]
**Expected Deliverables**: [Specific outputs]
```

### User Testing Requirement
**EVERY code change requires user confirmation**:
1. Claude pushes to dev branch
2. Claude asks user to test at dev URL
3. User confirms "it's working" or reports issues
4. **ONLY THEN** Claude marks task complete


### Agent Selection
Choose agents based on task type:
- **New Features**: rapid-prototyper → frontend/backend → test-writer-fixer → whimsy-injector
- **Bug Fixes**: backend-architect/frontend-developer → test-writer-fixer
- **UI/UX**: ui-designer → frontend-developer → whimsy-injector
- **Infrastructure**: devops-automator → infrastructure-maintainer
- **Complex Projects**: studio-coach → specialists → project-shipper

## 🎯 Standards
**Code**: TypeScript, 2-space indent, no comments unless requested, proper error handling
**React**: Function components, TypeScript interfaces, react-hook-form + Zod, Tailwind CSS
**Backend**: Multi-tenant context, @RequirePermission decorators, audit logging
**Git**: `type(scope): description`, never commit without user testing

## 🏗️ Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + TanStack Query  
- **Backend**: NestJS + Prisma + PostgreSQL + Advanced Permission System
- **Storage**: Cloudflare R2, **Deployment**: Railway, **Auth**: JWT with tenant context
- **Architecture**: Multi-tenant (Organizations → Properties → Departments → Users)
- **Permissions**: 82 granular permissions, 7 system roles, RBAC + ABAC hybrid

## 🔑 Essential Commands
**Dev**: `npm run install:all`, `npm run dev:bff`, `npm run dev:web`
**DB**: `npm run db:generate`, `npm run db:push`, `npm run db:studio`  
**Test**: `npm run test`, `npm run test:e2e`

## 🔒 Security
- **Multi-Tenant**: TenantInterceptor + TenantContextService auto-filter by tenant
- **Permissions**: `@RequirePermission('user.create.department')` on controllers
- **Frontend**: `<PermissionGate permission="..."><button>Action</button></PermissionGate>`

## 📝 Task Management
**TodoWrite Required**: Use for ALL non-trivial tasks, specify which agent handles each task, mark complete only after user confirmation.

## ⚠️ Critical Rules
**Never Complete Tasks Without**: Context7 research → Push to dev → User testing → User confirmation
**Forbidden**: Claude never writes code directly - always delegate to specialized agents
**Required**: Research → Delegate → Deploy → Test → Confirm

## 🌐 Environment Config
**Core**: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `PORT=3000`
**Multi-Tenant**: `DEFAULT_ORGANIZATION_ID`, `DEFAULT_PROPERTY_ID`, `TENANT_ISOLATION_MODE=strict`  
**R2**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
**Frontend**: `VITE_API_URL=http://localhost:3000`

## 🏨 Hotel Operations Context
**Multi-Tenant Hotel ERP**: Organization → Property → Department hierarchy with complete data isolation.

**Hotel Domains**: Front Desk (guests, reservations, rooms, payments), Housekeeping (room status, cleaning schedules, inventory), Property Management (revenue, analytics, staff, concierge).

**Implementation**: All DB queries include `organizationId`/`propertyId`, all controllers use `@RequirePermission` + `TenantInterceptor`, all frontend uses `<PermissionGate>`.

**White-Label**: Brand Studio theming, CSS variables, custom logos, English/Spanish support
**Performance**: Tenant isolation, Redis caching, WebSocket updates, mobile-first

## 📊 Status
**✅ Production Ready**: Multi-tenant schema, permission system, TenantInterceptor, white-label branding, JWT auth, Organization/Property APIs, HR module
**Next**: R2 migration, multi-language, hotel operations modules

## 🔍 Debug Flow
Issue → Context7 research → Delegate to agent → Deploy to dev → User test → Confirm working

## 🎨 UI Guidelines
**Components**: Brand Studio theming, PermissionGate, real-time validation, loading states, mobile-first
**UX**: Skeleton loaders, toast notifications, breadcrumb navigation, audit logging

---
**Remember**: Start with core memory bank files (activeContext.md, progress.md), then consult specific files only when needed. Always follow testing requirements.