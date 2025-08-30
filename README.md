# Hotel Operations Hub

A comprehensive, **multi-tenant, white-labeled, multi-language ERP platform** designed specifically for hotel operations management. From independent boutique hotels to large international chains, Hotel Operations Hub provides a complete suite of modules for every aspect of hotel operations.

## 🏨 Platform Overview

### Multi-Tenant Architecture
- **Organizations**: Hotel chains and management groups
- **Properties**: Individual hotels and resorts
- **Departments**: Front desk, housekeeping, maintenance, F&B, etc.
- **Users**: Staff, managers, and administrators with role-based access

### White-Label Capabilities
- **Custom Branding**: Logos, colors, fonts, and styling per tenant
- **Custom Domains**: Tenant-specific domain support
- **Branded Experience**: Complete UI customization and brand consistency

### Multi-Language Support
- **Currently Supported**: English, Spanish
- **AI Translation**: Preparation for automated translation expansion
- **Localization**: Currency, date formats, and regional preferences

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite, react-i18next
- **Backend**: NestJS with multi-tenant context, Prisma, PostgreSQL
- **Storage**: Cloudflare R2 with global CDN
- **Infrastructure**: Railway auto-deployment
- **Theming**: Dynamic CSS variables for white-labeling
- **Authentication**: JWT with tenant/property context
- **Authorization**: Advanced RBAC + ABAC permission system with conditional access
- **Caching**: Redis-backed permission evaluation with automatic invalidation

## 🏁 Current Status (August 27, 2025)

### Multi-Tenant Foundation: 100% Complete ✅ PRODUCTION READY

**✅ Fully Implemented & Production Operational:**
- **Database Schema**: Complete multi-tenant structure with organizationId/propertyId on all tables
- **Migration System**: 20240817000000_add_multi_tenant migration successfully deployed
- **Tenant Service**: Organization and Property management with default tenant creation
- **Advanced Permission System**: RBAC + ABAC with tenant-scoped caching and hotel operations integration
- **User Management**: Full tenant isolation in Users API with property-scoped operations
- **TenantInterceptor**: Global automatic tenant isolation across ALL API endpoints
- **TenantContextService**: Systematic service audit with tenant filtering complete
- **Data Security**: Zero cross-tenant data access verified in production
- **Organization/Property APIs**: Complete management endpoints with CRUD operations

**✅ Recent Critical Optimizations (August 27, 2025):**
- **PLATFORM_ADMIN Optimization**: Unrestricted access to all system features
- **Permission Service Enhancement**: Resolved TypeScript errors and source field mapping
- **Hotel Operations Integration**: Complete permission set to eliminate 403 errors
- **System Role API Enhancement**: All system roles properly exposed
- **React Hooks Compliance**: Fixed order violations for stable frontend
- **Frontend Stability**: Bulletproof components preventing filter errors

**🚀 Production Ready Features:**
- Multi-tenant Railway deployment with complete tenant isolation
- JWT authentication with full tenant context (organizationId, propertyId, departmentId)
- All services with automatic tenant filtering via TenantInterceptor
- Advanced permission system with hotel operations coverage
- White-label branding system with Brand Studio interface
- Comprehensive audit logging with tenant scoping

## 🧩 Module Ecosystem

### Core Platform
- 🏢 **Multi-Tenant Management**: Organization and property hierarchy
- 🎨 **White-Label Branding**: Custom theming per tenant
- 🌍 **Multi-Language**: Internationalization with AI translation
- 📊 **Super Admin Portal**: Platform-wide management and analytics

### HR Module (Implemented)
- 👥 User management with multi-level roles and granular permissions
- 📋 Profile management with photo/ID verification  
- 💰 Payroll with CSV import and multi-property support
- 🏖️ Vacation request and approval workflow
- 📚 Training sessions with progress tracking
- 🎁 Commercial benefits directory
- 📄 Document library with scoped access
- 🔐 **Advanced Permission System**: RBAC + ABAC with conditional access control

### Hotel Operations Modules (Planned)
- 🏨 **Front Desk**: Check-in/out, reservations, guest services
- 🧹 **Housekeeping**: Room status, cleaning schedules, inventory
- 🔧 **Maintenance**: Work orders, preventive maintenance, asset tracking
- 📦 **Inventory**: Stock management, purchase orders, suppliers
- 🍽️ **F&B**: Restaurant, bar, room service, event management
- 🛎️ **Concierge**: Guest requests, local recommendations
- 💹 **Revenue Management**: Dynamic pricing, forecasting
- 📈 **Analytics**: Cross-property reporting, KPI dashboards

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Railway CLI (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/[your-username]/hotel-ops-hub.git
cd hotel-ops-hub

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=...

# Multi-Tenant
DEFAULT_ORGANIZATION_ID=...
DEFAULT_PROPERTY_ID=...

# Cloudflare R2 Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

# White-Label
ALLOW_CUSTOM_BRANDING=true

# Internationalization
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es

# See .env.example for full list
```

## Project Structure

```
hotel-ops-hub/
├── apps/
│   ├── web/          # React frontend with multi-tenant UI
│   ├── bff/          # NestJS backend with tenant context
│   └── worker/       # Background jobs processor
├── packages/
│   ├── ui/           # White-label UI components
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Shared configurations
│   └── database/     # Multi-tenant Prisma schema
└── docs/            # Architecture documentation
```

## Development

```bash
# Start development servers
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Deploy to Railway
railway up
```

## Deployment

This project is configured for deployment on Railway with automatic deployments from the main branch.

1. Connect your GitHub repository to Railway
2. Configure environment variables in Railway dashboard
3. Deploy services (postgres, web, bff, worker)

## 📚 Documentation

For detailed, always up-to-date documentation, see the Memory Bank:

- **Project Brief**: [memory-bank/projectbrief.md](./memory-bank/projectbrief.md)
- **Product Context**: [memory-bank/productContext.md](./memory-bank/productContext.md)
- **Active Context**: [memory-bank/activeContext.md](./memory-bank/activeContext.md)
- **System Patterns (Architecture)**: [memory-bank/systemPatterns.md](./memory-bank/systemPatterns.md)
- **Technology Context (Guides/Setup)**: [memory-bank/techContext.md](./memory-bank/techContext.md)
- **UI Design**: [memory-bank/uiDesign.md](./memory-bank/uiDesign.md)
- **Agent Rules**: [CLAUDE.md](./CLAUDE.md)

## 🌟 Key Features

### Multi-Tenant Architecture (Status)
- 100% Complete — Production Ready
- Automatic tenant isolation via `TenantInterceptor` and `TenantContextService`
- Verified zero cross-tenant data access

### For Hotel Chains
- Centralized management across multiple properties with complete data separation
- Standardized operations with property-level customization
- Cross-property reporting with tenant-scoped analytics
- Organization-level module subscriptions and billing
- Unified permission system with tenant-aware access control

### For Independent Hotels  
- Complete operations management with single-property setup
- Affordable pricing with modular approach
- Custom branding per property with inheritance from organization
- Scalable multi-property expansion within same organization
- Flexible role and permission configuration with tenant scoping

### Security & Permissions (Implemented)
- **Advanced Multi-Tenant RBAC + ABAC**: Role-based + Attribute-based access control
- **Tenant-Scoped Permissions**: Automatic filtering by organizationId/propertyId
- **Permission Caching**: Redis-backed with tenant-aware cache invalidation
- **Conditional Access**: Time-based, location-based, and context-aware rules
- **Audit Logging**: Complete audit trail with tenant context
- **Data Isolation**: Guaranteed separation between organizations and properties

## 🔐 Authentication & Authorization

### Multi-Tenant Authentication
- **JWT Token-Based**: Secure authentication with tenant context
- **Magic Link Login**: Passwordless authentication option
- **Tenant Context**: Automatic organization and property scoping
- **Session Management**: Secure session handling with automatic expiration

### Advanced Permission System
- **Hybrid RBAC + ABAC**: Role-based access control enhanced with attribute-based conditions
- **Granular Permissions**: Fine-grained access control using `resource.action.scope` format
- **Conditional Access**: Time-based, location-based, and context-aware permissions
- **Multi-Tenant Scoping**: Automatic tenant isolation for all permission evaluations
- **High-Performance Caching**: Redis-backed permission caching with automatic invalidation
- **Audit Logging**: Complete audit trail for all permission changes
- **Custom Roles**: Tenant-defined roles beyond default system roles

### Permission Examples
- `user.create.department` - Create users within own department
- `payslip.read.own` - View own payslips only
- `vacation.approve.property` - Approve vacation requests property-wide
- `training.assign.organization` - Assign training across organization

### Role Hierarchy
1. **Platform Admin** - Full system access across all tenants
2. **Organization Owner** - Manages entire hotel chain/group
3. **Organization Admin** - Manages organization settings and policies
4. **Property Manager** - Manages individual hotel property
5. **Department Admin** - Manages department within property
6. **Staff** - Self-service access to own resources

### Security Features
- **Tenant Isolation**: Complete data separation between organizations
- **Permission Elevation Protection**: Users cannot grant permissions they don't possess
- **Condition Evaluation**: Server-side only evaluation prevents tampering
- **Cache Security**: Secure cache keys prevent cross-user access
- **Automatic Expiration**: Time-limited permissions and role assignments
- **Audit Trail**: Complete logging of all permission-related activities

## 🚀 Getting Started

### Current Implementation (August 2025)
1. **Automatic Tenant Setup**: TenantService creates default organization and property
2. **User Management**: Create users with automatic tenant inheritance
3. **Department Setup**: Property-scoped departments with tenant isolation
4. **Permission Assignment**: Advanced RBAC + ABAC with tenant context
5. **Data Import**: CSV imports with tenant-scoped validation

### Missing Components (Roadmap)
- Tenant Management UI
- Storage migration to Cloudflare R2

### Security Considerations
- **Current Risk**: Manual tenant filtering in services (incomplete coverage)
- **Mitigation**: Implement global tenant middleware before production
- **Data Safety**: Database schema enforces tenant separation
- **Access Control**: Permission system includes tenant-scoped access

## 🔄 Development Status

### Immediate Priorities (Critical)
1. **Global Tenant Middleware**: Implement automatic tenant isolation across all API endpoints
2. **Service Audit**: Ensure all database operations include tenant filtering
3. **Organization/Property APIs**: Build complete CRUD operations for tenant management
4. **Security Testing**: Verify complete tenant data isolation

### Current Technical Debt
- Manual tenant filtering in services (should be automatic via middleware)
- No Organization/Property management endpoints
- Frontend lacks tenant context integration
- Missing white-label theming implementation

### Production Readiness
- **Database**: ✅ Ready (complete multi-tenant schema)
- **Authentication**: ✅ Ready (JWT with tenant context)
- **Permissions**: ✅ Ready (advanced RBAC + ABAC)
- **API Security**: ❌ **Critical Gap** (missing global tenant middleware)
- **Frontend**: 🔄 Needs tenant context integration

## License

Private - Hotel Operations Hub Platform

## Support

For platform support and onboarding, contact our team.