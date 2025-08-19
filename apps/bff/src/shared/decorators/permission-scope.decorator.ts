import { SetMetadata } from '@nestjs/common';
import { PERMISSION_SCOPE_KEY } from './require-permission.decorator';

/**
 * Decorator to automatically apply scope-based filtering to query results
 * This is useful for endpoints that should automatically filter results 
 * based on the user's organizational context
 * 
 * @example
 * @Get()
 * @PermissionScope('property') // Will automatically filter by user's propertyId
 * async findAll() { ... }
 * 
 * @example 
 * @Get()
 * @PermissionScope('department') // Will automatically filter by user's departmentId
 * async findDepartmentUsers() { ... }
 */
// Moved to require-permission.decorator.ts to avoid circular imports

/**
 * Decorator for endpoints that require multiple scope filters
 * 
 * @example
 * @Get()
 * @MultipleScopes(['organization', 'property']) // Apply both org and property filters
 * async findResources() { ... }
 */
export const MultipleScopes = (scopes: string[]) =>
  SetMetadata(PERMISSION_SCOPE_KEY, scopes);

/**
 * Decorator to bypass automatic scope filtering
 * Useful when you need manual control over filtering
 * 
 * @example
 * @Get()
 * @RequirePermission('users.read.platform')
 * @NoAutoScope() // Don't apply automatic filtering
 * async findAllUsers() {
 *   // Manual filtering in service
 * }
 */
export const NoAutoScope = () => SetMetadata(PERMISSION_SCOPE_KEY, 'none');