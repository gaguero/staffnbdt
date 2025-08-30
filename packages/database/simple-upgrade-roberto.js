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
    console.log('=== SIMPLE ROBERTO PLATFORM_ADMIN UPGRADE ===\n');
    
    const userId = 'cmet301su002nwgzknxms3ev5';
    
    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found!');
    }

    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Current role: ${user.role}\n`);

    // 2. Update user to PLATFORM_ADMIN
    console.log('Upgrading to PLATFORM_ADMIN...');
    await prisma.user.update({
      where: { id: userId },
      data: { 
        role: 'PLATFORM_ADMIN',
        departmentId: null
      }
    });
    console.log('✅ User role updated to PLATFORM_ADMIN');

    // 3. Clear existing custom roles and permissions
    console.log('Clearing existing role assignments...');
    await prisma.userCustomRole.deleteMany({ where: { userId } });
    await prisma.permissionCache.deleteMany({ where: { userId } });
    console.log('✅ Cleared existing assignments');

    // 4. Find or create Platform Administrator custom role
    console.log('Setting up Platform Administrator custom role...');
    let platformAdminRole = await prisma.customRole.findFirst({
      where: { name: 'Platform Administrator' }
    });

    if (!platformAdminRole) {
      platformAdminRole = await prisma.customRole.create({
        data: {
          name: 'Platform Administrator',
          description: 'Full platform administrator with all system permissions'
        }
      });
    }
    console.log(`✅ Platform Administrator role ready: ${platformAdminRole.id}`);

    // 5. Get all permissions
    const allPermissions = await prisma.permission.findMany();
    console.log(`Found ${allPermissions.length} permissions in system`);

    // 6. Clear and set role permissions
    console.log('Assigning all permissions to Platform Administrator role...');
    await prisma.customRolePermission.deleteMany({
      where: { roleId: platformAdminRole.id }
    });

    const rolePermissions = allPermissions.map(p => ({
      roleId: platformAdminRole.id,
      permissionId: p.id
    }));

    await prisma.customRolePermission.createMany({
      data: rolePermissions,
      skipDuplicates: true
    });
    console.log(`✅ Assigned ${allPermissions.length} permissions to role`);

    // 7. Assign role to Roberto
    console.log('Assigning Platform Administrator role to Roberto...');
    await prisma.userCustomRole.create({
      data: {
        userId: userId,
        roleId: platformAdminRole.id
      }
    });
    console.log('✅ Role assigned to Roberto');

    // 8. Create permission cache
    console.log('Creating permission cache...');
    const permissionCacheEntries = allPermissions.map(p => ({
      userId: userId,
      permissionId: p.id,
      source: 'ROLE',
      sourceId: platformAdminRole.id
    }));

    await prisma.permissionCache.createMany({
      data: permissionCacheEntries,
      skipDuplicates: true
    });
    console.log(`✅ Created ${allPermissions.length} permission cache entries`);

    // 9. Verify upgrade
    console.log('\n=== VERIFICATION ===');
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    const userRoles = await prisma.userCustomRole.count({
      where: { userId }
    });

    const userPermissions = await prisma.permissionCache.count({
      where: { userId }
    });

    console.log(`System Role: ${updatedUser.role}`);
    console.log(`Department: ${updatedUser.departmentId || 'None (Platform-wide)'}`);
    console.log(`Custom Roles: ${userRoles}`);
    console.log(`Permission Cache: ${userPermissions} entries`);

    // 10. Check for hotel permissions specifically
    console.log('\n=== HOTEL PERMISSIONS CHECK ===');
    const hotelPermissionNames = [
      'unit.read.property', 'unit.create.property', 'unit.update.property', 'unit.delete.property',
      'guest.read.property', 'guest.create.property', 'guest.update.property', 'guest.delete.property',
      'reservation.read.property', 'reservation.create.property', 'reservation.update.property', 'reservation.delete.property'
    ];

    for (const permName of hotelPermissionNames) {
      const hasPermission = await prisma.permissionCache.findFirst({
        where: {
          userId: userId,
          permission: {
            name: permName
          }
        },
        include: {
          permission: true
        }
      });

      console.log(`${permName}: ${hasPermission ? '✅ GRANTED' : '❌ MISSING'}`);
    }

    console.log('\n=== UPGRADE COMPLETE ===');
    console.log('Roberto Martinez is now a PLATFORM_ADMIN with:');
    console.log('✅ Highest system role (PLATFORM_ADMIN)');
    console.log('✅ Platform Administrator custom role');
    console.log(`✅ All ${allPermissions.length} system permissions`);
    console.log('✅ Multi-organization access');
    console.log('✅ Multi-property management');
    console.log('✅ Hotel operations access');

  } catch (error) {
    console.error('Error during upgrade:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

upgradeRobertoToPlatformAdmin();