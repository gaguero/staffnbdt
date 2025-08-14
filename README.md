# Nayara Bocas del Toro - Staff Portal

A comprehensive HR management system for Nayara Bocas del Toro resort, featuring document management, payroll, vacation tracking, training modules, and commercial benefits.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: NestJS, Prisma, PostgreSQL
- **Infrastructure**: Railway, GitHub Actions
- **Storage**: S3-compatible object storage

## Features

- 📱 Mobile-first responsive design
- 🔐 Role-based access control (RBAC)
- 📄 Document library with department scoping
- 💰 Payroll management with CSV import
- 🏖️ Vacation request and approval workflow
- 📚 Training sessions with progress tracking
- 🎁 Commercial benefits directory
- 👤 User profile management

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Railway CLI (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/[your-username]/staffnbdt.git
cd staffnbdt

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
DATABASE_URL=postgresql://...
AUTH_SECRET=...
S3_BUCKET=...
# See .env.example for full list
```

## Project Structure

```
staffnbdt/
├── apps/
│   ├── web/          # React frontend
│   ├── bff/          # NestJS backend
│   └── worker/       # Background jobs
├── packages/
│   ├── ui/           # Shared UI components
│   ├── types/        # TypeScript types
│   ├── config/       # Shared configurations
│   └── database/     # Prisma schema
└── docs/            # Documentation
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

## License

Private - Nayara Bocas del Toro

## Support

For support, contact the development team.