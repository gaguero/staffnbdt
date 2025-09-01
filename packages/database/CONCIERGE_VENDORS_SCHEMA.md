# Concierge & Vendors Module Database Schema

## Overview

This document outlines the database schema implementation for the Concierge and Vendors modules in the Hotel Operations Hub multi-tenant ERP platform.

## Schema Design Principles

### 1. Multi-Tenant Isolation
- All tables include `organizationId` and `propertyId` for tenant scoping
- Automatic tenant filtering enforced by `TenantInterceptor` and `TenantContextService`
- Zero cross-tenant data leakage through database-level isolation

### 2. EAV (Entity-Attribute-Value) Pattern
- `ConciergeObject` uses EAV for flexible, dynamic field storage
- `ConciergeAttribute` stores typed values (string, number, boolean, date, json)
- Database constraint ensures exactly one typed value per attribute

### 3. Performance Optimization
- Composite indexes for tenant + common query patterns
- Type-specific indexes for EAV attribute queries
- Partial indexes for active records and common filters

## Database Tables

### Concierge Module

#### ConciergeObject
**Purpose**: Main entity for concierge operations (guest requests, experiences, tasks)
```sql
CREATE TABLE "ConciergeObject" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "reservationId" TEXT NULL,
  "guestId" TEXT NULL,
  "status" TEXT DEFAULT 'open',
  "dueAt" TIMESTAMP NULL,
  "assignments" JSONB NULL,
  "files" JSONB NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP NULL
);
```

**Key Features**:
- Links to reservations and guests optionally
- JSON fields for assignments and file attachments
- Soft delete support with `deletedAt`
- SLA support with `dueAt` field

#### ConciergeAttribute
**Purpose**: EAV storage for dynamic object attributes
```sql
CREATE TABLE "ConciergeAttribute" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "objectId" TEXT NOT NULL REFERENCES "ConciergeObject"("id"),
  "fieldKey" TEXT NOT NULL,
  "fieldType" TEXT NOT NULL,
  "stringValue" TEXT NULL,
  "numberValue" DECIMAL NULL,
  "booleanValue" BOOLEAN NULL,
  "dateValue" TIMESTAMP NULL,
  "jsonValue" JSONB NULL,
  CONSTRAINT "chk_concierge_attr_exactly_one_value" CHECK (
    (stringValue IS NOT NULL)::int +
    (numberValue IS NOT NULL)::int +
    (booleanValue IS NOT NULL)::int +
    (dateValue IS NOT NULL)::int +
    (jsonValue IS NOT NULL)::int = 1
  )
);
```

**Key Features**:
- Type-safe storage with constraint validation
- Efficient querying with type-specific indexes
- Flexible schema evolution without migrations

#### ObjectType
**Purpose**: Schema definitions for concierge object types
```sql
CREATE TABLE "ObjectType" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fieldsSchema" JSONB NOT NULL,
  "validations" JSONB NULL,
  "uiHints" JSONB NULL,
  "isActive" BOOLEAN DEFAULT true,
  UNIQUE("organizationId", "propertyId", "name")
);
```

**Key Features**:
- JSON schema definitions for field types and validation
- UI rendering hints for frontend forms
- Tenant-scoped unique constraint on names

#### Playbook
**Purpose**: Automation rules and workflow definitions
```sql
CREATE TABLE "Playbook" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "conditions" JSONB NOT NULL,
  "actions" JSONB NOT NULL,
  "enforcements" JSONB NULL,
  "isActive" BOOLEAN DEFAULT true,
  UNIQUE("organizationId", "propertyId", "name")
);
```

**Key Features**:
- Event-driven automation triggers
- JSON-based condition and action definitions
- SLA enforcement and escalation rules

### Vendors Module

#### Vendor
**Purpose**: Vendor directory and contact information
```sql
CREATE TABLE "Vendor" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NULL,
  "phone" TEXT NULL,
  "category" TEXT NOT NULL,
  "policies" JSONB NULL,
  "performance" JSONB NULL,
  "isActive" BOOLEAN DEFAULT true
);
```

**Key Features**:
- Contact information and categorization
- JSON fields for policies and performance metrics
- Tenant-scoped vendor directory

#### VendorLink
**Purpose**: Links between vendors and concierge objects
```sql
CREATE TABLE "VendorLink" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendorId" TEXT NOT NULL REFERENCES "Vendor"("id"),
  "objectId" TEXT NOT NULL,
  "objectType" TEXT NOT NULL,
  "policyRef" TEXT NULL,
  "status" TEXT DEFAULT 'pending',
  "confirmationAt" TIMESTAMP NULL,
  "expiresAt" TIMESTAMP NULL
);
```

**Key Features**:
- Polymorphic links to any object type
- Confirmation workflow with expiry
- Policy reference for contract compliance

