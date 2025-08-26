#!/usr/bin/env node

/**
 * Debug Profile Photos Script
 * Analyzes existing profile photos in database and their tenant context
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
    }
  }
});

console.log('🔍 Debugging Profile Photos Database...\n');

async function debugProfilePhotos() {
  try {
    // 1. Check all users and their tenant context
    console.log('👥 All Users:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        organizationId: true,
        propertyId: true,
        departmentId: true,
        deletedAt: true,
      },
      orderBy: { email: 'asc' }
    });
    
    console.table(users.map(u => ({
      id: u.id.substring(0, 8) + '...',
      email: u.email,
      orgId: u.organizationId?.substring(0, 8) + '...' || 'NULL',
      propId: u.propertyId?.substring(0, 8) + '...' || 'NULL',
      deptId: u.departmentId?.substring(0, 8) + '...' || 'NULL',
      deleted: !!u.deletedAt
    })));

    // 2. Check all profile photos
    console.log('\n📸 All Profile Photos:');
    const photos = await prisma.profilePhoto.findMany({
      select: {
        id: true,
        userId: true,
        organizationId: true,
        propertyId: true,
        fileName: true,
        fileKey: true,
        isPrimary: true,
        isActive: true,
        createdAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (photos.length === 0) {
      console.log('❌ NO PROFILE PHOTOS FOUND IN DATABASE');
    } else {
      console.table(photos.map(p => ({
        id: p.id.substring(0, 8) + '...',
        userId: p.userId.substring(0, 8) + '...',
        orgId: p.organizationId?.substring(0, 8) + '...' || 'NULL',
        propId: p.propertyId?.substring(0, 8) + '...' || 'NULL',
        fileName: p.fileName,
        fileKey: p.fileKey?.substring(0, 30) + '...' || 'NULL',
        primary: p.isPrimary,
        active: p.isActive,
        deleted: !!p.deletedAt
      })));
    }

    // 3. Check for specific user from logs
    const targetUserId = 'cmej91r0l002ns2f0e9dxocvf';
    console.log(`\n🎯 Photos for specific user (${targetUserId}):`);
    
    const userPhotos = await prisma.profilePhoto.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        organizationId: true,
        propertyId: true,
        fileName: true,
        fileKey: true,
        isPrimary: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
      }
    });
    
    if (userPhotos.length === 0) {
      console.log('❌ NO PHOTOS FOUND for this user');
    } else {
      console.table(userPhotos);
    }

    // 4. Cross-check with user's tenant context
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        organizationId: true,
        propertyId: true,
        departmentId: true,
      }
    });

    if (targetUser) {
      console.log(`\n👤 Target User Context:`, targetUser);
      
      // Check if photos match user's tenant context
      const matchingPhotos = userPhotos.filter(photo => 
        (photo.organizationId === targetUser.organizationId || (!photo.organizationId && !targetUser.organizationId)) &&
        (photo.propertyId === targetUser.propertyId || (!photo.propertyId && !targetUser.propertyId))
      );
      
      console.log(`\n🔍 Analysis:`);
      console.log(`- User has ${userPhotos.length} photos total`);
      console.log(`- ${matchingPhotos.length} photos match user's tenant context`);
      console.log(`- ${userPhotos.filter(p => p.isActive && !p.deletedAt).length} photos are active`);
      console.log(`- ${userPhotos.filter(p => p.isPrimary && p.isActive && !p.deletedAt).length} photos are primary`);
    } else {
      console.log('❌ TARGET USER NOT FOUND');
    }

    // 5. Check organizations and properties
    console.log('\n🏢 Organizations:');
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true }
    });
    console.table(orgs.map(o => ({
      id: o.id.substring(0, 8) + '...',
      name: o.name
    })));

    console.log('\n🏠 Properties:');
    const props = await prisma.property.findMany({
      select: { id: true, name: true, organizationId: true }
    });
    console.table(props.map(p => ({
      id: p.id.substring(0, 8) + '...',
      name: p.name,
      orgId: p.organizationId?.substring(0, 8) + '...' || 'NULL'
    })));

  } catch (error) {
    console.error('💥 Database query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProfilePhotos().catch(console.error);