const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateAllPasswords() {
  try {
    console.log('🔑 Updating all user passwords to password123...');
    
    // Hash the password properly
    const plainPassword = 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // Count all users first
    const totalUsers = await prisma.user.count();
    console.log(`📊 Found ${totalUsers} users to update`);
    
    // Update all users with the new hashed password using updateMany for efficiency
    const result = await prisma.user.updateMany({
      data: { password: hashedPassword }
    });
    
    console.log(`✓ Updated passwords for ${result.count} users`);
    
    // List some sample users for verification
    const sampleUsers = await prisma.user.findMany({
      take: 10,
      select: { email: true }
    });
    
    console.log('📝 Sample updated users:');
    sampleUsers.forEach(user => {
      console.log(`  - ${user.email}`);
    });
    
    console.log('✅ All passwords updated successfully!');
    console.log('🔑 All users can now login with password: password123');
    
  } catch (error) {
    console.error('❌ Failed to update passwords:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAllPasswords();