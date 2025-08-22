const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseProfilePhotos404() {
  console.log('🔍 Diagnosing Profile Photos 404 Error...\n');

  try {
    // 1. Check Roberto Martinez user data
    console.log('1️⃣ Checking Roberto Martinez user data:');
    const roberto = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'roberto.martinez@hotel.com' },
          { firstName: 'Roberto', lastName: 'Martinez' }
        ]
      },
      include: {
        department: true,
        organization: true,
        property: true
      }
    });

    if (roberto) {
      console.log('✅ Roberto Martinez found:');
      console.log(`   ID: ${roberto.id}`);
      console.log(`   Email: ${roberto.email}`);
      console.log(`   Active: ${!roberto.deletedAt}`);
      console.log(`   Organization ID: ${roberto.organizationId}`);
      console.log(`   Property ID: ${roberto.propertyId}`);
      console.log(`   Department ID: ${roberto.departmentId}`);
      console.log(`   Role: ${roberto.role}`);
    } else {
      console.log('❌ Roberto Martinez not found in database');
      return;
    }

    // 2. Check for profile photos
    console.log('\n2️⃣ Checking Roberto\'s profile photos:');
    const photos = await prisma.profilePhoto.findMany({
      where: {
        userId: roberto.id
      }
    });

    console.log(`   Found ${photos.length} profile photos for Roberto:`);
    photos.forEach((photo, index) => {
      console.log(`   Photo ${index + 1}:`);
      console.log(`     ID: ${photo.id}`);
      console.log(`     Active: ${photo.isActive}`);
      console.log(`     Deleted: ${photo.deletedAt ? 'Yes' : 'No'}`);
      console.log(`     Organization ID: ${photo.organizationId}`);
      console.log(`     Property ID: ${photo.propertyId}`);
      console.log(`     Photo Type: ${photo.photoType}`);
      console.log(`     Primary: ${photo.isPrimary}`);
      console.log(`     Created: ${photo.createdAt}`);
    });

    // 3. Check for photos without tenant context (legacy photos)
    console.log('\n3️⃣ Checking for legacy photos without tenant context:');
    const legacyPhotos = await prisma.profilePhoto.findMany({
      where: {
        userId: roberto.id,
        OR: [
          { organizationId: null },
          { propertyId: null }
        ]
      }
    });

    console.log(`   Found ${legacyPhotos.length} legacy photos without proper tenant context`);

    // 4. Test the current query logic
    console.log('\n4️⃣ Testing current query logic:');
    
    // Simulate the exact query from getUserPhotos method
    const tenantContext = {
      organizationId: roberto.organizationId,
      propertyId: roberto.propertyId,
    };

    const whereClause = {
      userId: roberto.id,
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

    console.log('   Query where clause:', JSON.stringify(whereClause, null, 2));

    const queryResult = await prisma.profilePhoto.findMany({
      where: whereClause,
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    console.log(`   Query returned ${queryResult.length} photos`);

    // 5. Check all users who might have invalid tokens
    console.log('\n5️⃣ Checking for users with potential authentication issues:');
    const allUsers = await prisma.user.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        propertyId: true,
        role: true
      }
    });

    console.log(`   Found ${allUsers.length} active users in database`);

    // 6. Summary and recommendations
    console.log('\n📋 SUMMARY:');
    console.log(`   - Roberto Martinez exists: ${roberto ? 'Yes' : 'No'}`);
    console.log(`   - Roberto's photos: ${photos.length}`);
    console.log(`   - Legacy photos: ${legacyPhotos.length}`);
    console.log(`   - Query result: ${queryResult.length} photos`);
    console.log(`   - Total active users: ${allUsers.length}`);

    if (queryResult.length === 0 && photos.length > 0) {
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('   Profile photos exist but query returns empty results');
      console.log('   This suggests a tenant filtering issue');
    }

    if (roberto && !roberto.organizationId) {
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('   Roberto has no organizationId - this will cause tenant filtering issues');
    }

    if (roberto && !roberto.propertyId) {
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('   Roberto has no propertyId - this will cause tenant filtering issues');
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnosis
diagnoseProfilePhotos404().catch(console.error);