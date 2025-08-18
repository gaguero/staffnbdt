import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding process...');

  // Get default organization and property
  const organization = await prisma.organization.findFirst({
    where: { slug: 'nayara-group' }
  });

  const property = await prisma.property.findFirst({
    where: { slug: 'nayara-gardens' }
  });

  if (!organization || !property) {
    console.log('❌ Default organization/property not found. Run migrations first.');
    return;
  }

  console.log(`✅ Using organization: ${organization.name} and property: ${property.name}`);

  // Create test departments with enhanced data
  const departments = [
    {
      name: 'Front Office',
      description: 'Guest services, reception, and customer relations',
      location: 'Main Building - Lobby',
      budget: 150000,
    },
    {
      name: 'Housekeeping',
      description: 'Room cleaning, maintenance, and facility upkeep',
      location: 'Service Building',
      budget: 200000,
    },
    {
      name: 'Food & Beverage',
      description: 'Restaurant, bar, and catering services',
      location: 'Restaurant Complex',
      budget: 300000,
    },
    {
      name: 'Maintenance',
      description: 'Facility maintenance, repairs, and technical support',
      location: 'Maintenance Workshop',
      budget: 100000,
    },
    {
      name: 'Human Resources',
      description: 'Employee relations, recruitment, and HR management',
      location: 'Admin Building - 2nd Floor',
      budget: 120000,
    },
    {
      name: 'Sales & Marketing',
      description: 'Sales operations, marketing, and guest acquisition',
      location: 'Admin Building - 1st Floor',
      budget: 180000,
    },
    {
      name: 'Spa & Wellness',
      description: 'Spa services, wellness programs, and therapy',
      location: 'Spa Center',
      budget: 150000,
    },
    {
      name: 'Activities & Recreation',
      description: 'Guest activities, tours, and recreational programs',
      location: 'Beach & Pool Area',
      budget: 90000,
    }
  ];

  const createdDepartments = {};

  for (const deptData of departments) {
    let dept = await prisma.department.findFirst({
      where: { 
        name: deptData.name,
        propertyId: property.id
      }
    });

    if (!dept) {
      dept = await prisma.department.create({
        data: {
          ...deptData,
          propertyId: property.id
        }
      });
      console.log(`✅ Created department: ${dept.name}`);
    } else {
      console.log(`ℹ️  Department already exists: ${dept.name}`);
    }

    createdDepartments[deptData.name] = dept;
  }

  // Create test users with departments
  const users = [
    {
      email: 'admin@nayara.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.PLATFORM_ADMIN,
      position: 'System Administrator',
      phoneNumber: '+507-6000-0001',
      hireDate: new Date('2024-01-01'),
      organizationId: organization.id,
      propertyId: property.id,
      departmentId: null, // Platform admins don't have departments
    },
    {
      email: 'hr@nayara.com',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      role: Role.DEPARTMENT_ADMIN,
      position: 'HR Manager',
      phoneNumber: '+507-6000-0002',
      hireDate: new Date('2024-01-15'),
      organizationId: organization.id,
      propertyId: property.id,
      departmentId: createdDepartments['Human Resources'].id,
    },
    {
      email: 'frontoffice@nayara.com',
      firstName: 'Carlos',
      lastName: 'Martinez',
      role: Role.DEPARTMENT_ADMIN,
      position: 'Front Office Manager',
      phoneNumber: '+507-6000-0010',
      hireDate: new Date('2024-01-20'),
      organizationId: organization.id,
      propertyId: property.id,
      departmentId: createdDepartments['Front Office'].id,
    },
    {
      email: 'fb@nayara.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      role: Role.DEPARTMENT_ADMIN,
      position: 'F&B Manager',
      phoneNumber: '+507-6000-0020',
      hireDate: new Date('2024-01-25'),
      organizationId: organization.id,
      propertyId: property.id,
      departmentId: createdDepartments['Food & Beverage'].id,
    },
    {
      email: 'frontdesk@nayara.com',
      firstName: 'John',
      lastName: 'Smith',
      role: Role.STAFF,
      position: 'Front Desk Agent',
      phoneNumber: '+507-6000-0011',
      hireDate: new Date('2024-02-01'),
      organizationId: organization.id,
      propertyId: property.id,
      departmentId: createdDepartments['Front Office'].id,
    },
    {
      email: 'chef@nayara.com',
      firstName: 'Pierre',
      lastName: 'Dubois',
      role: Role.STAFF,
      position: 'Executive Chef',
      phoneNumber: '+507-6000-0021',
      hireDate: new Date('2024-02-05'),
      organizationId: organization.id,
      propertyId: property.id,
      departmentId: createdDepartments['Food & Beverage'].id,
    },
    {
      email: 'housekeeper@nayara.com',
      firstName: 'Rosa',
      lastName: 'Lopez',
      role: Role.STAFF,
      position: 'Housekeeping Supervisor',
      phoneNumber: '+507-6000-0030',
      hireDate: new Date('2024-02-10'),
      organizationId: organization.id,
      propertyId: property.id,
      departmentId: createdDepartments['Housekeeping'].id,
    }
  ];

  for (const userData of users) {
    let user = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: userData
      });
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    } else {
      console.log(`ℹ️  User already exists: ${user.email}`);
    }
  }

  // Display summary
  const totalUsers = await prisma.user.count();
  const totalDepartments = await prisma.department.count();

  console.log('\n📊 Seeding Summary:');
  console.log(`  - Total departments: ${totalDepartments}`);
  console.log(`  - Total users: ${totalUsers}`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });