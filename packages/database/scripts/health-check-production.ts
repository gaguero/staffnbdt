#!/usr/bin/env node

/**
 * Production Health Check Script
 * 
 * Continuous monitoring script for the permission system in production.
 * Can be run manually or integrated into monitoring systems.
 * 
 * Usage:
 * - npm run health:production
 * - ALERT_ON_FAILURE=true npm run health:production (for monitoring systems)
 * - JSON_OUTPUT=true npm run health:production (for parsing by monitoring tools)
 * 
 * Exit codes:
 * - 0: All checks passed
 * - 1: Critical failure (system down)
 * - 2: Warning (degraded performance)
 * - 3: Configuration error
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const config = {
  alertOnFailure: process.env.ALERT_ON_FAILURE === 'true',
  jsonOutput: process.env.JSON_OUTPUT === 'true',
  isRailway: !!process.env.RAILWAY_ENVIRONMENT,
  isProduction: process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production'
};

interface HealthCheck {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  responseTime: number;
  message: string;
  details?: any;
}

interface HealthSummary {
  timestamp: string;
  environment: string;
  overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  checks: HealthCheck[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failures: number;
  };
}

const healthChecks: HealthCheck[] = [];

function addHealthCheck(
  name: string, 
  status: 'PASS' | 'WARN' | 'FAIL', 
  responseTime: number, 
  message: string, 
  details?: any
): void {
  healthChecks.push({ name, status, responseTime, message, details });
}

async function measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; time: number }> {
  const start = Date.now();
  const result = await operation();
  const time = Date.now() - start;
  return { result, time };
}

async function checkDatabaseConnectivity(): Promise<void> {
  try {
    const { time } = await measureTime(async () => {
      await prisma.$queryRaw`SELECT 1 as health_check`;
    });

    if (time > 5000) {
      addHealthCheck('database_connectivity', 'WARN', time, `Database connection slow: ${time}ms`);
    } else if (time > 1000) {
      addHealthCheck('database_connectivity', 'WARN', time, `Database connection acceptable: ${time}ms`);
    } else {
      addHealthCheck('database_connectivity', 'PASS', time, `Database connection healthy: ${time}ms`);
    }
  } catch (error) {
    addHealthCheck('database_connectivity', 'FAIL', 0, `Database connection failed: ${error}`);
  }
}

async function checkPermissionSystemIntegrity(): Promise<void> {
  try {
    const { result: counts, time } = await measureTime(async () => {
      const [permissions, userPermissions, rolePermissions] = await Promise.all([
        prisma.permission.count(),
        prisma.userPermission.count(),
        prisma.rolePermission.count()
      ]);
      return { permissions, userPermissions, rolePermissions };
    });

    // Check if permission system is enabled
    if (counts.permissions === 0) {
      addHealthCheck('permission_system', 'WARN', time, 'Permission system not initialized', counts);
      return;
    }

    // Check for reasonable permission counts
    const expectedMinPermissions = 50;
    const expectedMinRolePermissions = 100;

    if (counts.permissions < expectedMinPermissions) {
      addHealthCheck('permission_system', 'WARN', time, `Low permission count: ${counts.permissions}`, counts);
    } else if (counts.rolePermissions < expectedMinRolePermissions) {
      addHealthCheck('permission_system', 'WARN', time, `Low role permission mappings: ${counts.rolePermissions}`, counts);
    } else {
      addHealthCheck('permission_system', 'PASS', time, 'Permission system healthy', counts);
    }
  } catch (error) {
    addHealthCheck('permission_system', 'FAIL', 0, `Permission system check failed: ${error}`);
  }
}

async function checkUserAccessIntegrity(): Promise<void> {
  try {
    const { result: userStats, time } = await measureTime(async () => {
      const [totalUsers, usersWithRoles, usersWithPermissions] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: { not: null } } }),
        prisma.user.count({
          where: {
            userPermissions: { some: {} }
          }
        })
      ]);
      return { totalUsers, usersWithRoles, usersWithPermissions };
    });

    if (userStats.totalUsers === 0) {
      addHealthCheck('user_access', 'WARN', time, 'No users in system', userStats);
      return;
    }

    // Check that users have either roles OR permissions (or both)
    const usersWithAccess = Math.max(userStats.usersWithRoles, userStats.usersWithPermissions);
    const accessPercentage = (usersWithAccess / userStats.totalUsers) * 100;

    if (accessPercentage < 90) {
      addHealthCheck('user_access', 'FAIL', time, `${accessPercentage.toFixed(1)}% of users have access methods`, userStats);
    } else if (accessPercentage < 100) {
      addHealthCheck('user_access', 'WARN', time, `${accessPercentage.toFixed(1)}% of users have access methods`, userStats);
    } else {
      addHealthCheck('user_access', 'PASS', time, 'All users have access methods', userStats);
    }
  } catch (error) {
    addHealthCheck('user_access', 'FAIL', 0, `User access check failed: ${error}`);
  }
}

async function checkDatabasePerformance(): Promise<void> {
  try {
    // Test query performance on key tables
    const { result: queryResults, time: totalTime } = await measureTime(async () => {
      const userQuery = measureTime(() => prisma.user.findMany({ take: 10 }));
      const permissionQuery = measureTime(() => prisma.permission.findMany({ take: 10 }));
      const departmentQuery = measureTime(() => prisma.department.findMany({ take: 10 }));

      const [userResult, permissionResult, departmentResult] = await Promise.all([
        userQuery, permissionQuery, departmentQuery
      ]);

      return {
        userQueryTime: userResult.time,
        permissionQueryTime: permissionResult.time,
        departmentQueryTime: departmentResult.time,
        userCount: userResult.result.length,
        permissionCount: permissionResult.result.length,
        departmentCount: departmentResult.result.length
      };
    });

    const avgQueryTime = (queryResults.userQueryTime + queryResults.permissionQueryTime + queryResults.departmentQueryTime) / 3;

    if (avgQueryTime > 1000) {
      addHealthCheck('database_performance', 'FAIL', totalTime, `Database queries very slow: ${avgQueryTime.toFixed(0)}ms average`, queryResults);
    } else if (avgQueryTime > 500) {
      addHealthCheck('database_performance', 'WARN', totalTime, `Database queries slow: ${avgQueryTime.toFixed(0)}ms average`, queryResults);
    } else {
      addHealthCheck('database_performance', 'PASS', totalTime, `Database queries healthy: ${avgQueryTime.toFixed(0)}ms average`, queryResults);
    }
  } catch (error) {
    addHealthCheck('database_performance', 'FAIL', 0, `Database performance check failed: ${error}`);
  }
}

async function checkSystemConfiguration(): Promise<void> {
  try {
    const { time } = await measureTime(async () => {
      // Check environment configuration
      const requiredEnvVars = ['DATABASE_URL'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      // Check Railway-specific configuration
      if (config.isRailway) {
        const railwayVars = ['RAILWAY_ENVIRONMENT', 'RAILWAY_SERVICE_NAME'];
        const missingRailwayVars = railwayVars.filter(varName => !process.env[varName]);
        
        if (missingRailwayVars.length > 0) {
          console.warn(`Missing Railway variables: ${missingRailwayVars.join(', ')}`);
        }
      }
    });

    addHealthCheck('system_configuration', 'PASS', time, 'System configuration valid');
  } catch (error) {
    addHealthCheck('system_configuration', 'FAIL', 0, `Configuration error: ${error}`);
  }
}

async function checkDataIntegrity(): Promise<void> {
  try {
    const { result: integrityChecks, time } = await measureTime(async () => {
      // Check for orphaned records
      const orphanedUserPermissions = await prisma.$queryRaw<{count: number}[]>`
        SELECT COUNT(*) as count 
        FROM "UserPermission" up 
        LEFT JOIN "User" u ON up."userId" = u.id 
        LEFT JOIN "Permission" p ON up."permissionId" = p.id 
        WHERE u.id IS NULL OR p.id IS NULL
      `;

      const orphanedUsers = await prisma.user.count({
        where: {
          departmentId: { not: null },
          department: null
        }
      });

      return {
        orphanedUserPermissions: orphanedUserPermissions[0]?.count || 0,
        orphanedUsers
      };
    });

    const totalIssues = integrityChecks.orphanedUserPermissions + integrityChecks.orphanedUsers;

    if (totalIssues > 0) {
      addHealthCheck('data_integrity', 'WARN', time, `Found ${totalIssues} data integrity issues`, integrityChecks);
    } else {
      addHealthCheck('data_integrity', 'PASS', time, 'Data integrity healthy', integrityChecks);
    }
  } catch (error) {
    addHealthCheck('data_integrity', 'FAIL', 0, `Data integrity check failed: ${error}`);
  }
}

function calculateOverallHealth(checks: HealthCheck[]): 'HEALTHY' | 'DEGRADED' | 'CRITICAL' {
  const failures = checks.filter(c => c.status === 'FAIL').length;
  const warnings = checks.filter(c => c.status === 'WARN').length;

  if (failures > 0) {
    return 'CRITICAL';
  } else if (warnings > 0) {
    return 'DEGRADED';
  } else {
    return 'HEALTHY';
  }
}

function formatOutput(summary: HealthSummary): void {
  if (config.jsonOutput) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  // Human-readable output
  const statusEmoji = {
    'HEALTHY': '✅',
    'DEGRADED': '⚠️',
    'CRITICAL': '🚨'
  };

  const checkEmoji = {
    'PASS': '✅',
    'WARN': '⚠️',
    'FAIL': '❌'
  };

  console.log(`\n${statusEmoji[summary.overall]} System Health: ${summary.overall}`);
  console.log(`🕐 Timestamp: ${summary.timestamp}`);
  console.log(`🏗️  Environment: ${summary.environment}`);
  console.log(`📊 Summary: ${summary.summary.passed}/${summary.summary.total} passed, ${summary.summary.warnings} warnings, ${summary.summary.failures} failures\n`);

  console.log('Health Checks:');
  for (const check of summary.checks) {
    console.log(`${checkEmoji[check.status]} ${check.name}: ${check.message} (${check.responseTime}ms)`);
    
    if (check.details && !config.jsonOutput && (check.status === 'WARN' || check.status === 'FAIL')) {
      console.log(`   Details: ${JSON.stringify(check.details)}`);
    }
  }

  if (summary.overall === 'CRITICAL') {
    console.log('\n🚨 CRITICAL ISSUES DETECTED!');
    console.log('Immediate attention required. System may be down or degraded.');
  } else if (summary.overall === 'DEGRADED') {
    console.log('\n⚠️  WARNING: System is degraded');
    console.log('Some issues detected. Monitor closely and address warnings.');
  } else {
    console.log('\n🎉 System is healthy!');
  }
}

async function main(): Promise<void> {
  try {
    // Run all health checks
    await Promise.all([
      checkDatabaseConnectivity(),
      checkPermissionSystemIntegrity(),
      checkUserAccessIntegrity(),
      checkDatabasePerformance(),
      checkSystemConfiguration(),
      checkDataIntegrity()
    ]);

    // Calculate summary
    const overall = calculateOverallHealth(healthChecks);
    const summary: HealthSummary = {
      timestamp: new Date().toISOString(),
      environment: config.isProduction ? 'production' : 'development',
      overall,
      checks: healthChecks,
      summary: {
        total: healthChecks.length,
        passed: healthChecks.filter(c => c.status === 'PASS').length,
        warnings: healthChecks.filter(c => c.status === 'WARN').length,
        failures: healthChecks.filter(c => c.status === 'FAIL').length
      }
    };

    // Output results
    formatOutput(summary);

    // Alert on failure if configured
    if (config.alertOnFailure && overall === 'CRITICAL') {
      console.error('\n🚨 ALERT: Critical system failure detected!');
      // Here you could integrate with alerting systems like:
      // - Slack/Discord webhooks
      // - PagerDuty
      // - Email notifications
      // - SMS alerts
    }

    // Exit with appropriate code
    if (overall === 'CRITICAL') {
      process.exit(1);
    } else if (overall === 'DEGRADED') {
      process.exit(2);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error(`Health check failed: ${error}`);
    
    if (config.jsonOutput) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: config.isProduction ? 'production' : 'development',
        overall: 'CRITICAL',
        error: error.toString(),
        checks: []
      }));
    }
    
    process.exit(3); // Configuration error
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(1);
});

// Run the health check
main();