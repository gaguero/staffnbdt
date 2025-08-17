-- Multi-Tenant Schema Migration
-- This migration adds support for organizations and properties

-- CreateEnum for PropertyType
CREATE TYPE "PropertyType" AS ENUM ('HOTEL', 'RESORT', 'BOUTIQUE_HOTEL', 'CHAIN_HOTEL', 'MOTEL', 'BNB', 'HOSTEL', 'APARTMENT', 'VILLA', 'OTHER');

-- Update Role enum to include new roles
ALTER TYPE "Role" ADD VALUE 'PLATFORM_ADMIN';
ALTER TYPE "Role" ADD VALUE 'ORGANIZATION_OWNER';
ALTER TYPE "Role" ADD VALUE 'ORGANIZATION_ADMIN';
ALTER TYPE "Role" ADD VALUE 'PROPERTY_MANAGER';

-- CreateTable Organization
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

-- CreateTable Property
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

-- CreateTable ModuleSubscription
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

-- CreateTable TenantSettings
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

-- Add organizationId and propertyId to User table
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "User" ADD COLUMN "propertyId" TEXT;

-- Add propertyId to existing tables
ALTER TABLE "Department" ADD COLUMN "propertyId" TEXT;
ALTER TABLE "Document" ADD COLUMN "propertyId" TEXT;
ALTER TABLE "Payslip" ADD COLUMN "propertyId" TEXT;
ALTER TABLE "Vacation" ADD COLUMN "propertyId" TEXT;
ALTER TABLE "TrainingSession" ADD COLUMN "propertyId" TEXT;
ALTER TABLE "CommercialBenefit" ADD COLUMN "propertyId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "propertyId" TEXT;
ALTER TABLE "Invitation" ADD COLUMN "propertyId" TEXT;
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
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

CREATE INDEX "Department_propertyId_idx" ON "Department"("propertyId");

CREATE INDEX "Document_propertyId_idx" ON "Document"("propertyId");
CREATE INDEX "Document_departmentId_idx" ON "Document"("departmentId");
CREATE INDEX "Document_scope_idx" ON "Document"("scope");

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

-- Note: We'll make these NOT NULL after we populate them with default values
-- For now, they can be NULL during the migration

-- Update unique constraints to include tenant scoping
ALTER TABLE "Department" DROP CONSTRAINT "Department_name_key";
-- We'll need to add this constraint after we populate propertyId
-- ALTER TABLE "Department" ADD CONSTRAINT "Department_propertyId_name_key" UNIQUE("propertyId", "name");

ALTER TABLE "Payslip" DROP CONSTRAINT "Payslip_userId_period_key";
-- We'll need to add this constraint after we populate propertyId
-- ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_userId_period_propertyId_key" UNIQUE("userId", "period", "propertyId");

ALTER TABLE "TrainingSession" DROP CONSTRAINT "TrainingSession_title_version_key";
-- We'll need to add this constraint after we populate propertyId
-- ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_propertyId_title_version_key" UNIQUE("propertyId", "title", "version");

ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_email_status_key";
-- We'll need to add this constraint after we populate propertyId
-- ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_propertyId_email_status_key" UNIQUE("propertyId", "email", "status");

-- Create a default organization and property for existing data
-- This will be populated by a data migration script