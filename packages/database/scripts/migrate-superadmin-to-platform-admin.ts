import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSuperAdminToPlatformAdmin() {
  console.log('🔄 Starting migration: SUPERADMIN → PLATFORM_ADMIN');
  
  try {
    // First, let's check how many SUPERADMIN users exist
    const superAdminCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "User" WHERE role = 'SUPERADMIN'
    `;
    
    console.log(`📊 Found ${superAdminCount[0]?.count || 0} users with SUPERADMIN role`);
    
    if (superAdminCount[0]?.count > 0) {
      // Update all SUPERADMIN users to PLATFORM_ADMIN
      const result = await prisma.$executeRaw`
        UPDATE "User" SET role = 'PLATFORM_ADMIN' WHERE role = 'SUPERADMIN'
      `;
      
      console.log(`✅ Updated ${result} users from SUPERADMIN to PLATFORM_ADMIN`);
      
      // Verify the update
      const verifyCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "User" WHERE role = 'PLATFORM_ADMIN'
      `;
      
      console.log(`🔍 Verification: ${verifyCount[0]?.count || 0} users now have PLATFORM_ADMIN role`);
    } else {
      console.log('ℹ️  No SUPERADMIN users found - migration not needed');
    }
    
    console.log('✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Self-executing function
migrateSuperAdminToPlatformAdmin()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });