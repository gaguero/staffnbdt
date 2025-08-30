const { PrismaClient, Role, UserType } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTestUsers() {
  try {
    console.log('🚀 Seeding test users...');

    // Get the default organization
    let organization = await prisma.organization.findFirst({
      where: { slug: 'nayara-group' }
    });

    if (!organization) {
      console.log('Creating default organization...');
      organization = await prisma.organization.create({
        data: {
          name: 'Nayara Group',
          slug: 'nayara-group',
          description: 'Default organization for Hotel Operations Hub',
          timezone: 'America/Costa_Rica',
          settings: {
            defaultLanguage: 'en',
            supportedLanguages: ['en', 'es'],
            theme: 'nayara'
          },
          branding: {
            primaryColor: '#AA8E67',
            secondaryColor: '#F5EBD7',
            accentColor: '#4A4A4A',
            logoUrl: null
          },
          isActive: true
        }
      });
    }

    // Get or create a default property
    let property = await prisma.property.findFirst({
      where: { organizationId: organization.id }
    });

    if (!property) {
      console.log('Creating default property...');
      property = await prisma.property.create({
        data: {
          organizationId: organization.id,
          name: 'Nayara Gardens',
          slug: 'nayara-gardens',
          description: 'Luxury eco-resort in Costa Rica',
          address: {
            street: '100m North of Peninsula Papagayo',
            city: 'Guanacaste',
            country: 'Costa Rica'
          },
          phoneNumber: '+506-2690-4000',
          email: 'info@nayaragardens.com',
          settings: {
            currency: 'USD',
            language: 'en'
          },
          isActive: true
        }
      });
    }

    // Get or create a default department
    let department = await prisma.department.findFirst({
      where: { propertyId: property.id }
    });

    if (!department) {
      console.log('Creating default department...');
      department = await prisma.department.create({
        data: {
          name: 'Human Resources',
          description: 'HR Department',
          propertyId: property.id
        }
      });
    }

    // Use simple password for development testing (will be hashed by auth service)
    const plainPassword = 'password123';

    // Create test users
    const testUsers = [
      {
        email: 'admin@nayara.com',
        firstName: 'Platform',
        lastName: 'Admin',
        role: Role.PLATFORM_ADMIN,
        userType: UserType.INTERNAL,
        organizationId: organization.id,
        propertyId: property.id,
        departmentId: null,
        password: plainPassword
      },
      {
        email: 'hr@nayara.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: Role.DEPARTMENT_ADMIN,
        userType: UserType.INTERNAL,
        organizationId: organization.id,
        propertyId: property.id,
        departmentId: department.id,
        password: plainPassword
      },
      {
        email: 'staff@nayara.com',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.STAFF,
        userType: UserType.INTERNAL,
        organizationId: organization.id,
        propertyId: property.id,
        departmentId: department.id,
        password: plainPassword
      },
      {
        email: 'vendor@nayara.com',
        firstName: 'Vendor',
        lastName: 'User',
        role: Role.STAFF,
        userType: UserType.VENDOR,
        organizationId: organization.id,
        propertyId: property.id,
        departmentId: null,
        externalOrganization: 'Acme Supply Co.',
        accessPortal: 'vendor',
        password: plainPassword
      },
      {
        email: 'client@nayara.com',
        firstName: 'Client',
        lastName: 'User',
        role: Role.STAFF,
        userType: UserType.CLIENT,
        organizationId: organization.id,
        propertyId: property.id,
        departmentId: null,
        externalOrganization: 'Corporate Client Inc.',
        accessPortal: 'client',
        password: plainPassword
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`✓ User ${userData.email} already exists, updating...`);
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            ...userData,
            updatedAt: new Date()
          }
        });
      } else {
        console.log(`✓ Creating user ${userData.email}...`);
        await prisma.user.create({
          data: userData
        });
      }
    }

    console.log('✅ Test users seeded successfully!');
    console.log('📊 Available test accounts:');
    console.log('  - admin@nayara.com (PLATFORM_ADMIN, INTERNAL)');
    console.log('  - hr@nayara.com (DEPARTMENT_ADMIN, INTERNAL)');
    console.log('  - staff@nayara.com (STAFF, INTERNAL)');
    console.log('  - vendor@nayara.com (STAFF, VENDOR)');
    console.log('  - client@nayara.com (STAFF, CLIENT)');
    console.log('');
    console.log('🔑 All accounts use password: password123');
    
  } catch (error) {
    console.error('❌ Failed to seed test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUsers();