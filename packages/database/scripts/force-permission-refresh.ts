import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const railwayDatabaseUrl = process.env.DATABASE_URL;
if (!railwayDatabaseUrl) {
  console.error('❌ DATABASE_URL environment variable not found');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: railwayDatabaseUrl
    }
  }
});

async function forcePermissionRefresh() {
  console.log('🔄 Forcing permission cache refresh...');
  
  try {
    const userId = 'cmf0gg0wn000elzp5l9dzkzs1';
    console.log(`👤 User ID: ${userId}`);
    
    // Strategy 1: Update user record to force cache invalidation
    await prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: new Date()
      }
    });
    
    // Strategy 2: Update one of the user's permissions to trigger cache invalidation
    const userPermission = await prisma.userPermission.findFirst({
      where: {
        userId,
        isActive: true
      }
    });
    
    if (userPermission) {
      await prisma.userPermission.update({
        where: { id: userPermission.id },
        data: {
          updatedAt: new Date()
        }
      });
      console.log('🔄 Updated user permission record to trigger cache refresh');
    }
    
    console.log('✅ Permission cache refresh forced');
    console.log('🔄 User will get completely fresh permissions on next API call');
    console.log('⏰ Cache should be invalidated immediately');
    
    // Wait a moment and check permissions
    console.log('\n📊 Current user permissions:');
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        granted: true,
        isActive: true
      },
      include: {
        permission: true
      }
    });
    
    console.log(`📊 Total permissions: ${userPermissions.length}`);
    
    const hotelPermissions = userPermissions.filter(up => 
      ['reservation', 'guest', 'unit'].includes(up.permission.resource)
    );
    
    console.log(`🏨 Hotel operations permissions: ${hotelPermissions.length}`);
    hotelPermissions.forEach(up => {
      console.log(`  ✅ ${up.permission.resource}.${up.permission.action}.${up.permission.scope}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forcePermissionRefresh().catch(console.error);