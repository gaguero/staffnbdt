#!/usr/bin/env node

/**
 * Migration Script: Assign Custom Roles to Roberto Martinez
 * 
 * Purpose: Convert Roberto Martinez from legacy PLATFORM_ADMIN role to custom database roles
 * to eliminate the "legacy role permissions" warning messages in production logs.
 * 
 * Usage: node assign-custom-roles-roberto.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

const ROBERTO_MARTINEZ_ID = 'cmej91r0l002ns2f0e9dxocvf';

async function main() {
  console.log('🚀 Starting custom role assignment for Roberto Martinez...');
  console.log(`📋 Target User ID: ${ROBERTO_MARTINEZ_ID}`);

  try {
    // Step 1: Verify Roberto Martinez exists and get his current info
    const user = await prisma.user.findUnique({
      where: { id: ROBERTO_MARTINEZ_ID },
      include: {
        organization: true,
        property: true,
        userCustomRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      console.error(`❌ User with ID ${ROBERTO_MARTINEZ_ID} not found!`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`📊 Current legacy role: ${user.role}`);
    console.log(`🏢 Organization: ${user.organization?.name || 'None'}`);
    console.log(`🏨 Property: ${user.property?.name || 'None'}`);
    console.log(`🎭 Current custom roles: ${user.userCustomRoles.length}`);

    if (user.role !== 'PLATFORM_ADMIN') {
      console.warn(`⚠️  Expected PLATFORM_ADMIN role, but found ${user.role}. Continuing anyway...`);
    }

    // Step 2: Find or create the Platform Administrator custom role
    let platformAdminRole = await prisma.customRole.findFirst({
      where: {
        name: 'Platform Administrator',
        isSystemRole: true,
        organizationId: user.organizationId
      }
    });

    if (!platformAdminRole) {
      console.log('🔧 Creating Platform Administrator custom role...');
      
      // Get the organization to attach the role to
      const organization = user.organization;
      if (!organization) {
        console.error('❌ Cannot create system role without an organization');
        process.exit(1);
      }

      platformAdminRole = await prisma.customRole.create({
        data: {
          name: 'Platform Administrator',
          description: 'Full platform access for system administrators',
          organizationId: organization.id,
          propertyId: null,
          isSystemRole: true,
          isActive: true,
          priority: 1000,
          metadata: {
            createdBy: 'migration-script',
            purpose: 'Replace legacy PLATFORM_ADMIN role',
            migrationDate: new Date().toISOString()
          }
        }
      });
      console.log(`✅ Created Platform Administrator role: ${platformAdminRole.id}`);
    } else {
      console.log(`✅ Found existing Platform Administrator role: ${platformAdminRole.id}`);
    }

    // Step 3: Get all system permissions for platform admin
    const allPermissions = await prisma.permission.findMany({
      where: {
        isSystem: true
      }
    });

    console.log(`📋 Found ${allPermissions.length} system permissions to assign`);

    // Step 4: Assign all permissions to the Platform Administrator role
    const existingRolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: platformAdminRole.id
      }
    });

    console.log(`🔗 Role already has ${existingRolePermissions.length} permissions assigned`);

    // Create role permissions for any missing permissions
    let newPermissionsAssigned = 0;
    for (const permission of allPermissions) {
      const exists = existingRolePermissions.some(rp => rp.permissionId === permission.id);
      
      if (!exists) {
        await prisma.rolePermission.create({
          data: {
            roleId: platformAdminRole.id,
            permissionId: permission.id,
            granted: true,
            metadata: {
              assignedBy: 'migration-script',
              assignedAt: new Date().toISOString(),
              reason: 'Platform administrator full access'
            }
          }
        });
        newPermissionsAssigned++;
      }
    }

    console.log(`✅ Assigned ${newPermissionsAssigned} new permissions to Platform Administrator role`);

    // Step 5: Check if Roberto already has this custom role assigned
    const existingAssignment = await prisma.userCustomRole.findUnique({
      where: {
        userId_roleId: {
          userId: ROBERTO_MARTINEZ_ID,
          roleId: platformAdminRole.id
        }
      }
    });

    if (existingAssignment) {
      if (existingAssignment.isActive) {
        console.log('✅ Roberto Martinez already has Platform Administrator role assigned and active');
      } else {
        // Reactivate the role
        await prisma.userCustomRole.update({
          where: { id: existingAssignment.id },
          data: {
            isActive: true,
            assignedBy: 'migration-script',
            metadata: {
              reactivatedBy: 'migration-script',
              reactivatedAt: new Date().toISOString(),
              reason: 'Resolve legacy role permissions warning'
            }
          }
        });
        console.log('✅ Reactivated existing Platform Administrator role assignment');
      }
    } else {
      // Step 6: Assign the Platform Administrator role to Roberto Martinez
      const roleAssignment = await prisma.userCustomRole.create({
        data: {
          userId: ROBERTO_MARTINEZ_ID,
          roleId: platformAdminRole.id,
          assignedBy: 'migration-script',
          isActive: true,
          metadata: {
            assignedBy: 'migration-script',
            assignedAt: new Date().toISOString(),
            reason: 'Migrate from legacy PLATFORM_ADMIN role to custom role system',
            legacyRole: user.role
          }
        }
      });

      console.log(`✅ Assigned Platform Administrator role to Roberto Martinez: ${roleAssignment.id}`);
    }

    // Step 7: Verify the assignment worked
    const updatedUser = await prisma.user.findUnique({
      where: { id: ROBERTO_MARTINEZ_ID },
      include: {
        userCustomRoles: {
          where: { isActive: true },
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
        }
      }
    });

    const totalPermissions = updatedUser.userCustomRoles.reduce(
      (sum, userRole) => sum + userRole.role.permissions.length,
      0
    );

    console.log('\n🎉 Migration completed successfully!');
    console.log(`👤 User: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`🎭 Active custom roles: ${updatedUser.userCustomRoles.length}`);
    console.log(`🔑 Total permissions: ${totalPermissions}`);
    console.log('\n📝 Result:');
    console.log('- Roberto Martinez now has a custom Platform Administrator role assigned');
    console.log('- All system permissions are granted through this custom role'); 
    console.log('- Legacy role warnings should no longer appear in logs');
    console.log('- The legacy PLATFORM_ADMIN role enum is still preserved for backwards compatibility');

    // Step 8: Test permission evaluation (simulate the permission service check)
    console.log('\n🧪 Testing permission system...');
    
    const testPermissions = [
      'user.read.organization',
      'user.create.property',
      'payslip.read.department',
      'vacation.approve.property'
    ];

    for (const testPerm of testPermissions) {
      const [resource, action, scope] = testPerm.split('.');
      const hasPermission = updatedUser.userCustomRoles.some(userRole =>
        userRole.role.permissions.some(rp =>
          rp.permission.resource === resource &&
          rp.permission.action === action &&
          rp.permission.scope === scope
        )
      );
      
      console.log(`  ${hasPermission ? '✅' : '❌'} ${testPerm}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration terminated');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the migration
main()
  .catch(async (error) => {
    console.error('💥 Unhandled error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });