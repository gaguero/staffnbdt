import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductionState() {
  console.log('🔍 PRODUCTION DATABASE STATE ANALYSIS');
  console.log('=====================================');
  
  try {
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        departmentId: true,
        password: true,
        organizationId: true,
        propertyId: true
      },
      orderBy: [
        { role: 'asc' },
        { email: 'asc' }
      ]
    });
    
    console.log(`\n👥 USERS (${users.length} total):`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   📧 ${user.email}`);
      console.log(`   👔 ${user.role}`);
      console.log(`   🏢 Org: ${user.organizationId || 'none'}`);
      console.log(`   🏨 Property: ${user.propertyId || 'none'}`);
      console.log(`   🏪 Dept: ${user.departmentId || 'none'}`);
      console.log(`   🔑 Password: ${user.password ? '✅ Set' : '❌ Missing'}`);
      console.log('');
    });
    
    // Check permission system
    const permissions = await prisma.permission.count();
    const userPermissions = await prisma.userPermission.count();
    const customRoles = await prisma.customRole.count();
    const rolePermissions = await prisma.rolePermission.count();
    
    console.log(`\n🔐 PERMISSION SYSTEM:`);
    console.log(`   - Permissions: ${permissions}`);
    console.log(`   - User Permissions: ${userPermissions}`);
    console.log(`   - Custom Roles: ${customRoles}`);
    console.log(`   - Role Permissions: ${rolePermissions}`);
    
    // Check organizations and properties
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        organizationId: true
      }
    });
    
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        propertyId: true
      }
    });
    
    console.log(`\n🏢 TENANT STRUCTURE:`);
    console.log(`   - Organizations: ${organizations.length}`);
    organizations.forEach(org => {
      console.log(`     • ${org.name} (${org.slug})`);
    });
    console.log(`   - Properties: ${properties.length}`);
    properties.forEach(prop => {
      console.log(`     • ${prop.name} (${prop.slug}) - Org: ${prop.organizationId}`);
    });
    console.log(`   - Departments: ${departments.length}`);
    departments.forEach(dept => {
      console.log(`     • ${dept.name} - Property: ${dept.propertyId}`);
    });
    
    // Check role distribution
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n📊 ROLE DISTRIBUTION:`);
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count} users`);
    });
    
  } catch (error) {
    console.error('❌ Error checking production state:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionState();