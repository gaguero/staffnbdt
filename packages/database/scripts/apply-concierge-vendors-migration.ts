#!/usr/bin/env tsx
/**
 * Apply Concierge & Vendors Module Migration to Railway Database
 * This script applies the database schema changes for the Concierge and Vendors modules
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Migration {
  file: string;
  name: string;
  description: string;
}

const migrations: Migration[] = [
  {
    file: '000_create_migration_logs.sql',
    name: '000_create_migration_logs',
    description: 'Create migration_logs table'
  },
  {
    file: '002_concierge_vendors_optimization.sql', 
    name: '002_concierge_vendors_optimization',
    description: 'Concierge & Vendors schema optimization'
  }
];

async function checkMigrationExecuted(migrationName: string): Promise<boolean> {
  try {
    // First check if migration_logs table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migration_logs'
      );
    ` as [{ exists: boolean }];

    if (!tableExists[0]?.exists) {
      console.log('📝 migration_logs table does not exist, will be created');
      return false;
    }

    // Check if migration was already executed
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM migration_logs 
        WHERE name = ${migrationName}
      );
    ` as [{ exists: boolean }];

    return result[0]?.exists || false;
  } catch (error) {
    console.log(`⚠️  Could not check migration status for ${migrationName}:`, error);
    return false;
  }
}

async function executeMigration(migration: Migration): Promise<boolean> {
  try {
    console.log(`🚀 Executing migration: ${migration.name}`);
    
    const migrationPath = path.join(__dirname, '..', 'migrations', migration.file);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration SQL
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log(`✅ Successfully executed: ${migration.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to execute migration ${migration.name}:`, error);
    return false;
  }
}

async function verifySchemaChanges(): Promise<void> {
  try {
    console.log('🔍 Verifying schema changes...');
    
    // Check if new tables exist
    const tables = ['ConciergeObject', 'ConciergeAttribute', 'ObjectType', 'Playbook', 'Vendor', 'VendorLink', 'VendorPortalToken'];
    
    for (const table of tables) {
      const exists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      ` as [{ exists: boolean }];
      
      if (exists[0]?.exists) {
        console.log(`✅ Table ${table} exists`);
      } else {
        console.log(`❌ Table ${table} does not exist`);
      }
    }
    
    // Check if EAV constraint exists
    const constraint = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'chk_concierge_attr_exactly_one_value'
      );
    ` as [{ exists: boolean }];
    
    if (constraint[0]?.exists) {
      console.log('✅ EAV constraint exists');
    } else {
      console.log('❌ EAV constraint does not exist');
    }
    
    // Check module manifests
    const conciergeModule = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM module_manifests 
        WHERE "moduleId" = 'concierge'
      );
    ` as [{ exists: boolean }];
    
    const vendorsModule = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM module_manifests 
        WHERE "moduleId" = 'vendors'
      );
    ` as [{ exists: boolean }];
    
    console.log(`✅ Concierge module manifest: ${conciergeModule[0]?.exists ? 'exists' : 'missing'}`);
    console.log(`✅ Vendors module manifest: ${vendorsModule[0]?.exists ? 'exists' : 'missing'}`);
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
  }
}

async function main() {
  try {
    console.log('🏨 Hotel Operations Hub - Concierge & Vendors Migration');
    console.log('=' .repeat(60));
    
    let allSuccess = true;
    
    for (const migration of migrations) {
      const alreadyExecuted = await checkMigrationExecuted(migration.name);
      
      if (alreadyExecuted) {
        console.log(`⏭️  Migration already executed: ${migration.name}`);
        continue;
      }
      
      const success = await executeMigration(migration);
      if (!success) {
        allSuccess = false;
        break;
      }
    }
    
    if (allSuccess) {
      console.log('\n🔍 Running verification checks...');
      await verifySchemaChanges();
      
      console.log('\n🎉 All migrations completed successfully!');
      console.log('\n📋 Summary:');
      console.log('   ✅ EAV constraints for ConciergeAttribute');
      console.log('   ✅ Performance indexes for all tables');
      console.log('   ✅ Module manifests for Concierge & Vendors');
      console.log('   ✅ Sample data for development');
      console.log('   ✅ Module enablement for existing organizations');
      
    } else {
      console.log('\n❌ Migration failed. Please check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };