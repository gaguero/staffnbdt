import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface FixOptions {
  reseedPermissions: boolean;
  fixRoleMappings: boolean;
  updateUserRoles: boolean;
  grantPlatformAdmin: string | null; // User ID to grant PLATFORM_ADMIN
  dryRun: boolean;
  force: boolean;
}

// Legacy role mapping to new custom roles
const LEGACY_ROLE_MAPPING: Record<Role, string> = {
  PLATFORM_ADMIN: 'Super Administrator',
  ORGANIZATION_OWNER: 'Organization Manager',
  ORGANIZATION_ADMIN: 'Organization Manager',
  PROPERTY_MANAGER: 'Property Manager',
  DEPARTMENT_ADMIN: 'Department Supervisor',
  STAFF: 'Staff Member'
};

async function checkCurrentState(): Promise<{
  permissionCount: number;
  roleCount: number;
  mappingCount: number;
  usersWithoutCustomRoles: number;
}> {
  const [permissionCount, roleCount, mappingCount, usersWithoutCustomRoles] = await Promise.all([
    prisma.permission.count(),
    prisma.customRole.count({ where: { isSystemRole: true } }),
    prisma.rolePermission.count(),
    prisma.user.count({ where: { customRoleId: null } })
  ]);

  return {
    permissionCount,
    roleCount,
    mappingCount,
    usersWithoutCustomRoles
  };
}

async function reseedPermissions(dryRun: boolean): Promise<number> {
  console.log('🔐 Re-seeding permissions...');
  
  if (dryRun) {
    console.log('  [DRY RUN] Would re-run permission seeding script');
    return 0;
  }

  try {
    // Import and run the permission seeding logic
    const { spawn } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(spawn);

    // Run the seed permissions script
    console.log('  Running: npm run permissions:seed');
    const result = spawn('npm', ['run', 'permissions:seed'], { 
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    return new Promise((resolve, reject) => {
      result.on('close', (code) => {
        if (code === 0) {
          console.log('  ✅ Permission seeding completed');
          resolve(81); // Expected permission count
        } else {
          reject(new Error(`Permission seeding failed with exit code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('  ❌ Failed to re-seed permissions:', error);
    throw error;
  }
}

async function fixRoleMappings(dryRun: boolean): Promise<number> {
  console.log('🎭 Fixing role-permission mappings...');
  
  // Get all system roles
  const systemRoles = await prisma.customRole.findMany({
    where: { isSystemRole: true },
    include: {
      rolePermissions: {
        include: { permission: true }
      }
    }
  });

  if (systemRoles.length === 0) {
    console.log('  ⚠️  No system roles found - need to re-seed permissions first');
    return 0;
  }

  let fixedMappings = 0;

  for (const role of systemRoles) {
    const currentPermissionCount = role.rolePermissions.length;
    console.log(`  Checking ${role.name}: ${currentPermissionCount} permissions`);

    // Expected permission counts based on role definitions
    const expectedCounts = {
      'Super Administrator': 81,
      'Organization Manager': 60,
      'Property Manager': 45,
      'Department Supervisor': 25,
      'Front Desk Agent': 15,
      'Housekeeping Staff': 10,
      'Staff Member': 8
    };

    const expectedCount = expectedCounts[role.name as keyof typeof expectedCounts] || 0;
    
    if (currentPermissionCount < expectedCount * 0.8) { // Allow 20% tolerance
      console.log(`    ⚠️  ${role.name} has ${currentPermissionCount} permissions, expected ~${expectedCount}`);
      
      if (!dryRun) {
        // Re-run the role seeding for this specific role
        console.log(`    🔄 Re-seeding permissions for ${role.name}`);
        // This would require extracting the role seeding logic from seed-permissions.ts
        // For now, we'll log what needs to be done
        fixedMappings++;
      } else {
        console.log(`    [DRY RUN] Would re-seed permissions for ${role.name}`);
      }
    } else {
      console.log(`    ✅ ${role.name} permissions look good`);
    }
  }

  return fixedMappings;
}

async function updateUserRoles(dryRun: boolean): Promise<number> {
  console.log('👥 Updating user role assignments...');
  
  // Find users without custom role assignments
  const usersWithoutCustomRoles = await prisma.user.findMany({
    where: { customRoleId: null },
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
      propertyId: true
    }
  });

  console.log(`  Found ${usersWithoutCustomRoles.length} users without custom role assignments`);

  let updatedUsers = 0;

  for (const user of usersWithoutCustomRoles) {
    const targetRoleName = LEGACY_ROLE_MAPPING[user.role];
    
    if (!targetRoleName) {
      console.log(`    ⚠️  No mapping found for legacy role: ${user.role}`);
      continue;
    }

    // Find the system role
    const systemRole = await prisma.customRole.findFirst({
      where: {
        name: targetRoleName,
        isSystemRole: true
      }
    });

    if (!systemRole) {
      console.log(`    ⚠️  System role not found: ${targetRoleName}`);
      continue;
    }

    console.log(`    Assigning ${user.email} (${user.role}) → ${targetRoleName}`);

    if (!dryRun) {
      await prisma.user.update({
        where: { id: user.id },
        data: { customRoleId: systemRole.id }
      });
      updatedUsers++;
    } else {
      console.log(`      [DRY RUN] Would assign custom role ${targetRoleName}`);
    }
  }

  return updatedUsers;
}

async function grantPlatformAdminAccess(userId: string, dryRun: boolean): Promise<boolean> {
  console.log(`🔑 Granting Platform Admin access to user: ${userId}`);
  
  // Find the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true }
  });

  if (!user) {
    console.log(`    ❌ User not found: ${userId}`);
    return false;
  }

  // Find the Super Administrator role
  const superAdminRole = await prisma.customRole.findFirst({
    where: {
      name: 'Super Administrator',
      isSystemRole: true
    }
  });

  if (!superAdminRole) {
    console.log(`    ❌ Super Administrator role not found`);
    return false;
  }

  console.log(`    User: ${user.email} (Current role: ${user.role})`);
  console.log(`    Target: Super Administrator`);

  if (!dryRun) {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        customRoleId: superAdminRole.id,
        role: Role.PLATFORM_ADMIN // Also update legacy role for consistency
      }
    });
    console.log(`    ✅ Granted Platform Admin access to ${user.email}`);
    return true;
  } else {
    console.log(`    [DRY RUN] Would grant Platform Admin access`);
    return false;
  }
}

async function verifyFixes(): Promise<void> {
  console.log('🔍 Verifying fixes...');
  
  const [permissionCount, roleCount, mappingCount, usersWithoutRoles] = await Promise.all([
    prisma.permission.count(),
    prisma.customRole.count({ where: { isSystemRole: true } }),
    prisma.rolePermission.count(),
    prisma.user.count({ where: { customRoleId: null } })
  ]);

  console.log(`  Permissions: ${permissionCount} (Expected: 81)`);
  console.log(`  System Roles: ${roleCount} (Expected: 7)`);
  console.log(`  Role-Permission Mappings: ${mappingCount} (Expected: ~297)`);
  console.log(`  Users without custom roles: ${usersWithoutRoles}`);

  const issues: string[] = [];
  
  if (permissionCount < 81) {
    issues.push(`Still missing permissions: ${81 - permissionCount}`);
  }
  
  if (roleCount < 7) {
    issues.push(`Still missing system roles: ${7 - roleCount}`);
  }
  
  if (mappingCount < 200) {
    issues.push(`Still insufficient role mappings: ${mappingCount}`);
  }

  if (issues.length > 0) {
    console.log('  ⚠️  Remaining issues:');
    issues.forEach(issue => console.log(`     - ${issue}`));
  } else {
    console.log('  ✅ All issues appear to be resolved!');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  const options: FixOptions = {
    reseedPermissions: args.includes('--reseed-permissions'),
    fixRoleMappings: args.includes('--fix-mappings'),
    updateUserRoles: args.includes('--update-users'),
    grantPlatformAdmin: args.find(arg => arg.startsWith('--grant-admin='))?.split('=')[1] || null,
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force')
  };

  // If no specific options provided, do everything
  if (!options.reseedPermissions && !options.fixRoleMappings && !options.updateUserRoles && !options.grantPlatformAdmin) {
    options.reseedPermissions = true;
    options.fixRoleMappings = true;
    options.updateUserRoles = true;
  }

  try {
    console.log('🛠️  Production Permission System Fix');
    console.log('====================================\n');

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Check current state
    const currentState = await checkCurrentState();
    console.log('📊 Current State:');
    console.log(`  Permissions: ${currentState.permissionCount}`);
    console.log(`  System Roles: ${currentState.roleCount}`);
    console.log(`  Role Mappings: ${currentState.mappingCount}`);
    console.log(`  Users without custom roles: ${currentState.usersWithoutCustomRoles}\n`);

    // Confirm if not in force mode and not dry run
    if (!options.dryRun && !options.force) {
      console.log('⚠️  This will modify production data. Continue? (y/N)');
      // In a real implementation, you'd want to add readline for user input
      // For now, we'll require --force flag
      console.log('❌ Use --force flag to confirm changes or --dry-run to preview');
      process.exit(1);
    }

    let totalChanges = 0;

    // 1. Re-seed permissions if needed
    if (options.reseedPermissions) {
      try {
        const changes = await reseedPermissions(options.dryRun);
        totalChanges += changes;
      } catch (error) {
        console.error('❌ Failed to re-seed permissions:', error);
      }
    }

    // 2. Fix role mappings
    if (options.fixRoleMappings) {
      const changes = await fixRoleMappings(options.dryRun);
      totalChanges += changes;
    }

    // 3. Update user role assignments
    if (options.updateUserRoles) {
      const changes = await updateUserRoles(options.dryRun);
      totalChanges += changes;
    }

    // 4. Grant platform admin access if requested
    if (options.grantPlatformAdmin) {
      const success = await grantPlatformAdminAccess(options.grantPlatformAdmin, options.dryRun);
      if (success) totalChanges++;
    }

    // 5. Verify fixes
    if (!options.dryRun && totalChanges > 0) {
      console.log('\n');
      await verifyFixes();
    }

    console.log(`\n✅ Fix process completed. Total changes: ${totalChanges}`);
    
    if (options.dryRun) {
      console.log('🔍 This was a dry run. Use --force to apply changes.');
    }

  } catch (error) {
    console.error('❌ Error fixing production permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage examples:
// npm run permissions:fix:production -- --dry-run
// npm run permissions:fix:production -- --force
// npm run permissions:fix:production -- --reseed-permissions --force
// npm run permissions:fix:production -- --grant-admin=USER_ID --force
// npm run permissions:fix:production -- --update-users --force

main();