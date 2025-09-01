import { PrismaClient, Role } from '@prisma/client';

// Initialize Prisma with explicit configuration for Railway
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function assignAdminConciergePermissions() {
  console.log('🔧 Ensuring PLATFORM_ADMIN users have access to Concierge and Vendors...');
  console.log(`📡 Database URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`);

  try {
    // 1. Find PLATFORM_ADMIN users
    const platformAdmins = await prisma.user.findMany({
      where: { 
        role: Role.PLATFORM_ADMIN,
        deletedAt: null 
      },
      select: { id: true, email: true, role: true }
    });

    console.log(`\n👥 Found ${platformAdmins.length} PLATFORM_ADMIN users:`);
    platformAdmins.forEach(admin => {
      console.log(`  - ${admin.email}`);
    });

    if (platformAdmins.length === 0) {
      console.log('ℹ️  No PLATFORM_ADMIN users found. This is normal in a custom role-based system.');
    }

    // 2. Find system roles that should have full access
    const systemRoles = await prisma.customRole.findMany({
      where: {
        OR: [
          { name: { contains: 'Admin' } },
          { name: { contains: 'Manager' } },
          { name: { contains: 'Super' } },
        ],
        isSystemRole: true,
        isActive: true
      }
    });

    console.log(`\n🎭 Found ${systemRoles.length} system roles with admin-level access:`);
    systemRoles.forEach(role => {
      console.log(`  - ${role.name} (Priority: ${role.priority})`);
    });

    // 3. Get all concierge and vendors permissions
    const conciergeVendorsPermissions = await prisma.permission.findMany({
      where: {
        resource: { in: ['concierge', 'vendors'] }
      }
    });

    console.log(`\n📋 Found ${conciergeVendorsPermissions.length} concierge/vendors permissions to assign`);

    // 4. Assign all permissions to admin-level system roles
    let totalAssignments = 0;
    for (const role of systemRoles) {
      let assignedCount = 0;
      
      for (const permission of conciergeVendorsPermissions) {
        // Check if permission is already assigned
        const existing = await prisma.rolePermission.findFirst({
          where: {
            roleId: role.id,
            permissionId: permission.id
          }
        });

        if (!existing) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
              granted: true
            }
          });
          assignedCount++;
          totalAssignments++;
        }
      }

      console.log(`  ✅ ${role.name}: Added ${assignedCount} new permissions`);
    }

    // 5. Check if there are users assigned to these roles
    const userRoleAssignments = await prisma.userCustomRole.findMany({
      where: {
        roleId: { in: systemRoles.map(r => r.id) }
      },
      include: {
        user: { select: { email: true } },
        role: { select: { name: true } }
      }
    });

    console.log(`\n👤 Found ${userRoleAssignments.length} user role assignments for admin roles:`);
    userRoleAssignments.forEach(assignment => {
      console.log(`  - ${assignment.user.email} → ${assignment.role.name}`);
    });

    // 6. Summary
    console.log(`\n📊 Assignment Summary:`);
    console.log(`  - System roles updated: ${systemRoles.length}`);
    console.log(`  - Total permission assignments added: ${totalAssignments}`);
    console.log(`  - Users with admin access: ${userRoleAssignments.length}`);
    console.log(`  - Permissions available: ${conciergeVendorsPermissions.length}`);

    // 7. Verify one more time that the required permissions exist and are assigned
    console.log(`\n🔍 Final verification of required API permissions:`);
    const requiredApiPermissions = [
      'concierge.read.property',
      'concierge.create.property', 
      'concierge.update.property',
      'concierge.complete.property',
      'concierge.execute.property',
      'vendors.read.property',
      'vendors.create.property',
      'vendors.update.property'
    ];

    let allAssigned = true;
    for (const reqPerm of requiredApiPermissions) {
      const [resource, action, scope] = reqPerm.split('.');
      
      // Check if permission exists
      const permission = await prisma.permission.findFirst({
        where: { resource, action, scope }
      });

      if (!permission) {
        console.log(`  ❌ Permission not found: ${reqPerm}`);
        allAssigned = false;
        continue;
      }

      // Check if it's assigned to at least one admin role
      const roleAssignment = await prisma.rolePermission.findFirst({
        where: {
          permissionId: permission.id,
          granted: true,
          role: {
            OR: [
              { name: { contains: 'Admin' } },
              { name: { contains: 'Manager' } },
              { name: { contains: 'Super' } },
            ],
            isSystemRole: true,
            isActive: true
          }
        },
        include: {
          role: { select: { name: true } }
        }
      });

      if (roleAssignment) {
        console.log(`  ✅ ${reqPerm} → ${roleAssignment.role.name}`);
      } else {
        console.log(`  ❌ ${reqPerm} not assigned to any admin role`);
        allAssigned = false;
      }
    }

    console.log('\n✅ Permission assignment complete!');
    
    if (allAssigned) {
      console.log('\n🎉 SUCCESS: All required permissions are properly assigned!');
      console.log('\n📱 Test the fixed APIs:');
      console.log('  1. Login as an admin user at: https://frontend-copy-production-f1da.up.railway.app');
      console.log('  2. Navigate to Concierge or Vendors pages');
      console.log('  3. Should no longer see 403 Forbidden errors');
      console.log('\n🔗 Direct API tests:');
      console.log('  GET /api/concierge/object-types');
      console.log('  GET /api/concierge/objects');
      console.log('  GET /api/vendors');
    } else {
      console.log('\n⚠️  Some permissions may still be missing. Review the output above.');
    }

  } catch (error) {
    console.error('❌ Permission assignment failed:', error);
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Usage: DATABASE_URL="postgresql://..." npx tsx assign-admin-concierge-permissions.ts');
    process.exit(1);
  }

  await assignAdminConciergePermissions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Permission assignment failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });