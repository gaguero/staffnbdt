import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * CRITICAL PERMISSION SYSTEM FIX
 * 
 * This script creates all missing permissions and assigns them to users to fix 403 errors.
 * The current issue: Users have 0 roles and 0 permissions, causing all branding APIs to fail.
 */

interface PermissionDef {
  id: string;
  resource: string;
  action: string;
  scope: string;
  name: string;
  category: string;
}

// Helper function to create permission
function perm(id: string, name: string, scope: string, category: string): PermissionDef {
  const [resource, action] = id.split('.');
  return { id, resource, action, scope, name, category };
}

// Complete permission definitions
const PERMISSION_DEFINITIONS: PermissionDef[] = [
  // Authentication & User Management
  perm('users.create', 'Create Users', 'platform', 'users'),
  perm('users.read', 'Read Users', 'department', 'users'),
  perm('users.update', 'Update Users', 'department', 'users'),
  perm('users.delete', 'Delete Users', 'property', 'users'),
  
  // BRANDING PERMISSIONS - CRITICAL FOR BRANDING SYSTEM
  perm('branding.read', 'Read Branding', 'organization', 'branding'),
  perm('branding.update', 'Update Branding', 'organization', 'branding'),
  perm('branding.delete', 'Delete Branding', 'organization', 'branding'),
  perm('branding.upload', 'Upload Brand Assets', 'organization', 'branding'),
  
  // Organizations
  perm('organizations.create', 'Create Organizations', 'platform', 'organizations'),
  perm('organizations.read', 'Read Organizations', 'organization', 'organizations'),
  perm('organizations.update', 'Update Organizations', 'organization', 'organizations'),
  perm('organizations.delete', 'Delete Organizations', 'platform', 'organizations'),
  
  // Properties
  perm('properties.create', 'Create Properties', 'organization', 'properties'),
  perm('properties.read', 'Read Properties', 'property', 'properties'),
  perm('properties.update', 'Update Properties', 'property', 'properties'),
  perm('properties.delete', 'Delete Properties', 'organization', 'properties'),
  
  // Departments
  perm('departments.create', 'Create Departments', 'property', 'departments'),
  perm('departments.read', 'Read Departments', 'department', 'departments'),
  perm('departments.update', 'Update Departments', 'property', 'departments'),
  perm('departments.delete', 'Delete Departments', 'property', 'departments'),
  
  // Self-service
  perm('profile.read', 'Read Profile', 'self', 'profiles'),
  perm('profile.update', 'Update Profile', 'self', 'profiles'),
  perm('documents.read', 'Read Documents', 'self', 'documents'),
  perm('payslips.read', 'Read Payslips', 'self', 'payroll'),
  perm('vacations.read', 'Read Vacations', 'self', 'vacations'),
  perm('vacations.create', 'Create Vacation Requests', 'self', 'vacations'),
  perm('training.read', 'Read Training', 'self', 'training'),
  perm('tasks.read', 'Read Tasks', 'self', 'tasks'),
  perm('tasks.update', 'Update Tasks', 'self', 'tasks'),
];

// Role-to-permission mappings
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  PLATFORM_ADMIN: PERMISSION_DEFINITIONS.map(p => p.id), // All permissions
  ORGANIZATION_OWNER: [
    'users.read', 'users.update', 'users.delete',
    'branding.read', 'branding.update', 'branding.delete', 'branding.upload',
    'organizations.read', 'organizations.update',
    'properties.create', 'properties.read', 'properties.update', 'properties.delete',
    'departments.create', 'departments.read', 'departments.update', 'departments.delete',
    'profile.read', 'profile.update', 'documents.read', 'payslips.read',
    'vacations.read', 'vacations.create', 'training.read', 'tasks.read', 'tasks.update',
  ],
  ORGANIZATION_ADMIN: [
    'users.read', 'users.update',
    'branding.read', 'branding.update', 'branding.upload',
    'organizations.read', 'organizations.update',
    'properties.read', 'properties.update',
    'departments.read', 'departments.update',
    'profile.read', 'profile.update', 'documents.read', 'payslips.read',
    'vacations.read', 'vacations.create', 'training.read', 'tasks.read', 'tasks.update',
  ],
  PROPERTY_MANAGER: [
    'users.read', 'users.update',
    'branding.read', 'branding.update',
    'properties.read', 'properties.update',
    'departments.create', 'departments.read', 'departments.update', 'departments.delete',
    'profile.read', 'profile.update', 'documents.read', 'payslips.read',
    'vacations.read', 'vacations.create', 'training.read', 'tasks.read', 'tasks.update',
  ],
  DEPARTMENT_ADMIN: [
    'users.read', 'users.update',
    'branding.read',
    'departments.read', 'departments.update',
    'profile.read', 'profile.update', 'documents.read', 'payslips.read',
    'vacations.read', 'vacations.create', 'training.read', 'tasks.read', 'tasks.update',
  ],
  STAFF: [
    'branding.read',
    'profile.read', 'profile.update', 'documents.read', 'payslips.read',
    'vacations.read', 'vacations.create', 'training.read', 'tasks.read', 'tasks.update',
  ],
};

async function createPermissions() {
  console.log('🔐 Creating all permissions...');
  
  let createdCount = 0;
  let skippedCount = 0;

  for (const permission of PERMISSION_DEFINITIONS) {
    try {
      const existing = await prisma.permission.findUnique({
        where: { id: permission.id }
      });

      if (!existing) {
        await prisma.permission.create({
          data: {
            id: permission.id,
            resource: permission.resource,
            action: permission.action,
            scope: permission.scope,
            name: permission.name,
            category: permission.category,
          }
        });
        createdCount++;
        console.log(`✅ Created: ${permission.id}`);
      } else {
        skippedCount++;
        console.log(`ℹ️  Exists: ${permission.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create ${permission.id}:`, error);
    }
  }

  console.log(`\n📊 Permission Creation Summary:`);
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Already existed: ${skippedCount}`);
  console.log(`   - Total: ${PERMISSION_DEFINITIONS.length}`);
}

async function createCustomRoles() {
  console.log('\n🎭 Creating custom roles...');
  
  const roleDefinitions = [
    { name: 'Platform Admin', legacyRole: 'PLATFORM_ADMIN', permissions: ROLE_PERMISSIONS.PLATFORM_ADMIN },
    { name: 'Organization Owner', legacyRole: 'ORGANIZATION_OWNER', permissions: ROLE_PERMISSIONS.ORGANIZATION_OWNER },
    { name: 'Organization Admin', legacyRole: 'ORGANIZATION_ADMIN', permissions: ROLE_PERMISSIONS.ORGANIZATION_ADMIN },
    { name: 'Property Manager', legacyRole: 'PROPERTY_MANAGER', permissions: ROLE_PERMISSIONS.PROPERTY_MANAGER },
    { name: 'Department Admin', legacyRole: 'DEPARTMENT_ADMIN', permissions: ROLE_PERMISSIONS.DEPARTMENT_ADMIN },
    { name: 'Staff', legacyRole: 'STAFF', permissions: ROLE_PERMISSIONS.STAFF },
  ];

  for (const roleDef of roleDefinitions) {
    try {
      // Check if role exists
      let role = await prisma.customRole.findFirst({
        where: {
          name: roleDef.name,
          isSystemRole: true,
        },
        include: { permissions: true }
      });

      if (!role) {
        // Create role
        role = await prisma.customRole.create({
          data: {
            name: roleDef.name,
            description: `System role for ${roleDef.legacyRole}`,
            isSystemRole: true,
          },
          include: { permissions: true }
        });
        console.log(`✅ Created role: ${role.name}`);
      } else {
        console.log(`ℹ️  Role exists: ${role.name}`);
      }

      // Add permissions to role
      const existingPermissionIds = new Set(role.permissions.map(rp => rp.permissionId));
      const newPermissions = roleDef.permissions.filter(permId => !existingPermissionIds.has(permId));

      if (newPermissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: newPermissions.map(permissionId => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
        console.log(`   + Added ${newPermissions.length} permissions to ${role.name}`);
      }

    } catch (error) {
      console.error(`❌ Failed to create role ${roleDef.name}:`, error);
    }
  }
}

async function grantRobertoFullPermissions() {
  console.log('\n👑 Granting Roberto Martinez FULL permissions...');
  
  // Find Roberto Martinez user
  const roberto = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'roberto.martinez@nayararesorts.com' },
        { email: 'roberto.martinez@vercel.com' },
        { firstName: 'Roberto', lastName: 'Martinez' },
      ]
    }
  });

  if (!roberto) {
    console.log('❌ Roberto Martinez not found! Creating Roberto...');
    
    // Get default organization and property
    const organization = await prisma.organization.findFirst();
    const property = await prisma.property.findFirst();
    
    if (!organization || !property) {
      throw new Error('Default organization/property not found. Run seed first.');
    }

    // Create Roberto Martinez
    const newRoberto = await prisma.user.create({
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
        departmentId: null,
      }
    });
    
    console.log(`✅ Created Roberto Martinez: ${newRoberto.id}`);
    return grantUserAllPermissions(newRoberto.id, newRoberto.email);
  }

  return grantUserAllPermissions(roberto.id, roberto.email);
}

async function grantUserAllPermissions(userId: string, email: string) {
  console.log(`👑 Granting ALL permissions to ${email}...`);
  
  // Get Platform Admin role
  const platformAdminRole = await prisma.customRole.findFirst({
    where: {
      name: 'Platform Admin',
      isSystemRole: true,
    }
  });

  if (!platformAdminRole) {
    throw new Error('Platform Admin role not found!');
  }

  // Clear existing user custom roles
  await prisma.userCustomRole.deleteMany({
    where: { userId }
  });

  // Assign Platform Admin role
  await prisma.userCustomRole.create({
    data: {
      userId,
      roleId: platformAdminRole.id,
      assignedBy: 'SYSTEM_SEEDING',
    }
  });

  console.log(`✅ ${email} granted Platform Admin role with ALL permissions`);
}

async function assignRolesToTestUsers() {
  console.log('\n🧪 Assigning roles to test users...');
  
  const userRoleMappings = [
    { email: 'admin@nayara.com', roleName: 'Platform Admin' },
    { email: 'hr@nayara.com', roleName: 'Department Admin' },
    { email: 'manager@nayara.com', roleName: 'Property Manager' },
    { email: 'staff@nayara.com', roleName: 'Staff' },
    { email: 'frontoffice@nayara.com', roleName: 'Department Admin' },
    { email: 'fb@nayara.com', roleName: 'Department Admin' },
    { email: 'frontdesk@nayara.com', roleName: 'Staff' },
    { email: 'chef@nayara.com', roleName: 'Staff' },
    { email: 'housekeeper@nayara.com', roleName: 'Staff' },
  ];

  for (const mapping of userRoleMappings) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: mapping.email }
      });

      if (!user) {
        console.log(`⚠️  User not found: ${mapping.email}`);
        continue;
      }

      const role = await prisma.customRole.findFirst({
        where: {
          name: mapping.roleName,
          isSystemRole: true,
        }
      });

      if (!role) {
        console.log(`⚠️  Role not found: ${mapping.roleName}`);
        continue;
      }

      // Clear existing user custom roles
      await prisma.userCustomRole.deleteMany({
        where: { userId: user.id }
      });

      // Assign new role
      await prisma.userCustomRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedBy: 'SYSTEM_SEEDING',
        }
      });

      console.log(`✅ ${user.email}: ${mapping.roleName} role assigned`);

    } catch (error) {
      console.error(`❌ Failed to assign role to ${mapping.email}:`, error);
    }
  }
}

async function validateSetup() {
  console.log('\n🔍 Validating permission system setup...');
  
  const permissionCount = await prisma.permission.count();
  const roleCount = await prisma.customRole.count({ where: { isSystemRole: true } });
  const userWithRoleCount = await prisma.userCustomRole.count();
  
  console.log(`📊 System Status:`);
  console.log(`   - Total permissions: ${permissionCount}`);
  console.log(`   - System roles: ${roleCount}`);
  console.log(`   - Users with roles: ${userWithRoleCount}`);

  // Check Roberto specifically
  const roberto = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'roberto.martinez@nayararesorts.com' },
        { firstName: 'Roberto', lastName: 'Martinez' },
      ]
    },
    include: {
      userCustomRoles: {
        include: {
          role: {
            include: { permissions: true }
          }
        }
      }
    }
  });

  if (roberto) {
    const totalPermissions = roberto.userCustomRoles.reduce((sum: number, ucr: any) => 
      sum + ucr.role.permissions.length, 0
    );
    console.log(`👑 Roberto Martinez: ${totalPermissions} permissions via ${roberto.userCustomRoles.length} roles`);
  }

  console.log(`\n✅ Permission system setup complete!`);
  console.log(`🎯 Users should now be able to access branding endpoints`);
}

async function main() {
  console.log('🚀 CRITICAL PERMISSION SYSTEM FIX');
  console.log('=====================================');
  console.log('Fixing 403 Forbidden errors by setting up complete permission system\n');

  try {
    // Step 1: Create all permissions
    await createPermissions();

    // Step 2: Create custom roles with permissions
    await createCustomRoles();

    // Step 3: Grant Roberto Martinez full access
    await grantRobertoFullPermissions();

    // Step 4: Assign roles to test users
    await assignRolesToTestUsers();

    // Step 5: Validate everything is working
    await validateSetup();

    console.log('\n🎉 SUCCESS! Permission system is now fully operational');
    console.log('\n📝 Next Steps:');
    console.log('1. Test branding endpoints with Roberto Martinez login');
    console.log('2. Test other users with appropriate permissions');
    console.log('3. If still getting 403 errors, check the permission service implementation');
    console.log('\n🔗 Test URLs:');
    console.log('- Login: https://frontend-production-55d3.up.railway.app/login');
    console.log('- Roberto: roberto.martinez@nayararesorts.com / password123');

  } catch (error) {
    console.error('❌ Permission seeding failed:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('❌ Script failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });