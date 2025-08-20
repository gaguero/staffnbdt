const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCorrectPermissions() {
  console.log('Adding permissions with correct scopes for frontend...');
  
  const permissions = [
    // Organization permissions (platform scope)
    { resource: 'organization', action: 'create', scope: 'platform', name: 'Create Organizations (Platform)', description: 'Create new organizations at platform level' },
    { resource: 'organization', action: 'read', scope: 'platform', name: 'Read Organizations (Platform)', description: 'Read all organizations at platform level' },
    { resource: 'organization', action: 'update', scope: 'platform', name: 'Update Organizations (Platform)', description: 'Update organizations at platform level' },
    { resource: 'organization', action: 'delete', scope: 'platform', name: 'Delete Organizations (Platform)', description: 'Delete organizations at platform level' },
    
    // Property permissions (organization scope)
    { resource: 'property', action: 'create', scope: 'organization', name: 'Create Properties (Organization)', description: 'Create properties within organization' },
    { resource: 'property', action: 'read', scope: 'organization', name: 'Read Properties (Organization)', description: 'Read properties within organization' },
    { resource: 'property', action: 'update', scope: 'organization', name: 'Update Properties (Organization)', description: 'Update properties within organization' },
    { resource: 'property', action: 'delete', scope: 'organization', name: 'Delete Properties (Organization)', description: 'Delete properties within organization' },
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
  
  console.log(`\nAdded ${addedCount} new permissions with correct scopes`);
  await prisma.$disconnect();
}

addCorrectPermissions().catch(console.error);