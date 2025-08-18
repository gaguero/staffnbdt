import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test departments with enhanced data
  const frontOffice = await prisma.department.upsert({
    where: { name: 'Front Office' },
    update: {},
    create: {
      name: 'Front Office',
      description: 'Guest services, reception, and customer relations',
      location: 'Main Building - Lobby',
      budget: 150000,
    },
  });

  const housekeeping = await prisma.department.upsert({
    where: { name: 'Housekeeping' },
    update: {},
    create: {
      name: 'Housekeeping',
      description: 'Room cleaning, maintenance, and facility upkeep',
      location: 'Service Building',
      budget: 200000,
    },
  });

  const foodBeverage = await prisma.department.upsert({
    where: { name: 'Food & Beverage' },
    update: {},
    create: {
      name: 'Food & Beverage',
      description: 'Restaurant, bar, and catering services',
      location: 'Restaurant Complex',
      budget: 300000,
    },
  });

  const maintenance = await prisma.department.upsert({
    where: { name: 'Maintenance' },
    update: {},
    create: {
      name: 'Maintenance',
      description: 'Facility maintenance, repairs, and technical support',
      location: 'Maintenance Workshop',
      budget: 100000,
    },
  });

  const humanResources = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: {
      name: 'Human Resources',
      description: 'Employee relations, recruitment, and HR management',
      location: 'Admin Building - 2nd Floor',
      budget: 120000,
    },
  });

  const sales = await prisma.department.upsert({
    where: { name: 'Sales & Marketing' },
    update: {},
    create: {
      name: 'Sales & Marketing',
      description: 'Sales operations, marketing, and guest acquisition',
      location: 'Admin Building - 1st Floor',
      budget: 180000,
    },
  });

  const spa = await prisma.department.upsert({
    where: { name: 'Spa & Wellness' },
    update: {},
    create: {
      name: 'Spa & Wellness',
      description: 'Spa services, wellness programs, and therapy',
      location: 'Spa Center',
      budget: 150000,
    },
  });

  const activities = await prisma.department.upsert({
    where: { name: 'Activities & Recreation' },
    update: {},
    create: {
      name: 'Activities & Recreation',
      description: 'Guest activities, tours, and recreational programs',
      location: 'Beach & Pool Area',
      budget: 90000,
    },
  });

  // Create test users with departments
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@nayara.com' },
    update: {},
    create: {
      email: 'admin@nayara.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.PLATFORM_ADMIN,
      position: 'System Administrator',
      phoneNumber: '+507-6000-0001',
      hireDate: new Date('2024-01-01'),
    },
  });

  const hrManager = await prisma.user.upsert({
    where: { email: 'hr@nayara.com' },
    update: {},
    create: {
      email: 'hr@nayara.com',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      role: Role.DEPARTMENT_ADMIN,
      departmentId: humanResources.id,
      position: 'HR Manager',
      phoneNumber: '+507-6000-0002',
      hireDate: new Date('2024-01-15'),
    },
  });

  const frontOfficeManager = await prisma.user.upsert({
    where: { email: 'frontoffice@nayara.com' },
    update: {},
    create: {
      email: 'frontoffice@nayara.com',
      firstName: 'Carlos',
      lastName: 'Martinez',
      role: Role.DEPARTMENT_ADMIN,
      departmentId: frontOffice.id,
      position: 'Front Office Manager',
      phoneNumber: '+507-6000-0010',
      hireDate: new Date('2024-01-20'),
    },
  });

  const fbManager = await prisma.user.upsert({
    where: { email: 'fb@nayara.com' },
    update: {},
    create: {
      email: 'fb@nayara.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      role: Role.DEPARTMENT_ADMIN,
      departmentId: foodBeverage.id,
      position: 'F&B Manager',
      phoneNumber: '+507-6000-0020',
      hireDate: new Date('2024-01-25'),
    },
  });

  // Create regular staff users
  const frontDeskStaff = await prisma.user.upsert({
    where: { email: 'frontdesk@nayara.com' },
    update: {},
    create: {
      email: 'frontdesk@nayara.com',
      firstName: 'John',
      lastName: 'Smith',
      role: Role.STAFF,
      departmentId: frontOffice.id,
      position: 'Front Desk Agent',
      phoneNumber: '+507-6000-0011',
      hireDate: new Date('2024-02-01'),
    },
  });

  const chef = await prisma.user.upsert({
    where: { email: 'chef@nayara.com' },
    update: {},
    create: {
      email: 'chef@nayara.com',
      firstName: 'Pierre',
      lastName: 'Dubois',
      role: Role.STAFF,
      departmentId: foodBeverage.id,
      position: 'Executive Chef',
      phoneNumber: '+507-6000-0021',
      hireDate: new Date('2024-02-05'),
    },
  });

  const housekeeper = await prisma.user.upsert({
    where: { email: 'housekeeper@nayara.com' },
    update: {},
    create: {
      email: 'housekeeper@nayara.com',
      firstName: 'Rosa',
      lastName: 'Lopez',
      role: Role.STAFF,
      departmentId: housekeeping.id,
      position: 'Housekeeping Supervisor',
      phoneNumber: '+507-6000-0030',
      hireDate: new Date('2024-02-10'),
    },
  });

  const spaTherapist = await prisma.user.upsert({
    where: { email: 'spa@nayara.com' },
    update: {},
    create: {
      email: 'spa@nayara.com',
      firstName: 'Lisa',
      lastName: 'Chen',
      role: Role.STAFF,
      departmentId: spa.id,
      position: 'Spa Therapist',
      phoneNumber: '+507-6000-0040',
      hireDate: new Date('2024-02-15'),
    },
  });

  // Update departments with managers
  await prisma.department.update({
    where: { id: humanResources.id },
    data: { managerId: hrManager.id },
  });

  await prisma.department.update({
    where: { id: frontOffice.id },
    data: { managerId: frontOfficeManager.id },
  });

  await prisma.department.update({
    where: { id: foodBeverage.id },
    data: { managerId: fbManager.id },
  });

  // Create sample training sessions with department assignments
  const customerServiceTraining = await prisma.trainingSession.upsert({
    where: { 
      title_version: {
        title: 'Customer Service Excellence',
        version: 1
      }
    },
    update: {},
    create: {
      title: 'Customer Service Excellence',
      description: 'Essential customer service skills for all staff',
      category: 'Customer Service',
      departmentId: frontOffice.id,
      passingScore: 80,
      duration: 120,
      contentBlocks: [
        {
          type: 'TEXT',
          content: 'Welcome to Customer Service Excellence training',
          order: 1
        },
        {
          type: 'VIDEO',
          content: 'https://example.com/videos/customer-service.mp4',
          order: 2
        },
        {
          type: 'FORM',
          content: JSON.stringify({
            questions: [
              {
                question: 'What is the most important aspect of customer service?',
                options: ['Speed', 'Empathy', 'Knowledge', 'All of the above'],
                correctAnswer: 'Empathy'
              }
            ]
          }),
          order: 3
        }
      ],
      createdBy: hrManager.id,
    },
  });

  const foodSafetyTraining = await prisma.trainingSession.upsert({
    where: { 
      title_version: {
        title: 'Food Safety and Hygiene',
        version: 1
      }
    },
    update: {},
    create: {
      title: 'Food Safety and Hygiene',
      description: 'Required food safety certification for F&B staff',
      category: 'Compliance',
      departmentId: foodBeverage.id,
      passingScore: 90,
      duration: 180,
      contentBlocks: [
        {
          type: 'TEXT',
          content: 'Food safety is critical in our operations',
          order: 1
        },
        {
          type: 'DOCUMENT',
          content: 'food-safety-manual.pdf',
          order: 2
        },
        {
          type: 'FORM',
          content: JSON.stringify({
            questions: [
              {
                question: 'What is the safe temperature for storing cold foods?',
                options: ['Below 40°F', 'Below 50°F', 'Below 60°F', 'Below 70°F'],
                correctAnswer: 'Below 40°F'
              }
            ]
          }),
          order: 3
        }
      ],
      createdBy: fbManager.id,
    },
  });

  console.log('Database seeded with enhanced department data:');
  console.log('');
  console.log('Departments Created:');
  console.log('====================');
  console.log('- Front Office (Manager: Carlos Martinez)');
  console.log('- Housekeeping');
  console.log('- Food & Beverage (Manager: Ana Garcia)');
  console.log('- Maintenance');
  console.log('- Human Resources (Manager: Maria Rodriguez)');
  console.log('- Sales & Marketing');
  console.log('- Spa & Wellness');
  console.log('- Activities & Recreation');
  console.log('');
  console.log('Test Login Credentials:');
  console.log('========================');
  console.log('');
  console.log('SUPERADMIN:');
  console.log('Email: admin@nayara.com');
  console.log('Password: (any password)');
  console.log('');
  console.log('DEPARTMENT ADMINS:');
  console.log('HR Manager - Email: hr@nayara.com');
  console.log('Front Office Manager - Email: frontoffice@nayara.com');
  console.log('F&B Manager - Email: fb@nayara.com');
  console.log('');
  console.log('STAFF:');
  console.log('Front Desk - Email: frontdesk@nayara.com');
  console.log('Chef - Email: chef@nayara.com');
  console.log('Housekeeper - Email: housekeeper@nayara.com');
  console.log('Spa Therapist - Email: spa@nayara.com');
  console.log('');
  console.log('Note: In development mode, any password will work.');
  console.log('In production, proper password authentication will be implemented.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });