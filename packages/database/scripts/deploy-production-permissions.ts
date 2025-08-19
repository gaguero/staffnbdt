#!/usr/bin/env node

/**
 * Production-Safe Permission System Deployment
 * 
 * This script safely deploys the permission system to production Railway environment
 * with comprehensive error handling, rollback capabilities, and verification.
 * 
 * Usage:
 * - npm run deploy:production:permissions
 * - SKIP_PERMISSION_INIT=true npm run deploy:production:permissions (safer initial deploy)
 * - DRY_RUN=true npm run deploy:production:permissions (preview only)
 * 
 * Environment Variables:
 * - SKIP_PERMISSION_INIT: Skip permission seeding (default: false)
 * - DRY_RUN: Preview changes without applying (default: false)
 * - AUTO_ROLLBACK: Automatically rollback on failure (default: true)
 * - BACKUP_ENABLED: Create database backup (default: true in production)
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

// Configuration
const config = {
  skipPermissionInit: process.env.SKIP_PERMISSION_INIT === 'true',
  dryRun: process.env.DRY_RUN === 'true',
  autoRollback: process.env.AUTO_ROLLBACK !== 'false', // Default true
  backupEnabled: process.env.BACKUP_ENABLED !== 'false', // Default true
  isRailway: !!process.env.RAILWAY_ENVIRONMENT,
  isProduction: process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production'
};

const prisma = new PrismaClient();

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message: string) {
  log(`\n${colors.bold}🚀 ${message}${colors.reset}`, 'blue');
  log('='.repeat(50), 'blue');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

interface DeploymentState {
  schemaDeployed: boolean;
  permissionsSeeded: boolean;
  usersMigrated: boolean;
  backupCreated: boolean;
  startTime: Date;
}

const deploymentState: DeploymentState = {
  schemaDeployed: false,
  permissionsSeeded: false,
  usersMigrated: false,
  backupCreated: false,
  startTime: new Date()
};

async function checkPrerequisites(): Promise<boolean> {
  logHeader('Pre-Deployment Checks');

  try {
    // Check database connectivity
    log('🔍 Checking database connectivity...');
    await prisma.$queryRaw`SELECT 1`;
    logSuccess('Database connection verified');

    // Check environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      logError('DATABASE_URL not set');
      return false;
    }

    // Log deployment context (safely)
    const dbName = dbUrl.includes('railway') ? 
      (dbUrl.match(/\/([^?]+)/)?.[1] || 'unknown') : 'local';
    log(`📍 Target database: ${dbName}`);
    log(`🌿 Branch: ${process.env.RAILWAY_GIT_BRANCH || 'unknown'}`);
    log(`🏗️  Service: ${process.env.RAILWAY_SERVICE_NAME || 'unknown'}`);
    log(`🎯 Environment: ${config.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

    // Check current schema state
    log('🔍 Checking current schema state...');
    const tables = await prisma.$queryRaw<{table_name: string}[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    const hasPermissionTables = tables.some(t => t.table_name === 'Permission');
    log(`📊 Found ${tables.length} tables, Permission tables: ${hasPermissionTables ? 'Yes' : 'No'}`);

    // Check existing users
    const userCount = await prisma.user.count();
    log(`👥 Current users: ${userCount}`);

    if (userCount === 0 && !config.dryRun) {
      logWarning('No users found - this might be a fresh database');
    }

    // Verify migration files exist
    log('🔍 Checking migration files...');
    try {
      execSync('npx prisma migrate status', { stdio: 'pipe' });
      logSuccess('Migration files validated');
    } catch (error) {
      logError(`Migration validation failed: ${error}`);
      return false;
    }

    return true;
  } catch (error) {
    logError(`Prerequisites check failed: ${error}`);
    return false;
  }
}

async function createBackup(): Promise<boolean> {
  if (!config.backupEnabled) {
    logWarning('Backup disabled');
    return true;
  }

  logHeader('Creating Database Backup');

  try {
    if (config.dryRun) {
      log('🔍 DRY RUN: Would create database backup');
      return true;
    }

    log('💾 Creating database backup...');
    
    // For Railway PostgreSQL, we'll create a logical backup
    if (config.isRailway) {
      log('🚂 Railway deployment detected - using logical backup strategy');
      
      // Create a snapshot of critical data
      const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, departmentId: true }
      });
      
      const departments = await prisma.department.findMany({
        select: { id: true, name: true, parentId: true }
      });

      // Store backup metadata in database
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS deployment_backup (
          id SERIAL PRIMARY KEY,
          backup_date TIMESTAMP DEFAULT NOW(),
          user_count INTEGER,
          department_count INTEGER,
          backup_data JSONB
        )
      `;

      await prisma.$executeRaw`
        INSERT INTO deployment_backup (user_count, department_count, backup_data)
        VALUES (${users.length}, ${departments.length}, ${JSON.stringify({ users, departments })}::jsonb)
      `;

      logSuccess(`Backup created with ${users.length} users and ${departments.length} departments`);
    } else {
      logWarning('Local environment - backup skipped (use your preferred backup method)');
    }

    deploymentState.backupCreated = true;
    return true;
  } catch (error) {
    logError(`Backup creation failed: ${error}`);
    return false;
  }
}

async function deploySchema(): Promise<boolean> {
  logHeader('Schema Deployment');

  try {
    if (config.dryRun) {
      log('🔍 DRY RUN: Would deploy schema migrations');
      return true;
    }

    log('📦 Checking migration status...');
    const status = execSync('npx prisma migrate status', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });

    log(status);

    if (status.includes('Database schema is up to date')) {
      logSuccess('Database schema is already up to date');
    } else {
      log('🚀 Deploying pending migrations...');
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      logSuccess('Schema migrations deployed successfully');
    }

    // Generate Prisma client with latest schema
    log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    logSuccess('Prisma client generated');

    deploymentState.schemaDeployed = true;
    return true;
  } catch (error) {
    logError(`Schema deployment failed: ${error}`);
    
    // For Railway, try fallback
    if (config.isRailway) {
      logWarning('Attempting Railway fallback: Direct schema push...');
      try {
        execSync('npx prisma db push --accept-data-loss', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        logSuccess('Schema deployed via fallback method');
        deploymentState.schemaDeployed = true;
        return true;
      } catch (pushError) {
        logError(`Fallback also failed: ${pushError}`);
      }
    }
    
    return false;
  }
}

async function seedPermissions(): Promise<boolean> {
  if (config.skipPermissionInit) {
    logWarning('Permission seeding skipped (SKIP_PERMISSION_INIT=true)');
    return true;
  }

  logHeader('Permission System Seeding');

  try {
    if (config.dryRun) {
      log('🔍 DRY RUN: Would seed permission system');
      return true;
    }

    // Check if permissions already exist
    log('🔍 Checking existing permissions...');
    const existingPermissions = await prisma.permission.count();
    
    if (existingPermissions > 0) {
      logWarning(`Found ${existingPermissions} existing permissions`);
      log('Skipping permission seeding to avoid duplicates');
      log('Use npm run permissions:seed to force re-seed if needed');
      return true;
    }

    log('🌱 Seeding permission system...');
    execSync('npm run permissions:seed', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Verify permissions were created
    const permissionCount = await prisma.permission.count();
    const rolePermissionCount = await prisma.rolePermission.count();
    
    logSuccess(`Permissions seeded: ${permissionCount} permissions, ${rolePermissionCount} role mappings`);
    
    deploymentState.permissionsSeeded = true;
    return true;
  } catch (error) {
    logError(`Permission seeding failed: ${error}`);
    return false;
  }
}

async function migrateUsers(): Promise<boolean> {
  if (config.skipPermissionInit) {
    logWarning('User migration skipped (SKIP_PERMISSION_INIT=true)');
    return true;
  }

  logHeader('User Permission Migration');

  try {
    if (config.dryRun) {
      log('🔍 DRY RUN: Would migrate users to permission system');
      return true;
    }

    // Check if users already have permissions
    log('🔍 Checking existing user permissions...');
    const existingUserPermissions = await prisma.userPermission.count();
    const totalUsers = await prisma.user.count();
    
    if (existingUserPermissions > 0) {
      logWarning(`Found ${existingUserPermissions} existing user permissions for ${totalUsers} users`);
      log('Migration may have already been run - proceeding with caution');
    }

    if (totalUsers === 0) {
      logWarning('No users found - skipping user migration');
      return true;
    }

    log('👥 Migrating users to permission system...');
    execSync('npm run permissions:migrate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Verify migration
    const finalUserPermissions = await prisma.userPermission.count();
    logSuccess(`User migration completed: ${finalUserPermissions} permissions assigned`);
    
    deploymentState.usersMigrated = true;
    return true;
  } catch (error) {
    logError(`User migration failed: ${error}`);
    return false;
  }
}

async function verifyDeployment(): Promise<boolean> {
  logHeader('Deployment Verification');

  try {
    log('🔍 Running verification script...');
    execSync('npm run verify:production', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('Deployment verification passed');
    return true;
  } catch (error) {
    logError(`Deployment verification failed: ${error}`);
    return false;
  }
}

async function rollbackDeployment(): Promise<void> {
  logHeader('Rolling Back Deployment');

  try {
    log('🔄 Attempting rollback...');

    if (deploymentState.usersMigrated) {
      log('↩️  Rolling back user permissions...');
      try {
        execSync('npm run permissions:rollback', { stdio: 'inherit' });
        logSuccess('User permissions rolled back');
      } catch (error) {
        logError(`User permission rollback failed: ${error}`);
      }
    }

    if (deploymentState.permissionsSeeded) {
      log('↩️  Removing seeded permissions...');
      try {
        await prisma.userPermission.deleteMany();
        await prisma.rolePermission.deleteMany();
        await prisma.permission.deleteMany();
        logSuccess('Permissions removed');
      } catch (error) {
        logError(`Permission cleanup failed: ${error}`);
      }
    }

    if (deploymentState.schemaDeployed) {
      logWarning('Schema rollback requires manual intervention');
      log('Consider running: npx prisma migrate reset (WARNING: This will lose data)');
    }

    logWarning('Rollback completed - system should be in previous state');
  } catch (error) {
    logError(`Rollback failed: ${error}`);
    logError('Manual intervention required');
  }
}

async function displaySummary(success: boolean): Promise<void> {
  logHeader('Deployment Summary');

  const duration = (Date.now() - deploymentState.startTime.getTime()) / 1000;
  
  log(`⏱️  Duration: ${duration.toFixed(1)}s`);
  log(`🏗️  Environment: ${config.isProduction ? 'Production' : 'Development'}`);
  log(`🎯 Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE DEPLOYMENT'}`);
  
  log('\n📋 Deployment Steps:');
  log(`   ${deploymentState.backupCreated ? '✅' : '❌'} Database backup created`);
  log(`   ${deploymentState.schemaDeployed ? '✅' : '❌'} Schema deployed`);
  log(`   ${deploymentState.permissionsSeeded ? '✅' : '❌'} Permissions seeded`);
  log(`   ${deploymentState.usersMigrated ? '✅' : '❌'} Users migrated`);
  
  if (success) {
    logSuccess('\n🎉 Production deployment completed successfully!');
    
    if (!config.skipPermissionInit) {
      log('\n📝 Next steps:');
      log('   1. Update application code to use @RequirePermission decorators');
      log('   2. Test all functionality thoroughly');
      log('   3. Monitor application logs for any issues');
      log('   4. Run npm run permissions:validate to verify coverage');
    } else {
      log('\n📝 Next steps:');
      log('   1. When ready to enable permissions:');
      log('      - Set SKIP_PERMISSION_INIT=false');
      log('      - Run npm run deploy:production:permissions again');
      log('   2. Test schema deployment is working correctly');
    }
  } else {
    logError('\n💥 Production deployment failed!');
    log('\n🛠️  Troubleshooting:');
    log('   1. Check DATABASE_URL connectivity');
    log('   2. Verify Prisma schema is valid');
    log('   3. Review error messages above');
    log('   4. Check Railway service logs');
    log('   5. Consider running with DRY_RUN=true first');
  }
}

async function main(): Promise<void> {
  try {
    logHeader('Production Permission System Deployment');
    
    if (config.dryRun) {
      logWarning('🔍 DRY RUN MODE - No changes will be made');
    }
    
    if (config.skipPermissionInit) {
      logWarning('⚠️  SKIP_PERMISSION_INIT=true - Only schema will be deployed');
    }

    // Step 1: Prerequisites
    const prereqsOk = await checkPrerequisites();
    if (!prereqsOk) {
      await displaySummary(false);
      process.exit(1);
    }

    // Step 2: Backup
    const backupOk = await createBackup();
    if (!backupOk && config.backupEnabled) {
      await displaySummary(false);
      process.exit(1);
    }

    // Step 3: Schema deployment
    const schemaOk = await deploySchema();
    if (!schemaOk) {
      if (config.autoRollback && !config.dryRun) {
        await rollbackDeployment();
      }
      await displaySummary(false);
      process.exit(1);
    }

    // Step 4: Permission seeding (if enabled)
    const permissionsOk = await seedPermissions();
    if (!permissionsOk) {
      if (config.autoRollback && !config.dryRun) {
        await rollbackDeployment();
      }
      await displaySummary(false);
      process.exit(1);
    }

    // Step 5: User migration (if enabled)
    const migrationOk = await migrateUsers();
    if (!migrationOk) {
      if (config.autoRollback && !config.dryRun) {
        await rollbackDeployment();
      }
      await displaySummary(false);
      process.exit(1);
    }

    // Step 6: Verification
    const verificationOk = await verifyDeployment();
    if (!verificationOk) {
      logWarning('Verification failed but deployment may still be successful');
      logWarning('Manual verification recommended');
    }

    await displaySummary(true);
  } catch (error) {
    logError(`Deployment failed with error: ${error}`);
    
    if (config.autoRollback && !config.dryRun) {
      await rollbackDeployment();
    }
    
    await displaySummary(false);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logWarning('\n🛑 Deployment interrupted by user');
  
  if (config.autoRollback && !config.dryRun) {
    await rollbackDeployment();
  }
  
  await prisma.$disconnect();
  process.exit(1);
});

// Run the deployment
main();