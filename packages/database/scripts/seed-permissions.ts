import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Permission format: resource.action.scope
// Scopes: all, organization, property, department, own
interface PermissionDefinition {
  resource: string;
  action: string;
  scope: 'all' | 'organization' | 'property' | 'department' | 'own';
  name: string;
  description: string;
  category: string;
  isSystem: boolean;
}

// Core system permissions for the Hotel Operations Hub
const PERMISSIONS: PermissionDefinition[] = [
  // ===== USER MANAGEMENT =====
  {
    resource: 'user',
    action: 'create',
    scope: 'organization',
    name: 'Create Users in Organization',
    description: 'Create new user accounts within the organization',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'create',
    scope: 'property',
    name: 'Create Users in Property',
    description: 'Create new user accounts within the property',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'create',
    scope: 'department',
    name: 'Create Users in Department',
    description: 'Create new user accounts within the department',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'all',
    name: 'View All Users',
    description: 'View all users across the platform',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'organization',
    name: 'View Organization Users',
    description: 'View users within the organization',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'property',
    name: 'View Property Users',
    description: 'View users within the property',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'department',
    name: 'View Department Users',
    description: 'View users within the department',
    category: 'HR',
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
    description: 'Modify any user account across the platform',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'organization',
    name: 'Update Organization Users',
    description: 'Modify user accounts within the organization',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'property',
    name: 'Update Property Users',
    description: 'Modify user accounts within the property',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'department',
    name: 'Update Department Users',
    description: 'Modify user accounts within the department',
    category: 'HR',
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
    description: 'Delete any user account across the platform',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'delete',
    scope: 'organization',
    name: 'Delete Organization Users',
    description: 'Delete user accounts within the organization',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'delete',
    scope: 'property',
    name: 'Delete Property Users',
    description: 'Delete user accounts within the property',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'user',
    action: 'delete',
    scope: 'department',
    name: 'Delete Department Users',
    description: 'Delete user accounts within the department',
    category: 'HR',
    isSystem: true
  },

  // ===== DEPARTMENT MANAGEMENT =====
  {
    resource: 'department',
    action: 'create',
    scope: 'property',
    name: 'Create Departments',
    description: 'Create new departments within the property',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'read',
    scope: 'all',
    name: 'View All Departments',
    description: 'View all departments across the platform',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'read',
    scope: 'organization',
    name: 'View Organization Departments',
    description: 'View departments within the organization',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'read',
    scope: 'property',
    name: 'View Property Departments',
    description: 'View departments within the property',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'update',
    scope: 'property',
    name: 'Update Property Departments',
    description: 'Modify departments within the property',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'department',
    action: 'delete',
    scope: 'property',
    name: 'Delete Property Departments',
    description: 'Delete departments within the property',
    category: 'Admin',
    isSystem: true
  },

  // ===== ROLE & PERMISSION MANAGEMENT =====
  {
    resource: 'role',
    action: 'create',
    scope: 'organization',
    name: 'Create Organization Roles',
    description: 'Create custom roles within the organization',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'create',
    scope: 'property',
    name: 'Create Property Roles',
    description: 'Create custom roles within the property',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'read',
    scope: 'all',
    name: 'View All Roles',
    description: 'View all roles across the platform',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'read',
    scope: 'organization',
    name: 'View Organization Roles',
    description: 'View roles within the organization',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'read',
    scope: 'property',
    name: 'View Property Roles',
    description: 'View roles within the property',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'update',
    scope: 'organization',
    name: 'Update Organization Roles',
    description: 'Modify roles within the organization',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'update',
    scope: 'property',
    name: 'Update Property Roles',
    description: 'Modify roles within the property',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'delete',
    scope: 'organization',
    name: 'Delete Organization Roles',
    description: 'Delete roles within the organization',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'delete',
    scope: 'property',
    name: 'Delete Property Roles',
    description: 'Delete roles within the property',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'assign',
    scope: 'organization',
    name: 'Assign Organization Roles',
    description: 'Assign roles to users within the organization',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'assign',
    scope: 'property',
    name: 'Assign Property Roles',
    description: 'Assign roles to users within the property',
    category: 'Admin',
    isSystem: true
  },
  {
    resource: 'role',
    action: 'assign',
    scope: 'department',
    name: 'Assign Department Roles',
    description: 'Assign roles to users within the department',
    category: 'Admin',
    isSystem: true
  },

  // ===== PAYROLL MANAGEMENT =====
  {
    resource: 'payslip',
    action: 'create',
    scope: 'property',
    name: 'Create Payslips',
    description: 'Generate payslips for property staff',
    category: 'Payroll',
    isSystem: true
  },
  {
    resource: 'payslip',
    action: 'read',
    scope: 'all',
    name: 'View All Payslips',
    description: 'View all payslips across the platform',
    category: 'Payroll',
    isSystem: true
  },
  {
    resource: 'payslip',
    action: 'read',
    scope: 'property',
    name: 'View Property Payslips',
    description: 'View payslips within the property',
    category: 'Payroll',
    isSystem: true
  },
  {
    resource: 'payslip',
    action: 'read',
    scope: 'department',
    name: 'View Department Payslips',
    description: 'View payslips within the department',
    category: 'Payroll',
    isSystem: true
  },
  {
    resource: 'payslip',
    action: 'read',
    scope: 'own',
    name: 'View Own Payslips',
    description: 'View personal payslip history',
    category: 'Self Service',
    isSystem: true
  },
  {
    resource: 'payslip',
    action: 'import',
    scope: 'property',
    name: 'Import Payroll Data',
    description: 'Import payroll data from external systems',
    category: 'Payroll',
    isSystem: true
  },

  // ===== VACATION MANAGEMENT =====
  {
    resource: 'vacation',
    action: 'create',
    scope: 'own',
    name: 'Request Vacation',
    description: 'Submit vacation requests',
    category: 'Self Service',
    isSystem: true
  },
  {
    resource: 'vacation',
    action: 'read',
    scope: 'all',
    name: 'View All Vacations',
    description: 'View all vacation requests across the platform',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'vacation',
    action: 'read',
    scope: 'property',
    name: 'View Property Vacations',
    description: 'View vacation requests within the property',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'vacation',
    action: 'read',
    scope: 'department',
    name: 'View Department Vacations',
    description: 'View vacation requests within the department',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'vacation',
    action: 'read',
    scope: 'own',
    name: 'View Own Vacations',
    description: 'View personal vacation history',
    category: 'Self Service',
    isSystem: true
  },
  {
    resource: 'vacation',
    action: 'approve',
    scope: 'property',
    name: 'Approve Property Vacations',
    description: 'Approve vacation requests within the property',
    category: 'HR',
    isSystem: true
  },
  {
    resource: 'vacation',
    action: 'approve',
    scope: 'department',
    name: 'Approve Department Vacations',
    description: 'Approve vacation requests within the department',
    category: 'HR',
    isSystem: true
  },

  // ===== FRONT DESK OPERATIONS =====
  {
    resource: 'guest',
    action: 'create',
    scope: 'property',
    name: 'Register Guests',
    description: 'Register new guests at the property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'read',
    scope: 'property',
    name: 'View Property Guests',
    description: 'View guest information for the property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'guest',
    action: 'update',
    scope: 'property',
    name: 'Update Guest Information',
    description: 'Modify guest profiles and preferences',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'create',
    scope: 'property',
    name: 'Create Reservations',
    description: 'Book new reservations for the property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'read',
    scope: 'property',
    name: 'View Property Reservations',
    description: 'View reservations for the property',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'update',
    scope: 'property',
    name: 'Update Reservations',
    description: 'Modify reservation details',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'checkin',
    scope: 'property',
    name: 'Check-in Guests',
    description: 'Process guest check-in procedures',
    category: 'Front Desk',
    isSystem: true
  },
  {
    resource: 'reservation',
    action: 'checkout',
    scope: 'property',
    name: 'Check-out Guests',
    description: 'Process guest check-out procedures',
    category: 'Front Desk',
    isSystem: true
  },

  // ===== HOUSEKEEPING & MAINTENANCE =====
  {
    resource: 'unit',
    action: 'create',
    scope: 'property',
    name: 'Create Units',
    description: 'Add new accommodation units',
    category: 'Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'read',
    scope: 'property',
    name: 'View Property Units',
    description: 'View units within the property',
    category: 'Operations',
    isSystem: true
  },
  {
    resource: 'unit',
    action: 'update',
    scope: 'property',
    name: 'Update Unit Status',
    description: 'Change unit availability and status',
    category: 'Operations',
    isSystem: true
  },
  {
    resource: 'task',
    action: 'create',
    scope: 'property',
    name: 'Create Tasks',
    description: 'Create maintenance and housekeeping tasks',
    category: 'Operations',
    isSystem: true
  },
  {
    resource: 'task',
    action: 'read',
    scope: 'property',
    name: 'View Property Tasks',
    description: 'View tasks within the property',
    category: 'Operations',
    isSystem: true
  },
  {
    resource: 'task',
    action: 'read',
    scope: 'department',
    name: 'View Department Tasks',
    description: 'View tasks assigned to the department',
    category: 'Operations',
    isSystem: true
  },
  {
    resource: 'task',
    action: 'read',
    scope: 'own',
    name: 'View Own Tasks',
    description: 'View tasks assigned to self',
    category: 'Self Service',
    isSystem: true
  },
  {
    resource: 'task',
    action: 'update',
    scope: 'property',
    name: 'Update Property Tasks',
    description: 'Modify tasks within the property',
    category: 'Operations',
    isSystem: true
  },
  {
    resource: 'task',
    action: 'update',
    scope: 'own',
    name: 'Update Own Tasks',
    description: 'Update status of assigned tasks',
    category: 'Self Service',
    isSystem: true
  },
  {
    resource: 'task',
    action: 'assign',
    scope: 'property',
    name: 'Assign Tasks',
    description: 'Assign tasks to staff members',
    category: 'Operations',
    isSystem: true
  },

  // ===== TRAINING MANAGEMENT =====
  {
    resource: 'training',
    action: 'create',
    scope: 'property',
    name: 'Create Training Sessions',
    description: 'Create new training content and sessions',
    category: 'Training',
    isSystem: true
  },
  {
    resource: 'training',
    action: 'read',
    scope: 'property',
    name: 'View Property Training',
    description: 'View training sessions within the property',
    category: 'Training',
    isSystem: true
  },
  {
    resource: 'training',
    action: 'read',
    scope: 'own',
    name: 'View Own Training',
    description: 'View assigned training sessions',
    category: 'Self Service',
    isSystem: true
  },
  {
    resource: 'training',
    action: 'enroll',
    scope: 'property',
    name: 'Enroll in Training',
    description: 'Enroll staff in training sessions',
    category: 'Training',
    isSystem: true
  },
  {
    resource: 'training',
    action: 'complete',
    scope: 'own',
    name: 'Complete Training',
    description: 'Mark training sessions as completed',
    category: 'Self Service',
    isSystem: true
  },

  // ===== DOCUMENT MANAGEMENT =====
  {
    resource: 'document',
    action: 'create',
    scope: 'property',
    name: 'Upload Property Documents',
    description: 'Upload documents for the property',
    category: 'Documents',
    isSystem: true
  },
  {
    resource: 'document',
    action: 'create',
    scope: 'department',
    name: 'Upload Department Documents',
    description: 'Upload documents for the department',
    category: 'Documents',
    isSystem: true
  },
  {
    resource: 'document',
    action: 'read',
    scope: 'property',
    name: 'View Property Documents',
    description: 'Access property-wide documents',
    category: 'Documents',
    isSystem: true
  },
  {
    resource: 'document',
    action: 'read',
    scope: 'department',
    name: 'View Department Documents',
    description: 'Access department-specific documents',
    category: 'Documents',
    isSystem: true
  },
  {
    resource: 'document',
    action: 'read',
    scope: 'own',
    name: 'View Own Documents',
    description: 'Access personal documents',
    category: 'Self Service',
    isSystem: true
  },

  // ===== COMMERCIAL BENEFITS =====
  {
    resource: 'benefit',
    action: 'create',
    scope: 'organization',
    name: 'Create Benefits',
    description: 'Add new commercial benefits',
    category: 'Benefits',
    isSystem: true
  },
  {
    resource: 'benefit',
    action: 'read',
    scope: 'organization',
    name: 'View Organization Benefits',
    description: 'View benefits available in the organization',
    category: 'Benefits',
    isSystem: true
  },
  {
    resource: 'benefit',
    action: 'read',
    scope: 'property',
    name: 'View Property Benefits',
    description: 'View benefits available at the property',
    category: 'Benefits',
    isSystem: true
  },
  {
    resource: 'benefit',
    action: 'read',
    scope: 'own',
    name: 'View Available Benefits',
    description: 'Browse available commercial benefits',
    category: 'Self Service',
    isSystem: true
  },
  {
    resource: 'benefit',
    action: 'update',
    scope: 'organization',
    name: 'Update Benefits',
    description: 'Modify benefit details and availability',
    category: 'Benefits',
    isSystem: true
  }
];

