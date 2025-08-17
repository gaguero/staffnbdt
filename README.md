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

## 🧩 Module Ecosystem

### Core Platform
- 🏢 **Multi-Tenant Management**: Organization and property hierarchy
- 🎨 **White-Label Branding**: Custom theming per tenant
- 🌍 **Multi-Language**: Internationalization with AI translation
- 📊 **Super Admin Portal**: Platform-wide management and analytics

### HR Module (Implemented)
- 👥 User management with multi-level roles
- 📋 Profile management with photo/ID verification  
- 💰 Payroll with CSV import and multi-property support
- 🏖️ Vacation request and approval workflow
- 📚 Training sessions with progress tracking
- 🎁 Commercial benefits directory
- 📄 Document library with scoped access

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

For detailed information, see our comprehensive documentation:

- **[CLAUDE.md](./CLAUDE.md)** - Central navigation guide for developers
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Multi-tenant system architecture
- **[MODULES.md](./MODULES.md)** - Available modules and specifications
- **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** - Implementation roadmap
- **[specs.md](./specs.md)** - Complete technical specifications

## 🌟 Key Features

### For Hotel Chains
- Centralized management across multiple properties
- Standardized operations with local customization
- Cross-property reporting and analytics
- Bulk procurement and vendor management

### For Independent Hotels
- Complete operations management in one platform
- Affordable pricing with modular approach
- Custom branding to match hotel identity
- Scalable as business grows

### For All Users
- Mobile-first responsive design
- Multi-language support
- Role-based access control
- Real-time notifications and updates

## 🚀 Getting Started

1. **Choose Your Setup**: Single property or multi-property chain
2. **Configure Branding**: Upload logos, set colors, customize interface
3. **Select Modules**: Enable modules relevant to your operations
4. **Import Data**: Use CSV imports for users, inventory, etc.
5. **Train Staff**: Comprehensive training materials included

## License

Private - Hotel Operations Hub Platform

## Support

For platform support and onboarding, contact our team.