const { PrismaClient } = require('./packages/database/node_modules/.prisma/client');

async function addHotelPermissionsToRoberto() {
  const prisma = new PrismaClient({
    datasourceUrl: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
  });

  try {
    const robertoUserId = 'cmet301su002nwgzknxms3ev5';
    
    // List of hotel permissions needed
    const hotelPermissions = [
      'unit.read.property',
      'unit.create.property', 
      'unit.update.property',
      'unit.delete.property',
      'guest.read.property',
      'guest.create.property',
      'guest.update.property', 
      'guest.delete.property',
      'reservation.read.property',
      'reservation.create.property',
      'reservation.update.property',
      'reservation.delete.property'
    ];

    console.log(`Adding hotel permissions to Roberto (${robertoUserId})...`);

    // Get all permissions that Roberto needs
    const permissionsToAdd = await prisma.permission.findMany({
      where: {
        name: {
          in: hotelPermissions
        }
      }
    });

    console.log(`Found ${permissionsToAdd.length} permissions to add:`, permissionsToAdd.map(p => p.name));

    // Check current user permissions
    const currentPermissions = await prisma.userPermission.findMany({
      where: {
        userId: robertoUserId
      },
      include: {
        permission: true
      }
    });

    console.log(`Roberto currently has ${currentPermissions.length} permissions:`, 
      currentPermissions.map(up => up.permission.name));

    // Find permissions that Roberto doesn't already have
    const existingPermissionNames = currentPermissions.map(up => up.permission.name);
    const newPermissions = permissionsToAdd.filter(p => !existingPermissionNames.includes(p.name));

    console.log(`Need to add ${newPermissions.length} new permissions:`, newPermissions.map(p => p.name));

    // Add missing permissions
    for (const permission of newPermissions) {
      try {
        await prisma.userPermission.create({
          data: {
            userId: robertoUserId,
            permissionId: permission.id
          }
        });
        console.log(`✅ Added permission: ${permission.name}`);
      } catch (error) {
        console.log(`❌ Failed to add ${permission.name}:`, error.message);
      }
    }

    // Verify final permissions
    const finalPermissions = await prisma.userPermission.findMany({
      where: {
        userId: robertoUserId
      },
      include: {
        permission: true
      }
    });

    const hotelPermissionsGranted = finalPermissions.filter(up => 
      hotelPermissions.includes(up.permission.name)
    );

    console.log(`\n🎉 Roberto now has ${finalPermissions.length} total permissions`);
    console.log(`🏨 Hotel permissions (${hotelPermissionsGranted.length}/${hotelPermissions.length}):`, 
      hotelPermissionsGranted.map(up => up.permission.name));

    if (hotelPermissionsGranted.length === hotelPermissions.length) {
      console.log('\n✅ SUCCESS: All hotel permissions granted to Roberto!');
    } else {
      console.log('\n⚠️  WARNING: Some hotel permissions are still missing');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addHotelPermissionsToRoberto();