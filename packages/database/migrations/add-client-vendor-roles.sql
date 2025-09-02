-- Migration: Add CLIENT and VENDOR roles to the Role enum
-- Date: 2025-09-01
-- Description: Extends the Role enum to include external user roles

-- First, add the new enum values
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CLIENT';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VENDOR';

-- Update any existing custom roles that might reference these roles
-- (This is safe as we're adding new values)

-- Log the migration
INSERT INTO migration_logs (name, executed_at, description) 
VALUES ('add-client-vendor-roles', NOW(), 'Added CLIENT and VENDOR roles to Role enum')
ON CONFLICT (name) DO NOTHING;