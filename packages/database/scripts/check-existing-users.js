const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingUsers() {
  console.log('👥 Checking existing users in database...\n');

  try {
    // 1. Get all active users
    const activeUsers = await prisma.user.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        propertyId: true,
        departmentId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${activeUsers.length} active users:`);
    activeUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Org ID: ${user.organizationId || 'null'}`);
      console.log(`   Property ID: ${user.propertyId || 'null'}`);
      console.log(`   Department ID: ${user.departmentId || 'null'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // 2. Check for deleted users
    const deletedUsers = await prisma.user.findMany({
      where: {
        deletedAt: { not: null }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        deletedAt: true
      }
    });

    if (deletedUsers.length > 0) {
      console.log(`\n🗑️  Found ${deletedUsers.length} deleted users:`);
      deletedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Deleted: ${user.deletedAt}`);
      });
    }

    // 3. Check for users with profile photos
    const usersWithPhotos = await prisma.user.findMany({
      where: {
        profilePhotos: {
          some: {
            isActive: true,
            deletedAt: null
          }
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            profilePhotos: {
              where: {
                isActive: true,
                deletedAt: null
              }
            }
          }
        }
      }
    });

    console.log(`\n📸 Found ${usersWithPhotos.length} users with profile photos:`);
    usersWithPhotos.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user._count.profilePhotos} photos`);
    });

    // 4. Check for orphaned profile photos
    const orphanedPhotos = await prisma.profilePhoto.findMany({
      where: {
        user: null
      }
    });

    if (orphanedPhotos.length > 0) {
      console.log(`\n⚠️  Found ${orphanedPhotos.length} orphaned profile photos:`);
      orphanedPhotos.forEach((photo, index) => {
        console.log(`${index + 1}. Photo ID: ${photo.id} - User ID: ${photo.userId}`);
      });
    }

    // 5. Look for Roberto specifically (case-insensitive)
    const robertoSearch = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Roberto', mode: 'insensitive' } },
          { lastName: { contains: 'Martinez', mode: 'insensitive' } },
          { email: { contains: 'roberto', mode: 'insensitive' } }
        ]
      },
      include: {
        profilePhotos: true
      }
    });

    console.log(`\n🔍 Search for Roberto/Martinez users: ${robertoSearch.length} results`);
    robertoSearch.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Active: ${!user.deletedAt}`);
      console.log(`   Photos: ${user.profilePhotos.length}`);
    });

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkExistingUsers().catch(console.error);