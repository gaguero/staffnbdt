#!/usr/bin/env node

/**
 * Verification Script: Legacy Role Permissions Fix
 * 
 * Purpose: Verify that legacy role permission warnings are resolved
 * for all users, especially Roberto Martinez.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyLegacyRoleFix() {
  console.log('🔍 Verifying legacy role permissions fix...\n');

  try {
    // Check all users who might trigger legacy role warnings
    const usersWithNoCustomRoles = await prisma.user.findMany({
      where: {
        deletedAt: null,
        userCustomRoles: {
          none: {
            isActive: true
          }
        }
      },
      include: {
        userCustomRoles: {
          where: { isActive: true },
          include: { role: true }
        }
      }
    });

    console.log(`📊 Found ${usersWithNoCustomRoles.length} users without active custom roles`);
    
    if (usersWithNoCustomRoles.length === 0) {
      console.log('✅ All users have custom roles assigned - no legacy warnings expected!');
    } else {
      console.log('⚠️  Users that may still generate legacy role warnings:');
      usersWithNoCustomRoles.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Specifically check Roberto Martinez
    console.log('\n🎯 Checking Roberto Martinez specifically...');
    const roberto = await prisma.user.findUnique({
      where: { id: 'cmej91r0l002ns2f0e9dxocvf' },
      include: {
        userCustomRoles: {
          where: { isActive: true },
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
        }
      }
    });

    if (!roberto) {
      console.log('❌ Roberto Martinez not found');
    } else {
      console.log(`👤 Roberto Martinez: ${roberto.firstName} ${roberto.lastName}`);
      console.log(`📊 Legacy role: ${roberto.role}`);
      console.log(`🎭 Active custom roles: ${roberto.userCustomRoles.length}`);
      
      if (roberto.userCustomRoles.length > 0) {
        const totalPermissions = roberto.userCustomRoles.reduce(
          (sum, userRole) => sum + userRole.role.permissions.length,
          0
        );
        console.log(`🔑 Total permissions: ${totalPermissions}`);
        console.log('✅ Roberto Martinez has custom roles - legacy warning should be resolved!');
        
        // List his roles
        roberto.userCustomRoles.forEach(userRole => {
          console.log(`  - ${userRole.role.name} (${userRole.role.permissions.length} permissions)`);
        });
      } else {
        console.log('❌ Roberto Martinez still has no custom roles - warning will persist');
      }
    }

    // Check system health
    console.log('\n🏥 System health check...');
    const totalUsers = await prisma.user.count({ where: { deletedAt: null } });
    const usersWithCustomRoles = await prisma.user.count({
      where: {
        deletedAt: null,
        userCustomRoles: {
          some: {
            isActive: true
          }
        }
      }
    });

    const customRolesCoverage = Math.round((usersWithCustomRoles / totalUsers) * 100);
    console.log(`📈 Custom roles coverage: ${usersWithCustomRoles}/${totalUsers} users (${customRolesCoverage}%)`);

    if (customRolesCoverage === 100) {
      console.log('🎉 Perfect! All users have custom roles assigned');
    } else if (customRolesCoverage >= 90) {
      console.log('✅ Good coverage - minimal legacy warnings expected');
    } else if (customRolesCoverage >= 50) {
      console.log('⚠️  Moderate coverage - some legacy warnings may occur');
    } else {
      console.log('🚨 Low coverage - many legacy warnings expected');
    }

    console.log('\n📋 Summary:');
    console.log(`- Total active users: ${totalUsers}`);
    console.log(`- Users with custom roles: ${usersWithCustomRoles}`);
    console.log(`- Users still using legacy roles: ${totalUsers - usersWithCustomRoles}`);
    console.log(`- Roberto Martinez fix status: ${roberto?.userCustomRoles.length > 0 ? '✅ RESOLVED' : '❌ NOT FIXED'}`);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyLegacyRoleFix()
  .catch(async (error) => {
    console.error('💥 Unhandled error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });