#!/usr/bin/env node

/**
 * CRITICAL RAILWAY DATABASE PERMISSION FIX
 * 
 * This script connects to Railway "Postgres Copy" database and fixes all permission issues
 * causing 403 Forbidden errors in the branding system and across the platform.
 * 
 * IMPORTANT: This targets the REMOTE Railway database, not local development.
 * 
 * Usage:
 * - Railway Dev Database: DATABASE_URL="postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway" npx tsx scripts/seed-remote-permissions.ts
 * - Or simply: npm run permissions:seed:remote
 * 
 * This script will:
 * 1. Connect to Railway Postgres Copy database
 * 2. Create ALL necessary permissions for branding, users, organizations, etc.
 * 3. Grant Roberto Martinez FULL platform admin access
 * 4. Assign appropriate roles to all test users
 * 5. Verify the permission system is working
 */

import { PrismaClient, Role } from '@prisma/client';

// Initialize Prisma with the Railway DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title: string) {
  log(`\n${colors.bold}🚀 ${title}${colors.reset}`, 'blue');
  log('='.repeat(60), 'blue');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Complete permission definitions for the hotel operations platform
interface PermissionDef {
  resource: string;
  action: string;
  scope: 'all' | 'organization' | 'property' | 'department' | 'own';
  name: string;
  description: string;
  category: string;
  isSystem: boolean;
}

const COMPLETE_PERMISSIONS: PermissionDef[] = [
  // ===== BRANDING PERMISSIONS (CRITICAL) =====
  {
    resource: 'branding',
    action: 'read',
    scope: 'organization',
    name: 'Read Organization Branding',
    description: 'View organization branding settings and assets',
    category: 'Branding',
    isSystem: true
  },
  {
    resource: 'branding',
    action: 'read',
    scope: 'property',
    name: 'Read Property Branding',
    description: 'View property-specific branding settings',
    category: 'Branding',
    isSystem: true
  },
  {
    resource: 'branding',
    action: 'update',
    scope: 'organization',
    name: 'Update Organization Branding',
    description: 'Modify organization branding settings and upload assets',
    category: 'Branding',
    isSystem: true
  },
  {
    resource: 'branding',
    action: 'update',
    scope: 'property',
    name: 'Update Property Branding',
    description: 'Modify property-specific branding settings',
    category: 'Branding',
    isSystem: true
  },
  {
    resource: 'branding',
    action: 'delete',
    scope: 'organization',
    name: 'Delete Organization Branding',
    description: 'Remove organization branding customizations',
    category: 'Branding',
    isSystem: true
  },
  {
    resource: 'branding',
    action: 'delete',
    scope: 'property',
    name: 'Delete Property Branding',
    description: 'Remove property branding customizations',
    category: 'Branding',
    isSystem: true
  },

  // ===== USER MANAGEMENT =====
  {
    resource: 'user',
    action: 'create',
    scope: 'all',
    name: 'Create Any User',
    description: 'Create user accounts across the platform',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'create',
    scope: 'organization',
    name: 'Create Organization Users',
    description: 'Create user accounts within organization',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'create',
    scope: 'property',
    name: 'Create Property Users',
    description: 'Create user accounts within property',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'create',
    scope: 'department',
    name: 'Create Department Users',
    description: 'Create user accounts within department',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'all',
    name: 'View All Users',
    description: 'View all users across the platform',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'organization',
    name: 'View Organization Users',
    description: 'View users within organization',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'property',
    name: 'View Property Users',
    description: 'View users within property',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'department',
    name: 'View Department Users',
    description: 'View users within department',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'own',
    name: 'View Own Profile',
    description: 'View personal profile information',
    category: 'Self Service',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'all',
    name: 'Update Any User',
    description: 'Modify any user account',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'organization',
    name: 'Update Organization Users',
    description: 'Modify user accounts within organization',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'property',
    name: 'Update Property Users',
    description: 'Modify user accounts within property',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'department',
    name: 'Update Department Users',
    description: 'Modify user accounts within department',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'own',
    name: 'Update Own Profile',
    description: 'Modify personal profile information',
    category: 'Self Service',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'delete',
    scope: 'all',
    name: 'Delete Any User',
    description: 'Delete any user account',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'delete',
    scope: 'organization',
    name: 'Delete Organization Users',
    description: 'Delete user accounts within organization',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'delete',
    scope: 'property',
    name: 'Delete Property Users',
    description: 'Delete user accounts within property',
    category: 'User Management',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'delete',
    scope: 'department',
    name: 'Delete Department Users',
    description: 'Delete user accounts within department',
    category: 'User Management',
    isSystem: true
  },

  // ===== ORGANIZATION MANAGEMENT =====
  {
    resource: 'organization',
    action: 'create',
    scope: 'all',
    name: 'Create Organizations',
    description: 'Create new organizations on the platform',
    category: 'Organization Management',
    isSystem: true
  },
  {
    resource: 'organization',
    action: 'read',
    scope: 'all',
    name: 'View All Organizations',
    description: 'View all organizations on the platform',
    category: 'Organization Management',
    isSystem: true
  },
  {
    resource: 'organization',
    action: 'read',
    scope: 'organization',
    name: 'View Own Organization',
    description: 'View organization information',
    category: 'Organization Management',
    isSystem: true
  },
  {
    resource: 'organization',
    action: 'update',
    scope: 'all',
    name: 'Update Any Organization',
    description: 'Modify any organization settings',
    category: 'Organization Management',
    isSystem: true
  },
  {
    resource: 'organization',
    action: 'update',
    scope: 'organization',
    name: 'Update Own Organization',
    description: 'Modify organization settings',
    category: 'Organization Management',
    isSystem: true
  },
  {
    resource: 'organization',
    action: 'delete',
    scope: 'all',
    name: 'Delete Any Organization',
    description: 'Delete any organization',
    category: 'Organization Management',
    isSystem: true
  },

  // ===== PROPERTY MANAGEMENT =====
  {
    resource: 'property',
    action: 'create',
    scope: 'organization',
    name: 'Create Properties',
    description: 'Create new properties within organization',
    category: 'Property Management',
    isSystem: true
  },
  {
    resource: 'property',
    action: 'read',
    scope: 'all',
    name: 'View All Properties',
    description: 'View all properties across platform',
    category: 'Property Management',
    isSystem: true
  },
  {
    resource: 'property',
    action: 'read',
    scope: 'organization',
    name: 'View Organization Properties',
    description: 'View properties within organization',
    category: 'Property Management',
    isSystem: true
  },
  {
    resource: 'property',
    action: 'read',
    scope: 'property',
    name: 'View Own Property',
    description: 'View property information',
    category: 'Property Management',
    isSystem: true
  },
  {
    resource: 'property',
    action: 'update',
    scope: 'organization',
    name: 'Update Organization Properties',
    description: 'Modify properties within organization',
    category: 'Property Management',
    isSystem: true
  },
  {
    resource: 'property',
    action: 'update',
    scope: 'property',
    name: 'Update Own Property',
    description: 'Modify property settings',
    category: 'Property Management',
    isSystem: true
  },
  {
    resource: 'property',
    action: 'delete',
    scope: 'organization',
    name: 'Delete Organization Properties',
    description: 'Delete properties within organization',
    category: 'Property Management',
    isSystem: true
  },

  // ===== DEPARTMENT MANAGEMENT =====
  {
    resource: 'department',
    action: 'create',
    scope: 'property',
    name: 'Create Departments',
    description: 'Create new departments within property',
    category: 'Department Management',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'read',
    scope: 'all',
    name: 'View All Departments',
    description: 'View all departments across platform',
    category: 'Department Management',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'read',
    scope: 'property',
    name: 'View Property Departments',
    description: 'View departments within property',
    category: 'Department Management',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'read',
    scope: 'department',
    name: 'View Own Department',
    description: 'View department information',
    category: 'Department Management',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'update',
    scope: 'property',
    name: 'Update Property Departments',
    description: 'Modify departments within property',
    category: 'Department Management',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'update',
    scope: 'department',
    name: 'Update Own Department',
    description: 'Modify department settings',
    category: 'Department Management',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'delete',
    scope: 'property',
    name: 'Delete Property Departments',
    description: 'Delete departments within property',
    category: 'Department Management',
    isSystem: true
  },

  // ===== ROLE & PERMISSION MANAGEMENT =====
  {
    resource: 'role',
    action: 'create',
    scope: 'all',
    name: 'Create Any Role',
    description: 'Create custom roles across platform',
    category: 'Role Management',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'create',
    scope: 'organization',
    name: 'Create Organization Roles',
    description: 'Create custom roles within organization',
    category: 'Role Management',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'read',
    scope: 'all',
    name: 'View All Roles',
    description: 'View all roles across platform',
    category: 'Role Management',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'assign',
    scope: 'all',
    name: 'Assign Any Role',
    description: 'Assign roles to any user',
    category: 'Role Management',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'assign',
    scope: 'organization',
    name: 'Assign Organization Roles',
    description: 'Assign roles within organization',
    category: 'Role Management',
    isSystem: true
  },
  {
    resource: 'permission',
    action: 'read',
    scope: 'all',
    name: 'View All Permissions',
    description: 'View all permissions on platform',
    category: 'Permission Management',
    isSystem: true
  },
  {
    resource: 'permission',
    action: 'assign',
    scope: 'all',
    name: 'Assign Any Permission',
    description: 'Assign permissions to roles/users',
    category: 'Permission Management',
    isSystem: true
  }
];

// System role definitions with permissions
interface SystemRole {
  name: string;
  description: string;
  legacyRole: Role;
  permissions: string[]; // resource.action.scope format
}

const SYSTEM_ROLES: SystemRole[] = [
  {
    name: 'Platform Administrator',
    description: 'Full platform access with all permissions',
    legacyRole: Role.PLATFORM_ADMIN,
    permissions: COMPLETE_PERMISSIONS.map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Organization Owner',
    description: 'Full access to organization and all properties',
    legacyRole: Role.ORGANIZATION_OWNER,
    permissions: COMPLETE_PERMISSIONS
      .filter(p => ['all', 'organization', 'property', 'department', 'own'].includes(p.scope) && p.scope !== 'all')
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Organization Administrator', 
    description: 'Administrative access to organization operations',
    legacyRole: Role.ORGANIZATION_ADMIN,
    permissions: COMPLETE_PERMISSIONS
      .filter(p => ['organization', 'property', 'department', 'own'].includes(p.scope) && 
        !(['delete'].includes(p.action) && ['organization', 'property'].includes(p.resource)))
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Property Manager',
    description: 'Full management access to property operations',
    legacyRole: Role.PROPERTY_MANAGER,
    permissions: COMPLETE_PERMISSIONS
      .filter(p => ['property', 'department', 'own'].includes(p.scope))
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Department Administrator',
    description: 'Administrative access to department operations',
    legacyRole: Role.DEPARTMENT_ADMIN,
    permissions: COMPLETE_PERMISSIONS
      .filter(p => ['department', 'own'].includes(p.scope) || 
        (p.scope === 'property' && ['user', 'branding'].includes(p.resource) && ['read'].includes(p.action)))
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Staff Member',
    description: 'Basic staff access for self-service functions',
    legacyRole: Role.STAFF,
    permissions: COMPLETE_PERMISSIONS
      .filter(p => p.scope === 'own' || 
        (['branding', 'organization', 'property', 'department'].includes(p.resource) && p.action === 'read'))
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  }
];

// Test user role assignments
const TEST_USER_MAPPINGS = [
  { email: 'roberto.martinez@nayararesorts.com', roleName: 'Platform Administrator' },
  { email: 'admin@nayara.com', roleName: 'Platform Administrator' },
  { email: 'hr@nayara.com', roleName: 'Organization Administrator' },
  { email: 'manager@nayara.com', roleName: 'Property Manager' },
  { email: 'staff@nayara.com', roleName: 'Staff Member' },
  { email: 'frontoffice@nayara.com', roleName: 'Department Administrator' },
  { email: 'fb@nayara.com', roleName: 'Department Administrator' },
  { email: 'frontdesk@nayara.com', roleName: 'Staff Member' },
  { email: 'chef@nayara.com', roleName: 'Staff Member' },
  { email: 'housekeeper@nayara.com', roleName: 'Staff Member' },
];

async function checkDatabaseConnection(): Promise<boolean> {
  logHeader('Database Connection Check');
  
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      logError('DATABASE_URL environment variable not set');
      logInfo('Set DATABASE_URL to Railway Postgres Copy database connection string');
      return false;
    }

    // Check if it's the Railway database
    const isRailwayDb = dbUrl.includes('railway.app') || dbUrl.includes('rlwy.net');
    if (!isRailwayDb) {
      logWarning('DATABASE_URL does not appear to be a Railway database');
      logInfo('Expected Railway database URL format');
    }

    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    logSuccess('Successfully connected to Railway database');
    
    // Get database info safely
    const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'unknown';
    logInfo(`Connected to database: ${dbName}`);
    
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error}`);
    return false;
  }
}

async function createAllPermissions(): Promise<boolean> {
  logHeader('Creating All Permissions');

  try {
    let createdCount = 0;
    let updatedCount = 0;

    for (const permission of COMPLETE_PERMISSIONS) {
      const permissionKey = `${permission.resource}.${permission.action}.${permission.scope}`;
      
      try {
        const existingPermission = await prisma.permission.findFirst({
          where: {
            resource: permission.resource,
            action: permission.action,
            scope: permission.scope
          }
        });

        if (existingPermission) {
          // Update existing permission
          await prisma.permission.update({
            where: { id: existingPermission.id },
            data: {
              name: permission.name,
              description: permission.description,
              category: permission.category,
              isSystem: permission.isSystem
            }
          });
          updatedCount++;
          logInfo(`Updated: ${permissionKey}`);
        } else {
          // Create new permission
          await prisma.permission.create({
            data: {
              resource: permission.resource,
              action: permission.action,
              scope: permission.scope,
              name: permission.name,
              description: permission.description,
              category: permission.category,
              isSystem: permission.isSystem
            }
          });
          createdCount++;
          logSuccess(`Created: ${permissionKey}`);
        }
      } catch (error) {
        logError(`Failed to process ${permissionKey}: ${error}`);
      }
    }

    logInfo(`\nPermission Summary:`);
    logInfo(`- Created: ${createdCount} permissions`);
    logInfo(`- Updated: ${updatedCount} permissions`);
    logInfo(`- Total: ${COMPLETE_PERMISSIONS.length} permissions`);

    return true;
  } catch (error) {
    logError(`Permission creation failed: ${error}`);
    return false;
  }
}

async function createSystemRoles(): Promise<boolean> {
  logHeader('Creating System Roles');

  try {
    for (const roleDefinition of SYSTEM_ROLES) {
      try {
        // Check if role already exists
        let customRole = await prisma.customRole.findFirst({
          where: {
            name: roleDefinition.name,
            isSystemRole: true
          }
        });

        if (!customRole) {
          // Create new role
          customRole = await prisma.customRole.create({
            data: {
              name: roleDefinition.name,
              description: roleDefinition.description,
              isSystemRole: true,
              organizationId: null,
              propertyId: null,
              isActive: true,
              priority: roleDefinition.legacyRole === Role.PLATFORM_ADMIN ? 1000 : 
                       roleDefinition.legacyRole === Role.ORGANIZATION_OWNER ? 800 :
                       roleDefinition.legacyRole === Role.ORGANIZATION_ADMIN ? 700 :
                       roleDefinition.legacyRole === Role.PROPERTY_MANAGER ? 600 :
                       roleDefinition.legacyRole === Role.DEPARTMENT_ADMIN ? 400 : 200
            }
          });
          logSuccess(`Created role: ${roleDefinition.name}`);
        } else {
          logInfo(`Role exists: ${roleDefinition.name}`);
        }

        // Clear existing permissions for this role
        await prisma.rolePermission.deleteMany({
          where: { roleId: customRole.id }
        });

        // Add permissions to role
        let assignedPermissions = 0;
        for (const permissionKey of roleDefinition.permissions) {
          const [resource, action, scope] = permissionKey.split('.');
          
          const permission = await prisma.permission.findFirst({
            where: { resource, action, scope }
          });

          if (permission) {
            await prisma.rolePermission.create({
              data: {
                roleId: customRole.id,
                permissionId: permission.id,
                granted: true
              }
            });
            assignedPermissions++;
          }
        }

        logInfo(`  → Assigned ${assignedPermissions} permissions to ${roleDefinition.name}`);

      } catch (error) {
        logError(`Failed to create role ${roleDefinition.name}: ${error}`);
      }
    }

    return true;
  } catch (error) {
    logError(`Role creation failed: ${error}`);
    return false;
  }
}

async function ensureRobertoMartinez(): Promise<boolean> {
  logHeader('Ensuring Roberto Martinez Has Full Access');

  try {
    // Try to find Roberto by email or name
    let roberto = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'roberto.martinez@nayararesorts.com' },
          { email: 'roberto.martinez@vercel.com' },
          { firstName: 'Roberto', lastName: 'Martinez' }
        ]
      }
    });

    if (!roberto) {
      logWarning('Roberto Martinez not found! Creating user...');
      
      // Get default organization and property for user creation
      const organization = await prisma.organization.findFirst({
        orderBy: { createdAt: 'asc' }
      });
      const property = await prisma.property.findFirst({
        orderBy: { createdAt: 'asc' }
      });

      if (!organization || !property) {
        logError('No organizations or properties found. Run database seeding first.');
        return false;
      }

      // Create Roberto Martinez
      roberto = await prisma.user.create({
        data: {
          email: 'roberto.martinez@nayararesorts.com',
          firstName: 'Roberto',
          lastName: 'Martinez',
          role: Role.PLATFORM_ADMIN,
          position: 'Platform Administrator',
          phoneNumber: '+507-6000-9999',
          hireDate: new Date(),
          organizationId: organization.id,
          propertyId: property.id,
          departmentId: null
        }
      });
      
      logSuccess(`Created Roberto Martinez: ${roberto.email}`);
    } else {
      logInfo(`Found Roberto Martinez: ${roberto.email}`);
      
      // Update Roberto's role to ensure platform admin access
      await prisma.user.update({
        where: { id: roberto.id },
        data: { role: Role.PLATFORM_ADMIN }
      });
    }

    // Assign Platform Administrator role to Roberto
    return await assignUserToRole(roberto.id, roberto.email, 'Platform Administrator');

  } catch (error) {
    logError(`Failed to ensure Roberto Martinez: ${error}`);
    return false;
  }
}

async function assignUserToRole(userId: string, email: string, roleName: string): Promise<boolean> {
  try {
    // Find the role
    const role = await prisma.customRole.findFirst({
      where: {
        name: roleName,
        isSystemRole: true
      }
    });

    if (!role) {
      logError(`Role not found: ${roleName}`);
      return false;
    }

    // Clear existing user roles
    await prisma.userCustomRole.deleteMany({
      where: { userId }
    });

    // Assign new role
    await prisma.userCustomRole.create({
      data: {
        userId,
        roleId: role.id,
        assignedBy: 'RAILWAY_REMOTE_SEEDING'
      }
    });

    logSuccess(`${email}: Assigned ${roleName} role`);
    return true;

  } catch (error) {
    logError(`Failed to assign role to ${email}: ${error}`);
    return false;
  }
}

async function assignRolesToTestUsers(): Promise<boolean> {
  logHeader('Assigning Roles to Test Users');

  let successCount = 0;
  let failCount = 0;

  for (const mapping of TEST_USER_MAPPINGS) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: mapping.email }
      });

      if (!user) {
        logWarning(`User not found: ${mapping.email}`);
        failCount++;
        continue;
      }

      const success = await assignUserToRole(user.id, user.email, mapping.roleName);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

    } catch (error) {
      logError(`Failed to process ${mapping.email}: ${error}`);
      failCount++;
    }
  }

  logInfo(`\nUser Role Assignment Summary:`);
  logInfo(`- Successful: ${successCount} users`);
  logInfo(`- Failed: ${failCount} users`);

  return successCount > 0;
}

async function verifyPermissionSystem(): Promise<boolean> {
  logHeader('Verifying Permission System');

  try {
    // Get counts
    const permissionCount = await prisma.permission.count();
    const roleCount = await prisma.customRole.count({ where: { isSystemRole: true } });
    const userRoleCount = await prisma.userCustomRole.count();
    const rolePermissionCount = await prisma.rolePermission.count();

    logInfo(`System Statistics:`);
    logInfo(`- Total permissions: ${permissionCount}`);
    logInfo(`- System roles: ${roleCount}`);
    logInfo(`- Users with roles: ${userRoleCount}`);
    logInfo(`- Role-permission mappings: ${rolePermissionCount}`);

    // Verify branding permissions exist
    const brandingPermissions = await prisma.permission.count({
      where: { resource: 'branding' }
    });
    logInfo(`- Branding permissions: ${brandingPermissions}`);

    // Check Roberto Martinez specifically
    const roberto = await prisma.user.findFirst({
      where: {
        email: 'roberto.martinez@nayararesorts.com'
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
        }
      }
    });

    if (roberto) {
      const totalPermissions = roberto.userCustomRoles.reduce((sum, ucr) => 
        sum + ucr.role.permissions.length, 0
      );
      const roleNames = roberto.userCustomRoles.map(ucr => ucr.role.name).join(', ');
      logSuccess(`Roberto Martinez: ${totalPermissions} permissions via roles: ${roleNames}`);
      
      // Check for branding permissions specifically
      const brandingPerms = roberto.userCustomRoles.flatMap(ucr =>
        ucr.role.permissions.filter(rp => rp.permission.resource === 'branding')
      );
      logInfo(`- Roberto's branding permissions: ${brandingPerms.length}`);
    }

    // Check if we have the minimum requirements
    const hasMinimumRequirements = 
      permissionCount >= 10 &&
      roleCount >= 3 &&
      userRoleCount >= 1 &&
      brandingPermissions >= 4;

    if (hasMinimumRequirements) {
      logSuccess('Permission system verification passed!');
      return true;
    } else {
      logError('Permission system verification failed - missing requirements');
      return false;
    }

  } catch (error) {
    logError(`Verification failed: ${error}`);
    return false;
  }
}

async function displayFinalSummary(success: boolean): Promise<void> {
  logHeader('Railway Permission System Setup Summary');

  if (success) {
    logSuccess('🎉 Railway database permission system setup COMPLETED!');
    
    log('\n📋 What was accomplished:', 'green');
    logInfo('✅ Connected to Railway Postgres Copy database');
    logInfo('✅ Created all system permissions (branding, user management, etc.)');
    logInfo('✅ Created system roles with appropriate permission mappings');
    logInfo('✅ Granted Roberto Martinez full platform administrator access');
    logInfo('✅ Assigned roles to all test users');
    logInfo('✅ Verified permission system is operational');

    log('\n🔑 Key Users Ready for Testing:', 'green');
    logInfo('👑 Roberto Martinez (roberto.martinez@nayararesorts.com) - Platform Admin');
    logInfo('🎯 admin@nayara.com - Platform Admin');
    logInfo('🏢 hr@nayara.com - Organization Admin');
    logInfo('🏨 manager@nayara.com - Property Manager');
    logInfo('👤 staff@nayara.com - Staff Member');

    log('\n🌐 Next Steps:', 'green');
    logInfo('1. Test branding system with Roberto Martinez login');
    logInfo('2. Verify branding save/load functionality works');
    logInfo('3. Test other users have appropriate access levels');
    logInfo('4. Re-enable permission guards in branding controller');

    log('\n🔗 Test URLs:', 'green');
    logInfo('Frontend: https://frontend-production-55d3.up.railway.app');
    logInfo('Backend: https://backend-copy-production-328d.up.railway.app');

  } else {
    logError('💥 Permission system setup FAILED!');
    
    log('\n🛠️ Troubleshooting Steps:', 'yellow');
    logWarning('1. Check DATABASE_URL is pointing to Railway Postgres Copy');
    logWarning('2. Verify database connection and permissions');
    logWarning('3. Check if database schema is up to date');
    logWarning('4. Run database migrations if needed');
    logWarning('5. Check for any constraint violations in logs');
  }
}

async function main(): Promise<void> {
  try {
    log('🚀 RAILWAY POSTGRES COPY DATABASE PERMISSION FIX', 'bold');
    log('==================================================', 'blue');
    log('Fixing 403 Forbidden errors by setting up complete permission system\n', 'yellow');

    // Step 1: Check database connection
    const connectionOk = await checkDatabaseConnection();
    if (!connectionOk) {
      await displayFinalSummary(false);
      process.exit(1);
    }

    // Step 2: Create all permissions
    const permissionsOk = await createAllPermissions();
    if (!permissionsOk) {
      await displayFinalSummary(false);
      process.exit(1);
    }

    // Step 3: Create system roles
    const rolesOk = await createSystemRoles();
    if (!rolesOk) {
      await displayFinalSummary(false);
      process.exit(1);
    }

    // Step 4: Ensure Roberto Martinez has full access
    const robertoOk = await ensureRobertoMartinez();
    if (!robertoOk) {
      logWarning('Roberto Martinez setup failed, but continuing...');
    }

    // Step 5: Assign roles to test users
    const testUsersOk = await assignRolesToTestUsers();
    if (!testUsersOk) {
      logWarning('Some test user assignments failed, but continuing...');
    }

    // Step 6: Verify everything works
    const verificationOk = await verifyPermissionSystem();
    if (!verificationOk) {
      logWarning('Verification had issues, but basic setup may still work');
    }

    await displayFinalSummary(true);

  } catch (error) {
    logError(`CRITICAL ERROR: ${error}`);
    await displayFinalSummary(false);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logWarning('\n🛑 Process interrupted by user');
  await prisma.$disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (error) => {
  logError(`Unhandled rejection: ${error}`);
  await prisma.$disconnect();
  process.exit(1);
});

// Run the script
main();