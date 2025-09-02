import { PrismaClient } from '@prisma/client';

// Initialize Prisma with the Railway DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🔧 Fixing module registry permissions...');
  
  // Step 1: Add missing module permissions to the database
  await addModulePermissions();
  
  // Step 2: Update system roles to include module permissions
  await updateSystemRoles();
  
  // Step 3: Fix the specific user mentioned in the error
  const problematicUser = await prisma.user.findUnique({
    where: { id: 'cmf0gg0wn000elzp5l9dzkzs1' }
  });
  
  if (problematicUser) {
    console.log(`🔧 Fixing user: ${problematicUser.email}`);
    await fixUserModulePermissions(problematicUser.id);
  }
  
  // Step 4: Also check and fix lea@email.com if they exist
  const leaUser = await prisma.user.findUnique({
    where: { email: 'lea@email.com' }
  });
  
  if (leaUser) {
    console.log(`🔧 Fixing user: ${leaUser.email}`);
    await fixUserModulePermissions(leaUser.id);
  }
  
  console.log('✅ Module registry permissions fix completed!');
}

async function addModulePermissions() {
  console.log('📝 Adding module registry permissions...');
  
  const modulePermissions = [
    {
      resource: 'module',
      action: 'read',
      scope: 'organization',
      name: 'View Organization Modules',
      description: 'View enabled modules and their configurations for the organization',
      category: 'Admin',
      isSystem: true
    },
    {
      resource: 'module',
      action: 'read',
      scope: 'property',
      name: 'View Property Modules',
      description: 'View enabled modules and their configurations for the property',
      category: 'Admin',
      isSystem: true
    },
    {
      resource: 'module',
      action: 'manage',
      scope: 'organization',
      name: 'Manage Organization Modules',
      description: 'Enable and disable modules for the organization',
      category: 'Admin',
      isSystem: true
    },
    {
      resource: 'module',
      action: 'manage',
      scope: 'property',
      name: 'Manage Property Modules',
      description: 'Enable and disable modules for the property',
      category: 'Admin',
      isSystem: true
    },
    {
      resource: 'module',
      action: 'create',
      scope: 'all',
      name: 'Create Platform Modules',
      description: 'Register new modules on the platform',
      category: 'Platform',
      isSystem: true
    },
    {
      resource: 'module',
      action: 'delete',
      scope: 'all',
      name: 'Delete Platform Modules',
      description: 'Unregister modules from the platform',
      category: 'Platform',
      isSystem: true
    },
    {
      resource: 'permission',
      action: 'read',
      scope: 'organization',
      name: 'View Organization Permissions',
      description: 'View permission information within the organization',
      category: 'Admin',
      isSystem: true
    }
  ];
  
  for (const permission of modulePermissions) {
    await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource: permission.resource,
          action: permission.action,
          scope: permission.scope
        }
      },
      update: {
        name: permission.name,
        description: permission.description,
        category: permission.category,
        isSystem: permission.isSystem
      },
      create: permission
    });
    console.log(`✅ Added/updated permission: ${permission.resource}.${permission.action}.${permission.scope}`);
  }
}

async function updateSystemRoles() {
  console.log('🎭 Updating system roles with module permissions...');
  
  // Find Super Administrator role
  const superAdminRole = await prisma.customRole.findFirst({
    where: {
      name: 'Super Administrator',
      isSystemRole: true
    }
  });
  
  if (superAdminRole) {
    // Get all permissions for Super Admin
    const allPermissions = await prisma.permission.findMany();
    
    // Clear existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdminRole.id }
    });
    
    // Add all permissions
    for (const permission of allPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
          granted: true
        }
      });
    }
    
    console.log(`✅ Updated Super Administrator role with ${allPermissions.length} permissions`);
  }
  
  // Find Organization Manager role
  const orgManagerRole = await prisma.customRole.findFirst({
    where: {
      name: 'Organization Manager',
      isSystemRole: true
    }
  });
  
  if (orgManagerRole) {
    // Add module permissions to Organization Manager
    const modulePermissions = await prisma.permission.findMany({
      where: {
        resource: 'module',
        scope: { in: ['organization', 'property'] }
      }
    });
    
    for (const permission of modulePermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: orgManagerRole.id,
            permissionId: permission.id
          }
        },
        update: { granted: true },
        create: {
          roleId: orgManagerRole.id,
          permissionId: permission.id,
          granted: true
        }
      });
    }
    
    console.log(`✅ Updated Organization Manager role with ${modulePermissions.length} module permissions`);
  }
  
  // Find Property Manager role
  const propManagerRole = await prisma.customRole.findFirst({
    where: {
      name: 'Property Manager',
      isSystemRole: true
    }
  });
  
  if (propManagerRole) {
    // Add property-scoped module permissions to Property Manager
    const propModulePermissions = await prisma.permission.findMany({
      where: {
        resource: 'module',
        scope: 'property'
      }
    });
    
    for (const permission of propModulePermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: propManagerRole.id,
            permissionId: permission.id
          }
        },
        update: { granted: true },
        create: {
          roleId: propManagerRole.id,
          permissionId: permission.id,
          granted: true
        }
      });
    }
    
    console.log(`✅ Updated Property Manager role with ${propModulePermissions.length} module permissions`);
  }
}

async function fixUserModulePermissions(userId: string) {
  console.log(`🔧 Adding module permissions to user: ${userId}`);
  
  // Get the module.read.organization permission
  const moduleReadPermission = await prisma.permission.findFirst({
    where: {
      resource: 'module',
      action: 'read',
      scope: 'organization'
    }
  });
  
  if (!moduleReadPermission) {
    console.log('❌ module.read.organization permission not found!');
    return;
  }
  
  // Check if user already has this permission
  const existingPermission = await prisma.userPermission.findFirst({
    where: {
      userId: userId,
      permissionId: moduleReadPermission.id
    }
  });
  
  if (!existingPermission) {
    await prisma.userPermission.create({
      data: {
        userId: userId,
        permissionId: moduleReadPermission.id,
        granted: true,
        grantedBy: userId
      }
    });
    console.log('✅ Added module.read.organization permission');
  } else {
    console.log('✓ User already has module.read.organization permission');
  }
  
  // Also add permission.read.organization which is used by the module permissions endpoint
  const permissionReadPermission = await prisma.permission.findFirst({
    where: {
      resource: 'permission',
      action: 'read',
      scope: 'organization'
    }
  });
  
  if (permissionReadPermission) {
    const existingPermRead = await prisma.userPermission.findFirst({
      where: {
        userId: userId,
        permissionId: permissionReadPermission.id
      }
    });
    
    if (!existingPermRead) {
      await prisma.userPermission.create({
        data: {
          userId: userId,
          permissionId: permissionReadPermission.id,
          granted: true,
          grantedBy: userId
        }
      });
      console.log('✅ Added permission.read.organization permission');
    } else {
      console.log('✓ User already has permission.read.organization permission');
    }
  }
  
  // Validate the fix
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userPermissions: {
        include: {
          permission: true
        }
      }
    }
  });
  
  const hasModuleRead = user?.userPermissions.some(up => 
    up.permission.resource === 'module' && 
    up.permission.action === 'read' && 
    up.permission.scope === 'organization'
  );
  
  console.log(`📊 User ${userId} module permissions: ${hasModuleRead ? '✅ FIXED' : '❌ STILL MISSING'}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());