const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🚀 Applying modular role system migration...');

    // Insert sample system module manifests
    await prisma.moduleManifest.createMany({
      data: [
        {
          id: 'mod_hr_001',
          moduleId: 'hr',
          name: 'Human Resources',
          version: '1.0.0',
          category: 'Management',
          description: 'Employee management, payroll, and HR operations',
          internalPermissions: [
            {"resource": "user", "action": "create", "scope": "department", "name": "Create Department Users", "category": "HR"},
            {"resource": "user", "action": "read", "scope": "department", "name": "View Department Users", "category": "HR"},
            {"resource": "user", "action": "update", "scope": "department", "name": "Update Department Users", "category": "HR"},
            {"resource": "payslip", "action": "read", "scope": "department", "name": "View Department Payslips", "category": "HR"}
          ],
          externalPermissions: [
            {"resource": "user", "action": "read", "scope": "own", "name": "View Own Profile", "category": "HR"},
            {"resource": "payslip", "action": "read", "scope": "own", "name": "View Own Payslips", "category": "HR"}
          ],
          internalNavigation: [
            {"id": "hr-dashboard", "label": "HR Dashboard", "path": "/hr", "icon": "users", "requiredPermissions": ["user.read.department"]},
            {"id": "hr-employees", "label": "Employees", "path": "/hr/employees", "icon": "user", "requiredPermissions": ["user.read.department"]},
            {"id": "hr-payroll", "label": "Payroll", "path": "/hr/payroll", "icon": "dollar-sign", "requiredPermissions": ["payslip.read.department"]}
          ],
          externalNavigation: [
            {"id": "profile", "label": "My Profile", "path": "/profile", "icon": "user", "requiredPermissions": ["user.read.own"]},
            {"id": "payslips", "label": "My Payslips", "path": "/payslips", "icon": "file-text", "requiredPermissions": ["payslip.read.own"]}
          ],
          dependencies: [],
          isSystemModule: true,
          isActive: true
        },
        {
          id: 'mod_inventory_001',
          moduleId: 'inventory',
          name: 'Inventory Management',
          version: '1.0.0',
          category: 'Operations',
          description: 'Track and manage hotel inventory and supplies',
          internalPermissions: [
            {"resource": "inventory", "action": "create", "scope": "property", "name": "Create Inventory Items", "category": "Inventory"},
            {"resource": "inventory", "action": "read", "scope": "property", "name": "View Property Inventory", "category": "Inventory"},
            {"resource": "inventory", "action": "update", "scope": "property", "name": "Update Inventory", "category": "Inventory"},
            {"resource": "inventory", "action": "delete", "scope": "property", "name": "Delete Inventory Items", "category": "Inventory"}
          ],
          externalPermissions: [
            {"resource": "inventory", "action": "read", "scope": "public", "name": "View Available Items", "category": "Inventory"}
          ],
          internalNavigation: [
            {"id": "inventory-dashboard", "label": "Inventory", "path": "/inventory", "icon": "package", "requiredPermissions": ["inventory.read.property"]},
            {"id": "inventory-items", "label": "Items", "path": "/inventory/items", "icon": "box", "requiredPermissions": ["inventory.read.property"]},
            {"id": "inventory-reports", "label": "Reports", "path": "/inventory/reports", "icon": "bar-chart", "requiredPermissions": ["inventory.read.property"]}
          ],
          externalNavigation: [],
          dependencies: [],
          isSystemModule: true,
          isActive: true
        },
        {
          id: 'mod_maintenance_001',
          moduleId: 'maintenance',
          name: 'Maintenance Management',
          version: '1.0.0',
          category: 'Operations',
          description: 'Manage maintenance tasks and work orders',
          internalPermissions: [
            {"resource": "task", "action": "create", "scope": "property", "name": "Create Maintenance Tasks", "category": "Maintenance"},
            {"resource": "task", "action": "read", "scope": "property", "name": "View Property Tasks", "category": "Maintenance"},
            {"resource": "task", "action": "update", "scope": "property", "name": "Update Tasks", "category": "Maintenance"},
            {"resource": "task", "action": "assign", "scope": "property", "name": "Assign Tasks", "category": "Maintenance"}
          ],
          externalPermissions: [
            {"resource": "task", "action": "read", "scope": "assigned", "name": "View Assigned Tasks", "category": "Maintenance"},
            {"resource": "task", "action": "update", "scope": "assigned", "name": "Update Assigned Tasks", "category": "Maintenance"}
          ],
          internalNavigation: [
            {"id": "maintenance-dashboard", "label": "Maintenance", "path": "/maintenance", "icon": "wrench", "requiredPermissions": ["task.read.property"]},
            {"id": "maintenance-tasks", "label": "Tasks", "path": "/maintenance/tasks", "icon": "check-square", "requiredPermissions": ["task.read.property"]},
            {"id": "maintenance-schedule", "label": "Schedule", "path": "/maintenance/schedule", "icon": "calendar", "requiredPermissions": ["task.read.property"]}
          ],
          externalNavigation: [
            {"id": "my-tasks", "label": "My Tasks", "path": "/tasks", "icon": "check-square", "requiredPermissions": ["task.read.assigned"]}
          ],
          dependencies: [],
          isSystemModule: true,
          isActive: true
        }
      ],
      skipDuplicates: true
    });

    console.log('✅ Created sample module manifests');

    // Enable the HR module for the default organization if it exists
    const nayaraOrg = await prisma.organization.findFirst({
      where: { slug: 'nayara-group' }
    });

    if (nayaraOrg) {
      await prisma.moduleSubscription.upsert({
        where: {
          organizationId_moduleName: {
            organizationId: nayaraOrg.id,
            moduleName: 'hr'
          }
        },
        create: {
          id: `sub_${nayaraOrg.id}_hr`,
          organizationId: nayaraOrg.id,
          moduleName: 'hr',
          isEnabled: true,
          enabledAt: new Date()
        },
        update: {
          isEnabled: true,
          enabledAt: new Date()
        }
      });

      console.log('✅ Enabled HR module for Nayara Group organization');
    }

    console.log('🎉 Modular role system migration completed successfully!');
    console.log('📊 System now supports:');
    console.log('  - External user types (CLIENT, VENDOR, PARTNER)');
    console.log('  - Module-based permissions and navigation');
    console.log('  - Custom role builder with UI restrictions');
    console.log('  - Cross-organization access for external users');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();