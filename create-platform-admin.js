const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createPlatformAdmin() {
  try {
    console.log('Creating Platform Admin user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create Platform Admin user
    const platformAdmin = await prisma.user.create({
      data: {
        email: 'admin@nayara.com',
        password: hashedPassword,
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'PLATFORM_ADMIN',
        position: 'Platform Administrator',
        hireDate: new Date('2024-01-01'),
        // Platform admins don't belong to specific orgs/properties
        organizationId: null,
        propertyId: null,
        departmentId: null,
      }
    });
    
    console.log('✅ Platform Admin created:', platformAdmin.email);
    console.log('   ID:', platformAdmin.id);
    console.log('   Role:', platformAdmin.role);
    
  } catch (error) {
    console.error('❌ Failed to create Platform Admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createPlatformAdmin();