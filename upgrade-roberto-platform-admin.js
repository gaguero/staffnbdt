const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'node_modules', '@prisma/client'));

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
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        userPermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!currentUser) {
      throw new Error('User not found!');
    }

    console.log(`Current user: ${currentUser.firstName} ${currentUser.lastName}`);
    console.log(`Current system role: ${currentUser.role}`);
    console.log(`Current custom roles: ${currentUser.userRoles.length}`);
    console.log(`Current permissions: ${currentUser.userPermissions.length}\n`);

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
    let platformAdminRole = await prisma.role.findFirst({
      where: { name: 'Platform Administrator' }
    });

    if (!platformAdminRole) {
      console.log('Creating Platform Administrator custom role...');
      platformAdminRole = await prisma.role.create({
        data: {
          name: 'Platform Administrator',
          description: 'Full platform administrator with all system permissions'
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
    await prisma.rolePermission.deleteMany({
      where: { roleId: platformAdminRole.id }
    });

    // Then add all permissions
    const rolePermissionsData = allPermissions.map(permission => ({
      roleId: platformAdminRole.id,
      permissionId: permission.id
    }));

    await prisma.rolePermission.createMany({
      data: rolePermissionsData,
      skipDuplicates: true
    });
    console.log(`✅ Assigned ${allPermissions.length} permissions to Platform Administrator role\n`);

    // 6. Clear Roberto's existing role assignments
    console.log('6. Clearing existing role assignments...');
    await prisma.userRole.deleteMany({
      where: { userId: userId }
    });

    // 7. Assign Platform Administrator role to Roberto
    console.log('7. Assigning Platform Administrator role to Roberto...');
    await prisma.userRole.create({
      data: {
        userId: userId,
        roleId: platformAdminRole.id
      }
    });
    console.log('✅ Platform Administrator role assigned to Roberto\n');

    // 8. Verify the upgrade
    console.log('8. Verifying the upgrade...');
    const upgradedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('=== UPGRADE VERIFICATION ===');
    console.log(`System Role: ${upgradedUser.role}`);
    console.log(`Department: ${upgradedUser.departmentId || 'None (Platform-wide access)'}`);
    console.log(`Custom Roles: ${upgradedUser.userRoles.length}`);
    
    let totalPermissions = 0;
    upgradedUser.userRoles.forEach(ur => {
      console.log(`  - ${ur.role.name}: ${ur.role.rolePermissions.length} permissions`);
      totalPermissions += ur.role.rolePermissions.length;
    });
    
    console.log(`Total Permissions: ${totalPermissions}\n`);

    // 9. Check for specific hotel permissions
    console.log('9. Checking hotel operation permissions...');
    const hotelPermissionNames = [
      'unit.read.property', 'unit.create.property', 'unit.update.property', 'unit.delete.property',
      'guest.read.property', 'guest.create.property', 'guest.update.property', 'guest.delete.property',
      'reservation.read.property', 'reservation.create.property', 'reservation.update.property', 'reservation.delete.property'
    ];

    const userPermissions = new Set();
    upgradedUser.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        userPermissions.add(rp.permission.name);
      });
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

  } catch (error) {
    console.error('Error during upgrade:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

upgradeRobertoToPlatformAdmin();
