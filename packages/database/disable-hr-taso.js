const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function disableHRForTaso() {
  try {
    console.log('🚀 Disabling HR module for Taso Group...');
    
    // Find Taso Group organization
    const tasoOrg = await prisma.organization.findFirst({
      where: { 
        name: { 
          contains: 'Taso', 
          mode: 'insensitive' 
        } 
      }
    });
    
    if (!tasoOrg) {
      console.log('❌ Taso Group organization not found');
      return;
    }
    
    console.log(`🏢 Found Taso Group: ${tasoOrg.name} (id: ${tasoOrg.id})`);
    
    // Update HR module subscription to disabled
    const updatedSubscription = await prisma.moduleSubscription.updateMany({
      where: {
        organizationId: tasoOrg.id,
        moduleName: 'hr'
      },
      data: {
        isEnabled: false,
        disabledAt: new Date()
      }
    });
    
    console.log(`✅ Updated ${updatedSubscription.count} HR module subscription(s) for Taso Group`);
    
    // Verify the change
    const hrSubscriptions = await prisma.moduleSubscription.findMany({
      where: {
        organizationId: tasoOrg.id,
        moduleName: 'hr'
      }
    });
    
    console.log('💼 HR module subscriptions after update:');
    hrSubscriptions.forEach(sub => {
      console.log(`   - HR: ${sub.isEnabled ? 'ENABLED' : 'DISABLED'} ${sub.propertyId ? `(property: ${sub.propertyId})` : '(org-wide)'}`);
      console.log(`     Disabled at: ${sub.disabledAt}`);
    });
    
    console.log('🎉 HR module has been disabled for Taso Group!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

disableHRForTaso();