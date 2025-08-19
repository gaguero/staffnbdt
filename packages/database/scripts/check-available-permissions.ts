import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAvailablePermissions() {
  console.log('🔍 Checking available permissions in database...');
  
  try {
    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        name: true,
        resource: true,
        action: true,
        scope: true,
        category: true
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
        { scope: 'asc' }
      ]
    });
    
    console.log(`\n📊 Found ${permissions.length} permissions in database:`);
    console.log('\nPermissions by category:');
    
    const byCategory = permissions.reduce((acc, p) => {
      const cat = p.category || 'uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {} as Record<string, typeof permissions>);
    
    Object.entries(byCategory).forEach(([category, perms]) => {
      console.log(`\n📁 ${category.toUpperCase()} (${perms.length} permissions):`);
      perms.forEach(p => {
        const permId = p.name || `${p.resource}.${p.action}.${p.scope}`;
        console.log(`  ✅ ${permId}`);
      });
    });
    
    // Export all permission IDs for migration script
    console.log('\n📋 All permission IDs for migration:');
    const allIds = permissions.map(p => p.name || `${p.resource}.${p.action}.${p.scope}`);
    console.log(JSON.stringify(allIds, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailablePermissions();