const { PrismaClient } = require('@prisma/client');

async function checkRobertoPermissions() {
  const prisma = new PrismaClient({
    datasourceUrl: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
  });

  console.log('🔌 Connecting to Railway database...');

  try {
    console.log('=== CHECKING ROBERTO MARTINEZ PERMISSIONS ===\n');

    // Find Roberto's user account
    const roberto = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'roberto.martinez@nayararesorts.com' },
          { username: 'roberto.martinez' }
        ]
      },
      include: {
        userCustomRoles: {
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
          include: {
            permission: true
          }
        }
      }
    });

    if (!roberto) {
      console.log('❌ Roberto Martinez not found in database');
      return;
    }

    console.log(`✅ Found Roberto Martinez: ${roberto.email}`);
    console.log(`   - ID: ${roberto.id}`);
    console.log(`   - Role: ${roberto.role}`);
    console.log(`   - Organization: ${roberto.organizationId}`);
    console.log(`   - Property: ${roberto.propertyId}`);
    console.log('');

    // Check Permission table structure and data
    console.log('=== PERMISSION TABLE ANALYSIS ===');
    const allPermissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }]
    });

    console.log(`📊 Total permissions in database: ${allPermissions.length}`);
    
    if (allPermissions.length > 0) {
      // Check if isSystem field exists and analyze values
      const systemPermissions = allPermissions.filter(p => p.isSystem === true);
      const nonSystemPermissions = allPermissions.filter(p => p.isSystem === false);
      const nullSystemPermissions = allPermissions.filter(p => p.isSystem === null);
      
      console.log(`   - System permissions (isSystem=true): ${systemPermissions.length}`);
      console.log(`   - Non-system permissions (isSystem=false): ${nonSystemPermissions.length}`);
      console.log(`   - Null system permissions (isSystem=null): ${nullSystemPermissions.length}`);
      
      // Show first few permissions for analysis
      console.log('\n📋 Sample permissions:');
      allPermissions.slice(0, 10).forEach((perm, i) => {
        console.log(`   ${i + 1}. ${perm.resource}.${perm.action}.${perm.scope} (isSystem: ${perm.isSystem}) - ${perm.name || 'No name'}`);
      });
    } else {
      console.log('❌ No permissions found in database');
    }

    // Test the getLegacyRolePermissions logic for PLATFORM_ADMIN
    console.log('\n=== TESTING getLegacyRolePermissions for PLATFORM_ADMIN ===');
    
    // Simulate the current logic (isSystem: true filter)
    const systemOnlyPermissions = await prisma.permission.findMany({ 
      where: { isSystem: true } 
    });
    console.log(`🔍 Permissions with isSystem=true: ${systemOnlyPermissions.length}`);
    
    // Test without the isSystem filter (what PLATFORM_ADMIN should get)
    const allPermissionsForPlatformAdmin = await prisma.permission.findMany();
    console.log(`🔍 All permissions (no isSystem filter): ${allPermissionsForPlatformAdmin.length}`);

    // Check Roberto's role assignments
    console.log('\n=== ROBERTO\'S ROLE ASSIGNMENTS ===');
    console.log(`Custom roles assigned: ${roberto.userCustomRoles.length}`);
    roberto.userCustomRoles.forEach((userRole, i) => {
      console.log(`   ${i + 1}. ${userRole.role.name} (${userRole.role.permissions.length} permissions)`);
    });
    
    console.log(`Direct permissions assigned: ${roberto.userPermissions.length}`);
    roberto.userPermissions.forEach((userPerm, i) => {
      console.log(`   ${i + 1}. ${userPerm.permission.resource}.${userPerm.permission.action}.${userPerm.permission.scope} (granted: ${userPerm.granted})`);
    });

    // Check for roles with the name "Platform Administrator" or similar
    console.log('\n=== CHECKING FOR PLATFORM ADMIN ROLES ===');
    const platformAdminRoles = await prisma.customRole.findMany({
      where: {
        OR: [
          { name: { contains: 'Platform', mode: 'insensitive' } },
          { name: { contains: 'Admin', mode: 'insensitive' } },
          { isSystemRole: true }
        ]
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    console.log(`🔍 Found ${platformAdminRoles.length} platform/admin roles:`);
    platformAdminRoles.forEach(role => {
      console.log(`   - ${role.name} (${role.permissions.length} permissions, system: ${role.isSystemRole})`);
    });

  } catch (error) {
    console.error('❌ Error checking Roberto permissions:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkRobertoPermissions();