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
      permissions.slice(0, 3).forEach(p => console.log(`    - ${p}`));
      if (permissions.length > 3) {
        console.log(`    ... and ${permissions.length - 3} more`);
      }
    });

    // 3. Check simple user access
    console.log('\n👥 Checking user access...');
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, role: true },
      take: 5
    });

    console.log(`Found ${users.length} users (showing first 5):`);
    users.forEach(user => {
      console.log(`  📧 ${user.email} (Role: ${user.role})`);
    });

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

    // 6. Test the exact API endpoints that were failing
    console.log('\n🧪 Testing specific permission combinations...');
    const requiredPermissions = [
      'concierge.read.property',      // Used by GET /object-types, GET /objects, GET /objects/:id
      'concierge.create.property',    // Used by POST /objects
      'concierge.update.property',    // Used by PUT /objects/:id
      'concierge.complete.property',  // Used by POST /objects/:id/complete
      'concierge.execute.property',   // Used by POST /playbooks/execute
      'vendors.read.property',        // Used by GET /vendors, GET /vendors/:id
      'vendors.create.property',      // Used by POST /vendors
      'vendors.update.property',      // Used by PUT /vendors/:id
    ];

    let allPermissionsExist = true;
    for (const reqPerm of requiredPermissions) {
      const [resource, action, scope] = reqPerm.split('.');
      const exists = await prisma.permission.findFirst({
        where: { resource, action, scope }
      });
      console.log(`  ${exists ? '✅' : '❌'} ${reqPerm}`);
      if (!exists) allPermissionsExist = false;
    }

    console.log('\n✅ Verification complete!');
    
    if (allPermissionsExist && conciergeObjectsCount > 0 && vendorsCount > 0) {
      console.log('\n🎉 SUCCESS: All permissions exist and demo data is seeded!');
      console.log('\n🔍 The 403 errors should now be resolved. Test these APIs:');
      console.log('  GET https://backend-copy-production-328d.up.railway.app/api/concierge/object-types');
      console.log('  GET https://backend-copy-production-328d.up.railway.app/api/concierge/objects');
      console.log('  GET https://backend-copy-production-328d.up.railway.app/api/vendors');
      console.log('\n🌐 Frontend should work at: https://frontend-copy-production-f1da.up.railway.app');
    } else {
      console.log('\n⚠️  Some issues detected:');
      if (!allPermissionsExist) console.log('   - Missing required permissions');
      if (conciergeObjectsCount === 0) console.log('   - No demo concierge objects');
      if (vendorsCount === 0) console.log('   - No demo vendors');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Usage: DATABASE_URL="postgresql://..." npx tsx verify-concierge-access-simple.ts');
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