const { PrismaClient } = require('@prisma/client');

async function checkPermissions() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
      }
    }
  });

  try {
    console.log('=== CHECKING ROBERTO MARTINEZ PERMISSIONS ===\n');
    
    // 1. Get Roberto's user info
    const user = await prisma.user.findUnique({
      where: { id: 'cmet301su002nwgzknxms3ev5' },
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

    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log(`User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Role: ${user.role}`);
    console.log(`User Roles: ${user.userRoles.length} roles assigned`);
    
    // 2. Show roles
    console.log('\n=== USER ROLES ===');
    for (const ur of user.userRoles) {
      console.log(`- ${ur.role.name} (${ur.role.id})`);
      console.log(`  Permissions through role: ${ur.role.rolePermissions.length}`);
    }

    // 3. Check for hotel permissions in database
    console.log('\n=== CHECKING HOTEL PERMISSIONS IN DATABASE ===');
    const hotelPermissionNames = [
      'unit.read.property', 'unit.create.property', 'unit.update.property', 'unit.delete.property',
      'guest.read.property', 'guest.create.property', 'guest.update.property', 'guest.delete.property',
      'reservation.read.property', 'reservation.create.property', 'reservation.update.property', 'reservation.delete.property'
    ];

    for (const permName of hotelPermissionNames) {
      const perm = await prisma.permission.findUnique({
        where: { name: permName }
      });
      console.log(`${permName}: ${perm ? 'EXISTS' : 'MISSING'}`);
    }

    // 4. Check if PROPERTY_ADMIN role exists and has permissions
    console.log('\n=== CHECKING PROPERTY_ADMIN ROLE ===');
    const propertyAdminRole = await prisma.role.findFirst({
      where: { name: 'PROPERTY_ADMIN' },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (propertyAdminRole) {
      console.log(`PROPERTY_ADMIN role exists with ${propertyAdminRole.rolePermissions.length} permissions`);
      
      // Check which hotel permissions it has
      const hasHotelPerms = propertyAdminRole.rolePermissions
        .filter(rp => hotelPermissionNames.includes(rp.permission.name))
        .map(rp => rp.permission.name);
      
      console.log(`Hotel permissions assigned to PROPERTY_ADMIN: ${hasHotelPerms.length}`);
      if (hasHotelPerms.length > 0) {
        hasHotelPerms.forEach(p => console.log(`  - ${p}`));
      }
    } else {
      console.log('PROPERTY_ADMIN role not found!');
    }

    // 5. Check Roberto's actual permissions (combined)
    console.log('\n=== ROBERTO\'S ACTUAL PERMISSIONS ===');
    const allPermissions = new Set();
    
    // From roles
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        allPermissions.add(rp.permission.name);
      });
    });
    
    // Direct permissions
    user.userPermissions.forEach(up => {
      allPermissions.add(up.permission.name);
    });

    console.log(`Total permissions: ${allPermissions.size}`);
    
    // Check for hotel permissions
    const hasHotelPermissions = hotelPermissionNames.filter(p => allPermissions.has(p));
    console.log(`\nHotel permissions Roberto has: ${hasHotelPermissions.length}`);
    if (hasHotelPermissions.length > 0) {
      hasHotelPermissions.forEach(p => console.log(`  - ${p}`));
    } else {
      console.log('  NONE - This is the problem!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
