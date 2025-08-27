#!/usr/bin/env ts-node-esm

/**
 * Seed script to create UI-specific permissions that the frontend checks for
 * This fixes the "Permission not found" errors for UI elements like PermissionGate
 */

import { PrismaClient, Role } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🌱 Seeding UI-specific permissions...');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    console.log('📋 Creating UI-specific permissions for frontend components...');

    // UI permissions that the frontend PermissionGate components check for
    const uiPermissions = [
      // Role management permissions
      { resource: 'role', action: 'create', scope: 'own', name: 'Create Personal Roles', category: 'Role Management' },
      { resource: 'role', action: 'create', scope: 'department', name: 'Create Department Roles', category: 'Role Management' },
      { resource: 'role', action: 'create', scope: 'property', name: 'Create Property Roles', category: 'Role Management' },
      { resource: 'role', action: 'create', scope: 'organization', name: 'Create Organization Roles', category: 'Role Management' },

      { resource: 'role', action: 'assign', scope: 'own', name: 'Assign Personal Roles', category: 'Role Management' },
      { resource: 'role', action: 'assign', scope: 'department', name: 'Assign Department Roles', category: 'Role Management' },
      { resource: 'role', action: 'assign', scope: 'property', name: 'Assign Property Roles', category: 'Role Management' },
      { resource: 'role', action: 'assign', scope: 'organization', name: 'Assign Organization Roles', category: 'Role Management' },

      { resource: 'role', action: 'remove', scope: 'own', name: 'Remove Personal Roles', category: 'Role Management' },
      { resource: 'role', action: 'remove', scope: 'department', name: 'Remove Department Roles', category: 'Role Management' },
      { resource: 'role', action: 'remove', scope: 'property', name: 'Remove Property Roles', category: 'Role Management' },
      { resource: 'role', action: 'remove', scope: 'organization', name: 'Remove Organization Roles', category: 'Role Management' },

      { resource: 'role', action: 'update', scope: 'own', name: 'Update Personal Roles', category: 'Role Management' },
      { resource: 'role', action: 'update', scope: 'department', name: 'Update Department Roles', category: 'Role Management' },
      { resource: 'role', action: 'update', scope: 'property', name: 'Update Property Roles', category: 'Role Management' },
      { resource: 'role', action: 'update', scope: 'organization', name: 'Update Organization Roles', category: 'Role Management' },

      { resource: 'role', action: 'delete', scope: 'own', name: 'Delete Personal Roles', category: 'Role Management' },
      { resource: 'role', action: 'delete', scope: 'department', name: 'Delete Department Roles', category: 'Role Management' },
      { resource: 'role', action: 'delete', scope: 'property', name: 'Delete Property Roles', category: 'Role Management' },
      { resource: 'role', action: 'delete', scope: 'organization', name: 'Delete Organization Roles', category: 'Role Management' },

      { resource: 'role', action: 'read', scope: 'own', name: 'View Personal Roles', category: 'Role Management' },
      { resource: 'role', action: 'read', scope: 'department', name: 'View Department Roles', category: 'Role Management' },
      { resource: 'role', action: 'read', scope: 'property', name: 'View Property Roles', category: 'Role Management' },
      { resource: 'role', action: 'read', scope: 'organization', name: 'View Organization Roles', category: 'Role Management' },
      { resource: 'role', action: 'read', scope: 'all', name: 'View All Roles', category: 'Role Management' },

      // Additional UI permissions for common patterns
      { resource: 'permission', action: 'read', scope: 'own', name: 'View Personal Permissions', category: 'Permission Management' },
      { resource: 'permission', action: 'read', scope: 'department', name: 'View Department Permissions', category: 'Permission Management' },
      { resource: 'permission', action: 'read', scope: 'property', name: 'View Property Permissions', category: 'Permission Management' },
      { resource: 'permission', action: 'read', scope: 'organization', name: 'View Organization Permissions', category: 'Permission Management' },
      { resource: 'permission', action: 'read', scope: 'all', name: 'View All Permissions', category: 'Permission Management' },

      // User role assignment permissions
      { resource: 'user_role', action: 'create', scope: 'own', name: 'Assign Own Roles', category: 'User Management' },
      { resource: 'user_role', action: 'create', scope: 'department', name: 'Assign Department User Roles', category: 'User Management' },
      { resource: 'user_role', action: 'create', scope: 'property', name: 'Assign Property User Roles', category: 'User Management' },
      { resource: 'user_role', action: 'create', scope: 'organization', name: 'Assign Organization User Roles', category: 'User Management' },

      { resource: 'user_role', action: 'delete', scope: 'own', name: 'Remove Own Roles', category: 'User Management' },
      { resource: 'user_role', action: 'delete', scope: 'department', name: 'Remove Department User Roles', category: 'User Management' },
      { resource: 'user_role', action: 'delete', scope: 'property', name: 'Remove Property User Roles', category: 'User Management' },
      { resource: 'user_role', action: 'delete', scope: 'organization', name: 'Remove Organization User Roles', category: 'User Management' },

      { resource: 'user_role', action: 'read', scope: 'own', name: 'View Own Role Assignments', category: 'User Management' },
      { resource: 'user_role', action: 'read', scope: 'department', name: 'View Department Role Assignments', category: 'User Management' },
      { resource: 'user_role', action: 'read', scope: 'property', name: 'View Property Role Assignments', category: 'User Management' },
      { resource: 'user_role', action: 'read', scope: 'organization', name: 'View Organization Role Assignments', category: 'User Management' },
    ];

    console.log(`📝 Creating ${uiPermissions.length} UI permissions...`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const permissionData of uiPermissions) {
      try {
        const result = await prisma.permission.upsert({
          where: {
            resource_action_scope: {
              resource: permissionData.resource,
              action: permissionData.action,
              scope: permissionData.scope,
            },
          },
          create: {
            resource: permissionData.resource,
            action: permissionData.action,
            scope: permissionData.scope,
            name: permissionData.name,
            category: permissionData.category,
            description: `UI permission for ${permissionData.name.toLowerCase()}`,
            isSystem: true,
          },
          update: {
            name: permissionData.name,
            category: permissionData.category,
            description: `UI permission for ${permissionData.name.toLowerCase()}`,
            isSystem: true,
          },
        });

        if (result) {
          createdCount++;
          console.log(`✅ ${permissionData.resource}.${permissionData.action}.${permissionData.scope}`);
        } else {
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to create permission ${permissionData.resource}.${permissionData.action}.${permissionData.scope}:`, error.message);
      }
    }

    console.log(`\n🎉 UI permissions seeding completed!`);
    console.log(`📊 Created: ${createdCount} permissions`);
    console.log(`🔄 Updated: ${updatedCount} permissions`);

    // Now assign all permissions to Platform Administrator role
    console.log(`\n🔑 Assigning all permissions to Platform Administrator role...`);

    // Find Platform Administrator role
    const platformAdminRole = await prisma.customRole.findFirst({
      where: {
        name: 'Platform Administrator',
        isSystemRole: true,
      },
    });

    if (!platformAdminRole) {
      console.log('⚠️  Platform Administrator role not found, skipping permission assignment');
    } else {
      // Get all permissions
      const allPermissions = await prisma.permission.findMany();
      let assignedCount = 0;

      for (const permission of allPermissions) {
        try {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: platformAdminRole.id,
                permissionId: permission.id,
              },
            },
            create: {
              roleId: platformAdminRole.id,
              permissionId: permission.id,
              granted: true,
            },
            update: {
              granted: true,
            },
          });
          assignedCount++;
        } catch (error) {
          console.error(`❌ Failed to assign permission ${permission.resource}.${permission.action}.${permission.scope} to Platform Administrator:`, error.message);
        }
      }

      console.log(`✅ Assigned ${assignedCount} permissions to Platform Administrator role`);
    }

    console.log('\n🌟 UI permissions seed completed successfully!');
  } catch (error) {
    console.error('❌ UI permissions seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main()
  .then(() => {
    console.log('✅ UI permissions seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 UI permissions seed script failed:', error);
    process.exit(1);
  });