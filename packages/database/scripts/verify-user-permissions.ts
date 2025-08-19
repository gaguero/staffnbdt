import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface EndpointPermission {
  endpoint: string;
  method: string;
  requiredPermission: string;
  description: string;
}

// Critical endpoints that users are having issues with
const CRITICAL_ENDPOINTS: EndpointPermission[] = [
  {
    endpoint: '/users/stats',
    method: 'GET',
    requiredPermission: 'user.read.all',
    description: 'View user statistics dashboard'
  },
  {
    endpoint: '/departments/{id}',
    method: 'PUT',
    requiredPermission: 'department.update.property',
    description: 'Update department information'
  },
  {
    endpoint: '/users/{id}/status',
    method: 'PATCH',
    requiredPermission: 'user.update.property',
    description: 'Change user active/inactive status'
  },
  {
    endpoint: '/users/{id}/role',
    method: 'PATCH',
    requiredPermission: 'role.assign.property',
    description: 'Assign roles to users'
  },
  {
    endpoint: '/users',
    method: 'POST',
    requiredPermission: 'user.create.property',
    description: 'Create new users'
  },
  {
    endpoint: '/users/{id}',
    method: 'PUT',
    requiredPermission: 'user.update.property',
    description: 'Update user information'
  },
  {
    endpoint: '/departments',
    method: 'POST',
    requiredPermission: 'department.create.property',
    description: 'Create new departments'
  },
  {
    endpoint: '/vacation/requests/{id}/approve',
    method: 'PATCH',
    requiredPermission: 'vacation.approve.property',
    description: 'Approve vacation requests'
  }
];

interface UserPermissionAnalysis {
  user: {
    id: string;
    email: string;
    legacyRole: Role;
    customRoleName: string | null;
    isActive: boolean;
  };
  context: {
    organizationId: string | null;
    propertyId: string | null;
    departmentId: string | null;
  };
  permissions: {
    total: number;
    byScope: Record<string, number>;
    byCategory: Record<string, number>;
    all: string[];
  };
  endpointAccess: {
    endpoint: string;
    method: string;
    hasAccess: boolean;
    requiredPermission: string;
    reason: string;
  }[];
  recommendations: string[];
}

async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      customRole: {
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      },
      organization: true,
      property: true,
      department: true
    }
  });
}

async function findUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customRole: {
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      },
      organization: true,
      property: true,
      department: true
    }
  });
}

async function analyzeUserPermissions(identifier: string): Promise<UserPermissionAnalysis | null> {
  // Try to find user by email first, then by ID
  let user = await findUserByEmail(identifier);
  if (!user) {
    user = await findUserById(identifier);
  }

  if (!user) {
    console.log(`❌ User not found: ${identifier}`);
    return null;
  }

  // Get effective permissions
  const effectivePermissions: string[] = [];
  const permissionsByScope: Record<string, number> = {};
  const permissionsByCategory: Record<string, number> = {};

  if (user.customRole) {
    user.customRole.rolePermissions.forEach(rp => {
      if (rp.granted) {
        const permissionKey = `${rp.permission.resource}.${rp.permission.action}.${rp.permission.scope}`;
        effectivePermissions.push(permissionKey);
        
        // Count by scope
        permissionsByScope[rp.permission.scope] = (permissionsByScope[rp.permission.scope] || 0) + 1;
        
        // Count by category
        permissionsByCategory[rp.permission.category] = (permissionsByCategory[rp.permission.category] || 0) + 1;
      }
    });
  }

  // Analyze endpoint access
  const endpointAccess = CRITICAL_ENDPOINTS.map(endpoint => {
    const hasDirectPermission = effectivePermissions.includes(endpoint.requiredPermission);
    
    // Check for equivalent permissions (e.g., 'all' scope covers 'property' scope)
    const [resource, action, requiredScope] = endpoint.requiredPermission.split('.');
    const hasEquivalentPermission = effectivePermissions.some(perm => {
      const [permResource, permAction, permScope] = perm.split('.');
      return permResource === resource && 
             permAction === action && 
             (permScope === 'all' || (permScope === requiredScope));
    });

    const hasAccess = hasDirectPermission || hasEquivalentPermission;
    let reason = '';

    if (hasAccess) {
      if (hasDirectPermission) {
        reason = `Has exact permission: ${endpoint.requiredPermission}`;
      } else {
        reason = `Has equivalent permission with broader scope`;
      }
    } else {
      reason = `Missing permission: ${endpoint.requiredPermission}`;
    }

    return {
      endpoint: endpoint.endpoint,
      method: endpoint.method,
      hasAccess,
      requiredPermission: endpoint.requiredPermission,
      reason
    };
  });

  // Generate recommendations
  const recommendations: string[] = [];

  if (!user.customRole) {
    recommendations.push('User has no custom role assigned. Assign appropriate custom role based on legacy role.');
  }

  if (!user.isActive) {
    recommendations.push('User account is inactive. Activate the account if needed.');
  }

  const deniedEndpoints = endpointAccess.filter(e => !e.hasAccess);
  if (deniedEndpoints.length > 0) {
    if (user.legacyRole === 'PROPERTY_MANAGER') {
      recommendations.push('Property Manager should have access to most property-scoped operations. Consider assigning "Property Manager" custom role or creating a custom role with broader permissions.');
    }
    
    if (deniedEndpoints.some(e => e.requiredPermission.includes('.read.'))) {
      recommendations.push('Missing read permissions. Consider granting broader read access for this role.');
    }
    
    if (deniedEndpoints.some(e => e.requiredPermission.includes('.update.'))) {
      recommendations.push('Missing update permissions. Verify if this user should have management privileges.');
    }
  }

  if (effectivePermissions.length === 0) {
    recommendations.push('User has no effective permissions. This indicates a critical role assignment issue.');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      legacyRole: user.role,
      customRoleName: user.customRole?.name || null,
      isActive: user.isActive
    },
    context: {
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId
    },
    permissions: {
      total: effectivePermissions.length,
      byScope: permissionsByScope,
      byCategory: permissionsByCategory,
      all: effectivePermissions
    },
    endpointAccess,
    recommendations
  };
}

async function suggestPermissionFixes(analysis: UserPermissionAnalysis): Promise<void> {
  console.log('\n🛠️  SUGGESTED FIXES:');
  console.log('===================');

  const deniedCriticalEndpoints = analysis.endpointAccess.filter(e => !e.hasAccess);

  if (deniedCriticalEndpoints.length === 0) {
    console.log('✅ No permission issues found for critical endpoints!');
    return;
  }

  // Check if user should have Property Manager role
  if (analysis.user.legacyRole === 'PROPERTY_MANAGER' && !analysis.user.customRoleName) {
    console.log('1. Assign Property Manager custom role:');
    console.log(`   npm run permissions:fix:production -- --update-users --force`);
    console.log('   OR');
    console.log(`   Direct assignment: UPDATE users SET custom_role_id = (SELECT id FROM custom_roles WHERE name = 'Property Manager' AND is_system_role = true) WHERE id = '${analysis.user.id}';`);
  }

  // Check if user needs platform admin temporarily
  if (deniedCriticalEndpoints.some(e => e.requiredPermission.includes('.all'))) {
    console.log('\n2. Temporarily grant Platform Admin access for testing:');
    console.log(`   npm run permissions:fix:production -- --grant-admin=${analysis.user.id} --force`);
  }

  // Specific permission grants
  console.log('\n3. Grant specific missing permissions:');
  const missingPermissions = deniedCriticalEndpoints.map(e => e.requiredPermission);
  const uniquePermissions = [...new Set(missingPermissions)];
  
  uniquePermissions.forEach(permission => {
    console.log(`   - ${permission}`);
  });

  // Database query to create custom role with specific permissions
  if (analysis.user.customRoleName) {
    console.log('\n4. Add missing permissions to existing custom role:');
    console.log('   This requires custom SQL or script to add specific permissions to the role.');
  } else {
    console.log('\n4. Create custom role with required permissions:');
    console.log('   Consider creating a custom "Property Manager Extended" role with additional permissions.');
  }
}

async function checkProductionEnvironment(): Promise<void> {
  console.log('🌐 Checking production environment configuration...');
  
  // Check if we're actually in production
  const nodeEnv = process.env.NODE_ENV;
  console.log(`  Environment: ${nodeEnv || 'undefined'}`);
  
  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('  ✅ Database connection successful');
  } catch (error) {
    console.log('  ❌ Database connection failed:', error);
    return;
  }

  // Check permission system setup
  const [permissionCount, roleCount] = await Promise.all([
    prisma.permission.count(),
    prisma.customRole.count({ where: { isSystemRole: true } })
  ]);

  console.log(`  Permissions: ${permissionCount}`);
  console.log(`  System Roles: ${roleCount}`);

  if (permissionCount === 0) {
    console.log('  ⚠️  No permissions found! Run permission seeding first.');
  }

  if (roleCount === 0) {
    console.log('  ⚠️  No system roles found! Run permission seeding first.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const identifier = args[0]; // Email or user ID
  const showAllPermissions = args.includes('--show-all-permissions');
  const jsonOutput = args.includes('--json');
  const checkEnv = args.includes('--check-env');

  try {
    console.log('🔍 User Permission Verification');
    console.log('==============================\n');

    if (checkEnv) {
      await checkProductionEnvironment();
      console.log('');
    }

    if (!identifier) {
      console.log('Usage: npm run permissions:verify:user -- <email_or_user_id> [options]');
      console.log('');
      console.log('Options:');
      console.log('  --show-all-permissions  Show all permissions granted to user');
      console.log('  --json                 Output as JSON');
      console.log('  --check-env           Check production environment setup');
      console.log('');
      console.log('Examples:');
      console.log('  npm run permissions:verify:user -- user@example.com');
      console.log('  npm run permissions:verify:user -- user-id-123 --show-all-permissions');
      console.log('  npm run permissions:verify:user -- user@example.com --json');
      process.exit(1);
    }

    const analysis = await analyzeUserPermissions(identifier);

    if (!analysis) {
      process.exit(1);
    }

    if (jsonOutput) {
      console.log(JSON.stringify(analysis, null, 2));
      process.exit(0);
    }

    // Human-readable output
    console.log('👤 USER INFORMATION:');
    console.log('===================');
    console.log(`Email: ${analysis.user.email}`);
    console.log(`Legacy Role: ${analysis.user.legacyRole}`);
    console.log(`Custom Role: ${analysis.user.customRoleName || 'None assigned'}`);
    console.log(`Active: ${analysis.user.isActive ? 'Yes' : 'No'}`);
    console.log(`Organization: ${analysis.context.organizationId || 'None'}`);
    console.log(`Property: ${analysis.context.propertyId || 'None'}`);
    console.log(`Department: ${analysis.context.departmentId || 'None'}`);

    console.log('\n🔐 PERMISSION SUMMARY:');
    console.log('=====================');
    console.log(`Total Permissions: ${analysis.permissions.total}`);
    
    console.log('\nBy Scope:');
    Object.entries(analysis.permissions.byScope).forEach(([scope, count]) => {
      console.log(`  ${scope}: ${count}`);
    });

    console.log('\nBy Category:');
    Object.entries(analysis.permissions.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    console.log('\n🎯 ENDPOINT ACCESS ANALYSIS:');
    console.log('============================');
    analysis.endpointAccess.forEach(endpoint => {
      const status = endpoint.hasAccess ? '✅ ALLOWED' : '❌ DENIED';
      console.log(`${status} ${endpoint.method} ${endpoint.endpoint}`);
      console.log(`    Required: ${endpoint.requiredPermission}`);
      console.log(`    Reason: ${endpoint.reason}`);
      console.log('');
    });

    if (showAllPermissions && analysis.permissions.all.length > 0) {
      console.log('📋 ALL GRANTED PERMISSIONS:');
      console.log('===========================');
      analysis.permissions.all.sort().forEach(permission => {
        console.log(`  ${permission}`);
      });
      console.log('');
    }

    if (analysis.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      console.log('==================');
      analysis.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log('');
    }

    // Show suggested fixes if there are access issues
    const hasAccessIssues = analysis.endpointAccess.some(e => !e.hasAccess);
    if (hasAccessIssues) {
      await suggestPermissionFixes(analysis);
    }

  } catch (error) {
    console.error('❌ Error verifying user permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage examples:
// npm run permissions:verify:user -- user@example.com
// npm run permissions:verify:user -- user-id-123 --show-all-permissions
// npm run permissions:verify:user -- user@example.com --json
// npm run permissions:verify:user -- user@example.com --check-env

main();