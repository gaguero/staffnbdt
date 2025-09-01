# Hotel Operations Hub - Project Brief

## Vision
Transform from single-tenant "Nayara HR Portal" to **Hotel Operations Hub**: a comprehensive, multi-tenant, white-labeled ERP platform specifically designed for hotel operations management, supporting everything from independent boutique hotels to large international hotel chains.

## Core Mission
Provide a complete suite of operational modules that enable hotels to manage every aspect of their business through a single, integrated platform with complete tenant isolation, custom branding, and multi-language support.

## Target Market

### Primary Markets
- **Independent Hotels**: Complete operations management with custom branding
- **Hotel Chains**: Centralized management across multiple properties
- **Hotel Management Groups**: Multi-client property management
- **Boutique Resorts**: Personalized, branded experience

### Market Segments
- Single property (5-50 rooms) → Independent operators
- Small chains (2-10 properties) → Regional brands
- Large chains (10+ properties) → International operators
- Management companies → Multi-brand operators

## Core Requirements

### 1. Multi-Tenant Architecture
- **Complete tenant isolation** at organization and property levels
- **Hierarchical structure**: Platform → Organization → Property → Department → User
- **Module subscriptions** managed at organization level
- **Cross-property operations** for hotel chains
- **Tenant-aware APIs** with context validation

### 2. White-Label Branding
- **Dynamic theming** with CSS variables injection
- **Custom logos, colors, fonts** per tenant
- **Custom domain support** for branded access
- **Brand studio interface** for real-time customization
- **Tenant-branded communications** (emails, PDFs)

### 3. Multi-Language Support
- **Primary languages**: English, Spanish
- **AI translation fallback** for missing translations
- **Tenant-specific overrides** for custom terminology
- **Locale formatting** (currency, dates, numbers)
- **Extensible system** for additional languages

### 4. Modular System
- **Module marketplace** with enable/disable per property
- **Independent module operation** with seamless integration
- **Inter-module communication** via events and APIs
- **Pricing tiers** based on enabled modules
- **Custom module development** capabilities

## Key Differentiators

### Technical Excellence
- **Zero-downtime deployments** on Railway platform
- **Global CDN distribution** via Cloudflare R2
- **Tenant-scoped file organization** for security and performance
- **Real-time multi-language switching**
- **Mobile-first responsive design**
- **Audit logging and compliance**

### Business Value
- **Reduced operational costs** through consolidated platform
- **Improved guest experience** via integrated operations
- **Data-driven insights** across all hotel operations
- **Scalable growth path** from single property to chain
- **Custom branding** maintains hotel identity

## Module Portfolio

### Core Platform (Included)
- Multi-tenant management
- White-label branding
- Multi-language support
- User authentication/authorization
- Document management

### HR Module (Implemented)
- User/profile management with ID verification
- Payroll with CSV import and PDF generation
- Vacation request/approval workflows
- Training with certificates and progress tracking
- Employee benefits directory
- Audit logging and compliance

### Hotel Operations Modules (Planned)
- **Front Desk**: Check-in/out, reservations, guest services
- **Housekeeping**: Room status, cleaning schedules, inventory
- **Maintenance**: Work orders, preventive maintenance, assets
- **Inventory**: Stock management, purchasing, suppliers
- **F&B**: Restaurant, bar, room service management
- **Concierge**: Guest requests, local recommendations
- **Revenue Management**: Dynamic pricing, forecasting
- **Business Intelligence**: Cross-property analytics

## Technical Foundation

### Architecture Principles
- **Shared database with tenant isolation** (organization_id, property_id)
- **API-first design** with comprehensive OpenAPI documentation
- **Event-driven architecture** for module communication
- **Microservices-ready monolith** for future scaling
- **Security by design** with encryption and audit trails

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: NestJS + Prisma + PostgreSQL
- **Storage**: Cloudflare R2 with global CDN
- **Deployment**: Railway with auto-scaling
- **Languages**: react-i18next with AI translation
- **Authentication**: JWT with tenant context

## Success Metrics

### Technical Metrics
- **99.9% uptime** across all tenant operations
- **<2s page load times** globally via CDN
- **Complete tenant isolation** with zero data leakage
- **Real-time language switching** under 100ms
- **Mobile-responsive** across all device types

### Business Metrics
- **Single platform consolidation** reducing IT costs 40%+
- **Improved operational efficiency** via integrated workflows
- **Enhanced guest experience** through seamless operations
- **Scalable growth** from single property to international chain
- **Custom branding** maintaining hotel identity and values

## Project Constraints

### Technical Constraints
- **Railway deployment platform** for all services
- **PostgreSQL database** with shared multi-tenant schema
- **Cloudflare R2 storage** for global performance
- **English/Spanish languages** initially (expandable)
- **Web-based platform** (mobile app future consideration)

### Business Constraints
- **Hotel industry focus** with deep operational understanding
- **Multi-tenant SaaS model** with subscription pricing
- **White-label requirements** for brand preservation
- **Compliance requirements** for hospitality industry
- **International deployment** with local data residency

## Implementation Approach

### Phase 1: Multi-Tenant Foundation (Completed)
- ✅ Architecture design and documentation
- ✅ Multi-tenant database schema design (All tables have organizationId/propertyId)
- ✅ White-labeling system architecture
- ✅ Internationalization framework
- ✅ Module system design

### Phase 2: Core Platform Implementation (Completed)
- ✅ Multi-tenant middleware and APIs (TenantInterceptor & TenantContextService)
- ✅ Dynamic branding system (Brand Studio and theme injection)
- ✅ Translation management with AI
- ✅ Module subscription system
- ✅ Super admin portal

### Phase 3: White-Label & Internationalization (Completed)
- ✅ Branding service with CSS variable injection
- ✅ Brand studio interface for customization
- ✅ Logo and asset management system
- ✅ Translation service with tenant overrides and AI fallback

### Phase 4: Hotel Operations Modules (Planned)
- 📋 Front desk operations
- 📋 Housekeeping management
- 📋 Maintenance and inventory
- 📋 F&B operations
- 📋 Analytics and reporting

### Phase 5: Business Intelligence & Integrations (Future)
- 📋 Cross-module analytics dashboard
- 📋 PMS integration capabilities
- 📋 Channel manager connections
- 📋 Revenue management tools

This project brief serves as the foundational document that guides all development decisions, architectural choices, and business priorities for Hotel Operations Hub.

## New Modules (v1): Concierge + Vendors

- Concierge: Orchestrate guest experiences end-to-end via configurable Concierge Objects (EAV attributes), Playbooks (SLA/dependency automation via workers), and ops-first views (Reservation 360, Guest Timeline, Today Board).
- Vendors: Partner directory, policies, vendor links and confirmations, multi-channel notifications, and a magic-link portal (scoped PII).
- Multi-tenant: All data tenant-scoped by `organizationId` and `propertyId`. File storage via R2 with tenant paths `/org-id/property-id/...`.

### Module Enablement & Billing Direction
- Extend `ModuleSubscription` to support `propertyId` (optional) to enable:
  - Org-level enablement (single subscription record with `propertyId = NULL`).
  - Property-level overrides (additional records per property).
- Precedence: property-level overrides org-level for effective enablement.
- Future billing: org pays for all, property pays for itself, or hybrid—enabled by property-scoped subscriptions.

### Decisions
- Attributes: EAV pattern for Concierge object fields (typed columns + indexes).
- Playbooks/SLAs: worker-driven processors and timers.
- Vendor Portal: magic-link token (hashed, expiry), scoped PII rendering.
