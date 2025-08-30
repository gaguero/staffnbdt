const { PrismaClient } = require('@prisma/client');

async function upgradeRobertoToPlatformAdmin() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
      }
    }
  });

  try {
    console.log('=== UPGRADING ROBERTO MARTINEZ TO PLATFORM_ADMIN ===\n');
    
    const userId = 'cmet301su002nwgzknxms3ev5';
    
    // 1. Check current user status
    console.log('1. Checking current user status...');
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCustomRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        permissionCaches: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!currentUser) {
      throw new Error('User not found!');
    }

    console.log(`Current user: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.email})`);
    console.log(`Current system role: ${currentUser.role}`);
    console.log(`Current custom roles: ${currentUser.userCustomRoles.length}`);
    console.log(`Current permission caches: ${currentUser.permissionCaches.length}\n`);

    // 2. Update system role to PLATFORM_ADMIN
    console.log('2. Updating system role to PLATFORM_ADMIN...');
    await prisma.user.update({
      where: { id: userId },
      data: { 
        role: 'PLATFORM_ADMIN',
        departmentId: null // Platform admins don't belong to specific departments
      }
    });
    console.log('✅ System role updated to PLATFORM_ADMIN\n');

    // 3. Find or create Platform Administrator custom role
    console.log('3. Setting up Platform Administrator custom role...');
    let platformAdminRole = await prisma.customRole.findFirst({
      where: { name: 'Platform Administrator' }
    });

    if (!platformAdminRole) {
      console.log('Creating Platform Administrator custom role...');
      platformAdminRole = await prisma.customRole.create({
        data: {
          name: 'Platform Administrator',
          description: 'Full platform administrator with all system permissions',
          isSystemRole: true
        }
      });
    }
    console.log(`Platform Administrator role: ${platformAdminRole.id}\n`);

    // 4. Get all permissions in the system
    console.log('4. Getting all system permissions...');
    const allPermissions = await prisma.permission.findMany();
    console.log(`Found ${allPermissions.length} permissions in system\n`);

    // 5. Assign all permissions to Platform Administrator role
    console.log('5. Assigning all permissions to Platform Administrator role...');
    
    // First remove existing role permissions
    await prisma.customRolePermission.deleteMany({
      where: { roleId: platformAdminRole.id }
    });

    // Then add all permissions
    const rolePermissionsData = allPermissions.map(permission => ({
      roleId: platformAdminRole.id,
      permissionId: permission.id
    }));

    await prisma.customRolePermission.createMany({
      data: rolePermissionsData,
      skipDuplicates: true
    });
    console.log(`✅ Assigned ${allPermissions.length} permissions to Platform Administrator role\n`);

    // 6. Clear Roberto's existing role assignments
    console.log('6. Clearing existing custom role assignments...');
    await prisma.userCustomRole.deleteMany({
      where: { userId: userId }
    });

    // 7. Clear Roberto's permission cache
    console.log('7. Clearing permission cache...');
    await prisma.permissionCache.deleteMany({
      where: { userId: userId }
    });

    // 8. Assign Platform Administrator role to Roberto
    console.log('8. Assigning Platform Administrator role to Roberto...');
    await prisma.userCustomRole.create({
      data: {
        userId: userId,
        roleId: platformAdminRole.id
      }
    });
    console.log('✅ Platform Administrator role assigned to Roberto\n');

    // 9. Create permission cache entries for all permissions
    console.log('9. Creating permission cache for Roberto...');
    const permissionCacheData = allPermissions.map(permission => ({
      userId: userId,
      permissionId: permission.id,
      source: 'ROLE',
      sourceId: platformAdminRole.id
    }));

    await prisma.permissionCache.createMany({
      data: permissionCacheData,
      skipDuplicates: true
    });
    console.log(`✅ Created ${allPermissions.length} permission cache entries\n`);

    // 10. Verify the upgrade
    console.log('10. Verifying the upgrade...');
    const upgradedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCustomRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        permissionCaches: {
          include: {
            permission: true
          }
        }
      }
    });

    console.log('=== UPGRADE VERIFICATION ===');
    console.log(`System Role: ${upgradedUser.role}`);
    console.log(`Department: ${upgradedUser.departmentId || 'None (Platform-wide access)'}`);
    console.log(`Custom Roles: ${upgradedUser.userCustomRoles.length}`);
    
    let totalPermissions = 0;
    upgradedUser.userCustomRoles.forEach(ucr => {
      console.log(`  - ${ucr.role.name}: ${ucr.role.permissions.length} permissions`);
      totalPermissions += ucr.role.permissions.length;
    });
    
    console.log(`Total Permissions: ${totalPermissions}`);
    console.log(`Permission Cache: ${upgradedUser.permissionCaches.length} entries\n`);

    // 11. Check for specific hotel permissions
    console.log('11. Checking hotel operation permissions...');
    const hotelPermissionNames = [
      'unit.read.property', 'unit.create.property', 'unit.update.property', 'unit.delete.property',
      'guest.read.property', 'guest.create.property', 'guest.update.property', 'guest.delete.property',
      'reservation.read.property', 'reservation.create.property', 'reservation.update.property', 'reservation.delete.property'
    ];

    const userPermissions = new Set();
    upgradedUser.permissionCaches.forEach(pc => {
      userPermissions.add(pc.permission.name);
    });

    const hasHotelPerms = hotelPermissionNames.filter(p => userPermissions.has(p));
    console.log(`Hotel permissions Roberto now has: ${hasHotelPerms.length}/${hotelPermissionNames.length}`);
    if (hasHotelPerms.length > 0) {
      hasHotelPerms.forEach(p => console.log(`  ✅ ${p}`));
    }

    if (hasHotelPerms.length < hotelPermissionNames.length) {
      console.log('\nMissing hotel permissions:');
      hotelPermissionNames.filter(p => !userPermissions.has(p)).forEach(p => {
        console.log(`  ❌ ${p}`);
      });
    }

    console.log('\n=== PLATFORM ADMIN UPGRADE COMPLETE ===');
    console.log('Roberto Martinez now has:');
    console.log('✅ PLATFORM_ADMIN system role');
    console.log('✅ Platform Administrator custom role');
    console.log(`✅ ${totalPermissions} system permissions`);
    console.log('✅ Multi-organization access');
    console.log('✅ Multi-property management');
    console.log('✅ System administration capabilities');
    console.log('✅ Permission cache populated');

    // Show a few key permissions
    const keyPermissions = ['unit.read.property', 'guest.read.property', 'reservation.read.property', 'user.create.organization', 'organization.create.platform'];
    console.log('\nKey permissions verification:');
    keyPermissions.forEach(perm => {
      const hasIt = userPermissions.has(perm);
      console.log(`  ${hasIt ? '✅' : '❌'} ${perm}`);
    });

  } catch (error) {
    console.error('Error during upgrade:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

upgradeRobertoToPlatformAdmin();