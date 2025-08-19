import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PermissionService, PermissionContext } from '../services/permission.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  PERMISSION_KEY,
  CONDITIONAL_PERMISSION_KEY,
  PERMISSION_SCOPE_KEY,
  Permission,
  ConditionalPermissionConfig,
} from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Get permission requirements from decorators
      const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
        PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

      const conditionalPermission = this.reflector.getAllAndOverride<ConditionalPermissionConfig>(
        CONDITIONAL_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

      const permissionScope = this.reflector.getAllAndOverride<string>(
        PERMISSION_SCOPE_KEY,
        [context.getHandler(), context.getClass()],
      );

      // If no permissions required, allow access
      if (!requiredPermissions && !conditionalPermission) {
        this.logger.debug('No permissions required, allowing access');
        return true;
      }

      // Get request context
      const request = context.switchToHttp().getRequest<Request>();
      const user = request.user as CurrentUser;

      if (!user) {
        this.logger.warn('No user found in request context');
        throw new ForbiddenException('Authentication required');
      }

      // Create permission context
      const permissionContext: PermissionContext = this.permissionService.createPermissionContext(
        user,
        request.params,
        request.body,
        request.query,
      );

      // Log permission check
      this.logger.debug(
        `Checking permissions for user ${user.id} (${user.role}) - Required: ${JSON.stringify(requiredPermissions)}, Conditional: ${JSON.stringify(conditionalPermission?.permission)}`,
      );

      // Check regular permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        const permissionResult = await this.permissionService.evaluatePermissions(
          requiredPermissions,
          permissionContext,
        );

        if (!permissionResult.granted) {
          this.logger.warn(
            `Permission denied for user ${user.id}: ${permissionResult.reason}`,
          );
          throw new ForbiddenException(
            `Access denied: ${permissionResult.reason || 'Insufficient permissions'}`,
          );
        }

        // Attach scope filters to request for later use in services
        if (permissionResult.scopeFilters) {
          request['permissionFilters'] = permissionResult.scopeFilters;
        }

        this.logger.debug(`Permission granted for user ${user.id}`);
      }

      // Check conditional permissions
      if (conditionalPermission) {
        const basePermissionResult = await this.permissionService.evaluatePermission(
          conditionalPermission.permission,
          permissionContext,
        );

        if (!basePermissionResult.granted) {
          this.logger.warn(
            `Base permission denied for user ${user.id}: ${basePermissionResult.reason}`,
          );
          throw new ForbiddenException(
            `Access denied: ${basePermissionResult.reason || 'Insufficient permissions'}`,
          );
        }

        // Evaluate custom condition
        try {
          const conditionResult = await conditionalPermission.condition(permissionContext);
          if (!conditionResult) {
            this.logger.warn(
              `Conditional permission failed for user ${user.id}: ${conditionalPermission.description || 'Custom condition not met'}`,
            );
            throw new ForbiddenException(
              `Access denied: ${conditionalPermission.description || 'Custom condition not met'}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error evaluating conditional permission: ${error.message}`,
            error.stack,
          );
          throw new ForbiddenException('Permission evaluation error');
        }

        this.logger.debug(`Conditional permission granted for user ${user.id}`);
      }

      // Apply automatic scope filtering if specified
      if (permissionScope) {
        const scopeFilters = this.generateAutomaticScopeFilters(user, permissionScope);
        if (scopeFilters) {
          request['permissionFilters'] = {
            ...request['permissionFilters'],
            ...scopeFilters,
          };
        }
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Unexpected error in PermissionGuard: ${error.message}`, error.stack);
      throw new ForbiddenException('Permission check failed');
    }
  }

  /**
   * Generate automatic scope filters based on user context
   */
  private generateAutomaticScopeFilters(
    user: CurrentUser,
    scope: string,
  ): Record<string, any> | null {
    switch (scope) {
      case 'organization':
        return user.organizationId ? { organizationId: user.organizationId } : null;

      case 'property':
        return user.propertyId ? { propertyId: user.propertyId } : null;

      case 'department':
        return user.departmentId ? { departmentId: user.departmentId } : null;

      case 'own':
        return { userId: user.id };

      default:
        this.logger.warn(`Unknown permission scope: ${scope}`);
        return null;
    }
  }
}

/**
 * Helper function to get permission filters from request
 * Use this in services to apply automatic filtering
 */
export function getPermissionFilters(request: any): Record<string, any> {
  return request?.permissionFilters || {};
}

/**
 * Helper function to apply permission filters to Prisma queries
 */
export function applyPermissionFilters<T extends Record<string, any>>(
  where: T,
  request: any,
): T {
  const filters = getPermissionFilters(request);
  return {
    ...where,
    ...filters,
  };
}