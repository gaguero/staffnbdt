const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProductionPermissions() {
  console.log('Fixing production permissions for Roberto Martinez...');
  
  const userId = 'cmej91r0l002ns2f0e9dxocvf'; // Roberto Martinez
  
  // First, let's see what permissions exist
  const allPermissions = await prisma.permission.findMany();
  console.log(`Found ${allPermissions.length} total permissions in database`);
  
  // Check if organization/property permissions exist
  const orgPropertyPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: 'organization' },
        { resource: 'property' }
      ]
    }
  });
  
  console.log(`Found ${orgPropertyPermissions.length} org/property permissions`);
  
  if (orgPropertyPermissions.length === 0) {
    console.log('Creating organization and property permissions...');
    
    const permissions = [
      // Organization permissions
      { resource: 'organization', action: 'create', scope: 'all', name: 'Create Organizations', description: 'Create new organizations' },
      { resource: 'organization', action: 'read', scope: 'all', name: 'Read Organizations', description: 'Read all organizations' },
      { resource: 'organization', action: 'update', scope: 'all', name: 'Update Organizations', description: 'Update organizations' },
      { resource: 'organization', action: 'delete', scope: 'all', name: 'Delete Organizations', description: 'Delete organizations' },
      
      // Additional organization scopes for proper RBAC
      { resource: 'organization', action: 'create', scope: 'platform', name: 'Create Organizations (Platform)', description: 'Platform admin create organizations' },
      { resource: 'organization', action: 'read', scope: 'platform', name: 'Read Organizations (Platform)', description: 'Platform admin read organizations' },
      { resource: 'organization', action: 'update', scope: 'platform', name: 'Update Organizations (Platform)', description: 'Platform admin update organizations' },
      { resource: 'organization', action: 'delete', scope: 'platform', name: 'Delete Organizations (Platform)', description: 'Platform admin delete organizations' },
      
      // Property permissions
      { resource: 'property', action: 'create', scope: 'all', name: 'Create Properties', description: 'Create properties' },
      { resource: 'property', action: 'read', scope: 'all', name: 'Read Properties', description: 'Read properties' },
      { resource: 'property', action: 'update', scope: 'all', name: 'Update Properties', description: 'Update properties' },
      { resource: 'property', action: 'delete', scope: 'all', name: 'Delete Properties', description: 'Delete properties' },
      
      // Additional property scopes
      { resource: 'property', action: 'create', scope: 'organization', name: 'Create Properties (Org)', description: 'Organization create properties' },
      { resource: 'property', action: 'read', scope: 'organization', name: 'Read Properties (Org)', description: 'Organization read properties' },
      { resource: 'property', action: 'update', scope: 'organization', name: 'Update Properties (Org)', description: 'Organization update properties' },
      { resource: 'property', action: 'delete', scope: 'organization', name: 'Delete Properties (Org)', description: 'Organization delete properties' },
    ];
    
    for (const permission of permissions) {
      try {
        const created = await prisma.permission.create({
          data: permission,
        });
        console.log(`✓ Created: ${permission.resource}.${permission.action}.${permission.scope}`);
        orgPropertyPermissions.push(created);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`- Already exists: ${permission.resource}.${permission.action}.${permission.scope}`);
          // Try to find the existing one
          const existing = await prisma.permission.findFirst({
            where: {
              resource: permission.resource,
              action: permission.action,
              scope: permission.scope,
            },
          });
          if (existing) {
            orgPropertyPermissions.push(existing);
          }
        } else {
          console.error(`✗ Failed to create ${permission.resource}.${permission.action}.${permission.scope}:`, error.message);
        }
      }
    }
  }
  
  console.log(`\nAssigning ${orgPropertyPermissions.length} permissions to Roberto Martinez...`);
  
  // Clear existing user permissions first
  await prisma.userPermission.deleteMany({
    where: { userId: userId }
  });
  console.log('✓ Cleared existing permissions');
  
  // Now assign all org/property permissions
  let assignedCount = 0;
  
  for (const permission of orgPropertyPermissions) {
    try {
      await prisma.userPermission.create({
        data: {
          userId: userId,
          permissionId: permission.id,
          isActive: true,
          grantedBy: userId,
        },
      });
      console.log(`✓ Assigned: ${permission.resource}.${permission.action}.${permission.scope}`);
      assignedCount++;
    } catch (error) {
      console.error(`✗ Failed to assign ${permission.resource}.${permission.action}.${permission.scope}:`, error.message);
    }
  }
  
  // Also assign some basic user permissions for completeness
  const userPermissions = await prisma.permission.findMany({
    where: { resource: 'user' }
  });
  
  for (const permission of userPermissions) {
    try {
      await prisma.userPermission.create({
        data: {
          userId: userId,
          permissionId: permission.id,
          isActive: true,
          grantedBy: userId,
        },
      });
      console.log(`✓ Assigned: ${permission.resource}.${permission.action}.${permission.scope}`);
      assignedCount++;
    } catch (error) {
      console.error(`✗ Failed to assign ${permission.resource}.${permission.action}.${permission.scope}:`, error.message);
    }
  }
  
  console.log(`\n✓ Successfully assigned ${assignedCount} permissions to Roberto Martinez`);
  
  // Clear permission cache
  await prisma.permissionCache.deleteMany({
    where: { userId: userId }
  });
  console.log('✓ Cleared permission cache');
  
  await prisma.$disconnect();
}

fixProductionPermissions().catch(console.error);