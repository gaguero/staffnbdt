import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Hotel Operations Permission Definitions
const HOTEL_OPERATIONS_PERMISSIONS = [
  // ===== UNIT/ROOM MANAGEMENT =====
  {
    resource: 'unit',
    action: 'create',
    scope: 'all',
    name: 'Create Units (All Properties)',
    description: 'Create new rooms/units across all properties',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'create',
    scope: 'organization', 
    name: 'Create Units (Organization)',
    description: 'Create new rooms/units within organization',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'create',
    scope: 'property',
    name: 'Create Units (Property)',
    description: 'Create new rooms/units within property',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'read',
    scope: 'all',
    name: 'View All Units',
    description: 'View all rooms/units across the platform',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'read',
    scope: 'organization',
    name: 'View Organization Units',
    description: 'View rooms/units within organization',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'read',
    scope: 'property',
    name: 'View Property Units',
    description: 'View rooms/units within property',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'update',
    scope: 'all',
    name: 'Update All Units',
    description: 'Modify any room/unit across the platform',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'update',
    scope: 'organization',
    name: 'Update Organization Units',
    description: 'Modify rooms/units within organization',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'update',
    scope: 'property',
    name: 'Update Property Units',
    description: 'Modify rooms/units within property',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'delete',
    scope: 'all',
    name: 'Delete All Units',
    description: 'Delete any room/unit across the platform',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'delete',
    scope: 'organization',
    name: 'Delete Organization Units',
    description: 'Delete rooms/units within organization',
    category: 'Hotel Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'delete',
    scope: 'property',
    name: 'Delete Property Units',
    description: 'Delete rooms/units within property',
    category: 'Hotel Operations',
    isSystem: true
  },

  // ===== GUEST MANAGEMENT =====
  {
    resource: 'guest',
    action: 'create',
    scope: 'all',
    name: 'Create Guests (All Properties)',
    description: 'Create new guest profiles across all properties',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'create',
    scope: 'organization',
    name: 'Create Guests (Organization)',
    description: 'Create new guest profiles within organization',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'create',
    scope: 'property',
    name: 'Create Guests (Property)',
    description: 'Create new guest profiles within property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'read',
    scope: 'all',
    name: 'View All Guests',
    description: 'View all guest profiles across the platform',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'read',
    scope: 'organization',
    name: 'View Organization Guests',
    description: 'View guest profiles within organization',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'read',
    scope: 'property',
    name: 'View Property Guests',
    description: 'View guest profiles within property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'update',
    scope: 'all',
    name: 'Update All Guests',
    description: 'Modify any guest profile across the platform',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'update',
    scope: 'organization',
    name: 'Update Organization Guests',
    description: 'Modify guest profiles within organization',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'update',
    scope: 'property',
    name: 'Update Property Guests',
    description: 'Modify guest profiles within property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'delete',
    scope: 'all',
    name: 'Delete All Guests',
    description: 'Delete any guest profile across the platform',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'delete',
    scope: 'organization',
    name: 'Delete Organization Guests',
    description: 'Delete guest profiles within organization',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'delete',
    scope: 'property',
    name: 'Delete Property Guests',
    description: 'Delete guest profiles within property',
    category: 'Front Desk',
    isSystem: true
  },

  // ===== RESERVATION MANAGEMENT =====
  {
    resource: 'reservation',
    action: 'create',
    scope: 'all',
    name: 'Create Reservations (All Properties)',
    description: 'Create new reservations across all properties',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'create',
    scope: 'organization',
    name: 'Create Reservations (Organization)',
    description: 'Create new reservations within organization',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'create',
    scope: 'property',
    name: 'Create Reservations (Property)',
    description: 'Create new reservations within property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'read',
    scope: 'all',
    name: 'View All Reservations',
    description: 'View all reservations across the platform',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'read',
    scope: 'organization',
    name: 'View Organization Reservations',
    description: 'View reservations within organization',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'read',
    scope: 'property',
    name: 'View Property Reservations',
    description: 'View reservations within property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'update',
    scope: 'all',
    name: 'Update All Reservations',
    description: 'Modify any reservation across the platform',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'update',
    scope: 'organization',
    name: 'Update Organization Reservations',
    description: 'Modify reservations within organization',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'update',
    scope: 'property',
    name: 'Update Property Reservations',
    description: 'Modify reservations within property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'delete',
    scope: 'all',
    name: 'Delete All Reservations',
    description: 'Delete any reservation across the platform',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'delete',
    scope: 'organization',
    name: 'Delete Organization Reservations',
    description: 'Delete reservations within organization',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'delete',
    scope: 'property',
    name: 'Delete Property Reservations',
    description: 'Delete reservations within property',
    category: 'Front Desk',
    isSystem: true
  }
];

async function seedHotelOperationsPermissions() {
  console.log('🏨 Starting Hotel Operations Permissions Seed...');
  
  try {
    // Create/update all hotel operations permissions
    console.log('📝 Creating hotel operations permissions...');
    let createdCount = 0;
    let updatedCount = 0;

    for (const permission of HOTEL_OPERATIONS_PERMISSIONS) {
      const existingPermission = await prisma.permission.findUnique({
        where: {
          resource_action_scope: {
            resource: permission.resource,
            action: permission.action,
            scope: permission.scope
          }
        }
      });

      if (existingPermission) {
        await prisma.permission.update({
          where: { id: existingPermission.id },
          data: {
            name: permission.name,
            description: permission.description,
            category: permission.category,
            isSystem: permission.isSystem
          }
        });
        updatedCount++;
      } else {
        await prisma.permission.create({
          data: permission
        });
        createdCount++;
      }
    }

    console.log(`✅ Hotel operations permissions: ${createdCount} created, ${updatedCount} updated`);

    // Find Platform Administrator role
    console.log('🎭 Updating Platform Administrator role...');
    const platformAdminRole = await prisma.customRole.findFirst({
      where: { name: 'Platform Administrator' }
    });

    if (!platformAdminRole) {
      console.error('❌ Platform Administrator role not found');
      return;
    }

    // Assign all hotel operations permissions to Platform Administrator
    let assignedPermissions = 0;
    
    for (const permission of HOTEL_OPERATIONS_PERMISSIONS) {
      const permissionRecord = await prisma.permission.findUnique({
        where: {
          resource_action_scope: {
            resource: permission.resource,
            action: permission.action,
            scope: permission.scope
          }
        }
      });

      if (permissionRecord) {
        // Check if already assigned
        const existingAssignment = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: platformAdminRole.id,
              permissionId: permissionRecord.id
            }
          }
        });

        if (!existingAssignment) {
          await prisma.rolePermission.create({
            data: {
              roleId: platformAdminRole.id,
              permissionId: permissionRecord.id,
              granted: true
            }
          });
          assignedPermissions++;
        }
      }
    }

    console.log(`✅ Assigned ${assignedPermissions} new hotel operations permissions to Platform Administrator`);

    // Verify Roberto has Platform Administrator role
    console.log('👑 Ensuring Roberto has Platform Administrator access...');
    const roberto = await prisma.user.findFirst({
      where: { email: 'roberto.martinez@nayararesorts.com' }
    });

    if (roberto) {
      const existingRole = await prisma.userCustomRole.findFirst({
        where: {
          userId: roberto.id,
          roleId: platformAdminRole.id,
          isActive: true
        }
      });

      if (!existingRole) {
        await prisma.userCustomRole.create({
          data: {
            userId: roberto.id,
            roleId: platformAdminRole.id,
            assignedBy: roberto.id,
            isActive: true
          }
        });
        console.log('✅ Assigned Platform Administrator role to Roberto');
      } else {
        console.log('ℹ️  Roberto already has Platform Administrator role');
      }
    }

    // Final summary
    const totalPermissions = await prisma.permission.count();
    const platformAdminPermissions = await prisma.rolePermission.count({
      where: { 
        roleId: platformAdminRole.id,
        granted: true 
      }
    });

    console.log('\n🏨 Hotel Operations Permissions Seed Summary:');
    console.log(`✅ Total permissions in system: ${totalPermissions}`);
    console.log(`✅ Platform Administrator permissions: ${platformAdminPermissions}`);
    console.log(`✅ Hotel operations permissions: ${HOTEL_OPERATIONS_PERMISSIONS.length}`);
    console.log('✅ Roberto Martinez has full Platform Administrator access');
    console.log('\n🎯 Roberto should now have access to:');
    console.log('   - /api/units (rooms management)');
    console.log('   - /api/guests (guest profiles)');
    console.log('   - /api/reservations (bookings)');
    console.log('   - All hotel operations endpoints');

  } catch (error) {
    console.error('❌ Error seeding hotel operations permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedHotelOperationsPermissions()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });