import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateTenants() {
  console.log('🧹 Cleaning up duplicate organizations and properties...');
  
  try {
    // Find all organizations
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        users: { select: { id: true } },
        properties: { select: { id: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`\n🏢 Found ${organizations.length} organizations:`);
    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name} (${org.slug}) - Created: ${org.createdAt.toISOString()}`);
      console.log(`   Users: ${org.users.length}, Properties: ${org.properties.length}`);
    });
    
    // Keep only Nayara Group (the one being used)
    const keepOrg = organizations.find(org => org.slug === 'nayara-group');
    const deleteOrgs = organizations.filter(org => org.slug !== 'nayara-group');
    
    if (!keepOrg) {
      console.error('❌ Could not find Nayara Group organization to keep');
      return;
    }
    
    console.log(`\n✅ Keeping: ${keepOrg.name} (${keepOrg.slug})`);
    console.log(`🗑️  Will delete ${deleteOrgs.length} duplicate organizations:`);
    deleteOrgs.forEach(org => {
      console.log(`   - ${org.name} (${org.slug})`);
    });
    
    // Delete duplicate organizations (this will cascade to properties due to foreign key)
    for (const org of deleteOrgs) {
      if (org.users.length === 0 && org.properties.length === 0) {
        await prisma.organization.delete({
          where: { id: org.id }
        });
        console.log(`✅ Deleted empty organization: ${org.name}`);
      } else {
        console.log(`⚠️  Skipping ${org.name} - has ${org.users.length} users and ${org.properties.length} properties`);
      }
    }
    
    // Find all properties
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        organizationId: true,
        createdAt: true,
        users: { select: { id: true } },
        departments: { select: { id: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`\n🏨 Found ${properties.length} properties:`);
    properties.forEach((prop, index) => {
      console.log(`${index + 1}. ${prop.name} (${prop.slug}) - Org: ${prop.organizationId}`);
      console.log(`   Users: ${prop.users.length}, Departments: ${prop.departments.length}`);
    });
    
    // Keep only Nayara Gardens under Nayara Group
    const keepProperty = properties.find(prop => 
      prop.slug === 'nayara-gardens' && prop.organizationId === keepOrg.id
    );
    const deleteProperties = properties.filter(prop => 
      !(prop.slug === 'nayara-gardens' && prop.organizationId === keepOrg.id)
    );
    
    if (!keepProperty) {
      console.error('❌ Could not find Nayara Gardens property to keep');
      return;
    }
    
    console.log(`\n✅ Keeping: ${keepProperty.name} (${keepProperty.slug})`);
    console.log(`🗑️  Will delete ${deleteProperties.length} duplicate properties:`);
    deleteProperties.forEach(prop => {
      console.log(`   - ${prop.name} (${prop.slug})`);
    });
    
    // Delete duplicate properties
    for (const prop of deleteProperties) {
      if (prop.users.length === 0 && prop.departments.length === 0) {
        await prisma.property.delete({
          where: { id: prop.id }
        });
        console.log(`✅ Deleted empty property: ${prop.name}`);
      } else {
        console.log(`⚠️  Skipping ${prop.name} - has ${prop.users.length} users and ${prop.departments.length} departments`);
      }
    }
    
    // Final state check
    const finalOrgs = await prisma.organization.count();
    const finalProps = await prisma.property.count();
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`  - Organizations remaining: ${finalOrgs}`);
    console.log(`  - Properties remaining: ${finalProps}`);
    console.log(`  - Primary org: ${keepOrg.name} (${keepOrg.slug})`);
    console.log(`  - Primary property: ${keepProperty.name} (${keepProperty.slug})`);
    
    console.log('\n✅ Tenant cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning up duplicate tenants:', error);
    throw error;
  }
}

cleanupDuplicateTenants()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Cleanup failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });