# Nayara HR Portal Technical Specification

## 1. Executive Summary

* **Overview**: Mobile-first HR portal for Nayara Bocas del Toro providing role-scoped access to documents, payroll, vacation, training, benefits, and profiles. Managers (Admins) operate within their department; Superadmins manage organization-wide structures.
* **Objectives**: Deliver an MVP that is secure with strong RBAC, auditable actions, CSV payroll ingest, and extensible training sessions; deploy on Railway with Postgres in the same project.
* **Key Decisions**:

  * **Architecture**: Modular monolith with **Backend-for-Frontend (BFF)** + background **Worker** sharing a single Postgres; object storage via S3/R2; CDN in front of assets; signed URL brokerage only from BFF.
  * **RBAC/ABAC**: Role + department-scoped authorization checked server-side (Casbin/Oso or policy module).
  * **PII**: Encrypt highly sensitive blobs (IDs, payslips) and redact in logs; short-lived signed URLs.
  * **Ingestion**: CSV payroll dry-run validator + idempotent commits; future vendor connector via strategy interface.
* **Technology Stack (recommended)**: React + Tailwind (SPA), Node.js (NestJS/Express) BFF, TypeScript end-to-end, Postgres (Railway), Redis (Railway) optional, S3-compatible object storage (R2/S3), OpenTelemetry, Playwright/Cypress, Vitest/Jest.

### High-level Architecture Diagram

```mermaid
flowchart TB
  subgraph Client[Web Client (React SPA)]
    UI[UI + i18n + State]
  end
  CDN[CDN/Edge]
  WAF[WAF/Rate Limit]
  BFF[API/BFF]
  AUTH[OIDC/Passwordless]
  RBAC[Policy Engine]
  CACHE[(Redis)]
  AUDIT[Audit Stream]
  NOTIFY[Email/SMS/WhatsApp]

  subgraph Core[Core Services]
    USERS[Users/Orgs]
    DOCS[Documents]
    PAY[Payroll]
    VAC[Vacation]
    TRAIN[Training]
    PROF[Profile]
    BEN[Benefits]
  end

  subgraph Data[Railway Postgres + Object Storage]
    PG[(Postgres)]
    OBJ[(Object Storage)]
    Q[[Queue/Workers]]
  end

  UI -->|HTTPS| CDN --> WAF --> BFF
  BFF --> AUTH
  BFF --> RBAC
  BFF --> CACHE
  BFF --> USERS & DOCS & PAY & VAC & TRAIN & PROF & BEN
  BFF --> NOTIFY
  BFF --> AUDIT

  USERS & DOCS & PAY & VAC & TRAIN & PROF & BEN --> PG
  DOCS & TRAIN & PAY --> OBJ
  Q --> PAY
  Q --> DOCS
  Q --> TRAIN
  Q --> OBJ
```

## 2. System Architecture

### 2.1 Architecture Overview

* **Components**: React SPA, BFF API, Worker (CSV ingest, AV scan, PDF gen, training grading), Postgres, Object Storage, Queue (Railway cron/worker with BullMQ/RSMQ), CDN, Notification provider, Auth provider.
* **Relationships**: SPA calls BFF only; BFF enforces authz and issues signed URLs; Worker performs async tasks via queue; services share Postgres schemas with clear boundaries; audit events written on every mutating action and sensitive reads.
* **Data Flows**:

  1. **Document upload**: Admin → SPA → BFF → pre-signed upload → OBJ → enqueue AV → on pass, metadata→PG; on fail, quarantine.
  2. **Payroll ingest**: Admin uploads CSV → BFF stores staged file → Worker validates (dry-run), returns report → Admin commits → Worker persists rows, generates payslip PDFs if configured → indices updated.
  3. **Training**: Admin creates session with ordered blocks → users enroll/assigned → Worker grades FORM blocks on submit → completion recorded.
  4. **Vacation**: Staff submits → state machine transitions; Admin approves within dept; Superadmin override.
* **Infrastructure Requirements**: Railway services: `web` (BFF), `worker`, `postgres`, optional `redis`, `cron`. S3/R2 bucket with KMS; CDN (Cloudflare/R2 or CloudFront).

### 2.2 Technology Stack

* **Frontend**: React, TypeScript, Vite, Tailwind, React Query (TanStack), i18next; lucide icons; MSW for mock.
* **Backend**: Node.js (NestJS preferred for modules/DI), TypeScript, PostgreSQL client (Prisma or Knex), Casbin/Oso for policies, Zod for validation.
* **Database/Storage**: Postgres (Railway) single cluster; S3-compatible object storage for PDFs/IDs/training assets; Redis optional for rate limits/queues.
* **Third-party**: Auth (Auth0/Clerk/Cognito or email-magic-link), Email/SMS (SendGrid/Twilio/WhatsApp), AV scan (Lambda/ClamAV container), PDF gen (wkhtmltopdf/WeasyPrint), OpenTelemetry.

## 3. Feature Specifications

### 3.1 Role-Based Access, Hierarchies & Provisioning

* **User Stories**

  * As a Superadmin, I create departments and positions.
  * As an Admin, I create users in my department and assign positions.
  * As Staff, I access only my resources.
* **Acceptance**: Policy denies cross-department access; audit entries for CRUD.
* **Technical Requirements**: RBAC with attributes (role, department\_id); org tables for departments, positions, memberships.
* **Implementation**: Casbin model with policies generated from DB; middleware enforces subject/action/object with attributes; provisioning endpoints validate scope.
* **User Flow**: Superadmin → create dept/position → Admin → create user → system emails invite.
* **API**: see Section 5.
* **Data Models**: Department, Position, User, Membership (user↔department), RoleAssignment.
* **Errors**: 403 on scope breach; 409 on duplicate email.
* **Performance**: Cache policy decisions per token (short TTL).

### 3.2 Document Library with Scoped Linking

* **User Stories**

  * Admin uploads and links a doc to department or specific users.
  * Staff browses docs (general + dept + per-user), previews, downloads.
* **Technical**: Metadata in `documents`, link tables `document_departments`, `document_users`; AV scan; signed URLs.
* **Implementation**: Pre-signed PUT for upload; Worker runs AV; BFF exposes list with effective visibility query.
* **User Flow**: Upload → scan → publish; hover/long-press shows summary.
* **API/Data**: see Section 5; models below.
* **Errors**: 415 invalid type; 422 scan failed; 403 unauthorized.
* **Perf**: Pagination + tag index; CDN for files.

### 3.3 Payroll (CSV Bulk + Future API)

* **User Stories**

  * Admin imports monthly CSV and reviews validation report (dry-run).
  * Staff views their payslips and details; downloads PDF.
* **Technical**: Tables `payslips`, `payslip_items`; ingest tables `payroll_batches`, `payroll_rows_staged`.
* **Implementation**: Batch upload → Worker validates (schema vN), returns per-row errors; commit creates payslips; optional PDF generation.
* **API**: endpoints for dry-run, commit, list, self-view.
* **Errors**: 409 duplicate batch\_id; 422 row errors; 404 payslip missing.
* **Perf**: COPY-based bulk insert; indexes on (user\_id, month).

### 3.4 Vacation Management

* **User Stories**: submit request; Admin approves/denies; Superadmin override.
* **Technical**: State machine; `vacation_requests`, `vacation_balances`.
* **Implementation**: Transitions with guards (blackouts/accrual); notifications on change.
* **Errors**: 422 invalid range; 409 overlap; 403 out-of-scope approval.

### 3.5 Profile & ID Attachment

* **User Stories**: edit contact info; upload ID; Admin verifies.
* **Technical**: Profiles table + object storage; verification timestamp & actor.
* **Implementation**: File upload via signed URL; metadata row with hash.

### 3.6 Commercial Benefits Directory

* **User Stories**: Staff browse; Superadmin CRUD.
* **Technical**: `benefits` with validity windows; optional logo asset.

### 3.7 Training Sessions

* **User Stories**: Admin creates modular session (TEXT/FILE/VIDEO/LINK/FORM); assigns to users/positions/departments; user completes; system grades form.
* **Technical**: `training_sessions`, `training_blocks`, `enrollments`, `attempts`.
* **Implementation**: Ordered blocks; FORM as JSON schema; grading worker; versioning on edit.

### 3.8 Admin Console

* **User Stories**: Manage users in-scope; docs; payroll batches; vacation approvals; training; benefits (superadmin).
* **Technical**: Policy-aware UI; tables with pagination; CSV upload with progress.

## 4. Data Architecture

### 4.1 Data Models

(Types shown in SQL-ish form; all tables have `id UUID PK`, `created_at`, `updated_at`, `created_by`, `updated_by` unless noted.)

**departments**

* name TEXT UNIQUE NOT NULL
* code TEXT UNIQUE

**positions**

* department\_id FK→departments(id)
* name TEXT NOT NULL
* UNIQUE(department\_id, name)

**users**

* email CITEXT UNIQUE NOT NULL
* name TEXT NOT NULL
* status ENUM('invited','active','disabled') DEFAULT 'invited'
* primary\_department\_id FK→departments(id) NULL

**role\_assignments**

* user\_id FK→users(id)
* role ENUM('staff','admin','superadmin')
* department\_id FK→departments(id) NULL (required for admin)
* UNIQUE(user\_id, role, department\_id)

**documents**

* title TEXT, summary TEXT, mime TEXT, bytes INT, url\_key TEXT UNIQUE, updated\_on DATE
* scope ENUM('general','department','user')
* uploader\_id FK→users(id), av\_status ENUM('pending','passed','failed')

**document\_departments**

* document\_id FK→documents(id)
* department\_id FK→departments(id)
* UNIQUE(document\_id, department\_id)

**document\_users**

* document\_id FK→documents(id)
* user\_id FK→users(id)
* UNIQUE(document\_id, user\_id)

**profiles**

* user\_id FK→users(id) UNIQUE
* phone TEXT, emergency\_name TEXT, emergency\_phone TEXT, hire\_date DATE
* id\_url\_key TEXT NULL, id\_verified\_at TIMESTAMPTZ NULL, id\_verified\_by FK→users(id) NULL

**payslips**

* user\_id FK→users(id)
* month DATE (use first day)
* gross NUMERIC(10,2), net NUMERIC(10,2), regular\_hours NUMERIC(6,2), ot\_hours NUMERIC(6,2), tips NUMERIC(10,2), deductions NUMERIC(10,2)
* pdf\_url\_key TEXT NULL
* UNIQUE(user\_id, month)

**payroll\_batches**

* batch\_id TEXT UNIQUE, schema\_version INT, status ENUM('staged','validated','committed','failed')
* uploaded\_by FK→users(id)

**payroll\_rows\_staged**

* batch\_id TEXT
* row\_number INT
* raw JSONB
* errors TEXT\[] DEFAULT '{}'
* UNIQUE(batch\_id, row\_number)

**vacation\_requests**

* user\_id FK→users(id)
* department\_id FK→departments(id)
* start\_date DATE, end\_date DATE, type ENUM('annual','sick','unpaid')
* status ENUM('submitted','approved','denied') DEFAULT 'submitted'
* decision\_note TEXT NULL, decided\_by FK→users(id) NULL

**vacation\_balances**

* user\_id FK→users(id) UNIQUE
* available\_days NUMERIC(4,1) DEFAULT 0
* pending\_days NUMERIC(4,1) DEFAULT 0
* taken\_days NUMERIC(4,1) DEFAULT 0

**benefits**

* name TEXT, category ENUM('Dining','Wellness','Hotels','Other'), partner TEXT, location TEXT
* summary TEXT, terms TEXT, valid\_from DATE, valid\_to DATE, active BOOLEAN DEFAULT true
* logo\_url\_key TEXT NULL

**training\_sessions**

* title TEXT, department\_id FK→departments(id) NULL (null means org-wide)
* version INT DEFAULT 1, status ENUM('draft','published','archived')
* assigned\_rule JSONB NULL (e.g., by position)

**training\_blocks**

* session\_id FK→training\_sessions(id)
* version INT
* order\_index INT
* type ENUM('TEXT','FILE','VIDEO','LINK','FORM')
* payload JSONB (content, urls, form schema)
* UNIQUE(session\_id, version, order\_index)

**training\_enrollments**

* session\_id FK→training\_sessions(id)
* session\_version INT
* user\_id FK→users(id)
* status ENUM('assigned','in\_progress','completed','failed','requested')
* requested\_by FK→users(id) NULL
* UNIQUE(session\_id, user\_id)

**training\_attempts**

* enrollment\_id FK→training\_enrollments(id)
* block\_id FK→training\_blocks(id)
* score NUMERIC(5,2) NULL, passed BOOLEAN NULL, answers JSONB

**audit\_events**

* actor\_id FK→users(id)
* verb TEXT, object\_type TEXT, object\_id UUID, meta JSONB

**Indexes & Optimization**

* B-tree on common filters: documents(updated\_on, title), payslips(user\_id, month), vacation\_requests(department\_id, status), training\_enrollments(user\_id, status)
* GIN on tags/JSONB where applicable (e.g., training payload).

### 4.2 Data Storage

* **Rationale**: Postgres for relational integrity and reporting; object storage for large files; optional Redis for queues/rate limits.
* **Persistence**: Soft-deletes via `deleted_at` where needed; migrations via Prisma/Flyway; point-in-time recovery enabled.
* **Caching**: In-memory + Redis for short-lived list caches and policy decisions.
* **Backup/Recovery**: Railway automated backups daily; PITR if supported; documented restore runbooks; test restores quarterly.

## 5. API Specifications

### 5.1 Internal APIs (BFF)

(Example; all JSON; Auth via Bearer JWT; rate limit 60 req/min default.)

**Auth**

* `POST /auth/login` → { email } (magic link) or OIDC callback endpoints.
* `POST /auth/logout`

**Users & Org**

* `POST /org/departments` (superadmin)

  * Body: { name, code }
  * 201 → { id, name, code }
* `POST /org/positions` (superadmin)

  * Body: { departmentId, name }
* `POST /org/users` (admin within dept | superadmin)

  * Body: { email, name, departmentId, positionId, role:"staff|admin" }
  * 201 → invite initiated
* `GET /org/users?dept={id}&q={name}&page` (admin scoped)

**Documents**

* `POST /docs/upload-url` (admin/superadmin)

  * Body: { filename, mime, scope:"general|department|user", departmentId?, userIds?\[] }
  * 200 → { url, fields, key }
* `POST /docs` (finalize)

  * Body: { title, summary, key, scope, links }
* `GET /docs` (effective visibility for caller)

  * Query: { q, deptId, tag, page }
* `GET /docs/:id`
* `DELETE /docs/:id` (owner or superadmin)

**Payroll**

* `POST /payroll/batches` (admin/superadmin) → stage CSV

  * Request: multipart/form-data { file, batchId, schemaVersion }
  * 202 → { batchId, status:"staged" }
* `POST /payroll/batches/:batchId/validate` → dry-run

  * 200 → { valid\:boolean, errors:\[{row, field, message}], stats }
* `POST /payroll/batches/:batchId/commit`

  * 202 → { status:"committed" }
* `GET /payroll/self` (staff) → list months
* `GET /payroll/self/:month` → details + signed PDF URL (if available)

**Vacation**

* `POST /vacation/requests` (staff)
* `GET /vacation/requests?mine=1`
* `GET /vacation/approvals` (admin scoped)
* `POST /vacation/requests/:id/approve` (admin) { note }
* `POST /vacation/requests/:id/deny` (admin) { note }

**Training**

* `POST /training/sessions` (admin/superadmin)
* `PUT /training/sessions/:id` (version bump on published)
* `POST /training/sessions/:id/blocks` (ordered)
* `POST /training/enrollments` { sessionId, userIds\[]/positionId/departmentId, mode:"assigned|optional" }
* `GET /training/me` → enrollments & progress
* `POST /training/attempts` → submit FORM answers; 200 → { score, passed }

**Benefits**

* `GET /benefits` (all)
* `POST /benefits` (superadmin)
* `PUT /benefits/:id` (superadmin)

### 5.2 External Integrations

* **Auth**: OIDC or magic-link email; tokens verified by BFF.
* **Notifications**: SendGrid for email; Twilio for SMS/WhatsApp; fallback to email on SMS failure.
* **Future Payroll API**: strategy interface `PayrollProvider` with methods `syncEmployees()`, `pullPayslips(month)`, `mapToDomain()`; retries with exponential backoff; dedupe by provider key.

## 6. Security & Privacy

### 6.1 Authentication & Authorization

* AuthN via OIDC or passwordless; short-lived access tokens (15 min) + refresh tokens (httpOnly, same-site) handled by BFF.
* AuthZ via policy engine: subject (userId, role, dept) × action × object (resource with dept/user attributes).
* Session: BFF session cookie storing opaque session id; server maps to tokens.

### 6.2 Data Security

* TLS everywhere; at-rest: Postgres encrypted, objects encrypted (SSE-KMS). Signed URLs limited to 5 minutes.
* PII classification: IDs, payslips; logs redact emails and url\_keys; access to PII audited.
* Compliance: align with GDPR-like principles (lawful basis, minimization); enable data export/delete.

### 6.3 Application Security

* Input validation with Zod; output encoding; strict CSP; security headers (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
* OWASP: prevent injection, auth failures, sensitive data exposure; AV scan for uploads; rate limit auth endpoints.
* Vulnerability management: Dependabot/Renovate; weekly SCA; quarterly pen-test option.

## 7. User Interface Specifications

### 7.1 Design System

* **Principles**: Bold simplicity, breathable whitespace, color accents from brand palette; content-first.
* **Component Library**: Tailwind + headless primitives; create tokens and Tailwind theme.
* **Responsive**: Mobile-first; tablet/desktop expansions for Admin.
* **Accessibility**: WCAG 2.1 AA; keyboard nav; focus rings.

### 7.2 Design Foundations

#### 7.2.1 Color System

* Primary: Sand `#FFF0B9`, Clay `#D88C6C`, Seafoam `#ACD4CB`; Neutral: Charcoal `#4A4A4A`, Shell `#FBF8F3`.
* Semantic: Success `#2E7D32`, Warning `#ED6C02`, Error `#C62828`, Info `#0277BD`.
* Dark mode: deepen neutrals, reduce saturation; ensure contrast ≥ 4.5:1.

#### 7.2.2 Typography

* Headings: **Gotham Black** (all caps); Subhead: **Georgia Italic**; Body: **Proxima Nova**; web-safe fallbacks: Tahoma/Georgia/Arial.
* Type scale (rem): 3.0, 2.25, 1.75, 1.5, 1.25, 1.125, 1.0; line-height 1.4–1.6.

#### 7.2.3 Spacing & Layout

* Base unit 8px; spacing scale 4/8/12/16/24/32/48.
* Breakpoints: sm 640, md 768, lg 1024, xl 1280.
* Grid: 12-col desktop, 4-col mobile; container max 1200px.

#### 7.2.4 Interactive Elements

* Buttons: primary (filled clay), secondary (outline), subtle (ghost); states: hover +4% shade, focus ring 2px seafoam, disabled 40% opacity.
* Forms: 8px radius, 1px neutral border, error helper text; async loaders with skeletons.
* Motion: 200–300ms ease-in-out; slide/fade transitions.

#### 7.2.5 Component Specifications

* Tokens in `tokens.json` mapped to Tailwind config (colors, spacing, radii, shadows, typography).
* Core components: Button, Input, Select, TextArea, Modal, Card, Table, Tabs, Badge, Toast, EmptyState, Pagination.

### 7.3 User Experience Flows

* **Onboarding/Login**: role-based access post-auth; first-run wizard.
* **Document Browse**: search + filters; preview modal; download.
* **Payroll**: list of months; details modal; download PDF.
* **Vacation**: request flow; approval queue; notifications.
* **Training**: enroll → complete blocks → form grading → completion badge.
* **Admin**: CSV upload dry-run → resolve errors → commit; user creation; document linking.

## 8. Infrastructure & Deployment

### 8.1 Infrastructure Requirements

* Railway services: `web` (BFF, 512–1024MB RAM), `worker` (CSV/PDF/AV, 1–2GB), `postgres` (shared starter then scale), optional `redis`.
* Network: HTTPS via Railway domain; WAF/Rate-limit at BFF; VPC/egress to object storage.
* Storage: S3/R2 bucket with lifecycle policies (quarantine, archived, active).

### 8.2 Deployment Strategy

* **CI/CD**: GitHub Actions → build/test → dockerize → deploy to Railway; Prisma/Flyway migrations gated.
* **Environments**: `dev`, `staging`, `prod` with separate DBs/buckets and secrets.
* **Procedures**: Blue/green or canary on `web`; rollback by redeploy previous image + down-migration if safe.
* **Config Management**: `.env` per environment via Railway variables; secret rotation quarterly.

---

**Appendix: Example Project Structure (monorepo)**

```
apps/
  web/ (React SPA)
  bff/ (NestJS)
  worker/ (jobs)
packages/
  ui/ (shared components + Tailwind plugin)
  types/ (shared TypeScript types & Zod schemas)
  config/ (eslint, tsconfig, jest base)

bff/src/
  modules/
    auth/
    org/ (departments, positions, users, roles)
    docs/
    payroll/
    vacation/
    training/
    benefits/
    profile/
  common/
    policies/
    guards/
    dto/
    utils/
  infra/
    prisma/ or knex/
    storage/
    queue/
    mail/
    telemetry/
```

**Naming Conventions**: PascalCase for React components, camelCase for vars/functions, kebab-case for file names; tests `*.spec.ts`, e2e `*.e2e.ts`.
