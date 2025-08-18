const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateSuperAdminUsers() {
  console.log('🔄 Migrating SUPERADMIN users to PLATFORM_ADMIN...');

  try {
    // Find all users with SUPERADMIN role
    const superAdminUsers = await prisma.user.findMany({
      where: {
        role: 'SUPERADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log(`Found ${superAdminUsers.length} users with SUPERADMIN role`);

    if (superAdminUsers.length > 0) {
      // Update all SUPERADMIN users to PLATFORM_ADMIN
      const result = await prisma.user.updateMany({
        where: {
          role: 'SUPERADMIN'
        },
        data: {
          role: 'PLATFORM_ADMIN'
        }
      });

      console.log(`✅ Successfully updated ${result.count} users from SUPERADMIN to PLATFORM_ADMIN`);

      // Display updated users
      superAdminUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
      });
    } else {
      console.log('ℹ️  No SUPERADMIN users found to migrate');
    }

    // Verify the migration
    const platformAdminUsers = await prisma.user.findMany({
      where: {
        role: 'PLATFORM_ADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log(`\n📋 Current PLATFORM_ADMIN users (${platformAdminUsers.length}):`);
    platformAdminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
    });

  } catch (error) {
    console.error('❌ Error migrating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  migrateSuperAdminUsers()
    .then(() => {
      console.log('🏁 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateSuperAdminUsers };