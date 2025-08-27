#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🔍 Investigating Roberto Martinez 404 error...');
  console.log('Target userId: cmej91r0l002ns2f0e9dxocvf');
  
  try {
    // 1. Check if Roberto exists in the users table
    console.log('\n📊 1. Checking user existence...');
    const user = await prisma.user.findUnique({
      where: { id: 'cmej91r0l002ns2f0e9dxocvf' },
      include: {
        department: true,
        organization: true,
        property: true,
      }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId,
      deletedAt: user.deletedAt,
    });

    // 2. Check if user is soft-deleted
    if (user.deletedAt) {
      console.log('⚠️ User is soft-deleted:', user.deletedAt);
    } else {
      console.log('✅ User is active (not soft-deleted)');
    }

    // 3. Check tenant context data
    console.log('\n📊 2. Checking tenant context...');
    if (user.organization) {
      console.log('✅ Organization found:', {
        id: user.organization.id,
        name: user.organization.name,
        deletedAt: user.organization.deletedAt,
      });
    } else {
      console.log('❌ No organization linked');
    }

    if (user.property) {
      console.log('✅ Property found:', {
        id: user.property.id,
        name: user.property.name,
        deletedAt: user.property.deletedAt,
      });
    } else {
      console.log('❌ No property linked');
    }

    if (user.department) {
      console.log('✅ Department found:', {
        id: user.department.id,
        name: user.department.name,
        deletedAt: user.department.deletedAt,
      });
    } else {
      console.log('❌ No department linked');
    }

    // 4. Check profile photos
    console.log('\n📊 3. Checking profile photos...');
    const profilePhotos = await prisma.profilePhoto.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${profilePhotos.length} profile photos:`);
    profilePhotos.forEach((photo, index) => {
      console.log(`  ${index + 1}. Photo ID: ${photo.id}`);
      console.log(`     Type: ${photo.photoType}`);
      console.log(`     Primary: ${photo.isPrimary}`);
      console.log(`     Active: ${photo.isActive}`);
      console.log(`     OrgId: ${photo.organizationId || 'NULL'}`);
      console.log(`     PropId: ${photo.propertyId || 'NULL'}`);
      console.log(`     FileKey: ${photo.fileKey}`);
      console.log(`     Created: ${photo.createdAt}`);
      console.log('');
    });

    // 5. Test different query scenarios that might be used in getUserPhotos
    console.log('\n📊 4. Testing query scenarios...');
    
    // Scenario 1: Legacy query (no tenant filtering)
    const legacyPhotos = await prisma.profilePhoto.findMany({
      where: {
        userId: user.id,
        isActive: true,
        deletedAt: null,
      },
    });
    console.log(`Legacy query (no tenant filter): ${legacyPhotos.length} photos`);

    // Scenario 2: Strict tenant filtering
    if (user.organizationId && user.propertyId) {
      const strictTenantPhotos = await prisma.profilePhoto.findMany({
        where: {
          userId: user.id,
          organizationId: user.organizationId,
          propertyId: user.propertyId,
          isActive: true,
          deletedAt: null,
        },
      });
      console.log(`Strict tenant filtering: ${strictTenantPhotos.length} photos`);
    }

    // Scenario 3: OR filtering (current approach)
    const orFilterPhotos = await prisma.profilePhoto.findMany({
      where: {
        userId: user.id,
        isActive: true,
        deletedAt: null,
        OR: [
          {
            organizationId: null,
            propertyId: null,
          },
          {
            organizationId: user.organizationId,
            propertyId: user.propertyId,
          },
          {
            organizationId: user.organizationId,
            propertyId: null,
          },
        ],
      },
    });
    console.log(`OR filtering approach: ${orFilterPhotos.length} photos`);

    // 6. Check user lookup with different tenant contexts
    console.log('\n📊 5. Testing user lookup scenarios...');
    
    // Scenario 1: Basic lookup (used in getProfile)
    const basicUser = await prisma.user.findUnique({
      where: { 
        id: user.id,
        deletedAt: null,
      },
    });
    console.log(`Basic user lookup: ${basicUser ? 'SUCCESS' : 'FAILED'}`);

    // Scenario 2: Tenant-filtered lookup (used in uploadPhoto)
    if (user.organizationId) {
      const tenantUser = await prisma.user.findFirst({
        where: { 
          id: user.id, 
          deletedAt: null,
          organizationId: user.organizationId,
        },
      });
      console.log(`Tenant-filtered user lookup: ${tenantUser ? 'SUCCESS' : 'FAILED'}`);
    }

    // 7. Check current requests that might be accessing photos endpoint
    console.log('\n📊 6. Summary and recommendations...');
    
    if (profilePhotos.length === 0) {
      console.log('💡 ISSUE: User has no profile photos');
      console.log('   - The /api/profile/photos endpoint should return empty array, not 404');
      console.log('   - Check if getUserPhotos is throwing NotFoundException incorrectly');
    } else {
      console.log('✅ User has profile photos, issue might be in filtering logic');
      
      const activePhotos = profilePhotos.filter(p => p.isActive);
      const tenantPhotos = profilePhotos.filter(p => p.organizationId || p.propertyId);
      const legacyPhotos = profilePhotos.filter(p => !p.organizationId && !p.propertyId);
      
      console.log(`   - Active photos: ${activePhotos.length}`);
      console.log(`   - Tenant-scoped photos: ${tenantPhotos.length}`);
      console.log(`   - Legacy photos (no tenant): ${legacyPhotos.length}`);
    }

    // Check if there's a mismatch in tenant context
    if (user.organizationId && profilePhotos.length > 0) {
      const mismatchedPhotos = profilePhotos.filter(p => 
        p.organizationId && p.organizationId !== user.organizationId
      );
      if (mismatchedPhotos.length > 0) {
        console.log('⚠️ POTENTIAL ISSUE: Found photos with mismatched organization ID');
        mismatchedPhotos.forEach(photo => {
          console.log(`   Photo ${photo.id}: photo.orgId=${photo.organizationId}, user.orgId=${user.organizationId}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);