import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestUsers() {
  console.log('🌱 Seeding test users...');

  try {
    // Check if any users exist
    const userCount = await prisma.user.count({
      where: { deletedAt: null }
    });

    console.log(`Found ${userCount} existing users`);

    if (userCount === 0) {
      console.log('Creating test users...');

      // Create a test department first
      const department = await prisma.department.upsert({
        where: { name: 'Test Department' },
        update: {},
        create: {
          name: 'Test Department',
          description: 'Test department for development',
          location: 'Test Location'
        }
      });

      // Create test users
      const users = [
        {
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          role: Role.SUPERADMIN,
          departmentId: department.id
        },
        {
          email: 'dept@test.com',
          firstName: 'Department',
          lastName: 'Admin',
          role: Role.DEPARTMENT_ADMIN,
          departmentId: department.id
        },
        {
          email: 'staff@test.com',
          firstName: 'Staff',
          lastName: 'Member',
          role: Role.STAFF,
          departmentId: department.id
        }
      ];

      for (const userData of users) {
        const user = await prisma.user.create({
          data: userData
        });
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      }

      console.log('✅ Test users created successfully');
    } else {
      console.log('ℹ️  Users already exist, skipping seeding');
    }

    // List all users
    const allUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('\n📋 Current users:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} - ${user.department?.name || 'No Department'}`);
    });

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedTestUsers()
    .then(() => {
      console.log('🏁 Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedTestUsers };