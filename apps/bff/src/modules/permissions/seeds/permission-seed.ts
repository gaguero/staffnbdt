import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPermissions() {
  console.log('Seeding permissions...');

  // Core HR Permissions
  const hrPermissions = [
    {
      resource: 'user',
      action: 'create',
      scope: 'department',
      name: 'Create Department Users',
      description: 'Create new users within own department',
      category: 'HR',
    },
    {
      resource: 'user',
      action: 'read',
      scope: 'department',
      name: 'View Department Users',
      description: 'View users within own department',
      category: 'HR',
    },
    {
      resource: 'user',
      action: 'read',
      scope: 'own',
      name: 'View Own Profile',
      description: 'View own user profile and details',
      category: 'HR',
    },
    {
      resource: 'user',
      action: 'update',
      scope: 'own',
      name: 'Update Own Profile',
      description: 'Update own profile information',
      category: 'HR',
    },
    {
      resource: 'user',
      action: 'update',
      scope: 'department',
      name: 'Update Department Users',
      description: 'Update users within own department',
      category: 'HR',
    },
    {
      resource: 'payslip',
      action: 'read',
      scope: 'own',
      name: 'View Own Payslips',
      description: 'View own payslips and salary information',
      category: 'HR',
    },
    {
      resource: 'payslip',
      action: 'create',
      scope: 'department',
      name: 'Create Department Payslips',
      description: 'Generate payslips for department staff',
      category: 'HR',
    },
    {
      resource: 'vacation',
      action: 'create',
      scope: 'own',
      name: 'Request Vacation',
      description: 'Create vacation requests for self',
      category: 'HR',
    },
    {
      resource: 'vacation',
      action: 'read',
      scope: 'own',
      name: 'View Own Vacations',
      description: 'View own vacation history and status',
      category: 'HR',
    },
    {
      resource: 'vacation',
      action: 'approve',
      scope: 'department',
      name: 'Approve Department Vacations',
      description: 'Approve vacation requests for department staff',
      category: 'HR',
    },
  ];

  // Training Module Permissions
  const trainingPermissions = [
    {
      resource: 'training',
      action: 'read',
      scope: 'own',
      name: 'View Assigned Training',
      description: 'View training sessions assigned to self',
      category: 'Training',
    },
    {
      resource: 'training',
      action: 'create',
      scope: 'department',
      name: 'Create Department Training',
      description: 'Create training sessions for department',
      category: 'Training',
    },
    {
      resource: 'training',
      action: 'assign',
      scope: 'department',
      name: 'Assign Department Training',
      description: 'Assign training to department staff',
      category: 'Training',
    },
  ];

  // Document Management Permissions
  const documentPermissions = [
    {
      resource: 'document',
      action: 'read',
      scope: 'own',
      name: 'View Own Documents',
      description: 'View documents assigned to self',
      category: 'Documents',
    },
    {
      resource: 'document',
      action: 'read',
      scope: 'department',
      name: 'View Department Documents',
      description: 'View documents shared with department',
      category: 'Documents',
    },
    {
      resource: 'document',
      action: 'create',
      scope: 'department',
      name: 'Upload Department Documents',
      description: 'Upload documents for department use',
      category: 'Documents',
    },
    {
      resource: 'document',
      action: 'delete',
      scope: 'own',
      name: 'Delete Own Documents',
      description: 'Delete documents uploaded by self',
      category: 'Documents',
    },
  ];

  // Hotel Operations Permissions
  const operationsPermissions = [
    {
      resource: 'unit',
      action: 'read',
      scope: 'property',
      name: 'View Property Units',
      description: 'View all units in the property',
      category: 'Operations',
    },
    {
      resource: 'unit',
      action: 'update',
      scope: 'property',
      name: 'Update Unit Status',
      description: 'Update unit status and details',
      category: 'Operations',
    },
    {
      resource: 'reservation',
      action: 'read',
      scope: 'property',
      name: 'View Property Reservations',
      description: 'View all reservations for the property',
      category: 'Operations',
    },
    {
      resource: 'reservation',
      action: 'create',
      scope: 'property',
      name: 'Create Reservations',
      description: 'Create new reservations',
      category: 'Operations',
    },
    {
      resource: 'guest',
      action: 'read',
      scope: 'property',
      name: 'View Guest Information',
      description: 'View guest profiles and preferences',
      category: 'Operations',
    },
    {
      resource: 'task',
      action: 'create',
      scope: 'department',
      name: 'Create Department Tasks',
      description: 'Create tasks for department staff',
      category: 'Operations',
    },
    {
      resource: 'task',
      action: 'read',
      scope: 'own',
      name: 'View Assigned Tasks',
      description: 'View tasks assigned to self',
      category: 'Operations',
    },
    {
      resource: 'task',
      action: 'update',
      scope: 'own',
      name: 'Update Own Tasks',
      description: 'Update status of own assigned tasks',
      category: 'Operations',
    },
  ];

  // Admin Permissions
  const adminPermissions = [
    {
      resource: 'permission',
      action: 'grant',
      scope: 'organization',
      name: 'Grant Organization Permissions',
      description: 'Grant permissions to users within organization',
      category: 'Admin',
    },
    {
      resource: 'role',
      action: 'assign',
      scope: 'organization',
      name: 'Assign Organization Roles',
      description: 'Assign roles to users within organization',
      category: 'Admin',
    },
    {
      resource: 'audit',
      action: 'read',
      scope: 'organization',
      name: 'View Organization Audit Logs',
      description: 'View audit logs for organization activities',
      category: 'Admin',
    },
  ];

  const allPermissions = [
    ...hrPermissions,
    ...trainingPermissions,
    ...documentPermissions,
    ...operationsPermissions,
    ...adminPermissions,
  ];

  // Create permissions
  for (const permission of allPermissions) {
    await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource: permission.resource,
          action: permission.action,
          scope: permission.scope,
        },
      },
      create: {
        ...permission,
        isSystem: true,
      },
      update: {
        name: permission.name,
        description: permission.description,
        category: permission.category,
      },
    });
  }

  console.log(`Created ${allPermissions.length} permissions`);

  // Create default custom roles
  const customRoles = [
    {
      name: 'HR Manager',
      description: 'Human Resources department manager with full HR permissions',
      isSystemRole: true,
      priority: 800,
      permissions: [
        'user.create.department',
        'user.read.department',
        'user.update.department',
        'payslip.create.department',
        'vacation.approve.department',
        'training.create.department',
        'training.assign.department',
      ],
    },
    {
      name: 'Front Desk Manager',
      description: 'Front desk operations manager',
      isSystemRole: true,
      priority: 750,
      permissions: [
        'reservation.create.property',
        'reservation.read.property',
        'guest.read.property',
        'unit.read.property',
        'unit.update.property',
        'task.create.department',
      ],
    },
    {
      name: 'Housekeeping Supervisor',
      description: 'Housekeeping department supervisor',
      isSystemRole: true,
      priority: 700,
      permissions: [
        'unit.read.property',
        'unit.update.property',
        'task.create.department',
        'task.read.department',
      ],
    },
    {
      name: 'Training Coordinator',
      description: 'Manages training programs and staff development',
      isSystemRole: true,
      priority: 650,
      permissions: [
        'training.create.property',
        'training.assign.property',
        'training.read.property',
        'user.read.property',
      ],
    },
    {
      name: 'Basic Staff',
      description: 'Standard employee with basic self-service permissions',
      isSystemRole: true,
      priority: 100,
      permissions: [
        'user.read.own',
        'user.update.own',
        'payslip.read.own',
        'vacation.create.own',
        'vacation.read.own',
        'training.read.own',
        'document.read.own',
        'task.read.own',
        'task.update.own',
      ],
    },
  ];

  // Get or create default organization for custom roles
  let defaultOrg = await prisma.organization.findFirst({
    where: { slug: 'nayara-group' }
  });

  if (!defaultOrg) {
    console.log('Creating default organization for custom roles...');
    defaultOrg = await prisma.organization.create({
      data: {
        name: 'Nayara Group',
        slug: 'nayara-group',
        description: 'Default organization for Hotel Operations Hub',
        timezone: 'America/Costa_Rica',
        settings: {
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'es'],
          theme: 'nayara'
        },
        branding: {
          primaryColor: '#AA8E67',
          secondaryColor: '#F5EBD7',
          accentColor: '#4A4A4A',
          logoUrl: null
        },
        isActive: true
      }
    });
  }

  for (const role of customRoles) {
    // Use findFirst + create/update pattern instead of upsert
    let createdRole = await prisma.customRole.findFirst({
      where: {
        organizationId: defaultOrg.id,
        propertyId: null,
        name: role.name
      }
    });

    if (createdRole) {
      createdRole = await prisma.customRole.update({
        where: { id: createdRole.id },
        data: {
          description: role.description,
          priority: role.priority,
        }
      });
      console.log(`✓ Custom role updated: ${role.name}`);
    } else {
      createdRole = await prisma.customRole.create({
        data: {
          name: role.name,
          description: role.description,
          organizationId: defaultOrg.id,
          propertyId: null,
          isSystemRole: role.isSystemRole,
          priority: role.priority,
          isActive: true,
        }
      });
      console.log(`✓ Custom role created: ${role.name}`);
    }

    // Assign permissions to role
    for (const permissionKey of role.permissions) {
      const [resource, action, scope] = permissionKey.split('.');
      const permission = await prisma.permission.findUnique({
        where: {
          resource_action_scope: { resource, action, scope },
        },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: createdRole.id,
              permissionId: permission.id,
            },
          },
          create: {
            roleId: createdRole.id,
            permissionId: permission.id,
            granted: true,
          },
          update: {
            granted: true,
          },
        });
      }
    }
  }

  console.log(`Created ${customRoles.length} custom roles with permissions`);

  // Create some example conditional permissions
  const conditionalPermissions = [
    {
      resource: 'payslip',
      action: 'read',
      scope: 'department',
      conditionType: 'time',
      operator: 'between',
      value: { startTime: '09:00', endTime: '17:00' },
      description: 'Only during business hours',
    },
    {
      resource: 'vacation',
      action: 'approve',
      scope: 'department',
      conditionType: 'department',
      operator: 'in_list',
      value: { departments: ['hr', 'management'] },
      description: 'Only for HR and Management departments',
    },
  ];

  for (const condPermission of conditionalPermissions) {
    const permission = await prisma.permission.findUnique({
      where: {
        resource_action_scope: {
          resource: condPermission.resource,
          action: condPermission.action,
          scope: condPermission.scope,
        },
      },
    });

    if (permission) {
      await prisma.permissionCondition.upsert({
        where: {
          id: `${permission.id}_${condPermission.conditionType}`,
        },
        create: {
          permissionId: permission.id,
          conditionType: condPermission.conditionType,
          operator: condPermission.operator,
          value: condPermission.value,
          description: condPermission.description,
          isActive: true,
        },
        update: {
          operator: condPermission.operator,
          value: condPermission.value,
          description: condPermission.description,
        },
      });
    }
  }

  console.log(`Created ${conditionalPermissions.length} conditional permissions`);
  console.log('Permission seeding completed!');
}

if (require.main === module) {
  seedPermissions()
    .catch((e) => {
      console.error('Error seeding permissions:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}