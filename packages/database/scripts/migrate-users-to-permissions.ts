import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface UserRoleMapping {
  userId: string;
  email: string;
  currentRole: Role;
  permissionsToGrant: string[];
}

// Updated permission mappings using actual permission names from database
const ROLE_TO_PERMISSIONS: Record<Role, string[]> = {
  PLATFORM_ADMIN: [
    // All permissions for platform admin
    "Create Benefits",
    "View Organization Benefits",
    "View Available Benefits",
    "View Property Benefits",
    "Update Benefits",
    "Create Departments",
    "Delete Property Departments",
    "View All Departments",
    "View Organization Departments",
    "View Property Departments",
    "Update Property Departments",
    "Upload Department Documents",
    "Upload Property Documents",
    "View Department Documents",
    "View Own Documents",
    "View Property Documents",
    "Register Guests",
    "View Property Guests",
    "Update Guest Information",
    "Create Payslips",
    "Import Payroll Data",
    "View All Payslips",
    "View Department Payslips",
    "View Own Payslips",
    "View Property Payslips",
    "Check-in Guests",
    "Check-out Guests",
    "Create Reservations",
    "View Property Reservations",
    "Update Reservations",
    "Assign Department Roles",
    "Assign Organization Roles",
    "Assign Property Roles",
    "Create Organization Roles",
    "Create Property Roles",
    "Delete Organization Roles",
    "Delete Property Roles",
    "View All Roles",
    "View Organization Roles",
    "View Property Roles",
    "Update Organization Roles",
    "Update Property Roles",
    "Assign Tasks",
    "Create Tasks",
    "View Department Tasks",
    "View Own Tasks",
    "View Property Tasks",
    "Update Own Tasks",
    "Update Property Tasks",
    "Complete Training",
    "Create Training Sessions",
    "Enroll in Training",
    "View Department Training",
    "View Own Training",
    "View Property Training",
    "Create Units",
    "View Property Units",
    "Update Unit Status",
    "Create Department Users",
    "Create Users in Organization",
    "Create Users in Property",
    "Delete Any User",
    "Delete Department Users",
    "Delete Organization Users",
    "Delete Property Users",
    "View All Users",
    "View Department Users",
    "View Organization Users",
    "View Own Profile",
    "View Property Users",
    "Update Any User",
    "Update Department Users",
    "Update Organization Users",
    "Update Own Profile",
    "Update Property Users",
    "Approve Department Vacations",
    "Approve Property Vacations",
    "Create Vacation Request",
    "View All Vacations",
    "View Department Vacations",
    "View Own Vacations",
    "View Property Vacations"
  ],
  
  ORGANIZATION_OWNER: [
    // Organization level permissions (excluding platform-only)
    "View Organization Benefits",
    "View Available Benefits",
    "View Property Benefits",
    "Create Departments",
    "Delete Property Departments",
    "View Organization Departments",
    "View Property Departments",
    "Update Property Departments",
    "Upload Department Documents",
    "Upload Property Documents",
    "View Department Documents",
    "View Own Documents",
    "View Property Documents",
    "Register Guests",
    "View Property Guests",
    "Update Guest Information",
    "View All Payslips",
    "View Department Payslips",
    "View Own Payslips",
    "View Property Payslips",
    "Check-in Guests",
    "Check-out Guests",
    "Create Reservations",
    "View Property Reservations",
    "Update Reservations",
    "Assign Department Roles",
    "Assign Organization Roles",
    "Assign Property Roles",
    "Create Property Roles",
    "View Organization Roles",
    "View Property Roles",
    "Update Property Roles",
    "Assign Tasks",
    "Create Tasks",
    "View Department Tasks",
    "View Own Tasks",
    "View Property Tasks",
    "Update Own Tasks",
    "Update Property Tasks",
    "Complete Training",
    "Create Training Sessions",
    "Enroll in Training",
    "View Department Training",
    "View Own Training",
    "View Property Training",
    "Create Units",
    "View Property Units",
    "Update Unit Status",
    "Create Department Users",
    "Create Users in Organization",
    "Create Users in Property",
    "Delete Organization Users",
    "Delete Property Users",
    "View Organization Users",
    "View Own Profile",
    "View Property Users",
    "Update Organization Users",
    "Update Own Profile",
    "Update Property Users",
    "Approve Department Vacations",
    "Approve Property Vacations",
    "Create Vacation Request",
    "View All Vacations",
    "View Department Vacations",
    "View Own Vacations",
    "View Property Vacations"
  ],
  
  ORGANIZATION_ADMIN: [
    // Similar to Organization Owner but with some restrictions
    "View Organization Benefits",
    "View Available Benefits",
    "View Property Benefits",
    "View Organization Departments",
    "View Property Departments",
    "Update Property Departments",
    "Upload Department Documents",
    "Upload Property Documents",
    "View Department Documents",
    "View Own Documents",
    "View Property Documents",
    "Register Guests",
    "View Property Guests",
    "Update Guest Information",
    "View Department Payslips",
    "View Own Payslips",
    "View Property Payslips",
    "Check-in Guests",
    "Check-out Guests",
    "Create Reservations",
    "View Property Reservations",
    "Update Reservations",
    "Assign Property Roles",
    "View Property Roles",
    "Update Property Roles",
    "Assign Tasks",
    "Create Tasks",
    "View Department Tasks",
    "View Own Tasks",
    "View Property Tasks",
    "Update Own Tasks",
    "Update Property Tasks",
    "Complete Training",
    "Create Training Sessions",
    "Enroll in Training",
    "View Department Training",
    "View Own Training",
    "View Property Training",
    "Create Units",
    "View Property Units",
    "Update Unit Status",
    "Create Department Users",
    "Create Users in Property",
    "View Own Profile",
    "View Property Users",
    "Update Own Profile",
    "Update Property Users",
    "Approve Department Vacations",
    "Approve Property Vacations",
    "Create Vacation Request",
    "View Department Vacations",
    "View Own Vacations",
    "View Property Vacations"
  ],
  
  PROPERTY_MANAGER: [
    // Property-level management
    "View Available Benefits",
    "View Property Benefits",
    "View Property Departments",
    "Update Property Departments",
    "Upload Property Documents",
    "View Department Documents",
    "View Own Documents",
    "View Property Documents",
    "Register Guests",
    "View Property Guests",
    "Update Guest Information",
    "View Department Payslips",
    "View Own Payslips",
    "View Property Payslips",
    "Check-in Guests",
    "Check-out Guests",
    "Create Reservations",
    "View Property Reservations",
    "Update Reservations",
    "Assign Property Roles",
    "View Property Roles",
    "Update Property Roles",
    "Assign Tasks",
    "Create Tasks",
    "View Department Tasks",
    "View Own Tasks",
    "View Property Tasks",
    "Update Own Tasks",
    "Update Property Tasks",
    "Complete Training",
    "Create Training Sessions",
    "Enroll in Training",
    "View Department Training",
    "View Own Training",
    "View Property Training",
    "Create Units",
    "View Property Units",
    "Update Unit Status",
    "Create Department Users",
    "Create Users in Property",
    "View Own Profile",
    "View Property Users",
    "Update Own Profile",
    "Update Property Users",
    "Approve Department Vacations",
    "Approve Property Vacations",
    "Create Vacation Request",
    "View Department Vacations",
    "View Own Vacations",
    "View Property Vacations"
  ],
  
  DEPARTMENT_ADMIN: [
    // Department-level management
    "View Available Benefits",
    "View Property Benefits",
    "View Property Departments",
    "Upload Department Documents",
    "View Department Documents",
    "View Own Documents",
    "View Property Documents",
    "View Department Payslips",
    "View Own Payslips",
    "Assign Tasks",
    "Create Tasks",
    "View Department Tasks",
    "View Own Tasks",
    "Update Own Tasks",
    "Complete Training",
    "Enroll in Training",
    "View Department Training",
    "View Own Training",
    "Create Department Users",
    "View Own Profile",
    "Update Own Profile",
    "Approve Department Vacations",
    "Create Vacation Request",
    "View Department Vacations",
    "View Own Vacations"
  ],
  
  STAFF: [
    // Self-service only
    "View Available Benefits",
    "View Own Documents",
    "View Own Payslips",
    "View Own Tasks",
    "Update Own Tasks",
    "Complete Training",
    "Enroll in Training",
    "View Own Training",
    "View Own Profile",
    "Update Own Profile",
    "Create Vacation Request",
    "View Own Vacations"
  ]
};

async function migrateUsersToPermissions() {
  console.log('🔄 Migrating users from role-based to permission-based system...');
  
  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    console.log(`👥 Found ${users.length} users to migrate:`);
    
    const mappings: UserRoleMapping[] = users.map(user => ({
      userId: user.id,
      email: user.email,
      currentRole: user.role,
      permissionsToGrant: ROLE_TO_PERMISSIONS[user.role] || []
    }));
    
    // Show role distribution
    const roleStats = mappings.reduce((acc, mapping) => {
      acc[mapping.currentRole] = (acc[mapping.currentRole] || 0) + 1;
      return acc;
    }, {} as Record<Role, number>);
    
    console.log('\n📊 Role distribution:');
    Object.entries(roleStats).forEach(([role, count]) => {
      const permissions = ROLE_TO_PERMISSIONS[role as Role]?.length || 0;
      console.log(`   - ${role}: ${count} users (${permissions} permissions each)`);
    });
    
    // Validate all permissions exist
    console.log('\n🔍 Validating permissions exist...');
    const allPermissionNames = Array.from(
      new Set(mappings.flatMap(m => m.permissionsToGrant))
    );
    
    const existingPermissions = await prisma.permission.findMany({
      where: {
        name: { in: allPermissionNames }
      },
      select: { name: true }
    });
    
    const existingNames = new Set(existingPermissions.map(p => p.name));
    const missingPermissions = allPermissionNames.filter(name => name && !existingNames.has(name));
    
    if (missingPermissions.length > 0) {
      console.error('❌ Missing permissions:');
      missingPermissions.forEach(p => console.error(`   - ${p}`));
      throw new Error(`${missingPermissions.length} permissions are missing from database`);
    }
    
    console.log(`✅ All ${allPermissionNames.length} permissions exist in database`);
    
    // Perform migration
    console.log('\n🔄 Creating user permissions...');
    let migratedCount = 0;
    let totalPermissionsCreated = 0;
    
    for (const mapping of mappings) {
      try {
        // Clear existing user permissions
        await prisma.userPermission.deleteMany({
          where: { userId: mapping.userId }
        });
        
        // Create new user permissions
        if (mapping.permissionsToGrant.length > 0) {
          const userPermissions = [];
          
          for (const permissionName of mapping.permissionsToGrant) {
            const permission = await prisma.permission.findFirst({
              where: { name: permissionName }
            });
            
            if (permission) {
              userPermissions.push({
                userId: mapping.userId,
                permissionId: permission.id,
                grantedBy: 'SYSTEM_MIGRATION'
              });
            }
          }
          
          if (userPermissions.length > 0) {
            await prisma.userPermission.createMany({
              data: userPermissions,
              skipDuplicates: true
            });
            
            totalPermissionsCreated += userPermissions.length;
          }
        }
        
        migratedCount++;
        console.log(`✅ Migrated ${mapping.email} (${mapping.currentRole}): ${mapping.permissionsToGrant.length} permissions`);
        
      } catch (error) {
        console.error(`❌ Failed to migrate ${mapping.email}:`, error);
      }
    }
    
    console.log(`\n📊 Migration Results:`);
    console.log(`   - Users migrated: ${migratedCount}/${users.length}`);
    console.log(`   - Total permissions created: ${totalPermissionsCreated}`);
    
    // Validation
    console.log('\n🔍 Validating migration...');
    const finalUserPermissions = await prisma.userPermission.count();
    console.log(`   - Total user permissions in database: ${finalUserPermissions}`);
    
    console.log('\n✅ User permission migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateUsersToPermissions()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Migration failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });