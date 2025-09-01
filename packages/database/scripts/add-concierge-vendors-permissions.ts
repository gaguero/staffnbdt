import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// New permissions for Concierge and Vendors modules
const NEW_PERMISSIONS = [
  // ===== CONCIERGE MODULE =====
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

  // ===== VENDORS MODULE =====
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

// Role updates - which roles should get which new permissions
const ROLE_UPDATES = {
  'Super Administrator': 'ALL', // Gets all new permissions
  'Organization Manager': 'ALL', // Gets all new permissions  
  'Property Manager': 'ALL', // Gets all new permissions
  'Department Supervisor': [
    'concierge.object-types.read.property',
    'concierge.objects.read.property',
    'concierge.objects.create.property',
    'concierge.objects.update.property',
    'vendors.read.property',
    'vendors.links.create.property'
  ],
  'Front Desk Agent': [
    'concierge.object-types.read.property',
    'concierge.objects.read.property',
    'concierge.objects.create.property',
    'concierge.objects.update.property',
    'concierge.objects.complete.property'
  ],
  'Concierge Agent': 'ALL' // This is a new role, we'll create it too
};

async function addConciergeVendorsPermissions() {
  console.log('🔐 Adding Concierge and Vendors permissions...');

  try {
    // 1. Create all new permissions
    console.log('📝 Creating permissions...');
    let createdPermissions = 0;
    
    for (const permission of NEW_PERMISSIONS) {
      const result = await prisma.permission.upsert({
        where: { 
          resource_action_scope: {
            resource: permission.resource,
            action: permission.action,
            scope: permission.scope
          }
        },
        update: {
          name: permission.name,
          description: permission.description,
          category: permission.category,
          isSystem: permission.isSystem
        },
        create: {
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

    // 2. Create Concierge Agent role if it doesn't exist
    console.log('\n👤 Creating Concierge Agent role...');
    let conciergeRole = await prisma.customRole.findFirst({
      where: {
        name: 'Concierge Agent',
        organizationId: null,
        propertyId: null,
        isSystemRole: true
      }
    });

    if (!conciergeRole) {
      conciergeRole = await prisma.customRole.create({
        data: {
          name: 'Concierge Agent',
          description: 'Handles guest concierge services and vendor coordination',
          organizationId: null,
          propertyId: null,
          isSystemRole: true,
          priority: 250,
          isActive: true
        }
      });
      console.log('  ✅ Created Concierge Agent role');
    } else {
      console.log('  ✅ Concierge Agent role already exists');
    }

    // 3. Update role permissions
    console.log('\n🔗 Updating role permissions...');
    
    for (const [roleName, permissions] of Object.entries(ROLE_UPDATES)) {
      const role = await prisma.customRole.findFirst({
        where: {
          name: roleName,
          organizationId: null,
          propertyId: null,
          isSystemRole: true
        }
      });

      if (!role) {
        console.log(`  ⚠️ Role "${roleName}" not found, skipping...`);
        continue;
      }

      let permissionsToAdd: string[] = [];
      
      if (permissions === 'ALL') {
        permissionsToAdd = NEW_PERMISSIONS.map(p => `${p.resource}.${p.action}.${p.scope}`);
      } else {
        permissionsToAdd = permissions as string[];
      }

      let addedCount = 0;
      for (const permissionKey of permissionsToAdd) {
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

      console.log(`  ✅ ${roleName}: Added ${addedCount} new permissions`);
    }

    // 4. Display summary
    const totalConciergePermissions = await prisma.permission.count({
      where: { resource: 'concierge' }
    });
    const totalVendorsPermissions = await prisma.permission.count({
      where: { resource: 'vendors' }
    });
    
    console.log('\n📊 Summary:');
    console.log(`  - New permissions created: ${createdPermissions}`);
    console.log(`  - Total Concierge permissions: ${totalConciergePermissions}`);
    console.log(`  - Total Vendors permissions: ${totalVendorsPermissions}`);
    console.log(`  - Roles updated: ${Object.keys(ROLE_UPDATES).length}`);
    
    console.log('\n🎯 New Permissions Available:');
    console.log('  Concierge: object-types.read, objects.read/create/update/complete, playbooks.execute');
    console.log('  Vendors: read/create/update/delete, links.create/confirm, portal.create/send, manage');
    
    console.log('\n✅ Concierge and Vendors permissions added successfully!');

    // 5. Test by checking a few key permissions exist
    console.log('\n🔍 Verification:');
    const testPermissions = [
      'concierge.objects.read.property',
      'concierge.objects.create.property', 
      'vendors.read.property',
      'vendors.links.confirm.property'
    ];

    for (const testPerm of testPermissions) {
      const [resource, action, scope] = testPerm.split('.');
      const exists = await prisma.permission.findFirst({
        where: { resource, action, scope }
      });
      console.log(`  ${exists ? '✅' : '❌'} ${testPerm}`);
    }

  } catch (error) {
    console.error('❌ Permission addition failed:', error);
    throw error;
  }
}

async function main() {
  await addConciergeVendorsPermissions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Permission addition failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });