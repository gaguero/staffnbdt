import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RoleUsage {
  file: string;
  line: number;
  endpoint: string;
  method: string;
  roles: Role[];
  suggestedPermission?: string;
}

interface ValidationResult {
  totalEndpoints: number;
  coveredEndpoints: number;
  uncoveredEndpoints: RoleUsage[];
  duplicatePermissions: string[];
  unusedPermissions: string[];
  summary: {
    coveragePercentage: number;
    moduleBreakdown: Record<string, number>;
    roleUsageCount: Record<Role, number>;
  };
}

/**
 * Validates that all @Roles usage in the codebase has corresponding permissions
 * and identifies any gaps or duplicates in the permission system.
 */

// Known permissions from seed-permissions.ts
const KNOWN_PERMISSIONS = new Set([
  // Users module
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
  
  // Departments module
  'departments.create.platform',
  'departments.read.stats.overall',
  'departments.read.stats.specific',
  'departments.update.platform',
  'departments.delete.platform',
  
  // Invitations module
  'invitations.create.department',
  'invitations.read.department',
  'invitations.read.stats',
  'invitations.resend.department',
  'invitations.cancel.department',
  'invitations.cleanup.platform',
  
  // Profile module
  'profiles.read.others',
  'profiles.read.id_documents',
  'profiles.verify.id_documents',
  'profiles.read.id_status',
  
  // Benefits module
  'benefits.create.platform',
  'benefits.update.platform',
  'benefits.delete.platform',
  
  // Payroll module
  'payroll.import.platform',
  'payroll.read.stats',
  
  // Front desk modules
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
  
  // Operations module
  'tasks.create.property',
  'tasks.read.department',
  'tasks.read.overdue',
  'tasks.read.statistics',
  'tasks.update.property',
  'tasks.assign.property',
  'tasks.delete.property',
  
  // Self-service
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
]);

// Mapping from endpoint patterns to permissions
const ENDPOINT_TO_PERMISSION_MAP: Record<string, string> = {
  // Users endpoints
  'POST /users': 'users.create.platform',
  'GET /users/stats': 'users.read.stats',
  'GET /users/department/:id': 'users.read.department',
  'DELETE /users/:id': 'users.delete.platform',
  'POST /users/:id/restore': 'users.restore.platform',
  'PATCH /users/:id/role': 'users.update.role',
  'PATCH /users/:id/status': 'users.update.status',
  'PATCH /users/:id/department': 'users.update.department',
  'DELETE /users/:id/department': 'users.remove.department',
  'DELETE /users/:id/permanent': 'users.delete.permanent',
  'POST /users/bulk': 'users.create.bulk',
  'POST /users/import/csv': 'users.import.csv',
  'GET /users/export/csv': 'users.export.csv',
  'GET /users/export/template': 'users.download.template',
  
  // Departments endpoints
  'POST /departments': 'departments.create.platform',
  'GET /departments/stats/overall': 'departments.read.stats.overall',
  'GET /departments/:id/stats': 'departments.read.stats.specific',
  'PATCH /departments/:id': 'departments.update.platform',
  'DELETE /departments/:id': 'departments.delete.platform',
  
  // Invitations endpoints
  'POST /invitations': 'invitations.create.department',
  'GET /invitations': 'invitations.read.department',
  'GET /invitations/stats': 'invitations.read.stats',
  'POST /invitations/:id/resend': 'invitations.resend.department',
  'DELETE /invitations/:id': 'invitations.cancel.department',
  'POST /invitations/cleanup-expired': 'invitations.cleanup.platform',
  
  // Profile endpoints
  'GET /profile/:id': 'profiles.read.others',
  'GET /profile/id/:userId': 'profiles.read.id_documents',
  'POST /profile/id/:userId/verify': 'profiles.verify.id_documents',
  'GET /profile/id/:userId/status': 'profiles.read.id_status',
  
  // Benefits endpoints
  'POST /benefits': 'benefits.create.platform',
  'PATCH /benefits/:id': 'benefits.update.platform',
  'DELETE /benefits/:id': 'benefits.delete.platform',
  
  // Payroll endpoints
  'POST /payroll/import': 'payroll.import.platform',
  'GET /payroll/stats': 'payroll.read.stats',
  
  // Guests endpoints
  'POST /guests': 'guests.create.property',
  'PATCH /guests/:id': 'guests.update.property',
  'DELETE /guests/:id': 'guests.delete.property',
  
  // Units endpoints
  'POST /units': 'units.create.property',
  'PATCH /units/:id': 'units.update.property',
  'PUT /units/:id/status': 'units.update.status',
  'DELETE /units/:id': 'units.delete.property',
  
  // Reservations endpoints
  'POST /reservations': 'reservations.create.property',
  'PATCH /reservations/:id': 'reservations.update.property',
  'PUT /reservations/:id/status': 'reservations.update.status',
  'PUT /reservations/:id/check-in': 'reservations.checkin.property',
  'PUT /reservations/:id/check-out': 'reservations.checkout.property',
  'DELETE /reservations/:id': 'reservations.delete.property',
  
  // Tasks endpoints
  'POST /tasks': 'tasks.create.property',
  'GET /tasks/department/:id': 'tasks.read.department',
  'GET /tasks/overdue': 'tasks.read.overdue',
  'GET /tasks/statistics/:id': 'tasks.read.statistics',
  'PATCH /tasks/:id': 'tasks.update.property',
  'PUT /tasks/:id/assign': 'tasks.assign.property',
  'DELETE /tasks/:id': 'tasks.delete.property',
};

async function parseCodebaseForRoles(bffPath: string): Promise<RoleUsage[]> {
  console.log('🔍 Scanning codebase for @Roles usage...');
  
  const roleUsages: RoleUsage[] = [];
  
  function scanDirectory(dirPath: string) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.controller.ts')) {
        scanControllerFile(fullPath);
      }
    }
  }
  
  function scanControllerFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for @Roles decorator
      if (line.trim().startsWith('@Roles')) {
        const nextLines = lines.slice(i + 1, i + 5);
        const endpoint = extractEndpointInfo(lines, i);
        
        if (endpoint) {
          const roles = extractRoles(line);
          const endpointKey = `${endpoint.method} ${endpoint.path}`;
          const suggestedPermission = ENDPOINT_TO_PERMISSION_MAP[endpointKey];
          
          roleUsages.push({
            file: path.relative(bffPath, filePath),
            line: i + 1,
            endpoint: endpointKey,
            method: endpoint.method,
            roles,
            suggestedPermission,
          });
        }
      }
    }
  }
  
  function extractEndpointInfo(lines: string[], rolesLineIndex: number): { method: string; path: string } | null {
    // Look for HTTP method decorator before or after @Roles
    for (let i = Math.max(0, rolesLineIndex - 3); i < Math.min(lines.length, rolesLineIndex + 5); i++) {
      const line = lines[i].trim();
      
      // Match HTTP method decorators
      const methodMatch = line.match(/@(Get|Post|Put|Patch|Delete)\s*\(?\s*['"`]?([^'"`\)]*)/);
      if (methodMatch) {
        const method = methodMatch[1].toUpperCase();
        const path = methodMatch[2] || '';
        return { method, path: path.startsWith('/') ? path : `/${path}` };
      }
    }
    
    return null;
  }
  
  function extractRoles(rolesLine: string): Role[] {
    const roleNames = rolesLine.match(/Role\.(\w+)/g) || [];
    return roleNames.map(r => r.replace('Role.', '') as Role);
  }
  
  scanDirectory(bffPath);
  console.log(`✅ Found ${roleUsages.length} @Roles usages`);
  
  return roleUsages;
}

async function validatePermissionCoverage(roleUsages: RoleUsage[]): Promise<ValidationResult> {
  console.log('📊 Validating permission coverage...');
  
  const uncoveredEndpoints: RoleUsage[] = [];
  const duplicatePermissions: string[] = [];
  const permissionUsage = new Map<string, number>();
  
  // Check coverage and count usage
  for (const usage of roleUsages) {
    if (!usage.suggestedPermission) {
      uncoveredEndpoints.push(usage);
    } else {
      const count = permissionUsage.get(usage.suggestedPermission) || 0;
      permissionUsage.set(usage.suggestedPermission, count + 1);
      
      if (count > 0) {
        duplicatePermissions.push(usage.suggestedPermission);
      }
    }
  }
  
  // Find unused permissions
  const usedPermissions = new Set(Array.from(permissionUsage.keys()));
  const unusedPermissions = Array.from(KNOWN_PERMISSIONS).filter(p => !usedPermissions.has(p));
  
  // Calculate coverage
  const coveredEndpoints = roleUsages.length - uncoveredEndpoints.length;
  const coveragePercentage = (coveredEndpoints / roleUsages.length) * 100;
  
  // Module breakdown
  const moduleBreakdown: Record<string, number> = {};
  for (const usage of roleUsages) {
    const module = usage.file.split('/')[0] || 'unknown';
    moduleBreakdown[module] = (moduleBreakdown[module] || 0) + 1;
  }
  
  // Role usage count
  const roleUsageCount: Record<Role, number> = {} as Record<Role, number>;
  for (const usage of roleUsages) {
    for (const role of usage.roles) {
      roleUsageCount[role] = (roleUsageCount[role] || 0) + 1;
    }
  }
  
  return {
    totalEndpoints: roleUsages.length,
    coveredEndpoints,
    uncoveredEndpoints,
    duplicatePermissions: Array.from(new Set(duplicatePermissions)),
    unusedPermissions,
    summary: {
      coveragePercentage,
      moduleBreakdown,
      roleUsageCount,
    },
  };
}

async function generateValidationReport(result: ValidationResult): Promise<void> {
  console.log('\n📋 Permission Coverage Validation Report');
  console.log('========================================');
  
  console.log(`\n📊 Coverage Summary:`);
  console.log(`   Total endpoints: ${result.totalEndpoints}`);
  console.log(`   Covered endpoints: ${result.coveredEndpoints}`);
  console.log(`   Coverage percentage: ${result.summary.coveragePercentage.toFixed(1)}%`);
  
  console.log(`\n📂 Module Breakdown:`);
  Object.entries(result.summary.moduleBreakdown).forEach(([module, count]) => {
    console.log(`   ${module}: ${count} endpoints`);
  });
  
  console.log(`\n👥 Role Usage Count:`);
  Object.entries(result.summary.roleUsageCount).forEach(([role, count]) => {
    console.log(`   ${role}: ${count} usages`);
  });
  
  if (result.uncoveredEndpoints.length > 0) {
    console.log(`\n❌ Uncovered Endpoints (${result.uncoveredEndpoints.length}):`);
    result.uncoveredEndpoints.forEach(endpoint => {
      console.log(`   ${endpoint.file}:${endpoint.line} - ${endpoint.endpoint}`);
      console.log(`      Roles: ${endpoint.roles.join(', ')}`);
    });
  }
  
  if (result.duplicatePermissions.length > 0) {
    console.log(`\n⚠️  Duplicate Permission Mappings (${result.duplicatePermissions.length}):`);
    result.duplicatePermissions.forEach(permission => {
      console.log(`   ${permission}`);
    });
  }
  
  if (result.unusedPermissions.length > 0) {
    console.log(`\n🔍 Unused Permissions (${result.unusedPermissions.length}):`);
    result.unusedPermissions.forEach(permission => {
      console.log(`   ${permission}`);
    });
  }
  
  if (result.summary.coveragePercentage === 100) {
    console.log('\n✅ Perfect coverage! All endpoints have corresponding permissions.');
  } else {
    console.log(`\n⚠️  Coverage incomplete: ${result.uncoveredEndpoints.length} endpoints need permission mappings.`);
  }
}

async function suggestMissingPermissions(uncoveredEndpoints: RoleUsage[]): Promise<void> {
  if (uncoveredEndpoints.length === 0) return;
  
  console.log('\n💡 Suggested Permission Mappings:');
  console.log('================================');
  
  uncoveredEndpoints.forEach(endpoint => {
    const parts = endpoint.endpoint.split(' ');
    const method = parts[0].toLowerCase();
    const path = parts[1];
    
    // Suggest permission based on path and method
    const resource = extractResourceFromPath(path);
    const action = mapMethodToAction(method);
    const scope = suggestScopeFromRoles(endpoint.roles);
    
    const suggestedPermission = `${resource}.${action}.${scope}`;
    
    console.log(`\n${endpoint.endpoint}:`);
    console.log(`  File: ${endpoint.file}:${endpoint.line}`);
    console.log(`  Current roles: ${endpoint.roles.join(', ')}`);
    console.log(`  Suggested permission: ${suggestedPermission}`);
    console.log(`  Add to ENDPOINT_TO_PERMISSION_MAP:`);
    console.log(`    '${endpoint.endpoint}': '${suggestedPermission}',`);
  });
}

function extractResourceFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    return segments[0].toLowerCase();
  }
  return 'unknown';
}

function mapMethodToAction(method: string): string {
  const mapping: Record<string, string> = {
    'get': 'read',
    'post': 'create',
    'put': 'update',
    'patch': 'update',
    'delete': 'delete',
  };
  return mapping[method] || method;
}

function suggestScopeFromRoles(roles: Role[]): string {
  if (roles.includes(Role.PLATFORM_ADMIN) && roles.length === 1) {
    return 'platform';
  }
  if (roles.includes(Role.ORGANIZATION_OWNER) || roles.includes(Role.ORGANIZATION_ADMIN)) {
    return 'organization';
  }
  if (roles.includes(Role.PROPERTY_MANAGER)) {
    return 'property';
  }
  if (roles.includes(Role.DEPARTMENT_ADMIN)) {
    return 'department';
  }
  return 'property'; // Default fallback
}

async function main() {
  console.log('🔍 Starting permission coverage validation...');
  
  try {
    const bffPath = path.join(process.cwd(), '../../apps/bff/src');
    
    if (!fs.existsSync(bffPath)) {
      throw new Error(`BFF source path not found: ${bffPath}`);
    }
    
    // Step 1: Parse codebase for @Roles usage
    const roleUsages = await parseCodebaseForRoles(bffPath);
    
    // Step 2: Validate permission coverage
    const validationResult = await validatePermissionCoverage(roleUsages);
    
    // Step 3: Generate report
    await generateValidationReport(validationResult);
    
    // Step 4: Suggest missing permissions
    await suggestMissingPermissions(validationResult.uncoveredEndpoints);
    
    console.log('\n✅ Validation completed!');
    
    // Exit with error code if coverage is incomplete
    if (validationResult.summary.coveragePercentage < 100) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}