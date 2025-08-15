import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test departments
  const hrDepartment = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: {
      name: 'Human Resources',
      description: 'Human Resources Department',
    },
  });

  const opsDepartment = await prisma.department.upsert({
    where: { name: 'Operations' },
    update: {},
    create: {
      name: 'Operations',
      description: 'Operations Department',
    },
  });

  const salesDepartment = await prisma.department.upsert({
    where: { name: 'Sales' },
    update: {},
    create: {
      name: 'Sales',
      description: 'Sales Department',
    },
  });

  // Create test users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@nayara.com' },
    update: {},
    create: {
      email: 'admin@nayara.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.SUPERADMIN,
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
      firstName: 'HR',
      lastName: 'Manager',
      role: Role.DEPARTMENT_ADMIN,
      departmentId: hrDepartment.id,
      position: 'HR Manager',
      phoneNumber: '+507-6000-0002',
      hireDate: new Date('2024-01-15'),
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@nayara.com' },
    update: {},
    create: {
      email: 'staff@nayara.com',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.STAFF,
      departmentId: salesDepartment.id,
      position: 'Sales Representative',
      phoneNumber: '+507-6000-0003',
      hireDate: new Date('2024-02-01'),
    },
  });

  console.log('Database seeded with test data:');
  console.log('');
  console.log('Test Login Credentials:');
  console.log('========================');
  console.log('');
  console.log('SUPERADMIN:');
  console.log('Email: admin@nayara.com');
  console.log('Password: (any password)');
  console.log('');
  console.log('DEPARTMENT ADMIN (HR):');
  console.log('Email: hr@nayara.com');
  console.log('Password: (any password)');
  console.log('');
  console.log('STAFF:');
  console.log('Email: staff@nayara.com');
  console.log('Password: (any password)');
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