// Default custom roles for the system
interface CustomRoleDefinition {
  name: string;
  description: string;
  isSystemRole: boolean;
  priority: number;
  permissions: string[]; // resource.action.scope format
}

const SYSTEM_ROLES: CustomRoleDefinition[] = [
  {
    name: 'Super Administrator',
    description: 'Full platform access with all permissions',
    isSystemRole: true,
    priority: 1000,
    permissions: PERMISSIONS.map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Organization Manager',
    description: 'Manages organization-wide operations and properties',
    isSystemRole: true,
    priority: 800,
    permissions: PERMISSIONS
      .filter(p => ['organization', 'property', 'department', 'own'].includes(p.scope))
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Property Manager',
    description: 'Manages all operations within a single property',
    isSystemRole: true,
    priority: 600,
    permissions: PERMISSIONS
      .filter(p => ['property', 'department', 'own'].includes(p.scope))
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Department Supervisor',
    description: 'Manages department staff and operations',
    isSystemRole: true,
    priority: 400,
    permissions: PERMISSIONS
      .filter(p => ['department', 'own'].includes(p.scope) || 
        (p.scope === 'property' && ['task', 'training'].includes(p.resource)))
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Front Desk Agent',
    description: 'Handles guest services and front desk operations',
    isSystemRole: true,
    priority: 200,
    permissions: PERMISSIONS
      .filter(p => 
        p.scope === 'own' ||
        (p.scope === 'property' && ['guest', 'reservation', 'unit'].includes(p.resource) && p.action !== 'delete') ||
        (p.resource === 'task' && ['read', 'update'].includes(p.action))
      )
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Housekeeping Staff',
    description: 'Manages room cleaning and maintenance tasks',
    isSystemRole: true,
    priority: 200,
    permissions: PERMISSIONS
      .filter(p => 
        p.scope === 'own' ||
        (p.resource === 'unit' && ['read', 'update'].includes(p.action)) ||
        (p.resource === 'task' && ['read', 'update'].includes(p.action))
      )
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  },
  {
    name: 'Staff Member',
    description: 'Basic staff access for self-service functions',
    isSystemRole: true,
    priority: 100,
    permissions: PERMISSIONS
      .filter(p => p.scope === 'own')
      .map(p => `${p.resource}.${p.action}.${p.scope}`)
  }
];

// Legacy role mapping to new custom roles
const LEGACY_ROLE_MAPPING: Record<Role, string> = {
  PLATFORM_ADMIN: 'Super Administrator',
  ORGANIZATION_OWNER: 'Organization Manager',
  ORGANIZATION_ADMIN: 'Organization Manager',
  PROPERTY_MANAGER: 'Property Manager',
  DEPARTMENT_ADMIN: 'Department Supervisor',
  STAFF: 'Staff Member'
};

async function seedPermissions() {
  console.log('🔐 Starting flexible permission system seeding...');

  try {
    // 1. Create all permissions
    console.log('📝 Creating permissions...');
    for (const permission of PERMISSIONS) {
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
        create: {
          resource: permission.resource,
          action: permission.action,
          scope: permission.scope,
          name: permission.name,
          description: permission.description,
          category: permission.category,
          isSystem: permission.isSystem
        }
      });
    }
    console.log(`✅ Created/updated ${PERMISSIONS.length} permissions`);

    // 2. Create system-level custom roles (no tenant assignment)
    console.log('🎭 Creating system custom roles...');
    for (const roleDefinition of SYSTEM_ROLES) {
      // For system roles, try to find existing first, then create if not found
      let customRole = await prisma.customRole.findFirst({
        where: {
          name: roleDefinition.name,
          organizationId: null,
          propertyId: null,
          isSystemRole: true
        }
      });

      if (!customRole) {
        customRole = await prisma.customRole.create({
          data: {
            name: roleDefinition.name,
            description: roleDefinition.description,
            organizationId: null,
            propertyId: null,
            isSystemRole: roleDefinition.isSystemRole,
            priority: roleDefinition.priority,
            isActive: true
          }
        });
      } else {
        customRole = await prisma.customRole.update({
          where: { id: customRole.id },
          data: {
            description: roleDefinition.description,
            isSystemRole: roleDefinition.isSystemRole,
            priority: roleDefinition.priority,
            isActive: true
          }
        });
      }

      // 3. Assign permissions to the custom role
      console.log(`  🔗 Assigning permissions to ${roleDefinition.name}...`);
      
      // Clear existing permissions for this role
      await prisma.rolePermission.deleteMany({
        where: { roleId: customRole.id }
      });

      // Add permissions
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
        }
      }

      console.log(`  ✅ Assigned ${roleDefinition.permissions.length} permissions to ${roleDefinition.name}`);
    }

    // 4. Display summary
    const totalPermissions = await prisma.permission.count();
    const totalRoles = await prisma.customRole.count();
    const totalRolePermissions = await prisma.rolePermission.count();
    
    console.log('\n📊 Flexible Permission System Summary:');
    console.log(`  - Total permissions: ${totalPermissions}`);
    console.log(`  - Total custom roles: ${totalRoles}`);
    console.log(`  - Total role-permission mappings: ${totalRolePermissions}`);
    console.log('  - Permission categories: HR, Admin, Payroll, Front Desk, Operations, Training, Documents, Benefits, Self Service');
    console.log('  - Permission scopes: all, organization, property, department, own');
    console.log('  - System roles: Super Administrator, Organization Manager, Property Manager, Department Supervisor, Front Desk Agent, Housekeeping Staff, Staff Member');
    console.log('\n🔧 Usage Notes:');
    console.log('  - System roles are available to all tenants');
    console.log('  - Tenants can create custom roles specific to their organization/property');
    console.log('  - Permission cache will improve performance for frequent checks');
    console.log('  - Conditional permissions support time-based and context-aware rules');
    console.log('  - Legacy Role enum is preserved for backwards compatibility');
    console.log('✅ Flexible permission system seeding completed successfully!');

  } catch (error) {
    console.error('❌ Permission seeding failed:', error);
    throw error;
  }
}

async function main() {
  await seedPermissions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });