import { PrismaClient } from '@prisma/client';

// Initialize Prisma with explicit configuration for Railway
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function verifyConciergeAccess() {
  console.log('🔍 Verifying Concierge and Vendors access for Railway database...');
  console.log(`📡 Database URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`);

  try {
    // 1. Check if concierge and vendors permissions exist
    console.log('\n📝 Checking Concierge and Vendors permissions...');
    const conciergePermissions = await prisma.permission.findMany({
      where: { resource: 'concierge' },
      select: { resource: true, action: true, scope: true, name: true }
    });
    
    const vendorsPermissions = await prisma.permission.findMany({
      where: { resource: 'vendors' },
      select: { resource: true, action: true, scope: true, name: true }
    });

    console.log(`✅ Found ${conciergePermissions.length} concierge permissions:`);
    conciergePermissions.forEach(p => 
      console.log(`  - ${p.resource}.${p.action}.${p.scope} (${p.name})`)
    );

    console.log(`✅ Found ${vendorsPermissions.length} vendors permissions:`);
    vendorsPermissions.forEach(p => 
      console.log(`  - ${p.resource}.${p.action}.${p.scope} (${p.name})`)
    );

    // 2. Check which system roles have concierge/vendors permissions
    console.log('\n🎭 Checking role assignments...');
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        permission: {
          resource: { in: ['concierge', 'vendors'] }
        }
      },
      include: {
        role: { select: { name: true, isSystemRole: true } },
        permission: { select: { resource: true, action: true, scope: true } }
      }
    });

    const roleAssignments: Record<string, string[]> = {};
    rolePermissions.forEach(rp => {
      const roleName = rp.role.name;
      if (!roleAssignments[roleName]) {
        roleAssignments[roleName] = [];
      }
      roleAssignments[roleName].push(`${rp.permission.resource}.${rp.permission.action}.${rp.permission.scope}`);
    });

    console.log('📊 Role permissions summary:');
    Object.entries(roleAssignments).forEach(([roleName, permissions]) => {
      console.log(`  ${roleName}: ${permissions.length} permissions`);
      permissions.forEach(p => console.log(`    - ${p}`));
    });

    // 3. Check specific users and their role assignments
    console.log('\n👥 Checking user access...');
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        customRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  where: {
                    granted: true,
                    permission: {
                      resource: { in: ['concierge', 'vendors'] }
                    }
                  },
                  include: {
                    permission: { select: { resource: true, action: true, scope: true } }
                  }
                }
              }
            }
          }
        }
      },
      take: 10
    });

    console.log(`Found ${users.length} active users (showing first 10):`);
    for (const user of users) {
      const conciergeVendorsPermissions: string[] = [];
      
      user.customRoles.forEach(userRole => {
        userRole.role.permissions.forEach(rolePermission => {
          const perm = rolePermission.permission;
          conciergeVendorsPermissions.push(`${perm.resource}.${perm.action}.${perm.scope}`);
        });
      });

      const roleNames = user.customRoles.map(ur => ur.role.name).join(', ');
      console.log(`  📧 ${user.email}`);
      console.log(`    Roles: ${roleNames || 'None'}`);
      console.log(`    Concierge/Vendors permissions: ${conciergeVendorsPermissions.length}`);
      if (conciergeVendorsPermissions.length > 0) {
        conciergeVendorsPermissions.slice(0, 3).forEach(p => console.log(`      - ${p}`));
        if (conciergeVendorsPermissions.length > 3) {
          console.log(`      ... and ${conciergeVendorsPermissions.length - 3} more`);
        }
      }
    }

    // 4. Check module subscriptions
    console.log('\n🔧 Checking module subscriptions...');
    const moduleSubscriptions = await prisma.moduleSubscription.findMany({
      where: {
        moduleName: { in: ['concierge', 'vendors'] },
        isEnabled: true
      },
      include: {
        organization: { select: { name: true } },
        property: { select: { name: true } }
      }
    });

    console.log(`Found ${moduleSubscriptions.length} active module subscriptions:`);
    moduleSubscriptions.forEach(sub => {
      console.log(`  🏨 ${sub.property?.name || sub.organization.name} - ${sub.moduleName}: ${sub.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    });

    // 5. Check if demo data was created
    console.log('\n📊 Checking demo data...');
    const conciergeObjectsCount = await prisma.conciergeObject.count();
    const vendorsCount = await prisma.vendor.count();
    const objectTypesCount = await prisma.objectType.count();
    const playbooksCount = await prisma.playbook.count();
    const vendorLinksCount = await prisma.vendorLink.count();

    console.log(`Demo data summary:`);
    console.log(`  - Concierge Objects: ${conciergeObjectsCount}`);
    console.log(`  - Vendors: ${vendorsCount}`);
    console.log(`  - Object Types: ${objectTypesCount}`);
    console.log(`  - Playbooks: ${playbooksCount}`);
    console.log(`  - Vendor Links: ${vendorLinksCount}`);

    // 6. Test specific permission checks for common scenarios
    console.log('\n🧪 Testing permission scenarios...');
    const testUsers = await prisma.user.findMany({
      where: { isActive: true },
      take: 3
    });

    for (const user of testUsers) {
      console.log(`  Testing user: ${user.email}`);
      
      // Check if user can read concierge objects
      const canReadConcierge = await checkUserPermission(user.id, 'concierge.read.property');
      console.log(`    Can read concierge: ${canReadConcierge ? '✅' : '❌'}`);
      
      // Check if user can create concierge objects
      const canCreateConcierge = await checkUserPermission(user.id, 'concierge.create.property');
      console.log(`    Can create concierge: ${canCreateConcierge ? '✅' : '❌'}`);
      
      // Check if user can read vendors
      const canReadVendors = await checkUserPermission(user.id, 'vendors.read.property');
      console.log(`    Can read vendors: ${canReadVendors ? '✅' : '❌'}`);
    }

    console.log('\n✅ Verification complete!');
    console.log('\n🔍 Next steps:');
    console.log('  1. Test the APIs at: https://backend-copy-production-328d.up.railway.app/api');
    console.log('  2. Try: GET /api/concierge/object-types');
    console.log('  3. Try: GET /api/concierge/objects');
    console.log('  4. Try: GET /api/vendors');
    console.log('  5. Check frontend: https://frontend-copy-production-f1da.up.railway.app');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

async function checkUserPermission(userId: string, permission: string): Promise<boolean> {
  const [resource, action, scope] = permission.split('.');
  
  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      granted: true,
      permission: { resource, action, scope },
      role: {
        userRoles: {
          some: { userId }
        }
      }
    }
  });

  return rolePermissions.length > 0;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Usage: DATABASE_URL="postgresql://..." npx tsx verify-concierge-access.ts');
    process.exit(1);
  }

  await verifyConciergeAccess();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Verification failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });