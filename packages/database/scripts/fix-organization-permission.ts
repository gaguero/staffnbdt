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

async function fixOrganizationPermission() {
  console.log('🏛️ Fixing Organization Permission...');
  
  try {
    const userId = 'cmf0gg0wn000elzp5l9dzkzs1';
    
    console.log(`👤 User: ${userId}`);
    
    // 1. Remove the invalid system.manage.organizations permission if it exists
    const invalidPermission = await prisma.permission.findFirst({
      where: {
        resource: 'system',
        action: 'manage',
        scope: 'organizations'
      }
    });
    
    if (invalidPermission) {
      const existingUserPerm = await prisma.userPermission.findFirst({
        where: {
          userId,
          permissionId: invalidPermission.id
        }
      });
      
      if (existingUserPerm) {
        await prisma.userPermission.delete({
          where: { id: existingUserPerm.id }
        });
        console.log(`🗑️ Removed invalid system.manage.organizations permission`);
      }
    }
    
    // 2. Add the correct organization.read.platform permission
    const correctPermissionKey = 'organization.read.platform';
    const [resource, action, scope] = correctPermissionKey.split('.');
    
    let correctPermission = await prisma.permission.findFirst({
      where: {
        resource,
        action,
        scope
      }
    });
    
    if (!correctPermission) {
      console.log(`⚠️  Permission ${correctPermissionKey} does not exist in database - creating it...`);
      
      correctPermission = await prisma.permission.create({
        data: {
          resource,
          action,
          scope,
          name: `Read Organizations (platform)`,
          description: `Permission to read organizations at platform level`,
          category: 'System Administration',
          isSystem: true
        }
      });
      
      console.log(`✅ Created permission: ${correctPermissionKey}`);
    }
    
    // Check if user already has this permission
    const existingUserPermission = await prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId: correctPermission.id,
        isActive: true
      }
    });

    if (existingUserPermission && existingUserPermission.granted) {
      console.log(`✓ User already has: ${correctPermissionKey}`);
    } else if (existingUserPermission && !existingUserPermission.granted) {
      // Update denied permission to granted
      await prisma.userPermission.update({
        where: { id: existingUserPermission.id },
        data: { granted: true }
      });
      console.log(`🔄 Updated ${correctPermissionKey} from DENIED to GRANTED`);
    } else {
      // Grant new permission to user
      await prisma.userPermission.create({
        data: {
          userId,
          permissionId: correctPermission.id,
          granted: true,
          grantedBy: userId,
          isActive: true
        }
      });
      console.log(`✅ Added: ${correctPermissionKey}`);
    }

    // Get final permission count
    const finalPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        granted: true,
        isActive: true
      }
    });

    console.log(`\n🎉 User now has ${finalPermissions.length} total permissions!`);
    console.log('✅ Organization permission fixed successfully');
    console.log('🔄 Organizations API should now work correctly');

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrganizationPermission().catch(console.error);