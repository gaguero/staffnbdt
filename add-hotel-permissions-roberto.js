// Set database URL as environment variable
process.env.DATABASE_URL = "postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway";

// Import Prisma client from the database package
const { PrismaClient } = require('./packages/database/node_modules/.prisma/client');
const prisma = new PrismaClient();

async function addHotelPermissionsToRoberto() {
  try {
    console.log('🔍 Searching for Roberto Martinez...');
    
    // Find Roberto Martinez
    const roberto = await prisma.user.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Roberto', mode: 'insensitive' } },
          { lastName: { contains: 'Martinez', mode: 'insensitive' } },
          { email: { contains: 'roberto', mode: 'insensitive' } }
        ]
      },
      include: {
        userPermissions: {
          include: {
            permission: true
          }
        },
        organization: true,
        property: true
      }
    });

    if (!roberto) {
      console.log('❌ Roberto Martinez not found in the database');
      return;
    }

    console.log(`✅ Found Roberto Martinez:
    - ID: ${roberto.id}
    - Email: ${roberto.email}
    - Name: ${roberto.firstName} ${roberto.lastName}
    - Role: ${roberto.role}
    - Organization ID: ${roberto.organizationId}
    - Property ID: ${roberto.propertyId}`);

    // List current permissions
    console.log(`\n📋 Current permissions (${roberto.userPermissions.length}):`);
    roberto.userPermissions.forEach(up => {
      console.log(`  - ${up.permission.name} (${up.permission.resource}.${up.permission.action}.${up.permission.scope})`);
    });

    // Define the hotel operations permissions we need to add
    const requiredHotelPermissions = [
      // Unit permissions
      { resource: 'unit', action: 'read', scope: 'property' },
      { resource: 'unit', action: 'create', scope: 'property' },
      { resource: 'unit', action: 'update', scope: 'property' },
      { resource: 'unit', action: 'delete', scope: 'property' },
      
      // Guest permissions
      { resource: 'guest', action: 'read', scope: 'property' },
      { resource: 'guest', action: 'create', scope: 'property' },
      { resource: 'guest', action: 'update', scope: 'property' },
      { resource: 'guest', action: 'delete', scope: 'property' },
      
      // Reservation permissions
      { resource: 'reservation', action: 'read', scope: 'property' },
      { resource: 'reservation', action: 'create', scope: 'property' },
      { resource: 'reservation', action: 'update', scope: 'property' },
      { resource: 'reservation', action: 'delete', scope: 'property' }
    ];

    console.log('\n🔍 Checking which hotel permissions need to be added...');

    // Check which permissions exist in the system and which Roberto already has
    const existingPermissions = await prisma.permission.findMany({
      where: {
        OR: requiredHotelPermissions.map(rp => ({
          resource: rp.resource,
          action: rp.action,
          scope: rp.scope
        }))
      }
    });

    console.log(`\n📊 Found ${existingPermissions.length} hotel permissions in system:`);
    existingPermissions.forEach(p => {
      console.log(`  - ${p.name} (${p.resource}.${p.action}.${p.scope})`);
    });

    // Find permissions Roberto doesn't have yet
    const robertoPermissionKeys = new Set(
      roberto.userPermissions.map(up => `${up.permission.resource}.${up.permission.action}.${up.permission.scope}`)
    );

    const permissionsToAdd = existingPermissions.filter(p => 
      !robertoPermissionKeys.has(`${p.resource}.${p.action}.${p.scope}`)
    );

    console.log(`\n➕ Need to add ${permissionsToAdd.length} new permissions to Roberto:`);
    permissionsToAdd.forEach(p => {
      console.log(`  - ${p.name} (${p.resource}.${p.action}.${p.scope})`);
    });

    if (permissionsToAdd.length === 0 && existingPermissions.length > 0) {
      console.log('✅ Roberto already has all required hotel operations permissions!');
      return;
    }

    if (existingPermissions.length === 0) {
      console.log('⚠️  No hotel permissions exist in the system yet. Will create them.');
    }

    // Create missing permissions in the system if needed
    console.log('\n🔧 Creating any missing permissions in the system...');
    
    for (const reqPerm of requiredHotelPermissions) {
      const exists = existingPermissions.find(p => 
        p.resource === reqPerm.resource && 
        p.action === reqPerm.action && 
        p.scope === reqPerm.scope
      );
      
      if (!exists) {
        console.log(`  📝 Creating permission: ${reqPerm.resource}.${reqPerm.action}.${reqPerm.scope}`);
        
        try {
          const newPermission = await prisma.permission.create({
            data: {
              resource: reqPerm.resource,
              action: reqPerm.action,
              scope: reqPerm.scope,
              name: `${reqPerm.resource}.${reqPerm.action}.${reqPerm.scope}`,
              description: `${reqPerm.action.charAt(0).toUpperCase() + reqPerm.action.slice(1)} ${reqPerm.resource}s within ${reqPerm.scope}`,
              category: 'hotel_operations',
              isSystem: true
            }
          });
          
          permissionsToAdd.push(newPermission);
          console.log(`    ✅ Created: ${newPermission.name}`);
        } catch (error) {
          console.log(`    ❌ Failed to create ${reqPerm.resource}.${reqPerm.action}.${reqPerm.scope}: ${error.message}`);
        }
      }
    }

    // Add the permissions to Roberto's account
    console.log('\n🎯 Adding permissions to Roberto\'s account...');
    
    for (const permission of permissionsToAdd) {
      try {
        await prisma.userPermission.create({
          data: {
            userId: roberto.id,
            permissionId: permission.id,
            granted: true,
            grantedBy: 'system', // Indicating this was granted by system admin
            isActive: true
          }
        });
        
        console.log(`  ✅ Added: ${permission.name}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`  ⚠️  Already exists: ${permission.name}`);
        } else {
          console.log(`  ❌ Failed to add ${permission.name}: ${error.message}`);
        }
      }
    }

    // Verify final permissions
    console.log('\n🔍 Verifying Roberto\'s final permissions...');
    
    const updatedRoberto = await prisma.user.findUnique({
      where: { id: roberto.id },
      include: {
        userPermissions: {
          where: { isActive: true },
          include: {
            permission: true
          }
        }
      }
    });

    const hotelPermissions = updatedRoberto.userPermissions.filter(up => 
      ['unit', 'guest', 'reservation'].includes(up.permission.resource)
    );

    console.log(`\n🎉 Roberto now has ${hotelPermissions.length} hotel operations permissions:`);
    hotelPermissions.forEach(up => {
      console.log(`  ✅ ${up.permission.name}`);
    });

    // Clear permission cache for Roberto
    console.log('\n🧹 Clearing Roberto\'s permission cache...');
    await prisma.permissionCache.deleteMany({
      where: { userId: roberto.id }
    });
    console.log('  ✅ Permission cache cleared');

    console.log('\n🎊 SUCCESS: Roberto Martinez now has all hotel operations permissions!');
    console.log('\nRoberto can now access:');
    console.log('  - Units management (CRUD operations)');
    console.log('  - Guest management (CRUD operations)'); 
    console.log('  - Reservations management (CRUD operations)');
    console.log('\nThe 403 Forbidden errors should be resolved.');

  } catch (error) {
    console.error('❌ Error adding hotel permissions to Roberto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addHotelPermissionsToRoberto();