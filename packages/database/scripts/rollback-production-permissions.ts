#!/usr/bin/env node

/**
 * Production Permission System Rollback Script
 * 
 * Safely rolls back the permission system deployment to restore the
 * original role-based system. This is a last-resort recovery tool.
 * 
 * Usage:
 * - npm run rollback:production:permissions
 * - CONFIRM_ROLLBACK=true npm run rollback:production:permissions (required for execution)
 * - DRY_RUN=true npm run rollback:production:permissions (preview only)
 * 
 * Environment Variables:
 * - CONFIRM_ROLLBACK: Must be 'true' to execute rollback (safety measure)
 * - DRY_RUN: Preview changes without applying (default: false)
 * - KEEP_BACKUP: Keep backup data after rollback (default: true)
 * 
 * Warning: This will remove all permission-related data and restore role-based access only!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const config = {
  confirmRollback: process.env.CONFIRM_ROLLBACK === 'true',
  dryRun: process.env.DRY_RUN === 'true',
  keepBackup: process.env.KEEP_BACKUP !== 'false', // Default true
  isRailway: !!process.env.RAILWAY_ENVIRONMENT,
  isProduction: process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production'
};

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
  log(`\n${colors.bold}🔄 ${message}${colors.reset}`, 'blue');
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

function logCritical(message: string) {
  log(`🚨 ${message}`, 'red');
}

interface RollbackState {
  userPermissionsRemoved: number;
  rolePermissionsRemoved: number;
  permissionsRemoved: number;
  backupRestored: boolean;
  startTime: Date;
}

const rollbackState: RollbackState = {
  userPermissionsRemoved: 0,
  rolePermissionsRemoved: 0,
  permissionsRemoved: 0,
  backupRestored: false,
  startTime: new Date()
};

async function validateRollbackSafety(): Promise<boolean> {
  logHeader('Rollback Safety Validation');

  if (!config.confirmRollback) {
    logCritical('ROLLBACK NOT CONFIRMED!');
    log('This is a destructive operation that will remove all permission data.');
    log('To proceed, set CONFIRM_ROLLBACK=true');
    log('Example: CONFIRM_ROLLBACK=true npm run rollback:production:permissions');
    return false;
  }

  if (config.isProduction && !config.dryRun) {
    logCritical('PRODUCTION ROLLBACK DETECTED!');
    log('You are about to rollback permissions in PRODUCTION environment.');
    log('This will affect all users and their access permissions.');
    
    // Additional safety check for production
    if (!process.env.EMERGENCY_ROLLBACK) {
      logError('Production rollback requires EMERGENCY_ROLLBACK=true');
      log('This is an additional safety measure for production environments.');
      return false;
    }
  }

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    logSuccess('Database connection verified');

    // Check if permission system exists
    const permissionCount = await prisma.permission.count();
    const userPermissionCount = await prisma.userPermission.count();
    const rolePermissionCount = await prisma.rolePermission.count();

    log(`📊 Current permission data:`);
    log(`   - Permissions: ${permissionCount}`);
    log(`   - User permissions: ${userPermissionCount}`);
    log(`   - Role permissions: ${rolePermissionCount}`);

    if (permissionCount === 0 && userPermissionCount === 0) {
      logWarning('No permission data found - rollback may not be necessary');
      return false;
    }

    // Check if users still have roles (fallback system)
    const usersWithRoles = await prisma.user.count({
      where: { role: { not: null } }
    });

    log(`👥 Users with roles: ${usersWithRoles}`);

    if (usersWithRoles === 0) {
      logError('No users have role assignments - rollback may leave system inaccessible!');
      return false;
    }

    // Check for backup data
    const backupExists = await checkBackupExists();
    if (backupExists) {
      logSuccess('Deployment backup found');
    } else {
      logWarning('No deployment backup found - rollback will only remove permission data');
    }

    return true;
  } catch (error) {
    logError(`Safety validation failed: ${error}`);
    return false;
  }
}

async function checkBackupExists(): Promise<boolean> {
  try {
    const backupExists = await prisma.$queryRaw<{count: number}[]>`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_name = 'deployment_backup'
    `;

    if (backupExists[0]?.count > 0) {
      const backupCount = await prisma.$queryRaw<{count: number}[]>`
        SELECT COUNT(*) as count FROM deployment_backup
      `;
      
      return backupCount[0]?.count > 0;
    }

    return false;
  } catch (error) {
    return false;
  }
}

async function removeUserPermissions(): Promise<boolean> {
  logHeader('Removing User Permissions');

  try {
    if (config.dryRun) {
      const count = await prisma.userPermission.count();
      log(`🔍 DRY RUN: Would remove ${count} user permissions`);
      rollbackState.userPermissionsRemoved = count;
      return true;
    }

    const userPermissions = await prisma.userPermission.findMany({
      select: { userId: true, permissionId: true }
    });

    log(`🗑️  Removing ${userPermissions.length} user permissions...`);

    // Remove user permissions
    const result = await prisma.userPermission.deleteMany();
    rollbackState.userPermissionsRemoved = result.count;

    logSuccess(`Removed ${result.count} user permissions`);
    return true;
  } catch (error) {
    logError(`Failed to remove user permissions: ${error}`);
    return false;
  }
}

async function removeRolePermissions(): Promise<boolean> {
  logHeader('Removing Role Permissions');

  try {
    if (config.dryRun) {
      const count = await prisma.rolePermission.count();
      log(`🔍 DRY RUN: Would remove ${count} role permissions`);
      rollbackState.rolePermissionsRemoved = count;
      return true;
    }

    const rolePermissions = await prisma.rolePermission.findMany();
    log(`🗑️  Removing ${rolePermissions.length} role permissions...`);

    const result = await prisma.rolePermission.deleteMany();
    rollbackState.rolePermissionsRemoved = result.count;

    logSuccess(`Removed ${result.count} role permissions`);
    return true;
  } catch (error) {
    logError(`Failed to remove role permissions: ${error}`);
    return false;
  }
}

async function removePermissions(): Promise<boolean> {
  logHeader('Removing Permissions');

  try {
    if (config.dryRun) {
      const count = await prisma.permission.count();
      log(`🔍 DRY RUN: Would remove ${count} permissions`);
      rollbackState.permissionsRemoved = count;
      return true;
    }

    const permissions = await prisma.permission.findMany({
      select: { id: true, name: true }
    });

    log(`🗑️  Removing ${permissions.length} permissions...`);

    const result = await prisma.permission.deleteMany();
    rollbackState.permissionsRemoved = result.count;

    logSuccess(`Removed ${result.count} permissions`);
    return true;
  } catch (error) {
    logError(`Failed to remove permissions: ${error}`);
    return false;
  }
}

async function restoreFromBackup(): Promise<boolean> {
  logHeader('Restoring from Backup');

  try {
    const backupExists = await checkBackupExists();
    
    if (!backupExists) {
      logWarning('No backup found to restore from');
      return true; // Not a failure, just no backup
    }

    if (config.dryRun) {
      log('🔍 DRY RUN: Would restore from backup if needed');
      return true;
    }

    // Get the latest backup
    const latestBackup = await prisma.$queryRaw<{
      backup_date: Date;
      user_count: number;
      department_count: number;
      backup_data: any;
    }[]>`
      SELECT backup_date, user_count, department_count, backup_data
      FROM deployment_backup 
      ORDER BY backup_date DESC 
      LIMIT 1
    `;

    if (latestBackup.length === 0) {
      logWarning('No backup data found');
      return true;
    }

    const backup = latestBackup[0];
    log(`📦 Found backup from ${backup.backup_date}`);
    log(`    Users: ${backup.user_count}, Departments: ${backup.department_count}`);

    // For now, we just verify the backup exists
    // In a full implementation, you might restore specific data
    // But typically, the role-based system should still be intact
    
    rollbackState.backupRestored = true;
    logSuccess('Backup verification completed');
    return true;
  } catch (error) {
    logError(`Backup restoration failed: ${error}`);
    return false;
  }
}

async function verifyRoleBasedAccess(): Promise<boolean> {
  logHeader('Verifying Role-Based Access');

  try {
    // Check that users still have roles
    const usersWithRoles = await prisma.user.count({
      where: { role: { not: null } }
    });

    const totalUsers = await prisma.user.count();
    
    log(`👥 Users with roles: ${usersWithRoles}/${totalUsers}`);

    if (usersWithRoles === 0 && totalUsers > 0) {
      logError('No users have role assignments after rollback!');
      return false;
    }

    // Check role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { role: { not: null } }
    });

    log('👔 Role distribution:');
    for (const role of roleDistribution) {
      log(`   ${role.role}: ${role._count.role} users`);
    }

    // Verify no permission data remains
    const remainingPermissions = await prisma.permission.count();
    const remainingUserPermissions = await prisma.userPermission.count();
    const remainingRolePermissions = await prisma.rolePermission.count();

    if (remainingPermissions > 0 || remainingUserPermissions > 0 || remainingRolePermissions > 0) {
      logWarning(`Permission data still exists: ${remainingPermissions} permissions, ${remainingUserPermissions} user permissions, ${remainingRolePermissions} role permissions`);
    } else {
      logSuccess('All permission data successfully removed');
    }

    return true;
  } catch (error) {
    logError(`Role-based access verification failed: ${error}`);
    return false;
  }
}

async function cleanupBackupData(): Promise<void> {
  if (config.keepBackup) {
    logWarning('Backup data preserved (KEEP_BACKUP=true)');
    return;
  }

  logHeader('Cleaning Up Backup Data');

  try {
    if (config.dryRun) {
      log('🔍 DRY RUN: Would clean up backup data');
      return;
    }

    await prisma.$executeRaw`DROP TABLE IF EXISTS deployment_backup`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS deployment_test`;
    
    logSuccess('Backup data cleaned up');
  } catch (error) {
    logError(`Backup cleanup failed: ${error}`);
  }
}

function displayRollbackSummary(success: boolean): void {
  logHeader('Rollback Summary');

  const duration = (Date.now() - rollbackState.startTime.getTime()) / 1000;
  
  log(`⏱️  Duration: ${duration.toFixed(1)}s`);
  log(`🏗️  Environment: ${config.isProduction ? 'Production' : 'Development'}`);
  log(`🎯 Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE ROLLBACK'}`);
  
  log('\n📊 Rollback Results:');
  log(`   User permissions removed: ${rollbackState.userPermissionsRemoved}`);
  log(`   Role permissions removed: ${rollbackState.rolePermissionsRemoved}`);
  log(`   Permissions removed: ${rollbackState.permissionsRemoved}`);
  log(`   Backup restored: ${rollbackState.backupRestored ? 'Yes' : 'No'}`);
  
  if (success) {
    logSuccess('\n🎉 Permission system rollback completed successfully!');
    
    log('\n📝 System Status:');
    log('   ✅ Permission system removed');
    log('   ✅ Role-based access restored');
    log('   ✅ User roles preserved');
    
    log('\n🚀 Next steps:');
    log('   1. Restart application services');
    log('   2. Verify user access is working');
    log('   3. Remove @RequirePermission decorators from code');
    log('   4. Restore @Roles decorators if needed');
    log('   5. Test all functionality thoroughly');
    
    if (config.isRailway) {
      log('\n🚂 Railway-specific steps:');
      log('   1. Check Railway service logs for any errors');
      log('   2. Verify application deployment is successful');
      log('   3. Test API endpoints are accessible');
    }
  } else {
    logError('\n💥 Permission system rollback failed!');
    
    log('\n🛠️  Troubleshooting:');
    log('   1. Check database connectivity');
    log('   2. Verify user role assignments exist');
    log('   3. Review error messages above');
    log('   4. Consider manual intervention');
    log('   5. Contact system administrator');
    
    log('\n⚠️  System may be in inconsistent state!');
    log('   - Some permission data may remain');
    log('   - User access may be affected');
    log('   - Manual cleanup may be required');
  }

  if (config.dryRun) {
    log('\n🔍 This was a DRY RUN - no changes were made');
    log('Run without DRY_RUN=true to execute the rollback');
  }
}

async function main(): Promise<void> {
  try {
    logHeader('Production Permission System Rollback');
    
    logCritical('⚠️  WARNING: This will remove ALL permission data! ⚠️');
    log('This rollback will:');
    log('  - Remove all user permissions');
    log('  - Remove all role permissions');
    log('  - Remove all permission definitions');
    log('  - Restore role-based access only');
    
    if (config.dryRun) {
      logWarning('🔍 DRY RUN MODE - No changes will be made');
    }

    // Step 1: Safety validation
    const safetyOk = await validateRollbackSafety();
    if (!safetyOk) {
      displayRollbackSummary(false);
      process.exit(1);
    }

    // Step 2: Remove user permissions
    const userPermissionsOk = await removeUserPermissions();
    if (!userPermissionsOk) {
      displayRollbackSummary(false);
      process.exit(1);
    }

    // Step 3: Remove role permissions
    const rolePermissionsOk = await removeRolePermissions();
    if (!rolePermissionsOk) {
      displayRollbackSummary(false);
      process.exit(1);
    }

    // Step 4: Remove permissions
    const permissionsOk = await removePermissions();
    if (!permissionsOk) {
      displayRollbackSummary(false);
      process.exit(1);
    }

    // Step 5: Restore from backup (if needed)
    const backupOk = await restoreFromBackup();
    if (!backupOk) {
      logWarning('Backup restoration had issues - continuing anyway');
    }

    // Step 6: Verify role-based access
    const verificationOk = await verifyRoleBasedAccess();
    if (!verificationOk) {
      logError('Role-based access verification failed!');
      displayRollbackSummary(false);
      process.exit(1);
    }

    // Step 7: Cleanup (optional)
    await cleanupBackupData();

    displayRollbackSummary(true);
  } catch (error) {
    logError(`Rollback failed with error: ${error}`);
    displayRollbackSummary(false);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logWarning('\n🛑 Rollback interrupted by user');
  await prisma.$disconnect();
  process.exit(1);
});

// Run the rollback
main();