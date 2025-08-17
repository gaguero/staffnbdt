## Hotel Operations Hub - Module-Based MVP

### Multi-Tenant Foundation - CORE PLATFORM

The foundational multi-tenant architecture supporting hotel chains, independent properties, and management groups with complete tenant isolation and white-label branding.

#### Tech Involved

* Multi-tenant NestJS BFF with tenant context middleware
* PostgreSQL with tenant isolation (organization_id, property_id columns)
* JWT authentication with tenant claims
* Dynamic CSS variables for white-labeling
* react-i18next for internationalization
* Cloudflare R2 for tenant-scoped file storage

#### Main Requirements

* **Tenant Hierarchy**: Platform → Organization → Property → Department → User
* **Complete Isolation**: No cross-tenant data access at any level
* **Module Subscriptions**: Organizations enable modules for their properties
* **White-Label Branding**: Custom logos, colors, fonts, domains per tenant
* **Multi-Language**: English/Spanish with AI translation fallback
* **Tenant-Aware APIs**: All endpoints scoped to tenant context

---

### HR Module - Human Resources Management

Comprehensive human resources module with multi-tenant user management, profile system, payroll, vacation tracking, training, and employee benefits.

#### Module Components

**User Management & Profile System - PRIORITY 1**
Complete employee lifecycle management with role-based access control and department scoping.

#### Tech Involved

* Multi-tenant user model with organization/property/department scoping
* Role hierarchy: Platform Admin → Org Owner → Property Manager → Dept Admin → Staff
* Encrypted ID document storage with admin verification workflow
* Profile photo management with cropping and compression
* Emergency contact management (structured JSON, up to 3 contacts)
* Email invitation system with tenant-branded templates
* CSV bulk import with validation and error reporting
* Comprehensive audit logging for all HR operations

#### Main Requirements

* **Multi-Tenant User Management**: Users scoped to organization and property
* **Role-Based Access**: Five-tier role system with proper inheritance
* **Profile Information**: Complete employee profiles with photos and documents
* **Department Scoping**: Admins manage users only within their department/property
* **Secure Document Handling**: ID verification workflow with encryption
* **Bulk Operations**: CSV import/export with validation and progress tracking
* **Audit Trail**: Complete logging of all user management operations

**Payroll Management - PRIORITY 2**
Multi-tenant payroll system with CSV import, PDF generation, and property consolidation.

#### Tech Involved

* Multi-tenant payslips with organization/property scoping
* CSV ingestion worker with tenant-aware validation
* PDF generator for payslips with tenant branding
* Multi-property payroll consolidation for chains
* Tenant-scoped batch processing and error reporting

#### Main Requirements

* **Tenant-Scoped Payroll**: Payslips isolated by organization and property
* **CSV Import**: Bulk payroll import with tenant-specific validation
* **Multi-Property Support**: Consolidate payroll across hotel chain properties
* **Branded Payslips**: PDF generation using tenant branding configuration
* **Audit Trail**: Complete tracking of payroll operations per tenant

**Vacation Management - PRIORITY 3**
Multi-tenant leave request system with property-scoped approval workflows.

#### Tech Involved

* Tenant-aware vacation request state machine
* Property-scoped approval workflows and blackout policies
* Tenant-branded notification templates
* Multi-property vacation balance tracking

#### Main Requirements

* **Property-Scoped Approvals**: Managers approve leave within their property
* **Tenant Policies**: Custom vacation policies per organization/property
* **Cross-Property Tracking**: Vacation balances for chain employees
* **Branded Notifications**: Email/SMS using tenant branding

**Document Library - PRIORITY 4**
Multi-tenant document management with property and department scoping.

#### Tech Involved

* Tenant-organized R2 storage structure (/org-id/property-id/)
* Multi-level document scoping (organization, property, department, user)
* Tenant-aware virus scanning and processing
* Property-scoped document linking and access control

#### Main Requirements

* **Tenant Document Isolation**: Complete separation of documents by tenant
* **Multi-Level Scoping**: Organization → Property → Department → User access
* **Cross-Property Sharing**: Chain-level documents accessible to all properties
* **Secure Access**: Pre-signed URLs with tenant validation

---

### Profile & User Management (Complete System) - PRIORITY 1

Comprehensive profile management with user lifecycle, role-based access control, and department-scoped administration. Includes photo/ID uploads, emergency contacts, and full user creation/management capabilities.

#### Tech Involved

* Postgres User model with enhanced fields (profilePhoto, emergencyContact JSON)
* Role-based access control (Staff, Department Admin, Superadmin)
* Object storage (S3/R2) for photos and ID documents with pre-signed URLs
* KMS-managed encryption for ID documents; 5-minute signed URL expiry
* Email invitation system with 7-day expiry tokens
* CSV bulk import with validation pipeline
* Comprehensive audit logging for all operations

#### Main Requirements

* **User Lifecycle**: Creation, invitation, onboarding, role changes, deactivation
* **Profile Information**: firstName, lastName, phone, position, department, hireDate
* **Emergency Contacts**: Structured JSON with name, relationship, phone (up to 3)
* **Photo Upload**: 5MB limit, image formats (JPG, PNG), preview and crop
* **ID Document**: 10MB limit, encrypted storage, admin verification workflow
* **Role Management**: Three-tier hierarchy with department scoping
* **Department Scoping**: Admins can only manage users in their department
* **Bulk Operations**: CSV import/export with validation and error reporting
* **Access Control**: Granular permissions based on role and department
* **Security**: PII encryption, audit trail, session management

#### User Management Features

* **User Creation (Admin)**:
  - Multi-step wizard (Basic Info → Role & Dept → Permissions)
  - Department-scoped creation (enforced at API level)
  - Automatic invitation email with setup link
  - Optional temporary password with forced reset
  - Add to onboarding training automatically

* **Role System**:
  - **Staff**: Basic user, own profile access only
  - **Department Admin**: Manage department users, verify IDs
  - **Superadmin**: Full system access, cross-department management
  - Role changes require approval and audit logging
  - Prevent orphaned departments (last admin check)

* **Invitation & Onboarding**:
  - Email invitations with 7-day expiry
  - First-login profile completion required
  - Password setup with security questions
  - Emergency contact mandatory on setup
  - Welcome packet and training assignment

* **Bulk Import**:
  - CSV template download
  - Validation with row-level error reporting
  - Partial import capability (skip errors)
  - Progress tracking and rollback option
  - Email notifications for imported users

#### Implementation Details

* **API Endpoints - Profile**:
  - GET /api/profile - Current user's complete profile
  - PUT /api/profile - Update profile information
  - POST /api/profile/photo - Upload profile photo
  - DELETE /api/profile/photo - Remove photo
  - POST /api/profile/id - Upload ID document
  - GET /api/profile/id - Get signed URL (admin only)
  - POST /api/profile/id/verify - Verify ID (admin)
  - POST /api/profile/emergency-contacts - Manage contacts

* **API Endpoints - User Management**:
  - GET /api/users - List users (department-scoped)
  - POST /api/users - Create new user
  - GET /api/users/:id - Get user details
  - PUT /api/users/:id - Update user information
  - DELETE /api/users/:id - Delete user (superadmin only)
  - PUT /api/users/:id/role - Change user role
  - POST /api/users/:id/deactivate - Deactivate user
  - POST /api/users/:id/reactivate - Reactivate user

* **API Endpoints - Bulk & Admin**:
  - POST /api/users/bulk - Bulk import via CSV
  - GET /api/users/bulk/template - Download CSV template
  - POST /api/users/bulk/validate - Validate CSV without import
  - GET /api/users/export - Export users to CSV
  - POST /api/users/:id/invite - Send/resend invitation
  - GET /api/admin/verifications - ID verification queue
  - GET /api/admin/stats - Department user statistics

* **Frontend Components - User Side**:
  - ProfileView.tsx - Complete profile display
  - ProfileEdit.tsx - Multi-tab edit interface
  - ProfilePhotoUpload.tsx - Upload with crop tool
  - IDDocumentUpload.tsx - Secure document upload
  - EmergencyContactForm.tsx - Contact management
  - OnboardingWizard.tsx - First-login setup

* **Frontend Components - Admin Side**:
  - UserManagementDashboard.tsx - Main admin interface
  - CreateUserWizard.tsx - 3-step user creation
  - UserTable.tsx - Sortable/filterable user list
  - RoleChangeModal.tsx - Role management UI
  - BulkImportModal.tsx - CSV upload interface
  - VerificationQueue.tsx - ID verification workflow
  - DepartmentStats.tsx - Analytics dashboard
  - UserActivityLog.tsx - Audit trail viewer

* **Security & Validation**:
  - Department-scoped data access at API level
  - Role validation middleware for all endpoints
  - Password policies (complexity, history, expiry)
  - Account lockout after failed attempts
  - Session invalidation on role changes
  - Audit logging for all administrative actions
  - PII encryption for sensitive fields
  - Rate limiting on user creation endpoints

---

### Commercial Benefits Directory - PRIORITY 2

Comprehensive partner benefits platform with categories, department-specific benefits, and usage analytics. Rich filtering and search capabilities.

#### Tech Involved

* Postgres CommercialBenefit model with categories enum and validity dates
* Object storage for partner logos and promotional materials
* Server-side filtering by category, department, validity, location
* Anonymous usage tracking for analytics
* Redis caching for frequently accessed benefits

#### Main Requirements

* **Categories**: Dining, Wellness, Hotels, Entertainment, Shopping, Transportation
* **Department Benefits**: Some benefits exclusive to specific departments
* **Validity Management**: Start/end dates, blackout periods, terms & conditions
* **Partner Information**: Name, logo, website, contact, discount percentage/details
* **Location-Based**: Filter by physical location or online availability
* **Usage Tracking**: Anonymous analytics for popularity and engagement
* **Admin Management**: Full CRUD for Superadmin, read-only for others

#### Implementation Details

* **API Endpoints**:
  - GET /api/benefits - List with filters (category, dept, location, validity)
  - GET /api/benefits/:id - Detailed view with terms
  - POST /api/benefits - Create new benefit (superadmin)
  - PUT /api/benefits/:id - Update benefit (superadmin)
  - DELETE /api/benefits/:id - Soft delete (superadmin)
  - GET /api/benefits/categories - Available categories
  - POST /api/benefits/:id/track - Track usage (anonymous)
  - GET /api/benefits/analytics - Usage reports (admin)

* **Frontend Components**:
  - BenefitsGrid.tsx - Responsive card grid layout
  - BenefitCard.tsx - Preview with logo, discount, category
  - BenefitDetails.tsx - Full modal with terms and contact
  - BenefitFilters.tsx - Multi-select filters sidebar
  - BenefitSearch.tsx - Real-time search with suggestions
  - BenefitAdmin.tsx - Management interface with bulk operations

---

### Training Sessions with Integrated Documents - PRIORITY 3

Modular training platform with document integration, progress tracking, quizzes, and certificate generation. Department-based assignments with version control.

#### Tech Involved

* Postgres: TrainingSession with versioning, contentBlocks JSON, enrollments
* Block types: TEXT, FILE, VIDEO, LINK, FORM, DOCUMENT (integrated viewer)
* Document integration: Link existing documents directly into training flow
* Object storage for training materials, certificates
* Worker queue for quiz grading, certificate generation
* Progress tracking with completion rules engine

#### Main Requirements

* **Content Blocks**: Ordered, mixed-type content (text, files, videos, documents)
* **Document Integration**: Attach existing documents as training materials
* **Assignment Types**: Assigned (mandatory), Requested (approval needed), Optional
* **Department Scoping**: Assign to departments, positions, or individuals
* **Progress Tracking**: Track viewed blocks, time spent, quiz scores
* **Completion Rules**: View all blocks + pass quiz (if present) + minimum time
* **Versioning**: Edits create new versions; enrollments pinned to specific version
* **Certificates**: Auto-generated upon completion with unique ID
* **Reporting**: Completion rates, average scores, time to complete

#### Implementation Details

* **API Endpoints**:
  - GET /api/training/sessions - List available (filtered by assignment)
  - GET /api/training/sessions/:id - Full session with blocks
  - POST /api/training/sessions - Create session (admin)
  - PUT /api/training/sessions/:id - Update (creates new version)
  - POST /api/training/sessions/:id/blocks - Add content blocks
  - GET /api/training/enrollments - User's enrollments with progress
  - POST /api/training/enrollments - Enroll in session
  - GET /api/training/progress/:id - Detailed progress data
  - POST /api/training/progress/:id - Update progress (block viewed)
  - POST /api/training/submit/:id - Submit quiz/form answers
  - GET /api/training/:id/documents - List attached documents
  - POST /api/training/:id/documents - Attach document to training
  - GET /api/training/certificate/:id - Download certificate PDF

* **Frontend Components**:
  - TrainingDashboard.tsx - Overview with progress cards
  - TrainingCard.tsx - Session preview with progress bar
  - TrainingViewer.tsx - Content block renderer with navigation
  - TrainingDocuments.tsx - Integrated document viewer/downloader
  - TrainingQuiz.tsx - Dynamic form/quiz with validation
  - TrainingProgress.tsx - Visual progress indicators
  - TrainingCertificate.tsx - Certificate preview/download
  - TrainingAdmin.tsx - Session builder with drag-drop blocks
  - TrainingReports.tsx - Analytics and completion tracking

* **Content Block Specifications**:
  - TEXT: Rich text editor content (Markdown/HTML)
  - FILE: Downloadable attachments (PDF, DOCX, etc.)
  - VIDEO: YouTube/Vimeo embeds or direct URLs
  - LINK: External resources with description
  - FORM: JSON schema-based quiz/survey
  - DOCUMENT: Embedded document viewer from library

---

### Admin Console (Dept Admin & Superadmin)

Operational UI to manage users (within scope), documents, training, payroll ingests, and vacation approvals. Superadmin also manages departments, positions, and benefits.

#### Tech Involved

* Policy-aware Admin UI; server-enforced RBAC
* CSV upload UI with progress + validation results
* Audit log surfacing and exports

#### Main Requirements

* Guardrails: confirmations, dry-run for CSV, rollback on partial failures
* Bulk operations with preview diff
* Search, filter, sort across resources

---

### Deployment & Platform (Railway)

Deploy the BFF + services on Railway, Postgres in the same Railway project, and object storage via S3/R2. CI/CD builds, DB migrations, secrets, and environment promotion.

#### Tech Involved

* Railway services: BFF container(s), background worker, cron jobs
* Postgres (Railway) with migration tool (Prisma/Migrate, Flyway, or Sqitch)
* Health checks, autoscaling, structured logs, metrics (OTel)

#### Main Requirements

* Clearly separated “web” (BFF) and “worker” (ingestion/grading) processes
* Secrets via Railway variables; rotate keys; least privilege DB roles
* Observability dashboards and alerts for ingest errors & auth failures

---

## System Diagram

```mermaid
flowchart TB
  subgraph Client["Mobile-First Web App (React SPA)"]
    UI[SPA (React/Tailwind)]
  end

  CDN[CDN/Edge Cache]
  WAF[WAF / Rate Limit]
  BFF[Backend-for-Frontend (API Gateway)]
  AUTH[OIDC Provider]
  RBAC[Policy Engine (RBAC/ABAC)]
  AUDIT[Audit/Event Stream]
  NOTIFY[Notifications (Email/SMS/WhatsApp)]
  CACHE[(Redis Cache)]

  subgraph Services["Core Services (Railway)"]
    USERS[Users/Orgs (Depts & Positions)]
    DOCS[Documents Service]
    PAY[Payroll Service]
    VAC[Vacation Service]
    PROF[Profile Service]
    BEN[Benefits Service]
    TRAIN[Training Service]
  end

  subgraph Data["Data Layer (Railway Postgres + Object Storage)"]
    PG[(Postgres)]
    OBJ[(Object Storage: PDFs/IDs/Training files)]
    QUEUE[[Task Queue]]
  end

  subgraph Jobs["Workers / Async Processing"]
    CSV[CSV Ingest Validator]
    AV[AV Scan]
    PDFGEN[PDF Generator (Payslips)]
    GRADE[Form Grading / Completion Rules]
    INDEX[Search Indexer]
  end

  UI -->|HTTPS| CDN --> WAF --> BFF
  BFF --> AUTH
  BFF --> RBAC
  BFF --> CACHE
  BFF --> USERS
  BFF --> DOCS
  BFF --> PAY
  BFF --> VAC
  BFF --> PROF
  BFF --> BEN
  BFF --> TRAIN
  BFF --> NOTIFY
  BFF --> AUDIT

  USERS --> PG
  DOCS --> PG
  DOCS --> OBJ
  DOCS --> QUEUE
  PAY --> PG
  VAC --> PG
  PROF --> PG
  BEN --> PG
  TRAIN --> PG
  TRAIN --> OBJ

  QUEUE --> CSV
  QUEUE --> AV
  QUEUE --> PDFGEN
  QUEUE --> GRADE
  QUEUE --> INDEX

  AV --> OBJ
  PDFGEN --> OBJ
  INDEX --> PG
```

## List of Technical/Architecture Consideration Questions

* **Auth & Provisioning**

  * Will we integrate with corporate SSO on day one, or use email/password + magic link initially?
  * Should Admin-created users trigger an invite flow (email verification, forced password reset)?
* **Departments & Positions**

  * Are positions shared across departments or scoped to one? Any salary bands/attributes we should model now?
  * Do we need historical tracking (user moved departments/positions) for reporting?
* **Document Library**

  * Do we need per-file retention policies and legal hold? Maximum file size? Allowed MIME types?
  * Should we enable inline PDF text extraction and searching by content from MVP?
* **Payroll**

  * CSV format: can we lock a canonical schema and provide a downloadable template? How strict should validation be (hard vs soft errors)?
  * Do we need currency support beyond USD? Multi-entity payroll in future?
* **Training**

  * For FORM blocks, is a pass threshold global or per session? Require time limits or attempt limits?
  * Do we need SCORM/xAPI support in future, or is custom blocks sufficient?
  * Should “Requested” sessions require Admin approval, or auto-enroll with notification?
* **Notifications**

  * Approved channels (email/SMS/WhatsApp). Any provider preferences (SendGrid/Twilio/WhatsApp Business)?
  * Localization (ES/EN) requirements and templates?
* **Auditing & Compliance**

  * Which read events must be audited (document views/payslip views)? Retention for audit logs?
  * Data residency constraints for Panama; encryption keys residency?
* **Railway & Ops**

  * Expected scale (MAUs, peak ingestion during payroll)? Target SLOs? Autoscaling bounds?
  * Do we need blue/green deployments and DB migration gating (pre-/post-migrate health checks)?
* **Security**

  * File AV scan policy (block on fail vs quarantine)? Allowed external video hosts (YouTube/Vimeo/Drive)?
  * Secret management & rotation cadence; IP allowlist for Admin console?
* **Front-End**

  * Accessibility target (WCAG 2.1 AA)? Offline read-only cache for docs/payroll?
  * Analytics needs (consent, PII avoidance) and privacy banners?
* **Roadmap**

  * Timeline for external payroll API integration; which vendor(s)?
  * Mobile app later (Capacitor/React Native) or keep PWA route?

## Warnings-or-Guidance

* Enforce **server-side authorization** for every operation—never trust role claims from the client; use BFF-issued signed URLs for all file access.
* Treat payroll and ID uploads as **sensitive PII**: encrypt at rest, short-lived access, and redact PII in logs & analytics.
* Make CSV ingestion **idempotent** (batch\_id + checksum), with a **dry-run** to return row-level errors before commit.
* Version everything that users consume (docs, training, payslips) to avoid breaking active assignments and ensure reproducibility in audits.
* Start with a **modular monolith** in one repo (BFF + services in modules) on Railway; extract services only when hotspots are proven.
* Build **observability from day one** (structured logs, traces, metrics, ingestion dashboards, error budgets).
* Use **feature flags** around training forms, CSV ingest, and document linking to de-risk releases and allow quick rollback.
