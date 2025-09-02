const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function debugModuleStatus() {
  try {
    console.log('🔍 Starting module status debug...');
    
    // Find organizations with 'Taso' in name
    const organizations = await prisma.organization.findMany({
      where: { 
        name: { 
          contains: 'Taso', 
          mode: 'insensitive' 
        } 
      }
    });
    
    console.log('🏢 Taso organizations found:', organizations.length);
    
    if (organizations.length === 0) {
      console.log('❌ No Taso organizations found');
      return;
    }
    
    for (const org of organizations) {
      console.log(`\n🔍 Organization: ${org.name} (id: ${org.id})`);
      
      // Check module subscriptions
      const subscriptions = await prisma.moduleSubscription.findMany({
        where: { organizationId: org.id },
        orderBy: [{ moduleName: 'asc' }]
      });
      
      console.log(`📦 Module subscriptions for ${org.name}:`);
      subscriptions.forEach(sub => {
        console.log(`   - ${sub.moduleName}: ${sub.isEnabled ? 'ENABLED' : 'DISABLED'} ${sub.propertyId ? `(property: ${sub.propertyId})` : '(org-wide)'}`);
      });
      
      // Check HR module specifically
      const hrSubs = subscriptions.filter(s => s.moduleName === 'hr');
      console.log(`\n💼 HR module subscriptions:`);
      if (hrSubs.length === 0) {
        console.log('   ⚠️ No HR subscriptions found');
      } else {
        hrSubs.forEach(sub => {
          console.log(`   - HR: ${sub.isEnabled ? 'ENABLED' : 'DISABLED'} ${sub.propertyId ? `(property: ${sub.propertyId})` : '(org-wide)'}`);
          console.log(`     Created: ${sub.createdAt}, Updated: ${sub.updatedAt}`);
          if (sub.disabledAt) {
            console.log(`     Disabled at: ${sub.disabledAt}`);
          }
        });
      }
      
      // Get properties for this org
      const properties = await prisma.property.findMany({
        where: { organizationId: org.id },
        select: { id: true, name: true }
      });
      
      console.log(`\n🏨 Properties for ${org.name}:`);
      properties.forEach(prop => {
        console.log(`   - ${prop.name} (${prop.id})`);
      });
    }
    
    // Check HR module manifest
    const hrModule = await prisma.moduleManifest.findFirst({
      where: { moduleId: 'hr' }
    });
    
    console.log(`\n⚙️ HR Module manifest:`);
    console.log(`   - Module ID: ${hrModule?.moduleId}`);
    console.log(`   - Name: ${hrModule?.name}`);
    console.log(`   - Is System Module: ${hrModule?.isSystemModule}`);
    console.log(`   - Description: ${hrModule?.description}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugModuleStatus();