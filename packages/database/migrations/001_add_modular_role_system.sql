-- Migration: Add Modular Role-Based UI System Support
-- This migration adds support for external users, module management, and UI restrictions

-- Create UserType enum
CREATE TYPE "UserType" AS ENUM ('INTERNAL', 'CLIENT', 'VENDOR', 'PARTNER');

-- Add new columns to User table
ALTER TABLE "User" ADD COLUMN "userType" "UserType" NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "User" ADD COLUMN "externalOrganization" TEXT;
ALTER TABLE "User" ADD COLUMN "accessPortal" TEXT DEFAULT 'staff';

-- Add new columns to CustomRole table
ALTER TABLE "CustomRole" ADD COLUMN "userType" "UserType" NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "CustomRole" ADD COLUMN "allowedModules" JSONB;

-- Create ModuleManifest table
CREATE TABLE "module_manifests" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "internalPermissions" JSONB NOT NULL,
    "externalPermissions" JSONB NOT NULL,
    "internalNavigation" JSONB NOT NULL,
    "externalNavigation" JSONB NOT NULL,
    "dependencies" JSONB,
    "isSystemModule" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_manifests_pkey" PRIMARY KEY ("id")
);

-- Create UIRestriction table
CREATE TABLE "ui_restrictions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "hiddenModules" JSONB,
    "hiddenFeatures" JSONB,
    "readOnlyFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_restrictions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on moduleId
CREATE UNIQUE INDEX "module_manifests_moduleId_key" ON "module_manifests"("moduleId");

-- Create index on userType for CustomRole
CREATE INDEX "CustomRole_userType_idx" ON "CustomRole"("userType");

-- Add foreign key constraint for UIRestriction
ALTER TABLE "ui_restrictions" ADD CONSTRAINT "ui_restrictions_roleId_fkey" 
    FOREIGN KEY ("roleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert some sample system module manifests
INSERT INTO "module_manifests" ("id", "moduleId", "name", "version", "category", "description", 
    "internalPermissions", "externalPermissions", "internalNavigation", "externalNavigation",
    "dependencies", "isSystemModule", "isActive") VALUES
    (
        'mod_hr_001',
        'hr',
        'Human Resources',
        '1.0.0',
        'Management',
        'Employee management, payroll, and HR operations',
        '[
            {"resource": "user", "action": "create", "scope": "department", "name": "Create Department Users", "category": "HR"},
            {"resource": "user", "action": "read", "scope": "department", "name": "View Department Users", "category": "HR"},
            {"resource": "user", "action": "update", "scope": "department", "name": "Update Department Users", "category": "HR"},
            {"resource": "payslip", "action": "read", "scope": "department", "name": "View Department Payslips", "category": "HR"}
        ]',
        '[
            {"resource": "user", "action": "read", "scope": "own", "name": "View Own Profile", "category": "HR"},
            {"resource": "payslip", "action": "read", "scope": "own", "name": "View Own Payslips", "category": "HR"}
        ]',
        '[
            {"id": "hr-dashboard", "label": "HR Dashboard", "path": "/hr", "icon": "users", "requiredPermissions": ["user.read.department"]},
            {"id": "hr-employees", "label": "Employees", "path": "/hr/employees", "icon": "user", "requiredPermissions": ["user.read.department"]},
            {"id": "hr-payroll", "label": "Payroll", "path": "/hr/payroll", "icon": "dollar-sign", "requiredPermissions": ["payslip.read.department"]}
        ]',
        '[
            {"id": "profile", "label": "My Profile", "path": "/profile", "icon": "user", "requiredPermissions": ["user.read.own"]},
            {"id": "payslips", "label": "My Payslips", "path": "/payslips", "icon": "file-text", "requiredPermissions": ["payslip.read.own"]}
        ]',
        '[]',
        true,
        true
    ),
    (
        'mod_inventory_001',
        'inventory',
        'Inventory Management',
        '1.0.0',
        'Operations',
        'Track and manage hotel inventory and supplies',
        '[
            {"resource": "inventory", "action": "create", "scope": "property", "name": "Create Inventory Items", "category": "Inventory"},
            {"resource": "inventory", "action": "read", "scope": "property", "name": "View Property Inventory", "category": "Inventory"},
            {"resource": "inventory", "action": "update", "scope": "property", "name": "Update Inventory", "category": "Inventory"},
            {"resource": "inventory", "action": "delete", "scope": "property", "name": "Delete Inventory Items", "category": "Inventory"}
        ]',
        '[
            {"resource": "inventory", "action": "read", "scope": "public", "name": "View Available Items", "category": "Inventory"}
        ]',
        '[
            {"id": "inventory-dashboard", "label": "Inventory", "path": "/inventory", "icon": "package", "requiredPermissions": ["inventory.read.property"]},
            {"id": "inventory-items", "label": "Items", "path": "/inventory/items", "icon": "box", "requiredPermissions": ["inventory.read.property"]},
            {"id": "inventory-reports", "label": "Reports", "path": "/inventory/reports", "icon": "bar-chart", "requiredPermissions": ["inventory.read.property"]}
        ]',
        '[]',
        '[]',
        true,
        true
    ),
    (
        'mod_maintenance_001',
        'maintenance',
        'Maintenance Management',
        '1.0.0',
        'Operations',
        'Manage maintenance tasks and work orders',
        '[
            {"resource": "task", "action": "create", "scope": "property", "name": "Create Maintenance Tasks", "category": "Maintenance"},
            {"resource": "task", "action": "read", "scope": "property", "name": "View Property Tasks", "category": "Maintenance"},
            {"resource": "task", "action": "update", "scope": "property", "name": "Update Tasks", "category": "Maintenance"},
            {"resource": "task", "action": "assign", "scope": "property", "name": "Assign Tasks", "category": "Maintenance"}
        ]',
        '[
            {"resource": "task", "action": "read", "scope": "assigned", "name": "View Assigned Tasks", "category": "Maintenance"},
            {"resource": "task", "action": "update", "scope": "assigned", "name": "Update Assigned Tasks", "category": "Maintenance"}
        ]',
        '[
            {"id": "maintenance-dashboard", "label": "Maintenance", "path": "/maintenance", "icon": "wrench", "requiredPermissions": ["task.read.property"]},
            {"id": "maintenance-tasks", "label": "Tasks", "path": "/maintenance/tasks", "icon": "check-square", "requiredPermissions": ["task.read.property"]},
            {"id": "maintenance-schedule", "label": "Schedule", "path": "/maintenance/schedule", "icon": "calendar", "requiredPermissions": ["task.read.property"]}
        ]',
        '[
            {"id": "my-tasks", "label": "My Tasks", "path": "/tasks", "icon": "check-square", "requiredPermissions": ["task.read.assigned"]}
        ]',
        '[]',
        true,
        true
    );

-- Enable the HR module for the default organization if it exists
INSERT INTO "ModuleSubscription" ("id", "organizationId", "moduleName", "isEnabled", "enabledAt", "createdAt", "updatedAt")
SELECT 
    'sub_' || "id" || '_hr',
    "id",
    'hr',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Organization" 
WHERE "slug" = 'nayara-group'
ON CONFLICT ("organizationId", "moduleName") DO NOTHING;