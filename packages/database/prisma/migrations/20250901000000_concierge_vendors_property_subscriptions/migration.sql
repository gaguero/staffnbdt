-- Concierge/Vendors schema and property-level ModuleSubscription

-- 1) Extend ModuleSubscription with propertyId and uniqueness
ALTER TABLE "ModuleSubscription" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;

-- FK to Property (nullable)
DO $$ BEGIN
  ALTER TABLE "ModuleSubscription"
    ADD CONSTRAINT "ModuleSubscription_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Unique indexes
-- Property-level uniqueness (allows multiple NULLs, so we also add org-level partial below)
CREATE UNIQUE INDEX IF NOT EXISTS "ModuleSubscription_org_mod_prop_key"
ON "ModuleSubscription" ("organizationId", "moduleName", "propertyId");

-- Org-level uniqueness when propertyId IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS "ModuleSubscription_org_mod_orglevel_key"
ON "ModuleSubscription" ("organizationId", "moduleName")
WHERE "propertyId" IS NULL;

-- 2) Concierge core tables
CREATE TABLE IF NOT EXISTS "ConciergeObject" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "reservationId" TEXT,
  "guestId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "dueAt" TIMESTAMP(3),
  "assignments" JSONB,
  "files" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ConciergeObject_pkey" PRIMARY KEY ("id")
);

-- FK to Property
DO $$ BEGIN
  ALTER TABLE "ConciergeObject"
    ADD CONSTRAINT "ConciergeObject_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ConciergeObject_tenant_type_idx"
ON "ConciergeObject" ("organizationId", "propertyId", "type");

CREATE INDEX IF NOT EXISTS "ConciergeObject_tenant_status_due_idx"
ON "ConciergeObject" ("organizationId", "propertyId", "status", "dueAt");

CREATE TABLE IF NOT EXISTS "ConciergeAttribute" (
  "id" TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "fieldType" TEXT NOT NULL,
  "stringValue" TEXT,
  "numberValue" DOUBLE PRECISION,
  "booleanValue" BOOLEAN,
  "dateValue" TIMESTAMP(3),
  "jsonValue" JSONB,
  CONSTRAINT "ConciergeAttribute_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ConciergeAttribute"
    ADD CONSTRAINT "ConciergeAttribute_objectId_fkey"
    FOREIGN KEY ("objectId") REFERENCES "ConciergeObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ConciergeAttribute_object_field_idx"
ON "ConciergeAttribute" ("objectId", "fieldKey");

CREATE INDEX IF NOT EXISTS "ConciergeAttribute_field_type_idx"
ON "ConciergeAttribute" ("fieldKey", "fieldType");

-- Exactly one typed value must be present
DO $$ BEGIN
  ALTER TABLE "ConciergeAttribute" ADD CONSTRAINT "ConciergeAttribute_exactly_one_value_chk"
  CHECK (
    (CASE WHEN "stringValue"  IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "numberValue"  IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "booleanValue" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "dateValue"    IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "jsonValue"    IS NOT NULL THEN 1 ELSE 0 END)
  = 1);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ObjectType" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fieldsSchema" JSONB NOT NULL,
  "validations" JSONB,
  "uiHints" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT "ObjectType_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ObjectType_tenant_idx"
ON "ObjectType" ("organizationId", "propertyId");

CREATE UNIQUE INDEX IF NOT EXISTS "ObjectType_unique_name_per_tenant_key"
ON "ObjectType" ("organizationId", "propertyId", "name");

CREATE TABLE IF NOT EXISTS "Playbook" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "conditions" JSONB NOT NULL,
  "actions" JSONB NOT NULL,
  "enforcements" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Playbook_tenant_idx"
ON "Playbook" ("organizationId", "propertyId");

CREATE UNIQUE INDEX IF NOT EXISTS "Playbook_unique_name_per_tenant_key"
ON "Playbook" ("organizationId", "propertyId", "name");

-- 3) Vendors tables
CREATE TABLE IF NOT EXISTS "Vendor" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "category" TEXT NOT NULL,
  "policies" JSONB,
  "performance" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Vendor"
    ADD CONSTRAINT "Vendor_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Vendor_tenant_idx"
ON "Vendor" ("organizationId", "propertyId");

CREATE INDEX IF NOT EXISTS "Vendor_active_idx"
ON "Vendor" ("isActive");

CREATE TABLE IF NOT EXISTS "VendorLink" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  "objectType" TEXT NOT NULL,
  "policyRef" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "confirmationAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "VendorLink_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "VendorLink"
    ADD CONSTRAINT "VendorLink_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "VendorLink_vendor_status_idx"
ON "VendorLink" ("vendorId", "status");

CREATE INDEX IF NOT EXISTS "VendorLink_object_type_idx"
ON "VendorLink" ("objectId", "objectType");

-- Vendor portal tokens
CREATE TABLE IF NOT EXISTS "VendorPortalToken" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "linkId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorPortalToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VendorPortalToken_vendor_idx" ON "VendorPortalToken" ("vendorId");
CREATE INDEX IF NOT EXISTS "VendorPortalToken_tenant_idx" ON "VendorPortalToken" ("organizationId", "propertyId");
CREATE INDEX IF NOT EXISTS "VendorPortalToken_expires_idx" ON "VendorPortalToken" ("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "VendorPortalToken_link_hash_key" ON "VendorPortalToken" ("linkId", "tokenHash");


