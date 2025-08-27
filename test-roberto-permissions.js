const { PrismaClient } = require('./packages/database/node_modules/.prisma/client');

// Set database URL as environment variable
process.env.DATABASE_URL = "postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway";

const prisma = new PrismaClient();

async function testRobertoPermissions() {
  try {
    console.log('🔍 Testing Roberto Martinez permissions...');
    
    // Find Roberto/Rosa Martinez
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Roberto', mode: 'insensitive' } },
          { firstName: { contains: 'Rosa', mode: 'insensitive' } },
          { lastName: { contains: 'Martinez', mode: 'insensitive' } }
        ]
      },
      include: {
        userPermissions: {
          where: { isActive: true },
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Organization ID: ${user.organizationId}`);
    console.log(`   Property ID: ${user.propertyId}`);
    
    // Check hotel operation permissions
    const hotelPermissions = user.userPermissions.filter(up => 
      ['unit', 'guest', 'reservation'].includes(up.permission.resource)
    );

    console.log(`\n🏨 Hotel Operations Permissions (${hotelPermissions.length}):`);
    hotelPermissions.forEach(up => {
      console.log(`  ✅ ${up.permission.name} - ${up.permission.description || 'No description'}`);
    });

    // Check specific required permissions
    const requiredPermissions = [
      'unit.read.property', 'unit.create.property', 'unit.update.property', 'unit.delete.property',
      'guest.read.property', 'guest.create.property', 'guest.update.property', 'guest.delete.property',
      'reservation.read.property', 'reservation.create.property', 'reservation.update.property', 'reservation.delete.property'
    ];

    const userPermissionNames = new Set(hotelPermissions.map(up => up.permission.name));
    
    console.log('\n🎯 Required Permission Check:');
    let allPermissionsFound = true;
    
    requiredPermissions.forEach(perm => {
      const hasPermission = userPermissionNames.has(perm);
      console.log(`  ${hasPermission ? '✅' : '❌'} ${perm}`);
      if (!hasPermission) allPermissionsFound = false;
    });

    if (allPermissionsFound) {
      console.log('\n🎉 SUCCESS: Roberto has all required hotel operations permissions!');
      console.log('   He should now be able to access:');
      console.log('   - Units management endpoints (CRUD)');
      console.log('   - Guests management endpoints (CRUD)');
      console.log('   - Reservations management endpoints (CRUD)');
      console.log('\n   The 403 Forbidden errors should be resolved.');
    } else {
      console.log('\n⚠️  Some permissions are missing. Roberto may still encounter 403 errors.');
    }

    // Also check JWT generation would include permissions
    console.log('\n📋 JWT Token would include:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Organization ID: ${user.organizationId}`);
    console.log(`   Property ID: ${user.propertyId}`);
    console.log(`   Department ID: ${user.departmentId}`);
    console.log(`   Permissions: ${hotelPermissions.length} hotel operations permissions`);

  } catch (error) {
    console.error('❌ Error testing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRobertoPermissions();