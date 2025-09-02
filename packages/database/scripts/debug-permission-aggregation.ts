import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const railwayDatabaseUrl = process.env.DATABASE_URL;
if (!railwayDatabaseUrl) {
  console.error('❌ DATABASE_URL environment variable not found');
  console.log('Please run with: DATABASE_URL="your-railway-url" npx tsx scripts/debug-permission-aggregation.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: railwayDatabaseUrl
    }
  }
});

async function debugUserPermissions() {
  console.log('🔍 Debugging Permission Aggregation...');
  
  try {
    // Find the user that's experiencing issues
    const problemUser = await prisma.user.findUnique({
      where: { id: 'cmf0gg0wn000elzp5l9dzkzs1' },
      include: {
        userCustomRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        userPermissions: {
          where: { isActive: true },
          include: {
            permission: true
          }
        }
      }
    });

    if (!problemUser) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n👤 User: ${problemUser.email}`);
    console.log(`📧 User ID: ${problemUser.id}`);
    console.log(`🏢 Organization ID: ${problemUser.organizationId}`);
    console.log(`🏨 Property ID: ${problemUser.propertyId}`);
    console.log(`👥 User Type: ${problemUser.userType}`);

    // Check custom roles
    console.log(`\n🎭 Custom Roles (${problemUser.userCustomRoles.length}):`);
    for (const userRole of problemUser.userCustomRoles) {
      console.log(`  - Role: ${userRole.role.name}`);
      console.log(`    Active: ${userRole.isActive}`);
      console.log(`    Permissions from role: ${userRole.role.permissions.length}`);
      
      // List some of the permissions from this role
      if (userRole.role.permissions.length > 0) {
        console.log('    Sample permissions:');
        userRole.role.permissions.slice(0, 5).forEach(rp => {
          const perm = rp.permission;
          console.log(`      - ${perm.resource}.${perm.action}.${perm.scope} (${perm.name})`);
        });
        if (userRole.role.permissions.length > 5) {
          console.log(`      ... and ${userRole.role.permissions.length - 5} more`);
        }
      }
    }

    // Check direct permissions
    console.log(`\n🔑 Direct Permissions (${problemUser.userPermissions.length}):`);
    for (const userPerm of problemUser.userPermissions) {
      const perm = userPerm.permission;
      console.log(`  - ${perm.resource}.${perm.action}.${perm.scope} (${userPerm.granted ? 'GRANTED' : 'DENIED'})`);
    }

    // Check for module.read.organization permission specifically
    console.log(`\n🔍 Checking for 'module.read.organization' permission...`);
    
    let hasModuleReadOrg = false;
    
    // Check in role permissions
    for (const userRole of problemUser.userCustomRoles) {
      for (const rp of userRole.role.permissions) {
        if (rp.permission.resource === 'module' && 
            rp.permission.action === 'read' && 
            rp.permission.scope === 'organization') {
          console.log(`  ✅ Found in role: ${userRole.role.name}`);
          hasModuleReadOrg = true;
        }
      }
    }
    
    // Check in direct permissions  
    for (const userPerm of problemUser.userPermissions) {
      if (userPerm.permission.resource === 'module' && 
          userPerm.permission.action === 'read' && 
          userPerm.permission.scope === 'organization') {
        console.log(`  ✅ Found in direct permissions (${userPerm.granted ? 'GRANTED' : 'DENIED'})`);
        if (userPerm.granted) hasModuleReadOrg = true;
      }
    }
    
    if (!hasModuleReadOrg) {
      console.log('  ❌ module.read.organization permission NOT FOUND');
      
      // Check if the permission even exists
      const moduleReadOrgPerm = await prisma.permission.findFirst({
        where: {
          resource: 'module',
          action: 'read',
          scope: 'organization'
        }
      });
      
      if (!moduleReadOrgPerm) {
        console.log('  ❌ module.read.organization permission does not exist in database!');
      } else {
        console.log(`  ℹ️  module.read.organization permission exists (ID: ${moduleReadOrgPerm.id})`);
        
        // Check if it should be granted via any role
        if (problemUser.userCustomRoles.length > 0) {
          const roleId = problemUser.userCustomRoles[0].roleId;
          console.log(`  🔍 Checking if role ${problemUser.userCustomRoles[0].role.name} should have this permission...`);
          
          const rolePermissions = await prisma.rolePermission.findMany({
            where: { roleId },
            include: { permission: true }
          });
          
          const hasInRolePerms = rolePermissions.some(rp => 
            rp.permission.resource === 'module' && 
            rp.permission.action === 'read' && 
            rp.permission.scope === 'organization'
          );
          
          if (!hasInRolePerms) {
            console.log('  ❌ Permission is NOT assigned to the user\'s role');
            console.log('  💡 This is likely why the menu doesn\'t show after refresh!');
          } else {
            console.log('  ✅ Permission IS assigned to the user\'s role');
          }
        }
      }
    } else {
      console.log('  ✅ module.read.organization permission FOUND');
    }

    // Get total permissions this user should have
    const allUserPermissions = new Set<string>();
    
    // Add role permissions
    for (const userRole of problemUser.userCustomRoles) {
      for (const rp of userRole.role.permissions) {
        if (rp.granted) {
          allUserPermissions.add(`${rp.permission.resource}.${rp.permission.action}.${rp.permission.scope}`);
        }
      }
    }
    
    // Add/remove direct permissions
    for (const userPerm of problemUser.userPermissions) {
      const permKey = `${userPerm.permission.resource}.${userPerm.permission.action}.${userPerm.permission.scope}`;
      if (userPerm.granted) {
        allUserPermissions.add(permKey);
      } else {
        allUserPermissions.delete(permKey);
      }
    }
    
    console.log(`\n📊 Total Effective Permissions: ${allUserPermissions.size}`);
    console.log('Sample permissions:');
    Array.from(allUserPermissions).slice(0, 10).forEach(perm => {
      console.log(`  - ${perm}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserPermissions().catch(console.error);