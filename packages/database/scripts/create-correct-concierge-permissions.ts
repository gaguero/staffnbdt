import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Correct permissions matching the fixed controller decorators
const CORRECT_PERMISSIONS = [
  // ===== CONCIERGE MODULE (simplified) =====
  {
    resource: 'concierge',
    action: 'read',
    scope: 'property',
    name: 'View Concierge Operations',
    description: 'View concierge objects, object types and requests within the property',
    category: 'Concierge',
    isSystem: true
  },
  {
    resource: 'concierge',
    action: 'create',
    scope: 'property',
    name: 'Create Concierge Objects',
    description: 'Create new concierge requests and objects',
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
    description: 'Execute automated concierge workflows and SLA processes',
    category: 'Concierge',
    isSystem: true
  },

  // ===== VENDORS MODULE (already correct) =====
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

async function createCorrectConciergePermissions() {
  console.log('🔧 Creating correct Concierge and Vendors permissions...');

  try {
    // 1. Delete any existing concierge/vendors permissions first
    console.log('🗑️ Cleaning up existing concierge/vendors permissions...');
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
      
      // Determine which permissions to assign based on role name/description
      if (role.name.includes('Admin') || role.name.includes('Manager')) {
        // Admins and managers get all permissions
        permissionsToAssign = CORRECT_PERMISSIONS.map(p => `${p.resource}.${p.action}.${p.scope}`);
      } else if (role.name.includes('Front Desk') || role.name.includes('Concierge')) {
        // Front desk and concierge get most concierge permissions plus vendor read
        permissionsToAssign = [
          'concierge.read.property',
          'concierge.create.property',
          'concierge.update.property',
          'concierge.complete.property',
          'vendors.read.property'
        ];
      } else if (role.name.includes('Supervisor') || role.name.includes('Department')) {
        // Supervisors get basic concierge and vendor permissions
        permissionsToAssign = [
          'concierge.read.property',
          'concierge.create.property',
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

    // 4. Verification - test the exact permissions the controllers expect
    console.log('\n🔍 Verification - checking controller permissions:');
    const controllerPermissions = [
      'concierge.read.property',      // Used by GET /object-types, GET /objects, GET /objects/:id
      'concierge.create.property',    // Used by POST /objects
      'concierge.update.property',    // Used by PUT /objects/:id
      'concierge.complete.property',  // Used by POST /objects/:id/complete
      'concierge.execute.property',   // Used by POST /playbooks/execute
      'vendors.read.property',        // Used by GET /vendors, GET /vendors/:id
      'vendors.create.property',      // Used by POST /vendors
      'vendors.update.property',      // Used by PUT /vendors/:id
      'vendors.links.create.property',  // Used by POST /links
      'vendors.links.confirm.property', // Used by POST /links/:id/confirm
      'vendors.portal.create.property', // Used by POST /links/:id/portal-token
      'vendors.portal.send.property'    // Used by POST /links/:id/send-notification
    ];

    for (const testPerm of controllerPermissions) {
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
    
    console.log('\n✅ Concierge and Vendors permissions created successfully!');
    console.log('\n🔍 Ready to test the APIs - should no longer get 403 errors:');
    console.log('  GET /api/concierge/object-types');
    console.log('  GET /api/concierge/objects');
    console.log('  POST /api/concierge/objects');
    console.log('  GET /api/vendors');

  } catch (error) {
    console.error('❌ Permission creation failed:', error);
    throw error;
  }
}

async function main() {
  await createCorrectConciergePermissions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Permission creation failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });