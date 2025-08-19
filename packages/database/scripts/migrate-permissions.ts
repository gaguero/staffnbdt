import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface UserRoleMapping {
  userId: string;
  email: string;
  currentRole: Role;
  permissionsToGrant: string[];
}

/**
 * Migration script to transition from role-based to permission-based system
 * 
 * This script:
 * 1. Analyzes existing user roles
 * 2. Maps roles to equivalent permissions
 * 3. Creates UserPermission records for each user
 * 4. Validates the migration
 * 5. Provides rollback capability
 */

// Permission mappings from seed-permissions.ts (subset for reference)
const ROLE_TO_PERMISSIONS: Record<Role, string[]> = {
  PLATFORM_ADMIN: [
    // All permissions - this would be the full list from seed-permissions.ts
    'users.create.platform',
    'users.read.stats',
    'users.read.department',
    'users.delete.platform',
    'users.restore.platform',
    'users.update.role',
    'users.update.status',
    'users.update.department',
    'users.remove.department',
    'users.delete.permanent',
    'users.create.bulk',
    'users.import.csv',
    'users.export.csv',
    'users.download.template',
    'departments.create.platform',
    'departments.read.stats.overall',
    'departments.read.stats.specific',
    'departments.update.platform',
    'departments.delete.platform',
    'invitations.create.department',
    'invitations.read.department',
    'invitations.read.stats',
    'invitations.resend.department',
    'invitations.cancel.department',
    'invitations.cleanup.platform',
    'profiles.read.others',
    'profiles.read.id_documents',
    'profiles.verify.id_documents',
    'profiles.read.id_status',
    'benefits.create.platform',
    'benefits.update.platform',
    'benefits.delete.platform',
    'payroll.import.platform',
    'payroll.read.stats',
    'guests.create.property',
    'guests.update.property',
    'guests.delete.property',
    'units.create.property',
    'units.update.property',
    'units.update.status',
    'units.delete.property',
    'reservations.create.property',
    'reservations.update.property',
    'reservations.update.status',
    'reservations.checkin.property',
    'reservations.checkout.property',
    'reservations.delete.property',
    'tasks.create.property',
    'tasks.read.department',
    'tasks.read.overdue',
    'tasks.read.statistics',
    'tasks.update.property',
    'tasks.assign.property',
    'tasks.delete.property',
    // Self-service permissions
    'profile.read.own',
    'profile.update.own',
    'documents.read.own',
    'payslips.read.own',
    'vacations.read.own',
    'vacations.create.own',
    'training.read.own',
    'training.complete.own',
    'tasks.read.own',
    'tasks.update.own',
  ],
  
  ORGANIZATION_OWNER: [
    // Organization and below (excluding platform-only)
    'users.read.stats',
    'users.read.department',
    'users.update.status',
    'users.update.department',
    'users.remove.department',
    'users.export.csv',
    'departments.read.stats.overall',
    'departments.read.stats.specific',
    'invitations.create.department',
    'invitations.read.department',
    'invitations.read.stats',
    'invitations.resend.department',
    'invitations.cancel.department',
    'profiles.read.others',
    'profiles.read.id_documents',
    'profiles.verify.id_documents',
    'profiles.read.id_status',
    'payroll.read.stats',
    'guests.create.property',
    'guests.update.property',
    'guests.delete.property',
    'units.create.property',
    'units.update.property',
    'units.update.status',
    'units.delete.property',
    'reservations.create.property',
    'reservations.update.property',
    'reservations.update.status',
    'reservations.checkin.property',
    'reservations.checkout.property',
    'reservations.delete.property',
    'tasks.create.property',
    'tasks.read.department',
    'tasks.read.overdue',
    'tasks.read.statistics',
    'tasks.update.property',
    'tasks.assign.property',
    'tasks.delete.property',
    // Self-service permissions
    'profile.read.own',
    'profile.update.own',
    'documents.read.own',
    'payslips.read.own',
    'vacations.read.own',
    'vacations.create.own',
    'training.read.own',
    'training.complete.own',
    'tasks.read.own',
    'tasks.update.own',
  ],
  
  ORGANIZATION_ADMIN: [
    // Similar to Organization Owner but without some sensitive operations
    'users.read.stats',
    'users.read.department',
    'users.update.status',
    'users.update.department',
    'users.remove.department',
    'users.export.csv',
    'departments.read.stats.specific',
    'invitations.create.department',
    'invitations.read.department',
    'invitations.read.stats',
    'invitations.resend.department',
    'invitations.cancel.department',
    'profiles.read.others',
    'profiles.read.id_documents',
    'profiles.verify.id_documents',
    'profiles.read.id_status',
    'payroll.read.stats',
    'guests.create.property',
    'guests.update.property',
    'guests.delete.property',
    'units.create.property',
    'units.update.property',
    'units.update.status',
    'units.delete.property',
    'reservations.create.property',
    'reservations.update.property',
    'reservations.update.status',
    'reservations.checkin.property',
    'reservations.checkout.property',
    'reservations.delete.property',
    'tasks.create.property',
    'tasks.read.department',
    'tasks.read.overdue',
    'tasks.read.statistics',
    'tasks.update.property',
    'tasks.assign.property',
    'tasks.delete.property',
    // Self-service permissions
    'profile.read.own',
    'profile.update.own',
    'documents.read.own',
    'payslips.read.own',
    'vacations.read.own',
    'vacations.create.own',
    'training.read.own',
    'training.complete.own',
    'tasks.read.own',
    'tasks.update.own',
  ],
  
  PROPERTY_MANAGER: [
    // Property and department level
    'users.read.stats',
    'users.read.department',
    'users.update.status',
    'users.update.department',
    'users.remove.department',
    'users.export.csv',
    'departments.read.stats.specific',
    'invitations.create.department',
    'invitations.read.department',
    'invitations.read.stats',
    'invitations.resend.department',
    'invitations.cancel.department',
    'profiles.read.others',
    'profiles.read.id_documents',
    'profiles.verify.id_documents',
    'profiles.read.id_status',
    'payroll.read.stats',
    'guests.create.property',
    'guests.update.property',
    'guests.delete.property',
    'units.create.property',
    'units.update.property',
    'units.update.status',
    'units.delete.property',
    'reservations.create.property',
    'reservations.update.property',
    'reservations.update.status',
    'reservations.checkin.property',
    'reservations.checkout.property',
    'reservations.delete.property',
    'tasks.create.property',
    'tasks.read.department',
    'tasks.read.overdue',
    'tasks.read.statistics',
    'tasks.update.property',
    'tasks.assign.property',
    'tasks.delete.property',
    // Self-service permissions
    'profile.read.own',
    'profile.update.own',
    'documents.read.own',
    'payslips.read.own',
    'vacations.read.own',
    'vacations.create.own',
    'training.read.own',
    'training.complete.own',
    'tasks.read.own',
    'tasks.update.own',
  ],
  
  DEPARTMENT_ADMIN: [
    // Department-level management
    'users.read.stats',
    'users.read.department',
    'users.update.status',
    'users.update.department',
    'users.remove.department',
    'users.export.csv',
    'departments.read.stats.specific',
    'invitations.create.department',
    'invitations.read.department',
    'invitations.read.stats',
    'invitations.resend.department',
    'invitations.cancel.department',
    'profiles.read.others',
    'profiles.read.id_documents',
    'profiles.verify.id_documents',
    'profiles.read.id_status',
    'payroll.read.stats',
    'tasks.read.department',
    'tasks.read.overdue',
    'tasks.read.statistics',
    'tasks.create.property',
    'tasks.update.property',
    'tasks.assign.property',
    'tasks.delete.property',
    // Self-service permissions
    'profile.read.own',
    'profile.update.own',
    'documents.read.own',
    'payslips.read.own',
    'vacations.read.own',
    'vacations.create.own',
    'training.read.own',
    'training.complete.own',
    'tasks.read.own',
    'tasks.update.own',
  ],
  
  STAFF: [
    // Self-service only
    'profile.read.own',
    'profile.update.own',
    'documents.read.own',
    'payslips.read.own',
    'vacations.read.own',
    'vacations.create.own',
    'training.read.own',
    'training.complete.own',
    'tasks.read.own',
    'tasks.update.own',
  ],
};

async function analyzeCurrentUsers(): Promise<UserRoleMapping[]> {
  console.log('📊 Analyzing current user roles...');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
    },
    where: {
      deletedAt: null, // Only active users
    },
  });

  const mappings: UserRoleMapping[] = users.map(user => ({
    userId: user.id,
    email: user.email,
    currentRole: user.role,
    permissionsToGrant: ROLE_TO_PERMISSIONS[user.role] || [],
  }));

  console.log(`✅ Found ${users.length} active users to migrate`);
  console.log('📋 Role distribution:');
  
  const roleCount = mappings.reduce((acc, mapping) => {
    acc[mapping.currentRole] = (acc[mapping.currentRole] || 0) + 1;
    return acc;
  }, {} as Record<Role, number>);

  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`   - ${role}: ${count} users`);
  });

  return mappings;
}

async function validatePermissions(mappings: UserRoleMapping[]): Promise<boolean> {
  console.log('🔍 Validating permissions exist...');
  
  const allPermissionIds = Array.from(
    new Set(mappings.flatMap(m => m.permissionsToGrant))
  );

  const existingPermissions = await prisma.permission.findMany({
    where: {
      id: { in: allPermissionIds }
    },
    select: { id: true }
  });

  const existingIds = new Set(existingPermissions.map(p => p.id));
  const missingPermissions = allPermissionIds.filter(id => !existingIds.has(id));

  if (missingPermissions.length > 0) {
    console.error('❌ Missing permissions:', missingPermissions);
    return false;
  }

  console.log(`✅ All ${allPermissionIds.length} permissions exist`);
  return true;
}

async function migrateUserPermissions(mappings: UserRoleMapping[]): Promise<void> {
  console.log('🔄 Migrating user permissions...');
  
  let migratedCount = 0;
  let errorCount = 0;

  for (const mapping of mappings) {
    try {
      // Clear existing user permissions (if any)
      await prisma.userPermission.deleteMany({
        where: { userId: mapping.userId }
      });

      // Create new user permissions
      if (mapping.permissionsToGrant.length > 0) {
        const userPermissions = mapping.permissionsToGrant.map(permissionId => ({
          userId: mapping.userId,
          permissionId,
          grantedAt: new Date(),
          grantedBy: 'SYSTEM_MIGRATION', // Track that this was a migration
        }));

        await prisma.userPermission.createMany({
          data: userPermissions,
          skipDuplicates: true,
        });
      }

      migratedCount++;
      console.log(`✅ Migrated ${mapping.email} (${mapping.currentRole}): ${mapping.permissionsToGrant.length} permissions`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to migrate ${mapping.email}:`, error);
    }
  }

  console.log(`\n📊 Migration Results:`);
  console.log(`   - Successfully migrated: ${migratedCount} users`);
  console.log(`   - Errors: ${errorCount} users`);
  
  if (errorCount > 0) {
    throw new Error(`Migration completed with ${errorCount} errors`);
  }
}

async function validateMigration(mappings: UserRoleMapping[]): Promise<void> {
  console.log('🔍 Validating migration results...');
  
  for (const mapping of mappings) {
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: mapping.userId },
      select: { permissionId: true }
    });

    const grantedPermissions = new Set(userPermissions.map(up => up.permissionId));
    const expectedPermissions = new Set(mapping.permissionsToGrant);

    // Check if all expected permissions were granted
    for (const expectedPermission of expectedPermissions) {
      if (!grantedPermissions.has(expectedPermission)) {
        throw new Error(
          `Validation failed: User ${mapping.email} missing permission ${expectedPermission}`
        );
      }
    }

    // Check for unexpected permissions
    for (const grantedPermission of grantedPermissions) {
      if (!expectedPermissions.has(grantedPermission)) {
        console.warn(
          `⚠️  User ${mapping.email} has unexpected permission: ${grantedPermission}`
        );
      }
    }
  }

  console.log('✅ Migration validation passed');
}

async function createMigrationLog(mappings: UserRoleMapping[]): Promise<void> {
  console.log('📝 Creating migration log...');
  
  const migrationSummary = {
    timestamp: new Date(),
    totalUsers: mappings.length,
    roleDistribution: mappings.reduce((acc, mapping) => {
      acc[mapping.currentRole] = (acc[mapping.currentRole] || 0) + 1;
      return acc;
    }, {} as Record<Role, number>),
    permissionCounts: mappings.reduce((acc, mapping) => {
      acc[mapping.currentRole] = mapping.permissionsToGrant.length;
      return acc;
    }, {} as Record<Role, number>),
  };

  // Log to console (in production, you might want to write to a file)
  console.log('\n📋 Migration Summary:');
  console.log(JSON.stringify(migrationSummary, null, 2));
}

async function rollbackMigration(): Promise<void> {
  console.log('🔄 Rolling back migration...');
  
  // Remove all user permissions created by migration
  const deleteResult = await prisma.userPermission.deleteMany({
    where: {
      grantedBy: 'SYSTEM_MIGRATION'
    }
  });

  console.log(`✅ Rollback completed: Removed ${deleteResult.count} user permissions`);
}

async function main() {
  console.log('🔄 Starting permission system migration...');
  
  try {
    // Step 1: Analyze current users
    const mappings = await analyzeCurrentUsers();
    
    if (mappings.length === 0) {
      console.log('ℹ️  No users found to migrate');
      return;
    }

    // Step 2: Validate all permissions exist
    const permissionsValid = await validatePermissions(mappings);
    if (!permissionsValid) {
      throw new Error('Permission validation failed. Please run seed-permissions.ts first.');
    }

    // Step 3: Migrate user permissions
    await migrateUserPermissions(mappings);

    // Step 4: Validate migration
    await validateMigration(mappings);

    // Step 5: Create migration log
    await createMigrationLog(mappings);

    console.log('\n✅ Permission migration completed successfully!');
    console.log('📌 Note: Original user roles are preserved for backwards compatibility');
    console.log('📌 To rollback: Run this script with ROLLBACK=true environment variable');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Option to rollback on failure
    if (process.env.AUTO_ROLLBACK === 'true') {
      console.log('🔄 Auto-rollback enabled, reverting changes...');
      await rollbackMigration();
    }
    
    throw error;
  }
}

// Handle rollback mode
if (process.env.ROLLBACK === 'true') {
  rollbackMigration()
    .then(() => {
      console.log('✅ Rollback completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Rollback failed:', error);
      process.exit(1);
    });
} else {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('❌ Migration failed:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}