import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure we have Railway DATABASE_URL
const railwayDatabaseUrl = process.env.DATABASE_URL;
if (!railwayDatabaseUrl) {
  console.error('❌ DATABASE_URL environment variable not found');
  console.log('Please run with: DATABASE_URL="your-railway-url" npx tsx scripts/fix-module-permission-quick.ts');
  process.exit(1);
}

console.log('🚂 Connecting to Railway database...');
console.log(`📍 Database URL: ${railwayDatabaseUrl.substring(0, 30)}...`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: railwayDatabaseUrl
    }
  }
});

async function main() {
  console.log('🔧 Quick fix for module.read.organization permission...');
  
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to Railway database');
    
    // Step 1: Ensure the module.read.organization permission exists
    console.log('\n📝 Step 1: Ensuring module.read.organization permission exists...');
    
    let permission = await prisma.permission.findFirst({
      where: {
        resource: 'module',
        action: 'read',
        scope: 'organization'
      }
    });
    
    if (!permission) {
      console.log('🆕 Creating module.read.organization permission...');
      permission = await prisma.permission.create({
        data: {
          resource: 'module',
          action: 'read',
          scope: 'organization',
          name: 'View Organization Modules',
          description: 'View enabled modules and their configurations for the organization',
          category: 'Admin',
          isSystem: true
        }
      });
      console.log('✅ Created module.read.organization permission');
    } else {
      console.log('✓ module.read.organization permission already exists');
    }
    
    // Step 2: Add permission.read.organization as well (used by module permissions endpoint)
    console.log('\n📝 Step 2: Ensuring permission.read.organization permission exists...');
    
    let permissionReadPerm = await prisma.permission.findFirst({
      where: {
        resource: 'permission',
        action: 'read',
        scope: 'organization'
      }
    });
    
    if (!permissionReadPerm) {
      console.log('🆕 Creating permission.read.organization permission...');
      permissionReadPerm = await prisma.permission.create({
        data: {
          resource: 'permission',
          action: 'read',
          scope: 'organization',
          name: 'View Organization Permissions',
          description: 'View permission information within the organization',
          category: 'Admin',
          isSystem: true
        }
      });
      console.log('✅ Created permission.read.organization permission');
    } else {
      console.log('✓ permission.read.organization permission already exists');
    }
    
    // Step 3: Fix the specific problematic user
    console.log('\n👤 Step 3: Fixing user cmf0gg0wn000elzp5l9dzkzs1...');
    
    const problemUser = await prisma.user.findUnique({
      where: { id: 'cmf0gg0wn000elzp5l9dzkzs1' },
      include: {
        userPermissions: true
      }
    });
    
    if (!problemUser) {
      console.log('❌ User cmf0gg0wn000elzp5l9dzkzs1 not found');
      
      // Also try to find lea@email.com
      const leaUser = await prisma.user.findUnique({
        where: { email: 'lea@email.com' }
      });
      
      if (leaUser) {
        console.log(`✅ Found lea@email.com user: ${leaUser.id}`);
        await addPermissionsToUser(leaUser.id, permission, permissionReadPerm);
      } else {
        console.log('❌ No users found to fix');
        return;
      }
    } else {
      console.log(`✅ Found user: ${problemUser.email} (${problemUser.firstName} ${problemUser.lastName})`);
      await addPermissionsToUser(problemUser.id, permission, permissionReadPerm);
    }
    
    console.log('\n🎉 Quick fix completed successfully!');
    console.log('🔍 Please test the navigation menu loading now.');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function addPermissionsToUser(userId: string, modulePermission: any, permissionPermission: any) {
  console.log(`🔧 Adding permissions to user ${userId}...`);
  
  // Add module.read.organization
  const existingModulePerm = await prisma.userPermission.findFirst({
    where: {
      userId: userId,
      permissionId: modulePermission.id
    }
  });
  
  if (!existingModulePerm) {
    await prisma.userPermission.create({
      data: {
        userId: userId,
        permissionId: modulePermission.id,
        granted: true,
        grantedBy: userId
      }
    });
    console.log('✅ Added module.read.organization permission');
  } else {
    console.log('✓ User already has module.read.organization permission');
  }
  
  // Add permission.read.organization
  const existingPermissionPerm = await prisma.userPermission.findFirst({
    where: {
      userId: userId,
      permissionId: permissionPermission.id
    }
  });
  
  if (!existingPermissionPerm) {
    await prisma.userPermission.create({
      data: {
        userId: userId,
        permissionId: permissionPermission.id,
        granted: true,
        grantedBy: userId
      }
    });
    console.log('✅ Added permission.read.organization permission');
  } else {
    console.log('✓ User already has permission.read.organization permission');
  }
  
  // Verify the fix
  const userWithPerms = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userPermissions: {
        include: {
          permission: true
        }
      }
    }
  });
  
  const hasModuleRead = userWithPerms?.userPermissions.some(up => 
    up.permission.resource === 'module' && 
    up.permission.action === 'read' && 
    up.permission.scope === 'organization'
  );
  
  const hasPermissionRead = userWithPerms?.userPermissions.some(up => 
    up.permission.resource === 'permission' && 
    up.permission.action === 'read' && 
    up.permission.scope === 'organization'
  );
  
  console.log(`📊 User ${userId} verification:`);
  console.log(`  - module.read.organization: ${hasModuleRead ? '✅' : '❌'}`);
  console.log(`  - permission.read.organization: ${hasPermissionRead ? '✅' : '❌'}`);
  console.log(`  - Total permissions: ${userWithPerms?.userPermissions.length || 0}`);
}

main().catch(console.error);