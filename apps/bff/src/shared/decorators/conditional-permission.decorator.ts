import { SetMetadata } from '@nestjs/common';
import { Permission, ConditionalPermissionConfig, ConditionalPermission } from './require-permission.decorator';

// export const CONDITIONAL_PERMISSION_KEY = 'conditional_permission'; // Already exported in require-permission.decorator

/**
 * Decorator for complex permission checks with custom conditions
 * 
 * @example
 * @Patch(':id')
 * @ConditionalPermission({
 *   permission: 'users.update.department',
 *   condition: (ctx) => ctx.user.departmentId === ctx.params.departmentId || ctx.user.role === 'PLATFORM_ADMIN',
 *   description: 'Can only update users in same department or be platform admin',
 *   errorMessage: 'You can only update users in your own department'
 * })
 * async updateUser() { ... }
 */
// Moved to require-permission.decorator.ts to avoid circular imports

/**
 * Decorator for owner-only access with fallback permissions
 * 
 * @example
 * @Get(':id')
 * @OwnerOrPermission({
 *   ownerField: 'userId', // Field that contains the owner ID
 *   fallbackPermission: 'users.read.department', // Permission for non-owners
 *   description: 'Can access own resource or have department read permission'
 * })
 * async getResource() { ... }
 */
export const OwnerOrPermission = (config: {
  ownerField: string;
  fallbackPermission: Permission;
  description?: string;
  errorMessage?: string;
}) => {
  return ConditionalPermission({
    permission: config.fallbackPermission,
    condition: async (ctx) => {
      // If user is owner, allow access
      if (ctx.params[config.ownerField] === ctx.user.id) {
        return true;
      }
      // Otherwise check fallback permission (will be evaluated by PermissionGuard)
      return true; // Let the permission system handle the fallback
    },
    description: config.description || `Owner access or ${config.fallbackPermission}`,
    errorMessage: config.errorMessage || 'You can only access your own resources or have appropriate permissions',
  });
};

/**
 * Decorator for time-based permissions
 * 
 * @example
 * @Post()
 * @TimeBasedPermission({
 *   permission: 'vacation.create.own',
 *   condition: (ctx) => {
 *     const now = new Date();
 *     const workingHours = now.getHours() >= 9 && now.getHours() <= 17;
 *     return workingHours || ctx.user.role === 'DEPARTMENT_ADMIN';
 *   },
 *   description: 'Can create vacation requests during working hours or be admin',
 *   errorMessage: 'Vacation requests can only be created during working hours (9 AM - 5 PM)'
 * })
 * async createVacationRequest() { ... }
 */
export const TimeBasedPermission = (config: {
  permission: Permission;
  timeCondition: (ctx: any) => boolean;
  description?: string;
  errorMessage?: string;
}) => {
  return ConditionalPermission({
    permission: config.permission,
    condition: config.timeCondition,
    description: config.description || `Time-based access for ${config.permission}`,
    errorMessage: config.errorMessage || 'Access denied due to time restrictions',
  });
};

/**
 * Decorator for resource-state based permissions
 * 
 * @example
 * @Patch(':id/approve')
 * @StateBasedPermission({
 *   permission: 'vacation.approve.department',
 *   stateCondition: async (ctx) => {
 *     const vacation = await getVacationById(ctx.params.id);
 *     return vacation.status === 'PENDING';
 *   },
 *   description: 'Can only approve pending vacation requests',
 *   errorMessage: 'You can only approve vacation requests that are in pending status'
 * })
 * async approveVacation() { ... }
 */
export const StateBasedPermission = (config: {
  permission: Permission;
  stateCondition: (ctx: any) => boolean | Promise<boolean>;
  description?: string;
  errorMessage?: string;
}) => {
  return ConditionalPermission({
    permission: config.permission,
    condition: config.stateCondition,
    description: config.description || `State-based access for ${config.permission}`,
    errorMessage: config.errorMessage || 'Access denied due to resource state',
  });
};

/**
 * Decorator for department hierarchy permissions
 * 
 * @example
 * @Get(':departmentId/users')
 * @DepartmentHierarchyPermission({
 *   permission: 'users.read.department',
 *   allowSubDepartments: true, // Can access sub-departments
 *   allowParentDepartments: false, // Cannot access parent departments
 *   description: 'Can access own department and sub-departments'
 * })
 * async getDepartmentUsers() { ... }
 */
export const DepartmentHierarchyPermission = (config: {
  permission: Permission;
  allowSubDepartments?: boolean;
  allowParentDepartments?: boolean;
  description?: string;
  errorMessage?: string;
}) => {
  return ConditionalPermission({
    permission: config.permission,
    condition: async (ctx) => {
      const targetDepartmentId = ctx.params.departmentId;
      const userDepartmentId = ctx.user.departmentId;
      
      // If accessing own department, always allow
      if (targetDepartmentId === userDepartmentId) {
        return true;
      }
      
      // TODO: Implement department hierarchy check
      // This would require a service to check parent/child relationships
      // For now, just check if same department
      return false;
    },
    description: config.description || `Department hierarchy access for ${config.permission}`,
    errorMessage: config.errorMessage || 'Access denied - you can only access your department hierarchy',
  });
};