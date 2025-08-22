#!/usr/bin/env node

/**
 * Test Script: Verify Roberto Martinez Permission System
 * 
 * Purpose: Test that Roberto Martinez's permissions work through the custom role system
 * and no longer generate legacy role warnings.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['warn', 'error', 'info'],
});

const ROBERTO_MARTINEZ_ID = 'cmej91r0l002ns2f0e9dxocvf';

// Simulate the permission service logic from the codebase
class PermissionService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getUserPermissionsFromDatabase(user) {
    console.log(`🔍 Checking custom role permissions for user ${user.id}...`);
    
    const userRoles = await this.prisma.userCustomRole.findMany({
      where: {
        userId: user.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            permissions: {
              where: { granted: true },
              include: { permission: true }
            }
          }
        }
      }
    });

    if (userRoles.length === 0) {
      console.log(`⚠️  User ${user.id} has no active custom roles assigned`);
      return [];
    }

    // Collect all permissions from all active roles
    const allPermissions = [];
    userRoles.forEach(userRole => {
      console.log(`🎭 Found role: ${userRole.role.name} with ${userRole.role.permissions.length} permissions`);
      userRole.role.permissions.forEach(rp => {
        allPermissions.push(`${rp.permission.resource}.${rp.permission.action}.${rp.permission.scope}`);
      });
    });

    const permissions = [...new Set(allPermissions)]; // Remove duplicates
    console.log(`✅ User ${user.id} has ${permissions.length} database permissions from ${userRoles.length} custom roles`);
    return permissions;
  }

  async simulatePermissionCheck(user, resource, action, scope) {
    console.log(`\n🔐 Testing permission: ${resource}.${action}.${scope}`);
    
    // Get user's effective permissions from database first
    const userPermissions = await this.getUserPermissionsFromDatabase(user);
    
    // Check if user has the required permission from database custom roles
    const permissionString = `${resource}.${action}.${scope}`;
    const hasPermission = userPermissions.some(userPermission => {
      return this.matchesPermissionPattern(permissionString, userPermission);
    });

    if (hasPermission) {
      console.log(`✅ Permission granted through custom role system: ${permissionString}`);
      return true;
    }

    // If no custom role permissions, fall back to legacy role permissions
    if (userPermissions.length === 0) {
      console.log(`⚠️  User ${user.id} has no custom role permissions, would check legacy role permissions`);
      console.log(`🚨 THIS WOULD GENERATE THE WARNING: "User ${user.id} granted access via legacy role permissions. Consider assigning custom roles."`);
      return false;
    }

    console.log(`❌ Permission denied: ${permissionString}`);
    return false;
  }

  matchesPermissionPattern(required, granted) {
    const [reqResource, reqAction, reqScope] = required.split('.');
    const [grantResource, grantAction, grantScope] = granted.split('.');

    // Check resource match (wildcard support)
    if (grantResource !== '*' && grantResource !== reqResource) {
      return false;
    }

    // Check action match (wildcard support)
    if (grantAction !== '*' && grantAction !== reqAction) {
      return false;
    }

    // Check scope hierarchy: all > organization > property > department > own
    const scopeHierarchy = ['own', 'department', 'property', 'organization', 'all'];
    const grantedLevel = scopeHierarchy.indexOf(grantScope);
    const requiredLevel = scopeHierarchy.indexOf(reqScope);

    // If granted scope is higher or equal in hierarchy, allow access
    return grantedLevel >= requiredLevel;
  }
}

async function main() {
  console.log('🧪 Testing Roberto Martinez Permission System...');
  console.log(`📋 Target User ID: ${ROBERTO_MARTINEZ_ID}\n`);

  try {
    // Get Roberto Martinez
    const user = await prisma.user.findUnique({
      where: { id: ROBERTO_MARTINEZ_ID },
      include: {
        organization: true,
        property: true,
        userCustomRoles: {
          where: { isActive: true },
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      console.error(`❌ User with ID ${ROBERTO_MARTINEZ_ID} not found!`);
      process.exit(1);
    }

    console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`📊 Legacy role: ${user.role}`);
    console.log(`🎭 Active custom roles: ${user.userCustomRoles.length}`);

    if (user.userCustomRoles.length === 0) {
      console.log('❌ PROBLEM: User has no custom roles assigned!');
      console.log('🚨 This would cause legacy role warnings in production');
      process.exit(1);
    }

    // Test permission service
    const permissionService = new PermissionService(prisma);

    // Test common permission scenarios
    const testCases = [
      { resource: 'user', action: 'read', scope: 'organization' },
      { resource: 'user', action: 'create', scope: 'property' },
      { resource: 'payslip', action: 'read', scope: 'department' },
      { resource: 'vacation', action: 'approve', scope: 'property' },
      { resource: 'document', action: 'delete', scope: 'organization' },
      { resource: 'training', action: 'create', scope: 'property' }
    ];

    let allTestsPassed = true;
    
    for (const testCase of testCases) {
      const hasPermission = await permissionService.simulatePermissionCheck(
        user, 
        testCase.resource, 
        testCase.action, 
        testCase.scope
      );
      
      if (!hasPermission) {
        allTestsPassed = false;
      }
    }

    console.log('\n🎉 Test Results:');
    if (allTestsPassed) {
      console.log('✅ All permission checks passed through custom role system');
      console.log('✅ No legacy role warnings should be generated');
      console.log('✅ Roberto Martinez migration was successful');
    } else {
      console.log('❌ Some permission checks failed');
      console.log('⚠️  There may still be issues with the custom role assignment');
    }

    // Additional verification: Check specific platform admin permissions
    console.log('\n🔍 Detailed permission verification:');
    const userPermissions = await permissionService.getUserPermissionsFromDatabase(user);
    
    const criticalPermissions = [
      'user.create.organization',
      'user.read.platform',
      'organization.create.platform',
      'property.delete.organization'
    ];

    for (const perm of criticalPermissions) {
      const [resource, action, scope] = perm.split('.');
      const hasExact = userPermissions.includes(perm);
      const hasWildcard = userPermissions.some(up => 
        permissionService.matchesPermissionPattern(perm, up)
      );
      
      console.log(`  ${hasExact || hasWildcard ? '✅' : '❌'} ${perm} ${hasExact ? '(exact)' : hasWildcard ? '(wildcard)' : ''}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
main()
  .catch(async (error) => {
    console.error('💥 Unhandled error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });