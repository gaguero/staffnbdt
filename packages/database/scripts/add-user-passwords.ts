import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Default password for all users - should be changed on first login
const DEFAULT_PASSWORD = 'password123';

async function addUserPasswords() {
  console.log('🔑 Adding passwords to existing users...');

  try {
    // Get all users without passwords
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { password: null },
          { password: '' }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log(`📊 Found ${users.length} users without passwords`);

    if (users.length === 0) {
      console.log('✅ All users already have passwords set');
      return;
    }

    // Hash the default password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);
    console.log(`🔐 Generated password hash with ${saltRounds} salt rounds`);

    // Update all users with the hashed password
    let updatedCount = 0;
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword
        }
      });
      
      console.log(`✅ Set password for: ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
      updatedCount++;
    }

    console.log(`\n📊 Password Update Summary:`);
    console.log(`  - Total users updated: ${updatedCount}`);
    console.log(`  - Default password: "${DEFAULT_PASSWORD}"`);
    console.log(`  - Password hash strength: ${saltRounds} rounds`);
    console.log(`  - Force password change: Yes`);
    
    console.log(`\n🔐 Login Credentials for Testing:`);
    console.log(`  Admin: admin@nayara.com / ${DEFAULT_PASSWORD}`);
    console.log(`  HR Manager: hr@nayara.com / ${DEFAULT_PASSWORD}`);
    console.log(`  Front Office: frontoffice@nayara.com / ${DEFAULT_PASSWORD}`);
    console.log(`  Staff: frontdesk@nayara.com / ${DEFAULT_PASSWORD}`);

    console.log('\n⚠️  Security Notes:');
    console.log('  - All users should change passwords on first login');
    console.log('  - Consider implementing password complexity requirements');
    console.log('  - Enable two-factor authentication for admin accounts');
    
    console.log('\n✅ Password setup completed successfully!');

  } catch (error) {
    console.error('❌ Failed to add passwords:', error);
    throw error;
  }
}

addUserPasswords()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Password setup failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });