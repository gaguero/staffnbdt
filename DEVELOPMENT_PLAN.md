# Nayara Bocas del Toro HR Portal - Development Plan

## Phase 1: Infrastructure Setup (Day 1-2)

### 1.1 GitHub Repository Setup
```bash
# Initialize git repo (already done)
git add .
git commit -m "Initial commit with project specifications"
git branch -M main
git remote add origin https://github.com/[your-username]/staffnbdt.git
git push -u origin main
```

### 1.2 Railway Project Setup
1. **Create Railway Account & Project**
   - Go to railway.app and create new project
   - Name: `nayara-hr-portal`
   - Connect GitHub repository

2. **Configure Railway Services**
   ```yaml
   Services to create:
   - PostgreSQL Database (immediate)
   - Web Service (BFF - after code)
   - Web Service (Frontend - after code)
   - Worker Service (after code)
   - Redis (optional, for caching)
   ```

3. **Database Setup on Railway**
   - Add PostgreSQL service
   - Copy DATABASE_URL from Railway
   - Configure connection pooling (max 20 connections)

### 1.3 Environment Configuration
```env
# .env.railway (for Railway deployment)
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=3000

# .env.local (for local development pointing to Railway DB)
DATABASE_URL=postgresql://[from-railway]
NODE_ENV=development
```

## Phase 2: Monorepo Structure (Day 2-3)

### 2.1 Initialize Turborepo
```bash
npx create-turbo@latest staffnbdt --example with-nestjs
cd staffnbdt
npm install
```

### 2.2 Project Structure
```
staffnbdt/
├── apps/
│   ├── web/                 # React frontend
│   ├── bff/                 # NestJS backend
│   └── worker/              # Background jobs
├── packages/
│   ├── ui/                  # Shared components
│   ├── types/               # TypeScript types
│   ├── config/              # Shared configs
│   └── database/            # Prisma schema
├── turbo.json
├── package.json
└── railway.toml
```

### 2.3 Railway Configuration Files
```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10
```

## Phase 3: Backend Development (Day 3-7)

### 3.1 NestJS BFF Setup
```bash
cd apps/bff
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install @prisma/client prisma
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install class-validator class-transformer
npm install @nestjs/swagger
```

### 3.2 Database Schema (Prisma)
```prisma
// packages/database/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  firstName     String
  lastName      String
  role          Role
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
  position      String?
  hireDate      DateTime?
  phoneNumber   String?
  emergencyContact Json?
  idDocument    String?   // Encrypted
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  
  documents     Document[]
  payslips      Payslip[]
  vacations     Vacation[]
  enrollments   Enrollment[]
  notifications Notification[]
}

enum Role {
  SUPERADMIN
  DEPARTMENT_ADMIN
  STAFF
}

model Department {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  users       User[]
  documents   Document[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Document {
  id           String    @id @default(cuid())
  title        String
  description  String?
  fileUrl      String
  fileSize     Int
  mimeType     String
  scope        DocumentScope
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  userId       String?
  user         User?     @relation(fields: [userId], references: [id])
  uploadedBy   String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?
}

enum DocumentScope {
  GENERAL
  DEPARTMENT
  USER
}

model Payslip {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  period       String    // "2024-01"
  grossSalary  Decimal
  deductions   Json
  netSalary    Decimal
  currency     String    @default("USD")
  pdfUrl       String?
  importBatch  String?   // For tracking CSV imports
  createdAt    DateTime  @default(now())
  viewedAt     DateTime?
  
  @@unique([userId, period])
}

model Vacation {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  type         VacationType
  startDate    DateTime
  endDate      DateTime
  reason       String?
  status       VacationStatus @default(PENDING)
  approvedBy   String?
  approvedAt   DateTime?
  rejectedReason String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum VacationType {
  ANNUAL
  SICK
  PERSONAL
  UNPAID
}

enum VacationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model TrainingSession {
  id           String    @id @default(cuid())
  title        String
  description  String
  version      Int       @default(1)
  isActive     Boolean   @default(true)
  passingScore Int?
  contentBlocks Json     // Array of content blocks
  createdBy    String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  enrollments  Enrollment[]
  
  @@unique([title, version])
}

model Enrollment {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  sessionId     String
  session       TrainingSession @relation(fields: [sessionId], references: [id])
  status        EnrollmentStatus @default(IN_PROGRESS)
  progress      Json      // Track which blocks viewed
  score         Int?
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([userId, sessionId])
}

enum EnrollmentStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
}

model CommercialBenefit {
  id           String    @id @default(cuid())
  partnerName  String
  category     String
  description  String
  discount     String
  imageUrl     String?
  validUntil   DateTime?
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Notification {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  type         String
  title        String
  message      String
  data         Json?
  read         Boolean   @default(false)
  readAt       DateTime?
  createdAt    DateTime  @default(now())
}

model AuditLog {
  id           String    @id @default(cuid())
  userId       String
  action       String
  entity       String
  entityId     String
  oldData      Json?
  newData      Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime  @default(now())
}
```

### 3.3 Core Modules Structure
```typescript
// apps/bff/src/modules/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   └── guards/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── documents/
├── payroll/
├── vacation/
├── training/
└── benefits/
```

## Phase 4: Frontend Development (Day 7-10)

### 4.1 React + Vite Setup
```bash
cd apps/web
npm create vite@latest . --template react-ts
npm install @tanstack/react-query @tanstack/react-router
npm install axios react-hook-form zod @hookform/resolvers
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
npm install @headlessui/react @heroicons/react
npm install date-fns react-hot-toast
```

### 4.2 Frontend Structure
```
apps/web/src/
├── components/
│   ├── layout/
│   ├── common/
│   └── features/
├── pages/
│   ├── auth/
│   ├── dashboard/
│   ├── documents/
│   ├── payroll/
│   ├── vacation/
│   ├── training/
│   └── benefits/
├── services/
│   └── api/
├── hooks/
├── utils/
└── styles/
```

### 4.3 Routing Structure
```typescript
// Mobile-first routes
/                      // Login
/dashboard             // Home dashboard
/profile               // User profile
/documents             // Document library
/payroll               // Payslips
/vacation              // Vacation requests
/training              // Training sessions
/benefits              // Commercial benefits
/admin/*               // Admin routes (conditional)
```

## Phase 5: Core Features Implementation (Day 10-20)

### 5.1 Authentication System
- [ ] Magic link email authentication
- [ ] JWT token management
- [ ] Role-based guards
- [ ] Session management
- [ ] Password reset flow

### 5.2 User Management
- [ ] User CRUD operations
- [ ] Department assignment
- [ ] Role management
- [ ] Profile editing
- [ ] ID document upload

### 5.3 Document Library
- [ ] File upload to S3/R2
- [ ] Pre-signed URLs
- [ ] Document categorization
- [ ] Department scoping
- [ ] Search and filter

### 5.4 Payroll System
- [ ] CSV template generation
- [ ] Bulk import validation
- [ ] Payslip generation
- [ ] PDF export
- [ ] Historical records

### 5.5 Vacation Management
- [ ] Request submission
- [ ] Approval workflow
- [ ] Calendar view
- [ ] Balance tracking
- [ ] Email notifications

### 5.6 Training Sessions
- [ ] Content block editor
- [ ] Session enrollment
- [ ] Progress tracking
- [ ] Quiz/form handling
- [ ] Certificate generation

## Phase 6: Background Worker (Day 20-22)

### 6.1 Worker Setup
```bash
cd apps/worker
npm install @nestjs/bull bull
npm install @aws-sdk/client-s3
npm install puppeteer  # For PDF generation
npm install csv-parse csv-stringify
```

### 6.2 Job Queues
```typescript
// Job types
- PayrollImportJob      // CSV processing
- PayslipGenerationJob  // PDF creation
- TrainingGradingJob    // Quiz evaluation
- NotificationJob       // Email/SMS
- FileProcessingJob     // AV scan, optimization
```

## Phase 7: Storage & CDN (Day 22-23)

### 7.1 S3/R2 Configuration
```typescript
// Storage buckets
- documents/            // General documents
- payslips/            // Encrypted payslips
- training/            // Training materials
- profiles/            // User photos/IDs
- temp/                // Temporary uploads
```

### 7.2 CDN Setup
- Configure Cloudflare for static assets
- Set cache headers
- Configure CORS policies

## Phase 8: Testing & Quality (Day 23-25)

### 8.1 Testing Setup
```bash
npm install --save-dev @nestjs/testing jest
npm install --save-dev @testing-library/react vitest
npm install --save-dev cypress @cypress/react
npm install --save-dev supertest
```

### 8.2 Test Coverage
- Unit tests: 80% coverage
- Integration tests: Critical paths
- E2E tests: User flows
- Performance tests: CSV import, bulk operations

## Phase 9: Monitoring & Security (Day 25-26)

### 9.1 Monitoring Setup
- Railway metrics dashboard
- Sentry error tracking
- Custom health checks
- Performance monitoring

### 9.2 Security Implementation
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration
- Helmet.js

## Phase 10: Deployment & CI/CD (Day 26-27)

### 10.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run typecheck

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: web
```

### 10.2 Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up
```

## Phase 11: Final Polish (Day 27-30)

### 11.1 Performance Optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Database indexing
- [ ] Query optimization

### 11.2 Documentation
- [ ] API documentation (Swagger)
- [ ] User guide
- [ ] Admin guide
- [ ] Deployment guide

### 11.3 Final Checklist
- [ ] All features working
- [ ] Mobile responsive
- [ ] Accessibility compliance
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] SSL certificates
- [ ] Domain configured

## Development Timeline

**Week 1**: Infrastructure, Backend Core, Database
**Week 2**: Frontend, Core Features
**Week 3**: Advanced Features, Worker, Testing
**Week 4**: Polish, Security, Deployment

## Immediate Next Steps

1. Push current code to GitHub
2. Create Railway project
3. Setup PostgreSQL on Railway
4. Initialize monorepo structure
5. Start backend development

## Railway Service Configuration

```yaml
# Railway services setup
services:
  - name: postgres
    type: database
    plan: starter ($5/month)
    
  - name: bff
    type: web
    env:
      PORT: 3000
      NODE_ENV: production
    healthcheck: /health
    
  - name: web
    type: web
    env:
      PORT: 5173
      NODE_ENV: production
    
  - name: worker
    type: worker
    env:
      NODE_ENV: production
    
  - name: redis (optional)
    type: database
    plan: starter
```

## Environment Variables Template

```env
# Auth
AUTH_PROVIDER=magic-link
MAGIC_LINK_SECRET=
JWT_SECRET=
JWT_EXPIRY=7d

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Storage
S3_ENDPOINT=
S3_BUCKET=nayara-hr-documents
S3_REGION=auto
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Email
SENDGRID_API_KEY=
FROM_EMAIL=hr@nayarabocasdeltoro.com

# URLs
FRONTEND_URL=https://hr.nayarabocasdeltoro.com
BACKEND_URL=https://api-hr.nayarabocasdeltoro.com

# Monitoring
SENTRY_DSN=
```