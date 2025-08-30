import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../permission.service';
import { Role } from '@prisma/client';
import { Permission, PermissionObject, normalizePermission } from '../../shared/decorators/require-permission.decorator';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export interface PermissionRequirement {
  resource: string;
  action: string;
  scope: string;
  operator?: 'AND' | 'OR'; // For multiple permissions
}

export const RequirePermissions = (...requirements: (string | PermissionRequirement)[]) => {
  const formatted = requirements.map(req => {
    if (typeof req === 'string') {
      const [resource, action, scope] = req.split('.');
      return { resource, action, scope, operator: 'AND' };
    }
    return { ...req, operator: req.operator || 'AND' };
  });
  return SetMetadata(PERMISSIONS_KEY, formatted);
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rawPermissions = this.reflector.getAllAndOverride(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rawPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false; // No authenticated user
    }

    // PLATFORM_ADMIN users have unrestricted access to all resources
    if (user.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    // Build evaluation context from request
    const evaluationContext = {
      userId: user.sub,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      departmentId: user.departmentId,
      resource: request.params?.id,
      resourceId: request.params?.id,
      userAgent: request.get('User-Agent'),
      ipAddress: request.ip,
    };

    // Detect permission format and normalize to PermissionRequirement[]
    let requiredPermissions: PermissionRequirement[];

    // Check if it's string array (Permission[] from @RequirePermission)
    if (Array.isArray(rawPermissions) && typeof rawPermissions[0] === 'string') {
      requiredPermissions = (rawPermissions as string[]).map(permission => {
        const normalizedPermission = normalizePermission(permission);
        return {
          resource: normalizedPermission.resource,
          action: normalizedPermission.action,
          scope: normalizedPermission.scope,
          operator: 'AND' as const
        };
      });
    }
    // Check if it's PermissionObject array
    else if (Array.isArray(rawPermissions) && typeof rawPermissions[0] === 'object' && 'resource' in rawPermissions[0]) {
      requiredPermissions = (rawPermissions as PermissionObject[]).map(permission => ({
        resource: permission.resource,
        action: permission.action,
        scope: permission.scope,
        operator: 'AND' as const
      }));
    }
    // Already PermissionRequirement[]
    else {
      requiredPermissions = rawPermissions as PermissionRequirement[];
    }

    // Check permissions
    const results = await Promise.all(
      requiredPermissions.map(async (permission) => {
        return this.permissionService.evaluatePermission(
          user.sub,
          permission.resource,
          permission.action,
          permission.scope,
          evaluationContext,
        );
      })
    );

    // Apply operator logic
    const hasAnyAnd = requiredPermissions.some(p => p.operator === 'AND');
    const hasAnyOr = requiredPermissions.some(p => p.operator === 'OR');

    if (hasAnyAnd && !hasAnyOr) {
      // All must be true (AND logic)
      return results.every(result => result.allowed);
    } else if (hasAnyOr && !hasAnyOr) {
      // At least one must be true (OR logic)
      return results.some(result => result.allowed);
    } else {
      // Mixed operators - default to AND
      return results.every(result => result.allowed);
    }
  }
}