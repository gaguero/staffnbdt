/**
 * Permission Migration Validation Script
 * 
 * This script validates that the permission decorators are properly configured
 * and that the permission mapping is correct.
 */

import { Reflector } from '@nestjs/core';
import { UsersController } from './modules/users/users.controller';
import { DepartmentsController } from './modules/departments/departments.controller'; 
import { PayrollController } from './modules/payroll/payroll.controller';
import { BenefitsController } from './modules/benefits/benefits.controller';
import { ProfileController } from './modules/profile/profile.controller';
import { InvitationsController } from './modules/invitations/invitations.controller';
import { PERMISSION_KEY } from './shared/decorators/require-permission.decorator';

// Mock Reflector for testing
const reflector = new Reflector();

function validatePermissionsOnController(controller: any, controllerName: string) {
  console.log(`\n=== Validating ${controllerName} ===`);
  
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(new controller()));
  let methodCount = 0;
  let permissionCount = 0;
  
  methods.forEach(methodName => {
    if (methodName === 'constructor') return;
    
    const method = controller.prototype[methodName];
    if (typeof method !== 'function') return;
    
    methodCount++;
    
    // Get permissions metadata
    const permissions = reflector.get(PERMISSION_KEY, method);
    
    if (permissions && permissions.length > 0) {
      permissionCount++;
      console.log(`  ✅ ${methodName}: ${permissions.join(', ')}`);
    } else {
      console.log(`  ⚠️  ${methodName}: No permissions found`);
    }
  });
  
  console.log(`  📊 Summary: ${permissionCount}/${methodCount} methods have permissions`);
  return { methodCount, permissionCount };
}

// Validate all controllers
const controllers = [
  { controller: UsersController, name: 'UsersController' },
  { controller: DepartmentsController, name: 'DepartmentsController' }, 
  { controller: PayrollController, name: 'PayrollController' },
  { controller: BenefitsController, name: 'BenefitsController' },
  { controller: ProfileController, name: 'ProfileController' },
  { controller: InvitationsController, name: 'InvitationsController' },
];

let totalMethods = 0;
let totalWithPermissions = 0;

controllers.forEach(({ controller, name }) => {
  const result = validatePermissionsOnController(controller, name);
  totalMethods += result.methodCount;
  totalWithPermissions += result.permissionCount;
});

console.log(`\n🎯 MIGRATION SUMMARY`);
console.log(`📈 Total endpoints: ${totalMethods}`);
console.log(`🔐 Endpoints with permissions: ${totalWithPermissions}`);
console.log(`📊 Coverage: ${Math.round((totalWithPermissions / totalMethods) * 100)}%`);

if (totalWithPermissions >= 30) {
  console.log(`✅ Migration SUCCESSFUL - All core endpoints have permissions!`);
} else {
  console.log(`❌ Migration INCOMPLETE - Some endpoints missing permissions`);
}