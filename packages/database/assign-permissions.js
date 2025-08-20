const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignPermissions() {
  console.log('Assigning organization and property permissions to Roberto Martinez...');
  
  const userId = 'cmej91r0l002ns2f0e9dxocvf'; // Roberto Martinez (from browser console)
  
  // Get all organization and property permissions
  const permissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: 'organization' },
        { resource: 'property' }
      ]
    }
  });
  
  console.log(`Found ${permissions.length} organization/property permissions`);
  
  let assignedCount = 0;
  
  for (const permission of permissions) {
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
            grantedBy: userId, // Self-granted for now
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
  
  console.log(`\nAssigned ${assignedCount} new permissions to Roberto Martinez`);
  
  // Also update user role to PLATFORM_ADMIN
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'PLATFORM_ADMIN' }
    });
    console.log('✓ Updated user role to PLATFORM_ADMIN');
  } catch (error) {
    console.error('✗ Failed to update user role:', error.message);
  }
  
  await prisma.$disconnect();
}

assignPermissions().catch(console.error);