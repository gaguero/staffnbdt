const { PrismaClient } = require('@prisma/client');

// Use the production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
    }
  }
});

async function addProductionPermissions() {
  console.log('Adding missing organization and property permissions to PRODUCTION database...');
  
  const permissions = [
    // Organization permissions (with 'all' scope to match frontend)
    { resource: 'organization', action: 'create', scope: 'all', name: 'Create Organizations', description: 'Create new organizations' },
    { resource: 'organization', action: 'read', scope: 'all', name: 'Read Organizations', description: 'Read all organizations' },
    { resource: 'organization', action: 'update', scope: 'all', name: 'Update Organizations', description: 'Update organizations' },
    { resource: 'organization', action: 'delete', scope: 'all', name: 'Delete Organizations', description: 'Delete organizations' },
    
    // Property permissions (with 'all' scope to match frontend)
    { resource: 'property', action: 'create', scope: 'all', name: 'Create Properties', description: 'Create properties' },
    { resource: 'property', action: 'read', scope: 'all', name: 'Read Properties', description: 'Read properties' },
    { resource: 'property', action: 'update', scope: 'all', name: 'Update Properties', description: 'Update properties' },
    { resource: 'property', action: 'delete', scope: 'all', name: 'Delete Properties', description: 'Delete properties' },
  ];
  
  let addedCount = 0;
  
  for (const permission of permissions) {
    try {
      const existing = await prisma.permission.findUnique({
        where: {
          resource_action_scope: {
            resource: permission.resource,
            action: permission.action,
            scope: permission.scope,
          },
        },
      });
      
      if (!existing) {
        await prisma.permission.create({
          data: permission,
        });
        console.log(`✓ Added: ${permission.resource}.${permission.action}.${permission.scope}`);
        addedCount++;
      } else {
        console.log(`- Exists: ${permission.resource}.${permission.action}.${permission.scope}`);
      }
    } catch (error) {
      console.error(`✗ Failed to add ${permission.resource}.${permission.action}.${permission.scope}:`, error.message);
    }
  }
  
  console.log(`\nAdded ${addedCount} new permissions to production database`);
  
  // Now assign these permissions to the PLATFORM_ADMIN user
  console.log('\nAssigning permissions to Roberto Martinez...');
  
  const userId = 'cmej91r0l002ns2f0e9dxocvf'; // From browser console logs
  
  // Get all organization and property permissions
  const allPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: 'organization' },
        { resource: 'property' }
      ]
    }
  });
  
  let assignedCount = 0;
  
  for (const permission of allPermissions) {
    try {
      // Check if already assigned
      const existing = await prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId: userId,
            permissionId: permission.id,
          },
        },
      });
      
      if (!existing) {
        await prisma.userPermission.create({
          data: {
            userId: userId,
            permissionId: permission.id,
            isActive: true,
            grantedBy: userId, // Self-granted for testing
          },
        });
        console.log(`✓ Assigned: ${permission.resource}.${permission.action}.${permission.scope}`);
        assignedCount++;
      } else {
        console.log(`- Already assigned: ${permission.resource}.${permission.action}.${permission.scope}`);
      }
    } catch (error) {
      console.error(`✗ Failed to assign ${permission.resource}.${permission.action}.${permission.scope}:`, error.message);
    }
  }
  
  console.log(`\nAssigned ${assignedCount} permissions to Roberto Martinez`);
  
  await prisma.$disconnect();
}

addProductionPermissions().catch(console.error);