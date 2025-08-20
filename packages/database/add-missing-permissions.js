const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingPermissions() {
  console.log('Adding missing organization and property permissions...');
  
  const permissions = [
    // Organization permissions
    { resource: 'organization', action: 'create', scope: 'all', name: 'Create All Organizations', description: 'Create new organizations' },
    { resource: 'organization', action: 'read', scope: 'all', name: 'Read All Organizations', description: 'Read all organizations' },
    { resource: 'organization', action: 'read', scope: 'organization', name: 'Read Own Organization', description: 'Read own organization' },
    { resource: 'organization', action: 'update', scope: 'all', name: 'Update All Organizations', description: 'Update all organizations' },
    { resource: 'organization', action: 'update', scope: 'organization', name: 'Update Own Organization', description: 'Update own organization' },
    { resource: 'organization', action: 'delete', scope: 'all', name: 'Delete All Organizations', description: 'Delete organizations' },
    { resource: 'organization', action: 'delete', scope: 'organization', name: 'Delete Own Organization', description: 'Delete own organization' },
    
    // Property permissions
    { resource: 'property', action: 'create', scope: 'all', name: 'Create All Properties', description: 'Create properties in any organization' },
    { resource: 'property', action: 'create', scope: 'organization', name: 'Create Organization Properties', description: 'Create properties in own organization' },
    { resource: 'property', action: 'read', scope: 'all', name: 'Read All Properties', description: 'Read all properties' },
    { resource: 'property', action: 'read', scope: 'organization', name: 'Read Organization Properties', description: 'Read properties in own organization' },
    { resource: 'property', action: 'read', scope: 'property', name: 'Read Own Property', description: 'Read own property' },
    { resource: 'property', action: 'update', scope: 'all', name: 'Update All Properties', description: 'Update all properties' },
    { resource: 'property', action: 'update', scope: 'organization', name: 'Update Organization Properties', description: 'Update properties in own organization' },
    { resource: 'property', action: 'update', scope: 'property', name: 'Update Own Property', description: 'Update own property' },
    { resource: 'property', action: 'delete', scope: 'all', name: 'Delete All Properties', description: 'Delete properties' },
    { resource: 'property', action: 'delete', scope: 'organization', name: 'Delete Organization Properties', description: 'Delete properties in own organization' },
    { resource: 'property', action: 'delete', scope: 'property', name: 'Delete Own Property', description: 'Delete own property' },
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
  
  console.log(`\nAdded ${addedCount} new permissions`);
  await prisma.$disconnect();
}

addMissingPermissions().catch(console.error);