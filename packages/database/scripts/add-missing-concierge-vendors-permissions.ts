import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Permissions exactly matching the controller decorators
const REQUIRED_PERMISSIONS = [
  // CONCIERGE MODULE - Basic permissions matching controller usage
  {
    resource: 'concierge',
    action: 'read',
    scope: 'property',
    name: 'View Concierge Data',
    description: 'View concierge objects, stats, and object types',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'create',
    scope: 'property',
    name: 'Create Concierge Objects',
    description: 'Create new concierge objects and requests',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'update',
    scope: 'property',
    name: 'Update Concierge Objects',
    description: 'Modify concierge objects and their status',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'complete',
    scope: 'property',
    name: 'Complete Concierge Objects',
    description: 'Mark concierge objects as completed',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'execute',
    scope: 'property',
    name: 'Execute Concierge Playbooks',
    description: 'Execute automated concierge workflows',
    category: 'Concierge',
    isSystem: true
  },

  // VENDORS MODULE - Basic permissions matching controller usage
  {
    resource: 'vendors',
    action: 'read',
    scope: 'property',
    name: 'View Vendors',
    description: 'View vendor directory and links',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'create',
    scope: 'property',
    name: 'Create Vendors',
    description: 'Add new vendors and create vendor links/portal tokens',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'update',
    scope: 'property',
    name: 'Update Vendors',
    description: 'Modify vendors and confirm vendor links',
    category: 'Vendors',
    isSystem: true
  }
];

// Navigation permissions for sidebar items
const NAVIGATION_PERMISSIONS = [
  {
    resource: 'system',
    action: 'manage',
    scope: 'departments',
    name: 'Manage Departments',
    description: 'Access to departments management interface',
    category: 'System',
    isSystem: true
  },
  {
    resource: 'system',
    action: 'manage',
    scope: 'organizations',
    name: 'Manage Organizations',
    description: 'Access to organizations management interface',
    category: 'System',
    isSystem: true
  },
  {
    resource: 'system',
    action: 'manage',
    scope: 'properties',
    name: 'Manage Properties',
    description: 'Access to properties management interface',
    category: 'System',
    isSystem: true
  }
];

async function addMissingPermissions() {
  console.log('🔧 Adding missing Concierge, Vendors, and Navigation permissions...');

  try {
    const ALL_PERMISSIONS = [...REQUIRED_PERMISSIONS, ...NAVIGATION_PERMISSIONS];
    
    // 1. Create permissions (skip if already exist)
    console.log('📝 Creating permissions...');
    let createdCount = 0;
    
    for (const permission of ALL_PERMISSIONS) {
      const existing = await prisma.permission.findFirst({
        where: {
          resource: permission.resource,
          action: permission.action,
          scope: permission.scope
        }
      });

      if (!existing) {
        await prisma.permission.create({
          data: {
            resource: permission.resource,
            action: permission.action,
            scope: permission.scope,
            name: permission.name,
            description: permission.description,
            category: permission.category,
            isSystem: permission.isSystem
          }
        });
        createdCount++;
        console.log(`  ✅ Created: ${permission.resource}.${permission.action}.${permission.scope}`);
      } else {
        console.log(`  ⏭️  Exists: ${permission.resource}.${permission.action}.${permission.scope}`);
      }
    }

    // 2. Find admin roles and assign permissions
    console.log('\n🔗 Assigning permissions to admin roles...');
    
    const adminRoles = await prisma.customRole.findMany({
      where: {
        OR: [
          { name: { contains: 'Admin', mode: 'insensitive' } },
          { name: { contains: 'Manager', mode: 'insensitive' } },
          { name: { contains: 'PLATFORM_ADMIN', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });

    console.log(`Found ${adminRoles.length} admin roles`);

    for (const role of adminRoles) {
      let assignedCount = 0;
      
      // Get all the permissions we just created/verified
      const permissions = await prisma.permission.findMany({
        where: {
          OR: [
            { resource: 'concierge' },
            { resource: 'vendors' },
            { 
              AND: [
                { resource: 'system' },
                { action: 'manage' },
                { scope: { in: ['departments', 'organizations', 'properties'] } }
              ]
            }
          ]
        }
      });

      for (const permission of permissions) {
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
        }
      }

      console.log(`  ✅ ${role.name}: Assigned ${assignedCount} new permissions`);
    }

    // 3. Also assign to system roles if they exist
    const systemRoles = await prisma.user.findMany({
      where: {
        role: { in: ['PLATFORM_ADMIN', 'ORG_ADMIN', 'PROPERTY_MANAGER'] }
      },
      distinct: ['role']
    });

    console.log(`\n👥 Found users with system roles: ${systemRoles.map(u => u.role).join(', ')}`);

    // 4. Verification
    console.log('\n🔍 Verification - checking key permissions exist:');
    const testPermissions = [
      'concierge.read.property',
      'concierge.create.property', 
      'concierge.update.property',
      'concierge.complete.property',
      'concierge.execute.property',
      'vendors.read.property',
      'vendors.create.property',
      'vendors.update.property',
      'system.manage.departments',
      'system.manage.organizations',
      'system.manage.properties'
    ];

    let allExist = true;
    for (const testPerm of testPermissions) {
      const [resource, action, scope] = testPerm.split('.');
      const exists = await prisma.permission.findFirst({
        where: { resource, action, scope }
      });
      console.log(`  ${exists ? '✅' : '❌'} ${testPerm}`);
      if (!exists) allExist = false;
    }

    // 5. Display summary
    const totalConciergePermissions = await prisma.permission.count({
      where: { resource: 'concierge' }
    });
    const totalVendorsPermissions = await prisma.permission.count({
      where: { resource: 'vendors' }
    });
    const totalSystemPermissions = await prisma.permission.count({
      where: { 
        AND: [
          { resource: 'system' },
          { action: 'manage' },
          { scope: { in: ['departments', 'organizations', 'properties'] } }
        ]
      }
    });
    
    console.log('\n📊 Summary:');
    console.log(`  - New permissions created: ${createdCount}`);
    console.log(`  - Total concierge permissions: ${totalConciergePermissions}`);
    console.log(`  - Total vendors permissions: ${totalVendorsPermissions}`);
    console.log(`  - System navigation permissions: ${totalSystemPermissions}`);
    console.log(`  - Admin roles updated: ${adminRoles.length}`);
    
    if (allExist) {
      console.log('\n✅ All required permissions are now available!');
      console.log('\n🔍 Test these endpoints:');
      console.log('  GET /api/concierge/stats');
      console.log('  GET /api/concierge/objects');
      console.log('  GET /api/vendors/links');
      console.log('  GET /api/vendors');
    } else {
      console.log('\n❌ Some permissions are missing. Please check the logs above.');
    }

  } catch (error) {
    console.error('❌ Failed to add permissions:', error);
    throw error;
  }
}

async function main() {
  await addMissingPermissions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Script failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });