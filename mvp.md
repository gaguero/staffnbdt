## Features (MVP)

### Role-Based Access, Hierarchies & Provisioning

A secure auth layer with four roles (Staff, Department Admin, Superadmin) and hierarchical scoping: Superadmin can create departments & positions; Admins can create users only within their department. Admins can also assign users to positions.

#### Tech Involved

* OAuth2/OIDC (Auth0/Okta/Cognito) → BFF session; JWT (short-lived)
* RBAC/ABAC policy engine (Casbin/Oso) embedded in BFF
* Postgres (Railway) for users, departments, positions, memberships

#### Main Requirements

* Hierarchical scope checks (Superadmin > Admin > Staff) enforced server-side
* CRUD: departments (Superadmin), positions (Superadmin), users (Admin within dept)
* Idempotent user provisioning; email uniqueness; audit trail

---

### Document Library with Scoped Linking

A searchable library of PDFs and static pages. Admins manage documents for their department and link files to specific departments and/or individual users.

#### Tech Involved

* Object storage (S3/R2) with signed URLs via BFF
* Postgres metadata: documents, tags, department\_links, user\_links
* Content scanning (AV) on upload; CDN fronting storage

#### Main Requirements

* Visibility: (general) OR (dept-linked) OR (user-linked)
* Upload flow: AV scan → persist → index → CDN cache-invalidate
* Audit: who uploaded/linked/unlinked; when viewed/downloaded

---

### Payroll Service (DB-Backed + CSV Bulk Ingest, Future API)

Self-service payroll with monthly payslips and detail (days, hours, OT, tips, deductions). Supports bulk CSV ingestion now; future vendor API integration.

#### Tech Involved

* Postgres tables for payslips & line items
* CSV ingestion worker (queue-backed) with validation + idempotency keys
* PDF generator (wkhtmltopdf/WeasyPrint) for payslip export
* BFF aggregation for “self” access only

#### Main Requirements

* Bulk CSV endpoint (admin/superadmin): staged → validated → committed
* Schema versioning for ingests; reject on incompatible columns
* Immutable payslips (append-only); regeneration only creates new version
* Future external API connector interface (strategy pattern)

---

### Vacation Management (Requests, Approvals, History)

Employees submit leave; Admins approve for their department; Superadmin can override. Tracks available/pending/taken with blackout windows.

#### Tech Involved

* State machine for request lifecycle (Submitted → Approved/Denied)
* Rules engine for blackout windows & accrual
* Notification service (email/SMS/WhatsApp) for status changes

#### Main Requirements

* Department-scoped approval queues for Admins
* Accrual policy configurable (per position/tenure)
* Full audit of actions & notes

---

### Profile & ID Attachment (PII-Safe)

Profile page with contact info and emergency contact. Upload ID (image/PDF) with verification timestamp (by Admin or Superadmin).

#### Tech Involved

* Postgres profile; object storage for ID
* KMS-managed encryption at rest; short-lived signed URLs
* Optional verification workflow (task and timestamp)

#### Main Requirements

* Strict access (self + HR/Superadmin; Admin only within dept)
* Redacted logs; PII classification tags
* Retention & deletion policy (legal compliance)

---

### Commercial Benefits Directory (Superadmin Managed)

Discover & filter partner perks (Dining, Wellness, Hotels, Other). Superadmin manages entries; staff read-only.

#### Tech Involved

* Postgres CRUD; optional logo asset storage
* Server-side filtering/search
* Feature flags for rollout

#### Main Requirements

* Validity windows & blackout dates
* Soft delete with version history
* Optional location filter

---

### Training Sessions (Assigned/Requested/Optional)

Admins create training sessions for their users. Sessions can be “Assigned”, “Requested” (user requests enrollment), or “Optional” (discoverable catalog). Sessions are modular: text blocks, file attachments, videos (URL or embed), external links, and form components (quizzes/acknowledgements).

#### Tech Involved

* Postgres: sessions, session\_blocks (ordered), enrollment, completion, attempts
* Block types: TEXT, FILE, VIDEO, LINK, FORM (JSON schema for questions)
* File storage for attachments; video via external link/iframe
* Worker for grading simple forms; score + pass/fail; completion rule engine

#### Main Requirements

* Admin-scoped creation within department; Superadmin across org
* Assign users/positions/departments; user can request enrollment if allowed
* Completion tracking (rules: all blocks viewed, form pass score, acknowledgment)
* Versioning: edits create new version; active enrollments pinned to version
* Reporting: per-user status, per-session completion rates

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
