import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * CRITICAL FIX: The permission system in apps/bff/src/shared/services/permission.service.ts
 * is NOT using the custom role permissions from the database. It's still using hardcoded
 * legacy role mappings, which is why users with PROPERTY_MANAGER role are getting 403 errors.
 * 
 * This script identifies the issue and provides the updated permission service code
 * that integrates with the custom role system.
 */

async function analyzeProblem() {
  console.log('🔍 CRITICAL PERMISSION SYSTEM ISSUE ANALYSIS');
  console.log('===========================================\n');

  // Check if custom role system is properly set up
  const [permissionCount, customRoleCount, roleMappingCount] = await Promise.all([
    prisma.permission.count(),
    prisma.customRole.count({ where: { isSystemRole: true } }),
    prisma.rolePermission.count()
  ]);

  console.log('📊 Database State:');
  console.log(`  Permissions: ${permissionCount}`);
  console.log(`  System Roles: ${customRoleCount}`);
  console.log(`  Role-Permission Mappings: ${roleMappingCount}`);

  // Check Property Manager role permissions
  const propertyManagerRole = await prisma.customRole.findFirst({
    where: { name: 'Property Manager', isSystemRole: true },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  console.log('\n🎭 Property Manager Role Analysis:');
  if (propertyManagerRole) {
    console.log(`  Role ID: ${propertyManagerRole.id}`);
    console.log(`  Permission Count: ${propertyManagerRole.permissions.length}`);
    
    const hasUserReadAll = propertyManagerRole.permissions.some(rp => 
      rp.permission.resource === 'user' && 
      rp.permission.action === 'read' && 
      rp.permission.scope === 'all'
    );
    
    const hasUserReadProperty = propertyManagerRole.permissions.some(rp => 
      rp.permission.resource === 'user' && 
      rp.permission.action === 'read' && 
      rp.permission.scope === 'property'
    );

    console.log(`  Has user.read.all: ${hasUserReadAll ? '✅' : '❌'}`);
    console.log(`  Has user.read.property: ${hasUserReadProperty ? '✅' : '❌'}`);

    if (!hasUserReadAll && !hasUserReadProperty) {
      console.log('  ⚠️  Property Manager has NO user read permissions!');
    }
  } else {
    console.log('  ❌ Property Manager role not found!');
  }

  // Check users with PROPERTY_MANAGER legacy role
  const propertyManagers = await prisma.user.findMany({
    where: { role: 'PROPERTY_MANAGER' },
    include: { 
      customRoles: {
        include: { role: true },
        where: { isActive: true }
      }
    },
    take: 5
  });

  console.log('\n👥 Property Manager Users:');
  propertyManagers.forEach(user => {
    console.log(`  ${user.email}:`);
    console.log(`    Legacy Role: ${user.role}`);
    const activeRole = user.customRoles.find(ur => ur.isActive);
    console.log(`    Custom Role: ${activeRole?.role?.name || 'None assigned'}`);
    console.log(`    Custom Role ID: ${activeRole?.roleId || 'None'}`);
  });

  const usersWithoutCustomRoles = await prisma.user.count({
    where: { 
      role: 'PROPERTY_MANAGER',
      customRoles: { none: { isActive: true } }
    }
  });

  console.log(`\n⚠️  Property Managers without custom roles: ${usersWithoutCustomRoles}`);

  console.log('\n🚨 ROOT CAUSE IDENTIFIED:');
  console.log('========================');
  console.log('1. The PermissionService.getRolePermissions() method uses hardcoded');
  console.log('   legacy role mappings instead of database custom roles');
  console.log('2. Users with PROPERTY_MANAGER role may not have custom roles assigned');
  console.log('3. The permission checking is bypassing the actual permission system');
  console.log('');
  console.log('SOLUTION: Update permission service to use database custom roles');
}

async function generateFixedPermissionService() {
  console.log('\n🛠️  GENERATING FIXED PERMISSION SERVICE CODE');
  console.log('==========================================\n');

  const fixedCode = `
// FIXED VERSION - Copy this to apps/bff/src/shared/services/permission.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Role, PrismaClient } from '@prisma/client';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Permission, PermissionObject, normalizePermission, matchesPermissionPattern } from '../decorators/require-permission.decorator';

export interface PermissionContext {
  user: CurrentUser;
  organizationId?: string;
  propertyId?: string;
  departmentId?: string;
  resourceOwnerId?: string;
  [key: string]: any;
}

export interface PermissionEvaluationResult {
  granted: boolean;
  reason?: string;
  scopeFilters?: Record<string, any>;
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private readonly prisma = new PrismaClient();
  private permissionCache = new Map<string, string[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Core permission evaluation logic - NOW USES DATABASE CUSTOM ROLES
   */
  async evaluatePermission(
    permission: Permission,
    context: PermissionContext,
  ): Promise<PermissionEvaluationResult> {
    try {
      const normalizedPermission = normalizePermission(permission);
      const { user } = context;

      this.logger.debug(\`Evaluating permission: \${JSON.stringify(normalizedPermission)} for user \${user.id} (\${user.role})\`);

      // Get user's effective permissions from database
      const userPermissions = await this.getUserPermissionsFromDatabase(user);
      
      // Check if user has the required permission
      const hasPermission = this.checkUserPermission(normalizedPermission, userPermissions, context);

      if (!hasPermission) {
        // Fallback to legacy role permissions for backwards compatibility
        const legacyPermissions = this.getLegacyRolePermissions(user.role);
        const hasLegacyPermission = this.checkRolePermission(normalizedPermission, legacyPermissions, context);
        
        if (!hasLegacyPermission) {
          return {
            granted: false,
            reason: \`User \${user.id} (role: \${user.role}, custom role: \${user.customRoleId || 'none'}) does not have permission \${JSON.stringify(normalizedPermission)}\`,
          };
        } else {
          this.logger.warn(\`User \${user.id} granted access via legacy role permissions. Consider updating to custom roles.\`);
        }
      }

      // Apply scope-based filtering
      const scopeFilters = this.generateScopeFilters(normalizedPermission, context);

      // Check additional conditions if present
      if (normalizedPermission.conditions) {
        const conditionsResult = await this.evaluateConditions(normalizedPermission.conditions, context);
        if (!conditionsResult.granted) {
          return conditionsResult;
        }
      }

      return {
        granted: true,
        scopeFilters,
      };
    } catch (error) {
      this.logger.error(\`Error evaluating permission: \${error.message}\`, error.stack);
      return {
        granted: false,
        reason: \`Permission evaluation error: \${error.message}\`,
      };
    }
  }

  /**
   * Get user permissions from database custom roles
   */
  private async getUserPermissionsFromDatabase(user: CurrentUser): Promise<string[]> {
    const cacheKey = \`user_perms_\${user.id}\`;
    const now = Date.now();

    // Check cache first
    if (this.permissionCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.permissionCache.get(cacheKey)!;
    }

    try {
      // Get user's active role assignments
      const userRoles = await this.prisma.userCustomRole.findMany({
        where: {
          userId: user.id,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          role: {
            include: {
              permissions: {
                where: { granted: true },
                include: { permission: true }
              }
            }
          }
        }
      });

      if (userRoles.length === 0) {
        this.logger.warn(\`User \${user.id} has no active custom roles assigned, falling back to legacy permissions\`);
        return [];
      }

      // Collect all permissions from all active roles
      const allPermissions: string[] = [];
      userRoles.forEach(userRole => {
        userRole.role.permissions.forEach(rp => {
          allPermissions.push(\`\${rp.permission.resource}.\${rp.permission.action}.\${rp.permission.scope}\`);
        });
      });

      const permissions = [...new Set(allPermissions)]; // Remove duplicates

      // permissions variable is already set above

      // Cache the result
      this.permissionCache.set(cacheKey, permissions);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

      this.logger.debug(\`User \${user.id} has \${permissions.length} database permissions\`);
      return permissions;
    } catch (error) {
      this.logger.error(\`Error fetching user permissions from database: \${error.message}\`);
      return [];
    }
  }

  /**
   * Check if user has permission using database permissions
   */
  private checkUserPermission(
    permission: PermissionObject,
    userPermissions: string[],
    context: PermissionContext,
  ): boolean {
    const permissionString = \`\${permission.resource}.\${permission.action}.\${permission.scope}\`;

    return userPermissions.some(userPermission => {
      const matches = this.matchesPermissionPattern(permissionString, userPermission);
      
      if (matches) {
        // Additional scope validation for certain roles
        if (context.user.role === Role.DEPARTMENT_ADMIN && permission.scope === 'property') {
          // Department admins can only access property-level reads, not writes
          return permission.action === 'read';
        }
      }

      return matches;
    });
  }

  /**
   * Enhanced permission pattern matching with scope hierarchy
   */
  private matchesPermissionPattern(required: string, granted: string): boolean {
    const [reqResource, reqAction, reqScope] = required.split('.');
    const [grantResource, grantAction, grantScope] = granted.split('.');

    // Check resource match (wildcard support)
    if (grantResource !== '*' && grantResource !== reqResource) {
      return false;
    }

    // Check action match (wildcard support)
    if (grantAction !== '*' && grantAction !== reqAction) {
      return false;
    }

    // Check scope hierarchy: all > organization > property > department > own
    const scopeHierarchy = ['own', 'department', 'property', 'organization', 'all'];
    const grantedLevel = scopeHierarchy.indexOf(grantScope);
    const requiredLevel = scopeHierarchy.indexOf(reqScope);

    // If granted scope is higher or equal in hierarchy, allow access
    return grantedLevel >= requiredLevel;
  }

  /**
   * Legacy role permissions (fallback only)
   */
  private getLegacyRolePermissions(role: Role): string[] {
    const rolePermissionMap: Record<Role, string[]> = {
      [Role.PLATFORM_ADMIN]: ['*.*.*'],
      [Role.ORGANIZATION_OWNER]: ['*.*.organization', '*.*.property', '*.*.department', '*.*.own'],
      [Role.ORGANIZATION_ADMIN]: ['*.read.organization', '*.update.organization', '*.create.property', '*.*.property', '*.*.department', '*.*.own'],
      [Role.PROPERTY_MANAGER]: ['*.*.property', '*.*.department', '*.*.own'],
      [Role.DEPARTMENT_ADMIN]: ['*.read.property', 'departments.read.property', '*.*.department', '*.*.own'],
      [Role.STAFF]: ['profile.read.department', 'documents.read.department', 'training.read.department', 'benefits.read.property', 'vacation.read.department', '*.*.own'],
    };

    return rolePermissionMap[role] || [];
  }

  // ... rest of the methods remain the same ...
  // (generateScopeFilters, evaluateConditions, etc.)
}`;

  console.log('📝 FIXED PERMISSION SERVICE CODE:');
  console.log('=================================');
  console.log(fixedCode);
}

async function main() {
  try {
    await analyzeProblem();
    await generateFixedPermissionService();

    console.log('\n💡 IMMEDIATE ACTION ITEMS:');
    console.log('=========================');
    console.log('1. Update permission.service.ts with the fixed code above');
    console.log('2. Assign custom roles to users without them:');
    console.log('   npm run permissions:fix:production -- --update-users --force');
    console.log('3. Verify Property Manager role has correct permissions:');
    console.log('   npm run permissions:verify:user -- user@example.com');
    console.log('4. Test the /users/stats endpoint after fixes');
    console.log('');
    console.log('🚨 CRITICAL: The permission system is currently broken because');
    console.log('   it is not using the custom role permissions from the database!');

  } catch (error) {
    console.error('❌ Error analyzing permission system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();