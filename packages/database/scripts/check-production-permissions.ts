import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface PermissionStats {
  totalPermissions: number;
  systemPermissions: number;
  customPermissions: number;
  categories: Record<string, number>;
  scopes: Record<string, number>;
}

interface RoleStats {
  totalCustomRoles: number;
  systemRoles: number;
  organizationRoles: number;
  propertyRoles: number;
  activeRoles: number;
  inactiveRoles: number;
}

interface RolePermissionStats {
  totalMappings: number;
  roleDistribution: Record<string, number>;
  permissionDistribution: Record<string, number>;
}

interface UserRoleAnalysis {
  userId: string;
  email: string;
  legacyRole: Role;
  customRoleId: string | null;
  customRoleName: string | null;
  organizationId: string | null;
  propertyId: string | null;
  departmentId: string | null;
  effectivePermissions: string[];
  isActive: boolean;
}

async function checkPermissions(): Promise<PermissionStats> {
  console.log('🔐 Checking permission data...');
  
  const permissions = await prisma.permission.findMany();
  
  const stats: PermissionStats = {
    totalPermissions: permissions.length,
    systemPermissions: permissions.filter(p => p.isSystem).length,
    customPermissions: permissions.filter(p => !p.isSystem).length,
    categories: {},
    scopes: {}
  };

  // Count by category
  permissions.forEach(p => {
    stats.categories[p.category] = (stats.categories[p.category] || 0) + 1;
    stats.scopes[p.scope] = (stats.scopes[p.scope] || 0) + 1;
  });

  return stats;
}

async function checkCustomRoles(): Promise<RoleStats> {
  console.log('🎭 Checking custom roles...');
  
  const roles = await prisma.customRole.findMany();
  
  const stats: RoleStats = {
    totalCustomRoles: roles.length,
    systemRoles: roles.filter(r => r.isSystemRole).length,
    organizationRoles: roles.filter(r => r.organizationId !== null).length,
    propertyRoles: roles.filter(r => r.propertyId !== null).length,
    activeRoles: roles.filter(r => r.isActive).length,
    inactiveRoles: roles.filter(r => !r.isActive).length
  };

  return stats;
}

async function checkRolePermissionMappings(): Promise<RolePermissionStats> {
  console.log('🔗 Checking role-permission mappings...');
  
  const mappings = await prisma.rolePermission.findMany({
    include: {
      role: true,
      permission: true
    }
  });
  
  const stats: RolePermissionStats = {
    totalMappings: mappings.length,
    roleDistribution: {},
    permissionDistribution: {}
  };

  // Count mappings per role
  mappings.forEach(m => {
    const roleName = m.role.name;
    stats.roleDistribution[roleName] = (stats.roleDistribution[roleName] || 0) + 1;
    
    const permissionKey = `${m.permission.resource}.${m.permission.action}.${m.permission.scope}`;
    stats.permissionDistribution[permissionKey] = (stats.permissionDistribution[permissionKey] || 0) + 1;
  });

  return stats;
}

async function analyzeUserRoles(userId?: string): Promise<UserRoleAnalysis[]> {
  console.log('👥 Analyzing user roles...');
  
  const whereClause = userId ? { id: userId } : {};
  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      customRole: {
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      },
      organization: true,
      property: true,
      department: true
    },
    take: userId ? undefined : 10 // Limit to 10 users if no specific user ID
  });

  const analyses: UserRoleAnalysis[] = [];

  for (const user of users) {
    const effectivePermissions: string[] = [];
    
    if (user.customRole) {
      user.customRole.rolePermissions.forEach(rp => {
        if (rp.granted) {
          effectivePermissions.push(
            `${rp.permission.resource}.${rp.permission.action}.${rp.permission.scope}`
          );
        }
      });
    }

    analyses.push({
      userId: user.id,
      email: user.email,
      legacyRole: user.role,
      customRoleId: user.customRoleId,
      customRoleName: user.customRole?.name || null,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId,
      effectivePermissions,
      isActive: user.isActive
    });
  }

  return analyses;
}

async function checkSpecificEndpoints(userId?: string): Promise<void> {
  console.log('🎯 Checking specific endpoint permissions...');
  
  const criticalEndpoints = [
    { endpoint: '/users/stats', requiredPermission: 'user.read.all' },
    { endpoint: '/departments/{id}', requiredPermission: 'department.update.property' },
    { endpoint: '/users/{id}/status', requiredPermission: 'user.update.property' },
    { endpoint: '/users/{id}/role', requiredPermission: 'role.assign.property' }
  ];

  if (userId) {
    const userAnalysis = await analyzeUserRoles(userId);
    const user = userAnalysis[0];
    
    if (user) {
      console.log(`\n🔍 Permission analysis for user: ${user.email}`);
      console.log(`  Legacy Role: ${user.legacyRole}`);
      console.log(`  Custom Role: ${user.customRoleName || 'None'}`);
      console.log(`  Organization: ${user.organizationId || 'None'}`);
      console.log(`  Property: ${user.propertyId || 'None'}`);
      console.log(`  Department: ${user.departmentId || 'None'}`);
      console.log(`  Total Permissions: ${user.effectivePermissions.length}`);
      
      console.log('\n📊 Endpoint Access Analysis:');
      criticalEndpoints.forEach(endpoint => {
        const hasPermission = user.effectivePermissions.includes(endpoint.requiredPermission);
        const status = hasPermission ? '✅ ALLOWED' : '❌ DENIED';
        console.log(`  ${endpoint.endpoint}: ${status} (${endpoint.requiredPermission})`);
      });
    }
  }
}

async function checkDataIntegrity(): Promise<void> {
  console.log('🔍 Checking data integrity...');
  
  // Check for orphaned role permissions
  const orphanedRolePermissions = await prisma.rolePermission.findMany({
    where: {
      OR: [
        { role: null },
        { permission: null }
      ]
    }
  });

  if (orphanedRolePermissions.length > 0) {
    console.log(`⚠️  Found ${orphanedRolePermissions.length} orphaned role-permission mappings`);
  }

  // Check for users without custom roles assigned
  const usersWithoutCustomRoles = await prisma.user.count({
    where: {
      customRoleId: null,
      role: {
        in: ['PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'ORGANIZATION_ADMIN']
      }
    }
  });

  if (usersWithoutCustomRoles > 0) {
    console.log(`⚠️  Found ${usersWithoutCustomRoles} users with legacy roles but no custom role assignment`);
  }

  // Check for inactive custom roles being used
  const usersWithInactiveRoles = await prisma.user.count({
    where: {
      customRole: {
        isActive: false
      }
    }
  });

  if (usersWithInactiveRoles > 0) {
    console.log(`⚠️  Found ${usersWithInactiveRoles} users assigned to inactive custom roles`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const userId = args.find(arg => arg.startsWith('--user='))?.split('=')[1];
  const detailed = args.includes('--detailed');
  const jsonOutput = args.includes('--json');

  try {
    console.log('🔍 Production Permission System Verification');
    console.log('==========================================\n');

    const [permissionStats, roleStats, mappingStats] = await Promise.all([
      checkPermissions(),
      checkCustomRoles(),
      checkRolePermissionMappings()
    ]);

    const userAnalyses = await analyzeUserRoles(userId);
    
    await checkSpecificEndpoints(userId);
    await checkDataIntegrity();

    if (jsonOutput) {
      // Output as JSON for programmatic processing
      const result = {
        timestamp: new Date().toISOString(),
        permissions: permissionStats,
        roles: roleStats,
        mappings: mappingStats,
        users: userAnalyses,
        status: 'completed'
      };
      console.log('\n📊 JSON OUTPUT:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      // Human-readable output
      console.log('\n📊 PERMISSION SYSTEM SUMMARY:');
      console.log('===============================');
      console.log(`Total Permissions: ${permissionStats.totalPermissions} (Expected: 81)`);
      console.log(`  - System: ${permissionStats.systemPermissions}`);
      console.log(`  - Custom: ${permissionStats.customPermissions}`);
      
      console.log('\nPermission Categories:');
      Object.entries(permissionStats.categories).forEach(([category, count]) => {
        console.log(`  - ${category}: ${count}`);
      });

      console.log('\nPermission Scopes:');
      Object.entries(permissionStats.scopes).forEach(([scope, count]) => {
        console.log(`  - ${scope}: ${count}`);
      });

      console.log(`\nTotal Custom Roles: ${roleStats.totalCustomRoles} (Expected: 7)`);
      console.log(`  - System Roles: ${roleStats.systemRoles}`);
      console.log(`  - Organization Roles: ${roleStats.organizationRoles}`);
      console.log(`  - Property Roles: ${roleStats.propertyRoles}`);
      console.log(`  - Active: ${roleStats.activeRoles}`);
      console.log(`  - Inactive: ${roleStats.inactiveRoles}`);

      console.log(`\nRole-Permission Mappings: ${mappingStats.totalMappings} (Expected: ~297)`);
      
      if (detailed) {
        console.log('\nTop Roles by Permission Count:');
        const sortedRoles = Object.entries(mappingStats.roleDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);
        sortedRoles.forEach(([role, count]) => {
          console.log(`  - ${role}: ${count} permissions`);
        });
      }

      console.log('\n👥 USER ANALYSIS:');
      console.log('=================');
      userAnalyses.forEach(user => {
        console.log(`User: ${user.email}`);
        console.log(`  Legacy Role: ${user.legacyRole}`);
        console.log(`  Custom Role: ${user.customRoleName || 'None'}`);
        console.log(`  Permissions: ${user.effectivePermissions.length}`);
        console.log(`  Active: ${user.isActive}`);
        console.log('');
      });
    }

    // Check for critical issues
    const issues: string[] = [];
    
    if (permissionStats.totalPermissions < 81) {
      issues.push(`Missing permissions: Expected 81, found ${permissionStats.totalPermissions}`);
    }
    
    if (roleStats.systemRoles < 7) {
      issues.push(`Missing system roles: Expected 7, found ${roleStats.systemRoles}`);
    }
    
    if (mappingStats.totalMappings < 200) {
      issues.push(`Insufficient role-permission mappings: Expected ~297, found ${mappingStats.totalMappings}`);
    }

    if (issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      console.log('=========================');
      issues.forEach(issue => console.log(`❌ ${issue}`));
      console.log('\nRun: npm run permissions:fix:production');
      process.exit(1);
    } else {
      console.log('\n✅ Permission system appears to be properly configured!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error checking production permissions:', error);
    if (jsonOutput) {
      console.log(JSON.stringify({ error: error.message, status: 'failed' }, null, 2));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage examples:
// npm run permissions:check:production
// npm run permissions:check:production -- --user=USER_ID_HERE
// npm run permissions:check:production -- --detailed
// npm run permissions:check:production -- --json

main();