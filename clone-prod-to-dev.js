const { PrismaClient } = require('@prisma/client');

// Production database
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway"
    }
  }
});

// Dev database
const devPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway"
    }
  }
});

async function cloneDatabaseData() {
  console.log('🔄 Starting database clone from production to dev...');
  
  try {
    // Test connections
    console.log('Testing production connection...');
    await prodPrisma.$queryRaw`SELECT 1`;
    console.log('✅ Production database connected');
    
    console.log('Testing dev connection...');
    await devPrisma.$queryRaw`SELECT 1`;
    console.log('✅ Dev database connected');
    
    // Check if dev database has data
    const devUsersCount = await devPrisma.user.count();
    console.log(`Dev database currently has ${devUsersCount} users`);
    
    // Check production data
    const prodUsersCount = await prodPrisma.user.count();
    const prodPermissionsCount = await prodPrisma.permission.count();
    console.log(`Production database has ${prodUsersCount} users and ${prodPermissionsCount} permissions`);
    
    if (prodPermissionsCount === 0) {
      console.log('⚠️  Production database has no permissions - need to seed permissions first');
      return;
    }
    
    console.log('🎉 Database connections verified - proceeding with clone...');
    
  } catch (error) {
    console.error('❌ Error connecting to databases:', error);
    throw error;
  } finally {
    await prodPrisma.$disconnect();
    await devPrisma.$disconnect();
  }
}

cloneDatabaseData();
