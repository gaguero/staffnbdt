const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearPermissionCache() {
  console.log('Clearing permission cache for Roberto Martinez...');
  
  const userId = 'cmej91r0l002ns2f0e9dxocvf'; // Roberto Martinez
  
  try {
    // Delete all cached permissions for this user
    const result = await prisma.permissionCache.deleteMany({
      where: {
        userId: userId
      }
    });
    
    console.log(`✓ Cleared ${result.count} cached permission entries for Roberto Martinez`);
    
    // Also clear all expired cache entries
    const expiredResult = await prisma.permissionCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    console.log(`✓ Cleared ${expiredResult.count} expired permission cache entries`);
    
  } catch (error) {
    console.error('✗ Failed to clear permission cache:', error.message);
  }
  
  await prisma.$disconnect();
}

clearPermissionCache().catch(console.error);