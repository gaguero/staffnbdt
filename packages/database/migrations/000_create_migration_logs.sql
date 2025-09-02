-- Migration: Create Migration Logs Table
-- Date: 2025-09-01
-- Description: Create a table to track custom migrations execution

-- Create migration_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_logs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_migration_logs_name ON migration_logs(name);
CREATE INDEX IF NOT EXISTS idx_migration_logs_executed_at ON migration_logs(executed_at);

-- Log this migration
INSERT INTO migration_logs (name, executed_at, description) 
VALUES ('000_create_migration_logs', NOW(), 'Created migration_logs table to track custom migrations')
ON CONFLICT (name) DO NOTHING;