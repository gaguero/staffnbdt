import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Comprehensive permission seeding for all system roles
 * Including new CLIENT and VENDOR roles and Concierge/Vendors modules
 */

const SYSTEM_PERMISSIONS = {
  // User Management
  USER: [
    'user.create.platform',
    'user.create.organization',
    'user.create.property',
    'user.create.department',
    'user.read.platform',
    'user.read.organization',
    'user.read.property',
    'user.read.department',
    'user.read.own',
    'user.update.platform',
    'user.update.organization', 
    'user.update.property',
    'user.update.department',
    'user.update.own',
    'user.delete.platform',
    'user.delete.organization',
    'user.delete.property',
    'user.delete.department',
    'user.assign.platform',
    'user.assign.organization',
    'user.assign.property',
    'user.remove.platform',
    'user.remove.organization',
    'user.remove.property',
  ],

  // Role Management
  ROLE: [
    'role.create.platform',
    'role.create.organization',
    'role.create.property',
    'role.read.platform',
    'role.read.organization',
    'role.read.property',
    'role.read.department',
    'role.update.platform',
    'role.update.organization',
    'role.update.property',
    'role.delete.platform',
    'role.delete.organization',
    'role.delete.property',
    'role.assign.platform',
    'role.assign.organization',
    'role.assign.property',
    'role.assign.department',
  ],

  // Profile Management
  PROFILE: [
    'profile.read.platform',
    'profile.read.organization',
    'profile.read.property',
    'profile.read.department',
    'profile.read.own',
    'profile.update.platform',
    'profile.update.organization',
    'profile.update.property',
    'profile.update.department',
    'profile.update.own',
    'profile.verify_id.platform',
    'profile.verify_id.organization',
    'profile.verify_id.property',
    'profile.verify_id.department',
  ],

  // Organization Management
  ORGANIZATION: [
    'organization.create.platform',
    'organization.read.platform',
    'organization.read.organization',
    'organization.update.platform',
    'organization.update.organization',
    'organization.delete.platform',
  ],

  // Property Management  
  PROPERTY: [
    'property.create.platform',
    'property.create.organization',
    'property.read.platform',
    'property.read.organization',
    'property.read.property',
    'property.update.platform',
    'property.update.organization',
    'property.update.property',
    'property.delete.platform',
    'property.delete.organization',
  ],

  // Department Management
  DEPARTMENT: [
    'department.create.platform',
    'department.create.organization',
    'department.create.property',
    'department.read.platform',
    'department.read.organization',
    'department.read.property',
    'department.read.department',
    'department.update.platform',
    'department.update.organization',
    'department.update.property',
    'department.update.department',
    'department.delete.platform',
    'department.delete.organization',
    'department.delete.property',
  ],

  // Hotel Operations - Units (Rooms)
  UNIT: [
    'unit.create.platform',
    'unit.create.organization',
    'unit.create.property',
    'unit.read.platform',
    'unit.read.organization',
    'unit.read.property',
    'unit.read.department',
    'unit.update.platform',
    'unit.update.organization',
    'unit.update.property',
    'unit.update.department',
    'unit.delete.platform',
    'unit.delete.organization',
    'unit.delete.property',
    'unit.status.platform',
    'unit.status.property',
    'unit.maintenance.property',
  ],

  // Hotel Operations - Guests
  GUEST: [
    'guest.create.platform',
    'guest.create.organization',
    'guest.create.property',
    'guest.read.platform',
    'guest.read.organization',
    'guest.read.property',
    'guest.read.department',
    'guest.read.own',
    'guest.update.platform',
    'guest.update.organization',
    'guest.update.property',
    'guest.update.department',
    'guest.delete.platform',
    'guest.delete.organization',
    'guest.delete.property',
    'guest.blacklist.platform',
    'guest.blacklist.property',
  ],

  // Hotel Operations - Reservations
  RESERVATION: [
    'reservation.create.platform',
    'reservation.create.organization',
    'reservation.create.property',
    'reservation.create.department',
    'reservation.read.platform',
    'reservation.read.organization',
    'reservation.read.property',
    'reservation.read.department',
    'reservation.read.own',
    'reservation.update.platform',
    'reservation.update.organization',
    'reservation.update.property',
    'reservation.update.department',
    'reservation.delete.platform',
    'reservation.delete.organization',
    'reservation.delete.property',
    'reservation.checkin.property',
    'reservation.checkout.property',
    'reservation.cancel.property',
  ],

  // Concierge Module
  CONCIERGE: [
    'concierge.create.platform',
    'concierge.create.organization',
    'concierge.create.property',
    'concierge.read.platform',
    'concierge.read.organization',
    'concierge.read.property',
    'concierge.read.department',
    'concierge.update.platform',
    'concierge.update.organization',
    'concierge.update.property',
    'concierge.update.department',
    'concierge.delete.platform',
    'concierge.delete.organization',
    'concierge.delete.property',
    'concierge.object-types.platform',
    'concierge.object-types.organization',
    'concierge.object-types.property',
    'concierge.playbooks.platform',
    'concierge.playbooks.organization',
    'concierge.playbooks.property',
    'concierge.execute.property',
    'concierge.assign.property',
    'concierge.timeline.property',
  ],

  // Vendors Module
  VENDOR: [
    'vendor.create.platform',
    'vendor.create.organization',
    'vendor.create.property',
    'vendor.read.platform',
    'vendor.read.organization',
    'vendor.read.property',
    'vendor.read.own',
    'vendor.update.platform',
    'vendor.update.organization',
    'vendor.update.property',
    'vendor.update.own',
    'vendor.delete.platform',
    'vendor.delete.organization',
    'vendor.delete.property',
    'vendor.link.platform',
    'vendor.link.organization',
    'vendor.link.property',
    'vendor.confirm.platform',
    'vendor.confirm.property',
    'vendor.portal.vendor',
    'vendor.notification.property',
  ],

  // Documents & Training
  DOCUMENT: [
    'document.create.platform',
    'document.create.organization',
    'document.create.property',
    'document.create.department',
    'document.read.platform',
    'document.read.organization',
    'document.read.property',
    'document.read.department',
    'document.read.own',
    'document.update.platform',
    'document.update.organization',
    'document.update.property',
    'document.update.department',
    'document.update.own',
    'document.delete.platform',
    'document.delete.organization',
    'document.delete.property',
    'document.delete.department',
  ],

  TRAINING: [
    'training.create.platform',
    'training.create.organization',
    'training.create.property',
    'training.create.department',
    'training.read.platform',
    'training.read.organization',
    'training.read.property',
    'training.read.department',
    'training.read.own',
    'training.update.platform',
    'training.update.organization',
    'training.update.property',
    'training.update.department',
    'training.enroll.property',
    'training.enroll.department',
    'training.certificate.department',
  ],

  // System & Portal Access
  PORTAL: [
    'portal.access.platform',
    'portal.access.organization',
    'portal.access.property',
    'portal.access.client',
    'portal.access.vendor',
  ],

  SYSTEM: [
    'system.admin.platform',
    'system.config.platform',
    'system.audit.platform',
    'system.analytics.platform',
    'system.analytics.organization',
    'system.analytics.property',
  ],

  // Payroll, Vacation, Benefits
  PAYROLL: [
    'payroll.read.platform',
    'payroll.read.organization',
    'payroll.read.property',
    'payroll.read.department',
    'payroll.read.own',
    'payroll.create.platform',
    'payroll.create.organization',
    'payroll.create.property',
    'payroll.create.department',
    'payroll.process_csv.property',
    'payroll.generate_pdf.department',
  ],

  VACATION: [
    'vacation.create.platform',
    'vacation.create.organization',
    'vacation.create.property',
    'vacation.create.department',
    'vacation.create.own',
    'vacation.read.platform',
    'vacation.read.organization',
    'vacation.read.property',
    'vacation.read.department',
    'vacation.read.own',
    'vacation.approve.platform',
    'vacation.approve.organization',
    'vacation.approve.property',
    'vacation.approve.department',
    'vacation.reject.department',
  ],

  BENEFIT: [
    'benefit.read.platform',
    'benefit.read.organization',
    'benefit.read.property',
    'benefit.create.platform',
    'benefit.create.organization',
    'benefit.create.property',
    'benefit.update.platform',
    'benefit.update.organization',
    'benefit.update.property',
  ],
};

/**
 * Role permission mappings - defines which permissions each system role should have
 */
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.PLATFORM_ADMIN]: [
    // Full platform access - all permissions
    ...Object.values(SYSTEM_PERMISSIONS).flat(),
  ],

  [Role.ORGANIZATION_OWNER]: [
    // Organization and below
    ...SYSTEM_PERMISSIONS.USER.filter(p => ['organization', 'property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.ROLE.filter(p => ['organization', 'property', 'department'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.PROFILE.filter(p => ['organization', 'property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.ORGANIZATION.filter(p => p.endsWith('organization')),
    ...SYSTEM_PERMISSIONS.PROPERTY,
    ...SYSTEM_PERMISSIONS.DEPARTMENT,
    ...SYSTEM_PERMISSIONS.UNIT.filter(p => ['organization', 'property', 'department'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.GUEST.filter(p => ['organization', 'property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.RESERVATION.filter(p => ['organization', 'property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.CONCIERGE.filter(p => ['organization', 'property', 'department'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.VENDOR.filter(p => ['organization', 'property', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.DOCUMENT.filter(p => ['organization', 'property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.TRAINING.filter(p => ['organization', 'property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.PORTAL.filter(p => ['organization', 'property'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.SYSTEM.filter(p => ['organization'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.PAYROLL.filter(p => ['organization', 'property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.VACATION.filter(p => ['organization', 'property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.BENEFIT.filter(p => ['organization', 'property'].some(scope => p.endsWith(scope))),
  ],

  [Role.ORGANIZATION_ADMIN]: [
    // Organization administration with limited creation/deletion
    'user.read.organization', 'user.update.organization', 'user.create.property', 
    ...SYSTEM_PERMISSIONS.USER.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    'role.read.organization', 'role.assign.property',
    ...SYSTEM_PERMISSIONS.PROFILE.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    'organization.read.organization', 'organization.update.organization',
    ...SYSTEM_PERMISSIONS.PROPERTY.filter(p => !p.includes('delete')),
    ...SYSTEM_PERMISSIONS.DEPARTMENT,
    ...SYSTEM_PERMISSIONS.UNIT.filter(p => ['property', 'department'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.GUEST.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.RESERVATION.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.CONCIERGE.filter(p => ['property', 'department'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.VENDOR.filter(p => ['property', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.DOCUMENT.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.TRAINING.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    'portal.access.property',
    ...SYSTEM_PERMISSIONS.PAYROLL.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.VACATION.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.BENEFIT.filter(p => p.endsWith('property')),
  ],

  [Role.PROPERTY_MANAGER]: [
    // Property and below - full hotel operations
    ...SYSTEM_PERMISSIONS.USER.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    'role.assign.department', 'role.read.property',
    ...SYSTEM_PERMISSIONS.PROFILE.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    'property.read.property', 'property.update.property',
    ...SYSTEM_PERMISSIONS.DEPARTMENT,
    ...SYSTEM_PERMISSIONS.UNIT,
    ...SYSTEM_PERMISSIONS.GUEST,
    ...SYSTEM_PERMISSIONS.RESERVATION,
    ...SYSTEM_PERMISSIONS.CONCIERGE,
    ...SYSTEM_PERMISSIONS.VENDOR.filter(p => !p.endsWith('platform')),
    ...SYSTEM_PERMISSIONS.DOCUMENT.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.TRAINING.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    'portal.access.property',
    'system.analytics.property',
    ...SYSTEM_PERMISSIONS.PAYROLL.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.VACATION.filter(p => ['property', 'department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.BENEFIT.filter(p => p.endsWith('property')),
  ],

  [Role.DEPARTMENT_ADMIN]: [
    // Department and own with some property reads
    'user.read.property', // Can read property-level data
    ...SYSTEM_PERMISSIONS.USER.filter(p => ['department', 'own'].some(scope => p.endsWith(scope))),
    'profile.read.property',
    ...SYSTEM_PERMISSIONS.PROFILE.filter(p => ['department', 'own'].some(scope => p.endsWith(scope))),
    'department.read.property', // Can see all departments in property
    ...SYSTEM_PERMISSIONS.DEPARTMENT.filter(p => ['department'].some(scope => p.endsWith(scope))),
    'unit.read.property',
    'guest.read.property',
    'reservation.read.property',
    ...SYSTEM_PERMISSIONS.CONCIERGE.filter(p => p.endsWith('department')),
    ...SYSTEM_PERMISSIONS.DOCUMENT.filter(p => ['department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.TRAINING.filter(p => ['department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.PAYROLL.filter(p => ['department', 'own'].some(scope => p.endsWith(scope))),
    ...SYSTEM_PERMISSIONS.VACATION.filter(p => ['department', 'own'].some(scope => p.endsWith(scope))),
  ],

  [Role.STAFF]: [
    // Own data only, plus some department/property reads
    'profile.read.department', // Can see department colleagues' basic profiles
    'document.read.department', // Can read department documents
    'training.read.department', // Can see department training sessions
    'benefit.read.property', // Can see property benefits
    'vacation.read.department', // Can see department vacation calendar
    ...SYSTEM_PERMISSIONS.USER.filter(p => p.endsWith('own')),
    ...SYSTEM_PERMISSIONS.PROFILE.filter(p => p.endsWith('own')),
    ...SYSTEM_PERMISSIONS.DOCUMENT.filter(p => p.endsWith('own')),
    ...SYSTEM_PERMISSIONS.TRAINING.filter(p => p.endsWith('own')),
    ...SYSTEM_PERMISSIONS.PAYROLL.filter(p => p.endsWith('own')),
    ...SYSTEM_PERMISSIONS.VACATION.filter(p => p.endsWith('own')),
    // Limited hotel operations access
    'unit.read.property',
    'guest.read.property',
    'reservation.read.property',
  ],

  [Role.CLIENT]: [
    // Very limited access for external clients
    'profile.read.own',
    'profile.update.own',
    'reservation.read.own',
    'document.read.own',
    'portal.access.client',
  ],

  [Role.VENDOR]: [
    // Limited access for vendors
    'profile.read.own',
    'profile.update.own',
    'vendor.read.own',
    'vendor.update.own',
    'vendor.portal.vendor',
    'portal.access.vendor',
    'concierge.read.property', // Can see relevant concierge requests
    'concierge.update.property', // Can update their assigned items
  ],
};

async function createPermissions() {
  console.log('🔧 Creating system permissions...');
  
  // Get all unique permissions
  const allPermissions = [...new Set(Object.values(SYSTEM_PERMISSIONS).flat())];
  
  console.log(`📝 Creating ${allPermissions.length} permissions...`);
  
  for (const permissionString of allPermissions) {
    const [resource, action, scope] = permissionString.split('.');
    
    await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource,
          action,
          scope
        }
      },
      update: {
        name: permissionString,
        description: `Permission to ${action} ${resource} at ${scope} level`,
        category: resource.toUpperCase(),
        isSystem: true
      },
      create: {
        resource,
        action,
        scope,
        name: permissionString,
        description: `Permission to ${action} ${resource} at ${scope} level`,
        category: resource.toUpperCase(),
        isSystem: true
      }
    });
  }
  
  console.log('✅ System permissions created successfully');
}

async function createSystemRoles() {
  console.log('🎭 Creating system roles with permissions...');
  
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    console.log(`\n📋 Processing role: ${role} (${permissions.length} permissions)`);
    
    // Create or find the system role as a CustomRole
    const systemRole = await prisma.customRole.upsert({
      where: {
        organizationId_propertyId_name: {
          organizationId: null,
          propertyId: null,
          name: `SYSTEM_ROLE_${role}`
        }
      },
      update: {
        description: getSystemRoleDescription(role as Role),
        isSystemRole: true,
        priority: getSystemRolePriority(role as Role),
        userType: getSystemRoleUserType(role as Role),
        isActive: true
      },
      create: {
        name: `SYSTEM_ROLE_${role}`,
        description: getSystemRoleDescription(role as Role),
        isSystemRole: true,
        priority: getSystemRolePriority(role as Role),
        userType: getSystemRoleUserType(role as Role),
        organizationId: null,
        propertyId: null,
        isActive: true
      }
    });

    // Remove existing permissions for this role to avoid duplicates
    await prisma.rolePermission.deleteMany({
      where: { roleId: systemRole.id }
    });

    // Add permissions for this role
    const permissionPromises = permissions.map(async (permissionString) => {
      const [resource, action, scope] = permissionString.split('.');
      
      const permission = await prisma.permission.findUnique({
        where: {
          resource_action_scope: {
            resource,
            action,
            scope
          }
        }
      });
      
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: systemRole.id,
            permissionId: permission.id,
            granted: true
          }
        });
      } else {
        console.log(`⚠️  Permission not found: ${permissionString}`);
      }
    });

    await Promise.all(permissionPromises);
    console.log(`✅ Role ${role} configured with ${permissions.length} permissions`);
  }
  
  console.log('\n🎉 All system roles created successfully!');
}

function getSystemRoleDescription(role: Role): string {
  const descriptions = {
    [Role.PLATFORM_ADMIN]: 'Full system access across all organizations and properties',
    [Role.ORGANIZATION_OWNER]: 'Owns and manages entire hotel chains or groups',
    [Role.ORGANIZATION_ADMIN]: 'Administers organization settings and properties',
    [Role.PROPERTY_MANAGER]: 'Manages individual hotel properties and operations',
    [Role.DEPARTMENT_ADMIN]: 'Manages specific departments within properties',
    [Role.STAFF]: 'Regular hotel staff with operational access',
    [Role.CLIENT]: 'External clients with limited access to their data',
    [Role.VENDOR]: 'External vendors and suppliers with work-related access',
  };
  return descriptions[role] || `System role: ${role}`;
}

function getSystemRolePriority(role: Role): number {
  const priorities = {
    [Role.PLATFORM_ADMIN]: 1000,
    [Role.ORGANIZATION_OWNER]: 900,
    [Role.ORGANIZATION_ADMIN]: 800,
    [Role.PROPERTY_MANAGER]: 700,
    [Role.DEPARTMENT_ADMIN]: 600,
    [Role.STAFF]: 500,
    [Role.CLIENT]: 200,
    [Role.VENDOR]: 300,
  };
  return priorities[role] || 0;
}

function getSystemRoleUserType(role: Role): 'INTERNAL' | 'CLIENT' | 'VENDOR' {
  const userTypes = {
    [Role.PLATFORM_ADMIN]: 'INTERNAL' as const,
    [Role.ORGANIZATION_OWNER]: 'INTERNAL' as const,
    [Role.ORGANIZATION_ADMIN]: 'INTERNAL' as const,
    [Role.PROPERTY_MANAGER]: 'INTERNAL' as const,
    [Role.DEPARTMENT_ADMIN]: 'INTERNAL' as const,
    [Role.STAFF]: 'INTERNAL' as const,
    [Role.CLIENT]: 'CLIENT' as const,
    [Role.VENDOR]: 'VENDOR' as const,
  };
  return userTypes[role] || 'INTERNAL';
}

async function main() {
  console.log('🚀 Starting comprehensive system roles and permissions seeding...\n');
  
  try {
    await createPermissions();
    await createSystemRoles();
    
    console.log('\n🎊 System roles and permissions seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Created ${Object.values(SYSTEM_PERMISSIONS).flat().length} permissions`);
    console.log(`- Configured ${Object.keys(ROLE_PERMISSIONS).length} system roles`);
    console.log('- All roles include CLIENT and VENDOR with appropriate permissions');
    console.log('- Concierge and Vendors module permissions included');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });