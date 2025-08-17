-- Multi-Tenant Schema Migration
-- This migration adds support for organizations and properties

-- Create Organization table
CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "logoUrl" TEXT,
  "website" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "address" JSONB,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "settings" JSONB,
  "branding" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Create Property table
CREATE TABLE "Property" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "propertyType" "PropertyType" NOT NULL DEFAULT 'HOTEL',
  "address" JSONB,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "phoneNumber" TEXT,
  "email" TEXT,
  "website" TEXT,
  "settings" JSONB,
  "branding" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- Create PropertyType enum
CREATE TYPE "PropertyType" AS ENUM ('HOTEL', 'RESORT', 'BOUTIQUE_HOTEL', 'CHAIN_HOTEL', 'MOTEL', 'BNB', 'HOSTEL', 'APARTMENT', 'VILLA', 'OTHER');

-- Create ModuleSubscription table
CREATE TABLE "ModuleSubscription" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "moduleName" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "enabledAt" TIMESTAMP(3),
  "disabledAt" TIMESTAMP(3),
  "settings" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ModuleSubscription_pkey" PRIMARY KEY ("id")
);

-- Create TenantSettings table
CREATE TABLE "TenantSettings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "propertyId" TEXT,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "category" TEXT,
  "description" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id")
);

-- Update Role enum to include new roles
ALTER TYPE "Role" ADD VALUE 'PLATFORM_ADMIN';
ALTER TYPE "Role" ADD VALUE 'ORGANIZATION_OWNER';
ALTER TYPE "Role" ADD VALUE 'ORGANIZATION_ADMIN';
ALTER TYPE "Role" ADD VALUE 'PROPERTY_MANAGER';

-- Add organizationId and propertyId to User table
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "User" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to Department table
ALTER TABLE "Department" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to Document table  
ALTER TABLE "Document" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to Payslip table
ALTER TABLE "Payslip" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to Vacation table
ALTER TABLE "Vacation" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to TrainingSession table
ALTER TABLE "TrainingSession" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to CommercialBenefit table
ALTER TABLE "CommercialBenefit" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to Notification table
ALTER TABLE "Notification" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to Invitation table
ALTER TABLE "Invitation" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to AuditLog table
ALTER TABLE "AuditLog" ADD COLUMN "propertyId" TEXT;

-- Create indexes for Organization
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");
CREATE INDEX "Organization_isActive_idx" ON "Organization"("isActive");

-- Create indexes for Property
CREATE UNIQUE INDEX "Property_organizationId_slug_key" ON "Property"("organizationId", "slug");
CREATE INDEX "Property_organizationId_idx" ON "Property"("organizationId");
CREATE INDEX "Property_isActive_idx" ON "Property"("isActive");

-- Create indexes for ModuleSubscription
CREATE UNIQUE INDEX "ModuleSubscription_organizationId_moduleName_key" ON "ModuleSubscription"("organizationId", "moduleName");
CREATE INDEX "ModuleSubscription_organizationId_idx" ON "ModuleSubscription"("organizationId");
CREATE INDEX "ModuleSubscription_moduleName_idx" ON "ModuleSubscription"("moduleName");

-- Create indexes for TenantSettings
CREATE UNIQUE INDEX "TenantSettings_organizationId_propertyId_key_key" ON "TenantSettings"("organizationId", "propertyId", "key");
CREATE INDEX "TenantSettings_organizationId_idx" ON "TenantSettings"("organizationId");
CREATE INDEX "TenantSettings_propertyId_idx" ON "TenantSettings"("propertyId");
CREATE INDEX "TenantSettings_category_idx" ON "TenantSettings"("category");

-- Create indexes for tenant fields on existing tables
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "User_propertyId_idx" ON "User"("propertyId");

CREATE INDEX "Department_propertyId_idx" ON "Department"("propertyId");

CREATE INDEX "Document_propertyId_idx" ON "Document"("propertyId");

CREATE INDEX "Payslip_propertyId_idx" ON "Payslip"("propertyId");

CREATE INDEX "Vacation_propertyId_idx" ON "Vacation"("propertyId");

CREATE INDEX "TrainingSession_propertyId_idx" ON "TrainingSession"("propertyId");

CREATE INDEX "CommercialBenefit_propertyId_idx" ON "CommercialBenefit"("propertyId");

CREATE INDEX "Notification_propertyId_idx" ON "Notification"("propertyId");

CREATE INDEX "Invitation_propertyId_idx" ON "Invitation"("propertyId");

CREATE INDEX "AuditLog_propertyId_idx" ON "AuditLog"("propertyId");

-- Add foreign key constraints
ALTER TABLE "Property" ADD CONSTRAINT "Property_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ModuleSubscription" ADD CONSTRAINT "ModuleSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Department" ADD CONSTRAINT "Department_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Vacation" ADD CONSTRAINT "Vacation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommercialBenefit" ADD CONSTRAINT "CommercialBenefit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update unique constraints to include tenant scoping
ALTER TABLE "Department" DROP CONSTRAINT "Department_name_key";
ALTER TABLE "Department" ADD CONSTRAINT "Department_propertyId_name_key" UNIQUE("propertyId", "name");

ALTER TABLE "Payslip" DROP CONSTRAINT "Payslip_userId_period_key";
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_userId_period_propertyId_key" UNIQUE("userId", "period", "propertyId");

ALTER TABLE "TrainingSession" DROP CONSTRAINT "TrainingSession_title_version_key";
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_propertyId_title_version_key" UNIQUE("propertyId", "title", "version");

ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_email_status_key";
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_propertyId_email_status_key" UNIQUE("propertyId", "email", "status");