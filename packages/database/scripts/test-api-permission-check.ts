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

async function simulatePermissionCheck() {
  console.log('🧪 Simulating Permission Check for API Call...');
  
  try {
    const userId = 'cmf0gg0wn000elzp5l9dzkzs1';
    const requiredPermission = 'module.read.organization';

    // This simulates what the PermissionService.hasPermission does
    console.log(`\n🔍 Testing permission: ${requiredPermission}`);
    console.log(`👤 User ID: ${userId}`);

    // First, let's check what the JWT token contains
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,  // System role
        userType: true,
        organizationId: true,
        propertyId: true,
        departmentId: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('📋 User context:');
    console.log(`  - System Role: ${user.role}`);
    console.log(`  - User Type: ${user.userType}`);
    console.log(`  - Organization: ${user.organizationId}`);
    console.log(`  - Property: ${user.propertyId}`);

    // Check direct permissions (this is what should grant access)
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      include: {
        permission: true
      }
    });

    console.log(`\n🔑 Direct Permissions (${userPermissions.length}):`);
    
    let hasRequiredPermission = false;
    for (const up of userPermissions) {
      const permKey = `${up.permission.resource}.${up.permission.action}.${up.permission.scope}`;
      console.log(`  - ${permKey} (${up.granted ? 'GRANTED' : 'DENIED'})`);
      
      if (permKey === requiredPermission && up.granted) {
        hasRequiredPermission = true;
      }
    }

    console.log(`\n📊 Result: User ${hasRequiredPermission ? 'HAS' : 'DOES NOT HAVE'} ${requiredPermission}`);

    if (!hasRequiredPermission) {
      console.log('❌ This would cause 403 error');
    } else {
      console.log('✅ This should allow access');
      console.log('🤔 But API is still returning 403, which means:');
      console.log('   1. Permission check logic has a bug');
      console.log('   2. Cache is stale');  
      console.log('   3. Request context is missing');
      console.log('   4. Permission decorator requirements are wrong');
    }

    // Check if there are any permission cache issues
    console.log(`\n🗂️ Checking for potential cache issues...`);
    
    // Check if this permission should be available from legacy role check
    if (user.role === 'PLATFORM_ADMIN') {
      console.log('👑 User has PLATFORM_ADMIN role - should bypass all permission checks');
    }

    // Let's also check if there are any conditions on this permission
    const permissionWithConditions = await prisma.permission.findFirst({
      where: {
        resource: 'module',
        action: 'read',
        scope: 'organization'
      },
      include: {
        conditions: true
      }
    });

    if (permissionWithConditions?.conditions?.length > 0) {
      console.log('⚠️  Permission has conditions that might be failing:');
      permissionWithConditions.conditions.forEach(condition => {
        console.log(`   - ${condition.type}: ${condition.value}`);
      });
    } else {
      console.log('✅ Permission has no additional conditions');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulatePermissionCheck().catch(console.error);