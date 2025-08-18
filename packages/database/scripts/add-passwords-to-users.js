#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * Add passwords to existing users
 * This script adds the default password 'password123' to all users who don't have passwords
 */
async function addPasswordsToUsers() {
  console.log('🔐 Adding passwords to existing users...');
  
  const DEFAULT_PASSWORD = 'password123';
  console.log(`📝 Setting password "${DEFAULT_PASSWORD}" for all users without passwords`);

  try {
    // Get all users without passwords
    const usersWithoutPassword = await prisma.user.findMany({
      where: {
        password: null,
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`🔍 Found ${usersWithoutPassword.length} users without passwords`);

    if (usersWithoutPassword.length === 0) {
      console.log('✅ All users already have passwords!');
      return;
    }

    // Hash the default password
    console.log('🔒 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);

    // Update all users to have the hashed password
    console.log('📝 Updating users with hashed password...');
    let updateCount = 0;

    for (const user of usersWithoutPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      updateCount++;
      console.log(`   ✅ ${updateCount}/${usersWithoutPassword.length}: ${user.firstName} ${user.lastName} (${user.email})`);
    }

    console.log(`\n🎉 Successfully added passwords to ${updateCount} users!`);
    console.log(`📧 Test login credentials:`);
    console.log(`   Email: admin@nayararesorts.com (if exists) or any user email`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);

    // Create admin user if it doesn't exist
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@nayararesorts.com' }
    });

    if (!adminExists) {
      console.log(`\n👤 Creating admin user for testing...`);
      
      // Get first organization and property for admin user
      const firstOrg = await prisma.organization.findFirst();
      const firstProp = await prisma.property.findFirst();
      const firstDept = await prisma.department.findFirst();

      if (firstOrg && firstProp && firstDept) {
        const adminUser = await prisma.user.create({
          data: {
            email: 'admin@nayararesorts.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'Nayara',
            role: 'PROPERTY_MANAGER',
            organizationId: firstOrg.id,
            propertyId: firstProp.id,
            departmentId: firstDept.id,
            position: 'System Administrator',
            hireDate: new Date('2018-01-01'),
            phoneNumber: '+507 6789-0000',
            emergencyContact: {
              name: 'Emergency Contact',
              relationship: 'Admin',
              phone: '+507 6789-0001'
            }
          }
        });
        console.log(`   ✅ Created admin user: ${adminUser.email}`);
      }
    } else {
      console.log(`\n✅ Admin user already exists: admin@nayararesorts.com`);
    }

  } catch (error) {
    console.error('❌ Error adding passwords to users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  addPasswordsToUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { addPasswordsToUsers };