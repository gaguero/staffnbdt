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
  console.log('🔍 Testing profile photos endpoint logic...');
  
  const userId = 'cmej91r0l002ns2f0e9dxocvf'; // Roberto Martinez
  
  try {
    // 1. Simulate the currentUser lookup that happens during JWT auth
    console.log('\n📊 1. Simulating JWT user lookup...');
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        organization: true,
        property: true,
      }
    });

    if (!currentUser) {
      console.log('❌ Current user not found - this would cause auth failure');
      return;
    }

    console.log('✅ Current user found for JWT:', {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
    });

    // 2. Simulate the getUserPhotos permission check
    console.log('\n📊 2. Testing permission check...');
    const canViewOwnPhotos = currentUser.id === userId;
    console.log(`Permission check (own photos): ${canViewOwnPhotos ? 'PASS' : 'FAIL'}`);

    // 3. Simulate tenant context logic
    console.log('\n📊 3. Simulating tenant context...');
    
    // Mock request object with tenant context
    const mockRequest = {
      user: currentUser,
      headers: {},
      tenantContext: {
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        propertyId: currentUser.propertyId,
        departmentId: currentUser.departmentId,
        userRole: currentUser.role,
      }
    };

    console.log('Mock tenant context:', mockRequest.tenantContext);

    // 4. Test the exact query that getUserPhotos would make
    console.log('\n📊 4. Testing getUserPhotos query...');
    
    const tenantContext = {
      organizationId: currentUser.organizationId,
      propertyId: currentUser.propertyId,
    };

    const whereClause = {
      userId,
      isActive: true,
      deletedAt: null,
    };

    // Add the OR logic from getUserPhotos
    if (tenantContext.organizationId || tenantContext.propertyId) {
      const orConditions = [];
      
      // Include legacy photos without tenant context
      orConditions.push({
        organizationId: null,
        propertyId: null,
      });
      
      // Include photos matching tenant context
      if (tenantContext.organizationId && tenantContext.propertyId) {
        orConditions.push({
          organizationId: tenantContext.organizationId,
          propertyId: tenantContext.propertyId,
        });
      }
      
      // Include photos that partially match tenant context
      if (tenantContext.organizationId) {
        orConditions.push({
          organizationId: tenantContext.organizationId,
          propertyId: null,
        });
      }
      
      whereClause.OR = orConditions;
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    const photos = await prisma.profilePhoto.findMany({
      where: whereClause,
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    console.log(`✅ Photos query result: ${photos.length} photos found`);

    // 5. Test if there's any other user lookup that might fail
    console.log('\n📊 5. Testing other potential user lookups...');
    
    // Check if there's a user lookup in the upload validation flow
    const userForUpload = await prisma.user.findFirst({
      where: { 
        id: userId, 
        deletedAt: null,
        organizationId: currentUser.organizationId,
      },
    });
    console.log(`User lookup for upload validation: ${userForUpload ? 'SUCCESS' : 'FAILED'}`);

    // 6. Test exact same logic as controller getCurrentUserPhotos
    console.log('\n📊 6. Simulating controller logic...');
    
    try {
      // This is the exact logic from the controller
      if (!currentUser || !currentUser.id) {
        throw new Error('Invalid user session');
      }

      // Simulate photosByType calculation
      const photosByType = {
        FORMAL: 0,
        CASUAL: 0,
        UNIFORM: 0,
        FUNNY: 0,
      };

      photos.forEach(photo => {
        photosByType[photo.photoType]++;
      });

      const primaryPhoto = photos.find(photo => photo.isPrimary) || null;

      const result = {
        photos,
        photosByType,
        primaryPhoto,
      };

      console.log('✅ Controller logic simulation SUCCESS');
      console.log('Result:', {
        photosCount: result.photos.length,
        photosByType: result.photosByType,
        hasPrimaryPhoto: !!result.primaryPhoto,
      });

    } catch (error) {
      console.log('❌ Controller logic simulation FAILED:', error.message);
    }

    // 7. Look for any edge cases that might cause issues
    console.log('\n📊 7. Checking for edge cases...');
    
    // Check if user has null/undefined fields that might cause issues
    const userFields = {
      organizationId: currentUser.organizationId,
      propertyId: currentUser.propertyId,
      departmentId: currentUser.departmentId,
      email: currentUser.email,
      role: currentUser.role,
    };

    console.log('User fields:', userFields);

    // Check for any null values that might cause problems
    const nullFields = Object.entries(userFields).filter(([key, value]) => value === null);
    if (nullFields.length > 0) {
      console.log('⚠️ Found null fields that might cause issues:', nullFields);
    } else {
      console.log('✅ All critical user fields are populated');
    }

  } catch (error) {
    console.error('❌ Error during simulation:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);