#### VendorPortalToken
**Purpose**: Magic-link tokens for vendor portal access
```sql
CREATE TABLE "VendorPortalToken" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendorId" TEXT NOT NULL REFERENCES "Vendor"("id"),
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "linkId" TEXT NOT NULL REFERENCES "VendorLink"("id"),
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "usedAt" TIMESTAMP NULL,
  "metadata" JSONB NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("linkId", "tokenHash")
);
```

**Key Features**:
- Secure token storage with hashing
- One-time use tokens with expiry
- Audit trail with metadata

### Module System Extension

#### ModuleSubscription Enhancement
**Purpose**: Property-level module subscription overrides
```sql
ALTER TABLE "ModuleSubscription" ADD COLUMN "propertyId" TEXT NULL;
CREATE UNIQUE INDEX ON "ModuleSubscription"("organizationId", "moduleName", "propertyId");
CREATE UNIQUE INDEX ON "ModuleSubscription"("organizationId", "moduleName") WHERE "propertyId" IS NULL;
```

**Key Features**:
- Organization-level default subscriptions
- Property-level overrides for granular control
- Unique constraints for data integrity

## Performance Indexes

### Tenant Isolation Indexes
```sql
-- Multi-tenant query optimization
CREATE INDEX ON "ConciergeObject"("organizationId", "propertyId", "type");
CREATE INDEX ON "ConciergeObject"("organizationId", "propertyId", "status", "dueAt");
CREATE INDEX ON "Vendor"("organizationId", "propertyId", "category", "isActive");
```

### EAV Query Optimization
```sql
-- Type-specific attribute queries
CREATE INDEX ON "ConciergeAttribute"("objectId", "fieldKey");
CREATE INDEX ON "ConciergeAttribute"("fieldKey", "stringValue") WHERE "stringValue" IS NOT NULL;
CREATE INDEX ON "ConciergeAttribute"("fieldKey", "dateValue") WHERE "dateValue" IS NOT NULL;
```

### Workflow Optimization
```sql
-- SLA and confirmation workflows
CREATE INDEX ON "VendorLink"("status", "expiresAt") WHERE "status" = 'pending';
CREATE INDEX ON "VendorPortalToken"("tokenHash", "expiresAt") WHERE "usedAt" IS NULL;
```

## Data Integrity Constraints

### EAV Value Constraint
Ensures exactly one typed value per ConciergeAttribute:
```sql
ALTER TABLE "ConciergeAttribute" ADD CONSTRAINT "chk_concierge_attr_exactly_one_value"
CHECK (
  (CASE WHEN "stringValue" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "numberValue" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "booleanValue" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "dateValue" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "jsonValue" IS NOT NULL THEN 1 ELSE 0 END) = 1
);
```

### Unique Constraints
- Object type names unique per tenant
- Playbook names unique per tenant  
- Vendor portal tokens unique per link
- Module subscriptions unique per org/property/module combination

## Module Manifests

### Concierge Module
- **Module ID**: `concierge`
- **Category**: Guest Services
- **Dependencies**: `["hr"]`
- **Internal Permissions**: Object management, playbook execution, type definitions
- **Navigation**: Dashboard, Today Board, Objects, Playbooks

### Vendors Module
- **Module ID**: `vendors`
- **Category**: Operations
- **Dependencies**: `["concierge"]`
- **Internal Permissions**: Vendor CRUD, link management, portal administration
- **External Permissions**: Portal access, confirmation workflows
- **Navigation**: Dashboard, Directory, Links, Portal

## Migration Commands

### Apply Schema Changes
```bash
# From packages/database directory
npm run migrate:concierge-vendors
```

### Verify Implementation
```bash
npm run verify:concierge-vendors
```

### Generate Prisma Client
```bash
npm run db:generate
```

## Sample Data

The migration includes sample data for development:
- Guest Request object type with validation schema
- Check-in Preparation playbook with SLA enforcement
- Module subscriptions for existing organizations

## Security Considerations

1. **Multi-Tenant Isolation**: All queries automatically filtered by tenant context
2. **Token Security**: Vendor portal tokens are hashed and have expiry times
3. **Audit Trail**: All modifications logged through existing audit system
4. **Permission Gates**: API endpoints protected by granular permissions
5. **Data Validation**: JSON schemas enforce field types and constraints

## Next Steps

1. **API Implementation**: Create NestJS controllers and services
2. **Worker Services**: Implement playbook execution and SLA monitoring
3. **Frontend Integration**: Build React components for ops views
4. **Vendor Portal**: Implement magic-link authentication and scoped UI
5. **Testing**: End-to-end testing of workflows and multi-tenant isolation

This schema provides a solid foundation for the Concierge and Vendors modules while maintaining the security, performance, and scalability requirements of the Hotel Operations Hub platform.