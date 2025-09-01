import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Correct permissions matching the controller decorators exactly
const CORRECT_PERMISSIONS = [
  // ===== CONCIERGE MODULE (matching controller decorators) =====
  {
    resource: 'concierge',
    action: 'object-types.read',
    scope: 'property',
    name: 'View Concierge Object Types',
    description: 'View available concierge object types and their schemas',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'objects.read',
    scope: 'property',
    name: 'View Concierge Objects',
    description: 'View concierge objects and requests within the property',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'objects.create',
    scope: 'property',
    name: 'Create Concierge Objects',
    description: 'Create new concierge requests and objects',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'objects.update',
    scope: 'property',
    name: 'Update Concierge Objects',
    description: 'Modify concierge objects and their status',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'objects.complete',
    scope: 'property',
    name: 'Complete Concierge Objects',
    description: 'Mark concierge objects as completed',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'playbooks.execute',
    scope: 'property',
    name: 'Execute Concierge Playbooks',
    description: 'Execute automated concierge workflows and SLA processes',
    category: 'Concierge',
    isSystem: true
  },

  // ===== VENDORS MODULE (matching controller decorators) =====
  {
    resource: 'vendors',
    action: 'read',
    scope: 'property',
    name: 'View Property Vendors',
    description: 'View vendor directory and information',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'create',
    scope: 'property',
    name: 'Create Vendors',
    description: 'Add new vendors to the property directory',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'update',
    scope: 'property',
    name: 'Update Vendors',
    description: 'Modify vendor information and status',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'delete',
    scope: 'property',
    name: 'Delete Vendors',
    description: 'Remove vendors from the property directory',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'links.create',
    scope: 'property',
    name: 'Create Vendor Links',
    description: 'Create links between vendors and objects',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'links.confirm',
    scope: 'property',
    name: 'Confirm Vendor Links',
    description: 'Process vendor confirmations and responses',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'portal.create',
    scope: 'property',
    name: 'Create Vendor Portal Tokens',
    description: 'Generate secure access tokens for vendor portal',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'portal.send',
    scope: 'property',
    name: 'Send Vendor Portal Notifications',
    description: 'Send notifications and invitations to vendors',
    category: 'Vendors',
    isSystem: true
  },
  {
    resource: 'vendors',
    action: 'manage',
    scope: 'property',
    name: 'Manage Vendor Operations',
    description: 'Full vendor management including policies and performance tracking',
    category: 'Vendors',
    isSystem: true
  }
];

async function fixConciergeVendorsPermissions() {
  console.log('🔧 Fixing Concierge and Vendors permissions...');

  try {
    // 1. Delete any incorrectly created permissions first
    console.log('🗑️ Cleaning up incorrect permissions...');
    await prisma.permission.deleteMany({
      where: {
        OR: [
          { resource: 'concierge' },
          { resource: 'vendors' }
        ]
      }
    });

    // 2. Create all correct permissions
    console.log('📝 Creating correct permissions...');
    let createdPermissions = 0;
    
    for (const permission of CORRECT_PERMISSIONS) {
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
      createdPermissions++;
      console.log(`  ✅ ${permission.resource}.${permission.action}.${permission.scope}`);
    }

    // 3. Assign permissions to existing system roles
    console.log('\n🔗 Assigning permissions to system roles...');
    
    // Find existing system roles by name pattern matching
    const systemRoles = await prisma.customRole.findMany({
      where: {
        isSystemRole: true,
        organizationId: null,
        propertyId: null,
        isActive: true
      }
    });

    console.log(`Found ${systemRoles.length} system roles`);

    for (const role of systemRoles) {
      let permissionsToAssign: string[] = [];
      
      // Determine which permissions to assign based on role name
      if (role.name.includes('Admin') || role.name.includes('Manager')) {
        // Admins and managers get all permissions
        permissionsToAssign = CORRECT_PERMISSIONS.map(p => `${p.resource}.${p.action}.${p.scope}`);
      } else if (role.name.includes('Front Desk') || role.name.includes('Concierge')) {
        // Front desk and concierge get most concierge permissions
        permissionsToAssign = [
          'concierge.object-types.read.property',
          'concierge.objects.read.property',
          'concierge.objects.create.property',
          'concierge.objects.update.property',
          'concierge.objects.complete.property',
          'vendors.read.property'
        ];
      } else if (role.name.includes('Supervisor') || role.name.includes('Department')) {
        // Supervisors get basic concierge and vendor permissions
        permissionsToAssign = [
          'concierge.object-types.read.property',
          'concierge.objects.read.property',
          'concierge.objects.create.property',
          'vendors.read.property',
          'vendors.links.create.property'
        ];
      }

      let addedCount = 0;
      for (const permissionKey of permissionsToAssign) {
        const [resource, action, scope] = permissionKey.split('.');
        
        const permission = await prisma.permission.findFirst({
          where: { resource, action, scope }
        });

        if (permission) {
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
            addedCount++;
          }
        }
      }

      console.log(`  ✅ ${role.name}: Added ${addedCount} permissions`);
    }

    // 4. Verification
    console.log('\n🔍 Verification - checking key permissions exist:');
    const testPermissions = [
      'concierge.object-types.read.property',
      'concierge.objects.read.property',
      'concierge.objects.create.property',
      'concierge.objects.update.property',
      'concierge.objects.complete.property',
      'concierge.playbooks.execute.property',
      'vendors.read.property',
      'vendors.create.property',
      'vendors.links.confirm.property',
      'vendors.portal.create.property'
    ];

    for (const testPerm of testPermissions) {
      const [resource, action, scope] = testPerm.split('.');
      const exists = await prisma.permission.findFirst({
        where: { resource, action, scope }
      });
      console.log(`  ${exists ? '✅' : '❌'} ${testPerm}`);
    }

    // 5. Display summary
    const totalConciergePermissions = await prisma.permission.count({
      where: { resource: 'concierge' }
    });
    const totalVendorsPermissions = await prisma.permission.count({
      where: { resource: 'vendors' }
    });
    
    console.log('\n📊 Summary:');
    console.log(`  - Total permissions created: ${createdPermissions}`);
    console.log(`  - Concierge permissions: ${totalConciergePermissions}`);
    console.log(`  - Vendors permissions: ${totalVendorsPermissions}`);
    console.log(`  - System roles updated: ${systemRoles.length}`);
    
    console.log('\n✅ Concierge and Vendors permissions fixed successfully!');
    console.log('\n🔍 You can now test the APIs:');
    console.log('  GET /api/concierge/object-types');
    console.log('  GET /api/concierge/objects');
    console.log('  GET /api/vendors');

  } catch (error) {
    console.error('❌ Permission fix failed:', error);
    throw error;
  }
}

async function main() {
  await fixConciergeVendorsPermissions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Permission fix failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });