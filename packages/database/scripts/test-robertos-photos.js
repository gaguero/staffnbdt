const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRobertosPhotos() {
  console.log('🔍 Testing Robertos Martinez profile photos access...\n');

  try {
    // Get Robertos Martinez data
    const robertos = await prisma.user.findUnique({
      where: { id: 'cmej91r0l002ns2f0e9dxocvf' },
      include: {
        department: true,
        organization: true,
        property: true,
        profilePhotos: true
      }
    });

    if (!robertos) {
      console.log('❌ Robertos Martinez not found');
      return;
    }

    console.log('✅ Found Robertos Martinez:');
    console.log(`   ID: ${robertos.id}`);
    console.log(`   Email: ${robertos.email}`);
    console.log(`   Name: ${robertos.firstName} ${robertos.lastName}`);
    console.log(`   Role: ${robertos.role}`);
    console.log(`   Organization ID: ${robertos.organizationId}`);
    console.log(`   Property ID: ${robertos.propertyId}`);
    console.log(`   Department ID: ${robertos.departmentId}`);
    console.log(`   Profile Photos: ${robertos.profilePhotos.length}`);

    // Show details of each photo
    console.log('\n📸 Profile Photos Details:');
    robertos.profilePhotos.forEach((photo, index) => {
      console.log(`   Photo ${index + 1}:`);
      console.log(`     ID: ${photo.id}`);
      console.log(`     Active: ${photo.isActive}`);
      console.log(`     Deleted: ${photo.deletedAt ? 'Yes' : 'No'}`);
      console.log(`     Organization ID: ${photo.organizationId}`);
      console.log(`     Property ID: ${photo.propertyId}`);
      console.log(`     Photo Type: ${photo.photoType}`);
      console.log(`     Primary: ${photo.isPrimary}`);
      console.log(`     URL: ${photo.url}`);
      console.log(`     Created: ${photo.createdAt}`);
    });

    // Test the exact query that getUserPhotos would run
    console.log('\n🧪 Testing getUserPhotos query logic:');

    const tenantContext = {
      organizationId: robertos.organizationId,
      propertyId: robertos.propertyId,
    };

    console.log('   Tenant Context:', tenantContext);

    const whereClause = {
      userId: robertos.id,
      isActive: true,
      deletedAt: null,
    };

    if (tenantContext.organizationId && tenantContext.propertyId) {
      whereClause.OR = [
        {
          // Photos with proper tenant context
          organizationId: tenantContext.organizationId,
          propertyId: tenantContext.propertyId,
        },
        {
          // Legacy photos without tenant context (for backward compatibility)
          organizationId: null,
          propertyId: null,
        },
      ];
    }

    console.log('   Where Clause:', JSON.stringify(whereClause, null, 2));

    const queryResult = await prisma.profilePhoto.findMany({
      where: whereClause,
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    console.log(`   Query Result: ${queryResult.length} photos found`);

    if (queryResult.length === 0) {
      console.log('\n❌ ISSUE: Query returns no photos despite photos existing!');
      
      // Test individual conditions
      console.log('\n🔍 Testing individual query conditions:');
      
      // Test 1: Just user ID and basic filters
      const basicQuery = await prisma.profilePhoto.findMany({
        where: {
          userId: robertos.id,
          isActive: true,
          deletedAt: null,
        }
      });
      console.log(`   Basic query (user + active + not deleted): ${basicQuery.length} photos`);

      // Test 2: With tenant context match
      const tenantQuery = await prisma.profilePhoto.findMany({
        where: {
          userId: robertos.id,
          isActive: true,
          deletedAt: null,
          organizationId: tenantContext.organizationId,
          propertyId: tenantContext.propertyId,
        }
      });
      console.log(`   Tenant match query: ${tenantQuery.length} photos`);

      // Test 3: Legacy photos (null tenant)
      const legacyQuery = await prisma.profilePhoto.findMany({
        where: {
          userId: robertos.id,
          isActive: true,
          deletedAt: null,
          organizationId: null,
          propertyId: null,
        }
      });
      console.log(`   Legacy photos query: ${legacyQuery.length} photos`);

      // Show what the photos actually have for tenant context
      console.log('\n📋 Actual photo tenant context:');
      robertos.profilePhotos.forEach((photo, index) => {
        console.log(`   Photo ${index + 1}: org=${photo.organizationId}, property=${photo.propertyId}`);
      });

    } else {
      console.log('✅ Query works correctly!');
      queryResult.forEach((photo, index) => {
        console.log(`   Result ${index + 1}: ${photo.id} (${photo.photoType})`);
      });
    }

    // Test what happens without tenant filtering at all
    console.log('\n🧪 Testing query without tenant filtering:');
    const noTenantQuery = await prisma.profilePhoto.findMany({
      where: {
        userId: robertos.id,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    console.log(`   No tenant filtering: ${noTenantQuery.length} photos found`);

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRobertosPhotos().catch(console.error);