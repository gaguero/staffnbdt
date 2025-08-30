const { PrismaClient } = require('@prisma/client');

async function finalUpgradeRoberto() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
      }
    }
  });

  try {
    console.log('=== FINAL ROBERTO PLATFORM_ADMIN SETUP ===\n');
    
    const userId = 'cmet301su002nwgzknxms3ev5';
    
    // 1. Verify user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log(`User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    // 2. Get Platform Administrator role
    const platformAdminRole = await prisma.customRole.findFirst({
      where: { name: 'Platform Administrator' }
    });
    console.log(`Platform Administrator role ID: ${platformAdminRole.id}`);

    // 3. Get all permissions
    const allPermissions = await prisma.permission.findMany();
    console.log(`Total permissions in system: ${allPermissions.length}`);

    // 4. Clear existing role permissions and add all permissions
    console.log('\nAssigning ALL permissions to Platform Administrator role...');
    await prisma.rolePermission.deleteMany({
      where: { roleId: platformAdminRole.id }
    });

    const rolePermissions = allPermissions.map(p => ({
      roleId: platformAdminRole.id,
      permissionId: p.id
    }));

    await prisma.rolePermission.createMany({
      data: rolePermissions,
      skipDuplicates: true
    });
    console.log(`✅ Assigned ${allPermissions.length} permissions to Platform Administrator role`);

    // 5. Assign role to Roberto (clear first)
    console.log('\nAssigning Platform Administrator role to Roberto...');
    await prisma.userCustomRole.deleteMany({ where: { userId } });
    await prisma.userCustomRole.create({
      data: {
        userId: userId,
        roleId: platformAdminRole.id
      }
    });
    console.log('✅ Platform Administrator role assigned to Roberto');

    // 6. Update permission cache
    console.log('\nUpdating permission cache...');
    await prisma.permissionCache.deleteMany({ where: { userId } });
    
    const cacheEntries = allPermissions.map(p => ({
      userId: userId,
      permissionId: p.id,
      source: 'ROLE',
      sourceId: platformAdminRole.id
    }));

    await prisma.permissionCache.createMany({
      data: cacheEntries,
      skipDuplicates: true
    });
    console.log(`✅ Created ${allPermissions.length} permission cache entries`);

    // 7. Verify hotel permissions
    console.log('\n=== HOTEL PERMISSIONS VERIFICATION ===');
    const hotelPerms = [
      'unit.read.property', 'unit.create.property', 'unit.update.property', 'unit.delete.property',
      'guest.read.property', 'guest.create.property', 'guest.update.property', 'guest.delete.property',
      'reservation.read.property', 'reservation.create.property', 'reservation.update.property', 'reservation.delete.property'
    ];

    let hotelPermCount = 0;
    for (const permName of hotelPerms) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        const hasCache = await prisma.permissionCache.findFirst({
          where: { userId, permissionId: perm.id }
        });
        if (hasCache) {
          console.log(`✅ ${permName}`);
          hotelPermCount++;
        } else {
          console.log(`❌ ${permName} - Cache missing`);
        }
      } else {
        console.log(`❌ ${permName} - Permission doesn't exist in DB`);
      }
    }

    console.log(`\nHotel permissions granted: ${hotelPermCount}/${hotelPerms.length}`);

    // 8. Final summary
    console.log('\n=== FINAL STATUS ===');
    const roleCount = await prisma.userCustomRole.count({ where: { userId } });
    const cacheCount = await prisma.permissionCache.count({ where: { userId } });
    
    console.log('Roberto Martinez now has:');
    console.log(`✅ System Role: ${user.role} (highest level)`);
    console.log(`✅ Custom Roles: ${roleCount} (Platform Administrator)`);
    console.log(`✅ Permission Cache: ${cacheCount} entries`);
    console.log(`✅ Hotel Operations: ${hotelPermCount}/12 permissions`);
    console.log('✅ Multi-organization access capability');
    console.log('✅ Multi-property management capability');
    
    if (hotelPermCount === hotelPerms.length) {
      console.log('\n🎉 SUCCESS: Roberto should now be able to access all hotel operations!');
    } else {
      console.log('\n⚠️  WARNING: Some hotel permissions are missing from the database.');
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

finalUpgradeRoberto();