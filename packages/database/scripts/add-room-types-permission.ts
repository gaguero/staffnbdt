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

async function addRoomTypesPermission() {
  console.log('🏷️ Adding Room Types Permission...');
  
  try {
    const userId = 'cmf0gg0wn000elzp5l9dzkzs1';
    
    const permissionKey = 'unit_type.read.property';
    const [resource, action, scope] = permissionKey.split('.');
    
    console.log(`👤 User: ${userId}`);
    console.log(`🔑 Adding permission: ${permissionKey}`);
    
    // Find or create the permission
    let permission = await prisma.permission.findFirst({
      where: {
        resource,
        action, 
        scope
      }
    });

    if (!permission) {
      console.log(`⚠️  Permission ${permissionKey} does not exist in database - creating it...`);
      
      permission = await prisma.permission.create({
        data: {
          resource,
          action,
          scope,
          name: `Read Unit Types (property)`,
          description: `Permission to read unit types at property level`,
          category: 'Hotel Operations',
          isSystem: true
        }
      });
      
      console.log(`✅ Created permission: ${permissionKey}`);
    }

    // Check if user already has this permission
    const existingUserPermission = await prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId: permission.id,
        isActive: true
      }
    });

    if (existingUserPermission && existingUserPermission.granted) {
      console.log(`✓ User already has: ${permissionKey}`);
    } else if (existingUserPermission && !existingUserPermission.granted) {
      // Update denied permission to granted
      await prisma.userPermission.update({
        where: { id: existingUserPermission.id },
        data: { granted: true }
      });
      console.log(`🔄 Updated ${permissionKey} from DENIED to GRANTED`);
    } else {
      // Grant new permission to user
      await prisma.userPermission.create({
        data: {
          userId,
          permissionId: permission.id,
          granted: true,
          grantedBy: userId,
          isActive: true
        }
      });
      console.log(`✅ Added: ${permissionKey}`);
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
    console.log('✅ Room types permission added successfully');

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRoomTypesPermission().catch(console.error);