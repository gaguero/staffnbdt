import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserTenantAssignments() {
  console.log('🏢 Fixing user tenant assignments...');
  
  try {
    // Find the primary organization and property (should be Nayara Group / Nayara Gardens)
    const organization = await prisma.organization.findFirst({
      where: { slug: 'nayara-group' }
    });
    
    const property = await prisma.property.findFirst({
      where: { 
        slug: 'nayara-gardens',
        organizationId: organization?.id
      }
    });
    
    if (!organization || !property) {
      console.error('❌ Could not find primary organization or property');
      console.log('Available organizations:', await prisma.organization.findMany({ select: { id: true, name: true, slug: true } }));
      console.log('Available properties:', await prisma.property.findMany({ select: { id: true, name: true, slug: true, organizationId: true } }));
      return;
    }
    
    console.log(`✅ Found organization: ${organization.name} (${organization.id})`);
    console.log(`✅ Found property: ${property.name} (${property.id})`);
    
    // Get all users that need tenant assignment
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { organizationId: null },
          { propertyId: null }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        departmentId: true
      }
    });
    
    console.log(`\n👥 Found ${users.length} users needing tenant assignment:`);
    
    let updatedCount = 0;
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          organizationId: organization.id,
          propertyId: property.id
        }
      });
      
      console.log(`✅ Assigned ${user.firstName} ${user.lastName} (${user.email}) to ${organization.name}/${property.name}`);
      updatedCount++;
    }
    
    console.log(`\n📊 Tenant Assignment Summary:`);
    console.log(`  - Users updated: ${updatedCount}`);
    console.log(`  - Organization: ${organization.name} (${organization.slug})`);
    console.log(`  - Property: ${property.name} (${property.slug})`);
    
    // Now update departments to belong to the property if they don't already
    const departments = await prisma.department.findMany({
      where: { propertyId: null }
    });
    
    if (departments.length > 0) {
      console.log(`\n🏪 Updating ${departments.length} departments to belong to property...`);
      
      for (const dept of departments) {
        await prisma.department.update({
          where: { id: dept.id },
          data: { propertyId: property.id }
        });
        
        console.log(`✅ Assigned department ${dept.name} to ${property.name}`);
      }
    }
    
    console.log('\n✅ User tenant assignments completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing user tenant assignments:', error);
    throw error;
  }
}

fixUserTenantAssignments()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Tenant assignment failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });