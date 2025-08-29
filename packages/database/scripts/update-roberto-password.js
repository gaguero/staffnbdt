const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateRobertoPassword() {
  try {
    console.log('🔑 Updating roberto.martinez@nayararesorts.com password...');
    
    // Hash the password properly
    const plainPassword = 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // Update specifically roberto.martinez
    const result = await prisma.user.update({
      where: { email: 'roberto.martinez@nayararesorts.com' },
      data: { password: hashedPassword },
      select: { email: true, firstName: true, lastName: true, role: true }
    });
    
    console.log('✓ Updated password for:', result);
    console.log('🔑 You can now login with:');
    console.log('  Email: roberto.martinez@nayararesorts.com');
    console.log('  Password: password123');
    
  } catch (error) {
    console.error('❌ Failed to update password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateRobertoPassword();