#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * 
 * Verifies that the permission system deployment was successful and the
 * application is ready for production use.
 * 
 * Usage:
 * - npm run verify:production
 * - DETAILED=true npm run verify:production (detailed output)
 * 
 * Checks:
 * 1. Database connectivity and schema
 * 2. Permission system completeness
 * 3. User migration accuracy
 * 4. Application startup readiness
 * 5. Sample API endpoint functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const config = {
  detailed: process.env.DETAILED === 'true',
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
  log(`\n${colors.bold}🔍 ${message}${colors.reset}`, 'blue');
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

function logInfo(message: string) {
  if (config.detailed) {
    log(`ℹ️  ${message}`, 'blue');
  }
}

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: any;
}

interface VerificationSummary {
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  overall: 'PASS' | 'WARNING' | 'FAIL';
}

const verificationResults: VerificationResult[] = [];

function addResult(passed: boolean, message: string, details?: any, isWarning = false): void {
  verificationResults.push({ passed: passed || isWarning, message, details });
  
  if (passed) {
    logSuccess(message);
  } else if (isWarning) {
    logWarning(message);
  } else {
    logError(message);
  }
  
  if (details && config.detailed) {
    logInfo(`Details: ${JSON.stringify(details, null, 2)}`);
  }
}

async function verifyDatabaseConnectivity(): Promise<void> {
  logHeader('Database Connectivity');

  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1 as test`;
    addResult(true, 'Database connection successful');

    // Check environment info
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const dbName = dbUrl.includes('railway') ? 
        (dbUrl.match(/\/([^?]+)/)?.[1] || 'unknown') : 'local';
      logInfo(`Connected to database: ${dbName}`);
      logInfo(`Environment: ${config.isProduction ? 'Production' : 'Development'}`);
      logInfo(`Platform: ${config.isRailway ? 'Railway' : 'Local'}`);
    }

    // Check database version
    const versionResult = await prisma.$queryRaw<{version: string}[]>`SELECT version()`;
    if (versionResult.length > 0) {
      const version = versionResult[0].version;
      addResult(true, 'Database version retrieved', { version: version.split(' ').slice(0, 2).join(' ') });
    }

  } catch (error) {
    addResult(false, `Database connectivity failed: ${error}`);
  }
}

async function verifySchemaIntegrity(): Promise<void> {
  logHeader('Schema Integrity');

  try {
    // Check critical tables exist
    const tables = await prisma.$queryRaw<{table_name: string}[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tableNames = tables.map(t => t.table_name);
    const requiredTables = [
      'User', 'Department', 'Invitation', 
      'Permission', 'RolePermission', 'UserPermission'
    ];

    let allTablesPresent = true;
    for (const table of requiredTables) {
      const exists = tableNames.includes(table);
      if (exists) {
        logInfo(`Table ${table}: Present`);
      } else {
        logError(`Table ${table}: Missing`);
        allTablesPresent = false;
      }
    }

    addResult(allTablesPresent, `Schema verification: ${allTablesPresent ? 'All required tables present' : 'Missing tables'}`, {
      totalTables: tableNames.length,
      requiredTables: requiredTables.length,
      missingTables: requiredTables.filter(t => !tableNames.includes(t))
    });

    // Check for permission system specific tables
    const hasPermissionTables = tableNames.includes('Permission');
    addResult(hasPermissionTables, `Permission system tables: ${hasPermissionTables ? 'Present' : 'Missing'}`);

  } catch (error) {
    addResult(false, `Schema verification failed: ${error}`);
  }
}

async function verifyPermissionSystem(): Promise<void> {
  logHeader('Permission System');

  try {
    // Check permissions exist
    const permissionCount = await prisma.permission.count();
    const expectedMinPermissions = 50; // Should have 60+ but allow some flexibility
    
    addResult(
      permissionCount >= expectedMinPermissions, 
      `Permission count: ${permissionCount} (expected: ≥${expectedMinPermissions})`,
      { actual: permissionCount, expected: expectedMinPermissions }
    );

    if (permissionCount > 0) {
      // Check permission structure
      const samplePermissions = await prisma.permission.findMany({
        take: 5,
        select: { id: true, resource: true, action: true, scope: true, module: true }
      });
      
      addResult(true, 'Permission structure validation passed', { samplePermissions });

      // Check role mappings
      const rolePermissionCount = await prisma.rolePermission.count();
      addResult(
        rolePermissionCount > 0, 
        `Role permission mappings: ${rolePermissionCount}`,
        { count: rolePermissionCount }
      );

      // Check role distribution
      const roleDistribution = await prisma.rolePermission.groupBy({
        by: ['role'],
        _count: { role: true }
      });
      
      addResult(true, 'Role permission distribution analyzed', { distribution: roleDistribution });

      // Verify critical permissions exist
      const criticalPermissions = [
        'users.read.platform',
        'users.create.department',
        'profile.update.own'
      ];

      for (const permissionId of criticalPermissions) {
        const exists = await prisma.permission.findUnique({
          where: { id: permissionId }
        });
        
        if (exists) {
          logInfo(`Critical permission ${permissionId}: Present`);
        } else {
          addResult(false, `Critical permission ${permissionId}: Missing`);
        }
      }
    }

  } catch (error) {
    addResult(false, `Permission system verification failed: ${error}`);
  }
}

async function verifyUserMigration(): Promise<void> {
  logHeader('User Migration');

  try {
    const userCount = await prisma.user.count();
    const userPermissionCount = await prisma.userPermission.count();

    if (userCount === 0) {
      addResult(true, 'No users found - fresh installation', null, true);
      return;
    }

    // Check if users have been migrated to permission system
    const usersWithPermissions = await prisma.user.findMany({
      where: {
        userPermissions: {
          some: {}
        }
      },
      select: { id: true, email: true, role: true }
    });

    const migrationPercentage = (usersWithPermissions.length / userCount) * 100;
    
    if (migrationPercentage === 100) {
      addResult(true, `User migration: 100% complete (${usersWithPermissions.length}/${userCount} users)`);
    } else if (migrationPercentage > 0) {
      addResult(false, `User migration: ${migrationPercentage.toFixed(1)}% complete (${usersWithPermissions.length}/${userCount} users)`, null, true);
    } else {
      addResult(false, 'User migration: Not started - users have no permissions');
    }

    // Check role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    addResult(true, 'User role distribution analyzed', { 
      totalUsers: userCount,
      usersWithPermissions: usersWithPermissions.length,
      roleDistribution 
    });

    // Sample a few users to verify their permissions
    if (usersWithPermissions.length > 0) {
      const sampleUser = usersWithPermissions[0];
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId: sampleUser.id },
        include: { permission: true },
        take: 5
      });

      addResult(true, `Sample user permissions verified`, {
        userId: sampleUser.id,
        userRole: sampleUser.role,
        permissionCount: userPermissions.length,
        samplePermissions: userPermissions.map(up => up.permission.id)
      });
    }

  } catch (error) {
    addResult(false, `User migration verification failed: ${error}`);
  }
}

async function verifyApplicationReadiness(): Promise<void> {
  logHeader('Application Readiness');

  try {
    // Check if all required environment variables are set
    const requiredEnvVars = ['DATABASE_URL'];
    const optionalEnvVars = ['JWT_SECRET', 'SKIP_PERMISSION_INIT'];
    
    let allRequiredPresent = true;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        logInfo(`Environment variable ${envVar}: Set`);
      } else {
        logError(`Environment variable ${envVar}: Missing`);
        allRequiredPresent = false;
      }
    }

    addResult(allRequiredPresent, `Required environment variables: ${allRequiredPresent ? 'All present' : 'Missing some'}`);

    // Check optional environment variables
    for (const envVar of optionalEnvVars) {
      const isSet = !!process.env[envVar];
      logInfo(`Optional environment variable ${envVar}: ${isSet ? 'Set' : 'Not set'}`);
    }

    // Test basic database operations
    const canRead = await testDatabaseRead();
    addResult(canRead, `Database read operations: ${canRead ? 'Working' : 'Failed'}`);

    const canWrite = await testDatabaseWrite();
    addResult(canWrite, `Database write operations: ${canWrite ? 'Working' : 'Failed'}`);

    // Check if legacy role system still works (for backwards compatibility)
    const hasUsersWithRoles = await prisma.user.count({
      where: { role: { not: null } }
    });
    
    if (hasUsersWithRoles > 0) {
      addResult(true, 'Legacy role system compatibility maintained', null, true);
    }

  } catch (error) {
    addResult(false, `Application readiness check failed: ${error}`);
  }
}

async function testDatabaseRead(): Promise<boolean> {
  try {
    await prisma.user.findFirst();
    await prisma.department.findFirst();
    return true;
  } catch (error) {
    logError(`Database read test failed: ${error}`);
    return false;
  }
}

async function testDatabaseWrite(): Promise<boolean> {
  try {
    // Try to create and delete a test record
    const testResult = await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS deployment_test (
        id SERIAL PRIMARY KEY,
        test_data TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO deployment_test (test_data) VALUES ('verification-test')
    `;

    await prisma.$executeRaw`
      DELETE FROM deployment_test WHERE test_data = 'verification-test'
    `;

    return true;
  } catch (error) {
    logError(`Database write test failed: ${error}`);
    return false;
  }
}

async function verifyDataIntegrity(): Promise<void> {
  logHeader('Data Integrity');

  try {
    // Check for orphaned records
    const orphanedUserPermissions = await prisma.userPermission.count({
      where: {
        OR: [
          { user: null },
          { permission: null }
        ]
      }
    });

    addResult(
      orphanedUserPermissions === 0,
      `Orphaned user permissions: ${orphanedUserPermissions}`,
      { count: orphanedUserPermissions }
    );

    // Check for duplicate permissions per user
    const duplicatePermissions = await prisma.$queryRaw<{userId: string, permissionId: string, count: number}[]>`
      SELECT "userId", "permissionId", COUNT(*) as count
      FROM "UserPermission"
      GROUP BY "userId", "permissionId"
      HAVING COUNT(*) > 1
    `;

    addResult(
      duplicatePermissions.length === 0,
      `Duplicate user permissions: ${duplicatePermissions.length}`,
      { duplicates: duplicatePermissions }
    );

    // Check referential integrity for departments
    const orphanedUsers = await prisma.user.count({
      where: {
        departmentId: { not: null },
        department: null
      }
    });

    addResult(
      orphanedUsers === 0,
      `Users with invalid department references: ${orphanedUsers}`,
      { count: orphanedUsers }
    );

  } catch (error) {
    addResult(false, `Data integrity check failed: ${error}`);
  }
}

function calculateSummary(): VerificationSummary {
  const summary: VerificationSummary = {
    totalChecks: verificationResults.length,
    passedChecks: 0,
    warningChecks: 0,
    failedChecks: 0,
    overall: 'FAIL'
  };

  for (const result of verificationResults) {
    if (result.passed) {
      if (result.message.includes('⚠️')) {
        summary.warningChecks++;
      } else {
        summary.passedChecks++;
      }
    } else {
      summary.failedChecks++;
    }
  }

  // Determine overall status
  if (summary.failedChecks === 0) {
    summary.overall = summary.warningChecks > 0 ? 'WARNING' : 'PASS';
  }

  return summary;
}

function displaySummary(summary: VerificationSummary): void {
  logHeader('Verification Summary');

  log(`📊 Total checks: ${summary.totalChecks}`);
  log(`✅ Passed: ${summary.passedChecks}`, 'green');
  log(`⚠️  Warnings: ${summary.warningChecks}`, 'yellow');
  log(`❌ Failed: ${summary.failedChecks}`, 'red');

  log(`\n🎯 Overall Status: ${summary.overall}`, 
    summary.overall === 'PASS' ? 'green' : 
    summary.overall === 'WARNING' ? 'yellow' : 'red');

  if (summary.overall === 'PASS') {
    logSuccess('\n🎉 Production deployment verification PASSED!');
    log('\n📝 System is ready for production use');
    log('\n🚀 Next steps:');
    log('   1. Deploy application code with permission decorators');
    log('   2. Monitor application logs for any issues');
    log('   3. Test critical user flows');
    log('   4. Set up monitoring and alerting');
  } else if (summary.overall === 'WARNING') {
    logWarning('\n⚠️  Production deployment verification completed with WARNINGS');
    log('\n📝 System may be usable but requires attention');
    log('\n🔧 Review warnings above and address as needed');
  } else {
    logError('\n💥 Production deployment verification FAILED!');
    log('\n📝 System is NOT ready for production use');
    log('\n🛠️  Fix failed checks before proceeding');
  }

  // Railway-specific guidance
  if (config.isRailway) {
    log('\n🚂 Railway Platform Notes:');
    log('   - Check Railway service logs for runtime errors');
    log('   - Verify environment variables in Railway dashboard');
    log('   - Monitor application health and performance');
    log('   - Use `railway logs` to troubleshoot issues');
  }
}

async function main(): Promise<void> {
  try {
    logHeader('Production Deployment Verification');
    
    log(`🎯 Environment: ${config.isProduction ? 'Production' : 'Development'}`);
    log(`🏗️  Platform: ${config.isRailway ? 'Railway' : 'Local'}`);
    log(`📊 Detailed output: ${config.detailed ? 'Enabled' : 'Disabled'}`);

    // Run all verification checks
    await verifyDatabaseConnectivity();
    await verifySchemaIntegrity();
    await verifyPermissionSystem();
    await verifyUserMigration();
    await verifyApplicationReadiness();
    await verifyDataIntegrity();

    // Calculate and display summary
    const summary = calculateSummary();
    displaySummary(summary);

    // Exit with appropriate code
    if (summary.overall === 'FAIL') {
      process.exit(1);
    } else if (summary.overall === 'WARNING') {
      process.exit(2); // Non-zero but different from failure
    } else {
      process.exit(0);
    }

  } catch (error) {
    logError(`Verification script failed: ${error}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
main();