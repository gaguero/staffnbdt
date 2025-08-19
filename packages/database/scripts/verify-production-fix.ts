import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyProductionFix() {
  console.log('🔍 VERIFYING PRODUCTION PERMISSION FIX');
  console.log('=====================================\n');

  try {
    // 1. Verify system health
    const [permissionCount, customRoleCount, roleMappingCount] = await Promise.all([
      prisma.permission.count(),
      prisma.customRole.count({ where: { isSystemRole: true } }),
      prisma.rolePermission.count()
    ]);

    console.log('📊 System Health Check:');
    console.log(`  ✅ Permissions: ${permissionCount} (Expected: 81+)`);
    console.log(`  ✅ System Roles: ${customRoleCount} (Expected: 7)`);
    console.log(`  ✅ Role Mappings: ${roleMappingCount} (Expected: ~297)`);

    // 2. Verify Property Manager role has correct permissions
    const propertyManagerRole = await prisma.customRole.findFirst({
      where: { name: 'Property Manager', isSystemRole: true },
      include: {
        permissions: {
          where: { granted: true },
          include: { permission: true }
        }
      }
    });

    if (!propertyManagerRole) {
      console.log('❌ Property Manager role not found!');
      return;
    }

    const userReadPermissions = propertyManagerRole.permissions.filter(rp => 
      rp.permission.resource === 'user' && rp.permission.action === 'read'
    );

    console.log('\n🎭 Property Manager Role:');
    console.log(`  Total Permissions: ${propertyManagerRole.permissions.length}`);
    console.log(`  User Read Permissions: ${userReadPermissions.length}`);
    userReadPermissions.forEach(rp => {
      console.log(`    ✅ ${rp.permission.resource}.${rp.permission.action}.${rp.permission.scope}`);
    });

    // 3. Verify users have custom roles assigned
    const usersWithoutCustomRoles = await prisma.user.count({
      where: {
        customRoles: { none: { isActive: true } }
      }
    });

    console.log(`\n👥 Users without custom roles: ${usersWithoutCustomRoles}`);

    // 4. Verify specific Property Manager users
    const propertyManagerUsers = await prisma.user.findMany({
      where: { role: 'PROPERTY_MANAGER' },
      include: {
        customRoles: {
          where: { isActive: true },
          include: { role: true }
        }
      }
    });

    console.log('\n🏨 Property Manager Users:');
    propertyManagerUsers.forEach(user => {
      const activeRole = user.customRoles.find(ur => ur.isActive);
      console.log(`  ${user.email}:`);
      console.log(`    Legacy Role: ${user.role}`);
      console.log(`    Custom Role: ${activeRole?.role?.name || 'None'}`);
      console.log(`    Active: ${user.isActive}`);
    });

    // 5. Test permission calculation for Property Manager
    const testUser = propertyManagerUsers[0];
    if (testUser) {
      console.log(`\n🧪 Testing Permission Calculation for ${testUser.email}:`);
      
      // Get all permissions for this user
      const userRoles = await prisma.userCustomRole.findMany({
        where: {
          userId: testUser.id,
          isActive: true
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

      const allPermissions: string[] = [];
      userRoles.forEach(userRole => {
        userRole.role.permissions.forEach(rp => {
          allPermissions.push(`${rp.permission.resource}.${rp.permission.action}.${rp.permission.scope}`);
        });
      });

      const uniquePermissions = [...new Set(allPermissions)];
      console.log(`    Total Permissions: ${uniquePermissions.length}`);

      // Check specific permissions
      const criticalPermissions = [
        'user.read.property',
        'user.update.property', 
        'department.update.property',
        'role.assign.property'
      ];

      criticalPermissions.forEach(perm => {
        const hasPermission = uniquePermissions.includes(perm);
        console.log(`    ${hasPermission ? '✅' : '❌'} ${perm}`);
      });
    }

    // 6. Final recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (usersWithoutCustomRoles === 0) {
      console.log('  ✅ All users have custom roles assigned');
    } else {
      console.log(`  ⚠️  ${usersWithoutCustomRoles} users still need custom role assignment`);
    }

    if (userReadPermissions.length > 0) {
      console.log('  ✅ Property Manager has user read permissions');
    } else {
      console.log('  ❌ Property Manager missing user read permissions');
    }

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Restart the backend service to clear permission cache');
    console.log('2. Test the /users/stats endpoint with Property Manager credentials');
    console.log('3. Check backend logs for permission evaluation debug messages');
    console.log('4. If still getting 403, temporarily grant Platform Admin for testing:');
    console.log('   npm run permissions:fix:production -- --grant-admin=USER_ID --force');

  } catch (error) {
    console.error('❌ Error verifying production fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProductionFix();