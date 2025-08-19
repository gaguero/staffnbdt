import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  
  // Feature flag for gradual migration to permission system
  private readonly usePermissionSystem = process.env.USE_PERMISSION_SYSTEM === 'true';

  constructor(
    private reflector: Reflector,
    private permissionService?: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check if this endpoint uses the new permission system
    const hasPermissionDecorator = this.reflector.getAllAndOverride<any>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If new permission system is active and endpoint has @RequirePermission, skip role check
    if (this.usePermissionSystem && hasPermissionDecorator) {
      this.logger.debug('Skipping role check - endpoint uses new permission system');
      return true;
    }

    if (!requiredRoles) {
      return true;
    }

    const { user }: { user: CurrentUser } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    const hasRole = requiredRoles.includes(user.role);
    
    // If using permission system as fallback, try to map roles to permissions
    if (!hasRole && this.usePermissionSystem && this.permissionService) {
      return this.checkRoleBasedPermissions(requiredRoles, user, context);
    }

    return hasRole;
  }

  /**
   * Backwards compatibility: Map legacy @Roles to equivalent permissions
   */
  private async checkRoleBasedPermissions(
    requiredRoles: Role[],
    user: CurrentUser,
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      // Map roles to equivalent permissions based on the endpoint
      const equivalentPermissions = this.mapRolesToPermissions(requiredRoles, context);
      
      if (equivalentPermissions.length === 0) {
        return false;
      }

      const request = context.switchToHttp().getRequest();
      const permissionContext = this.permissionService.createPermissionContext(
        user,
        request.params,
        request.body,
        request.query,
      );

      const result = await this.permissionService.evaluatePermissions(
        equivalentPermissions,
        permissionContext,
      );

      if (result.granted) {
        this.logger.debug(`Role-based permission granted via permission system for user ${user.id}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error in role-based permission check: ${error.message}`);
      return false;
    }
  }

  /**
   * Map legacy roles to equivalent permissions
   */
  private mapRolesToPermissions(requiredRoles: Role[], context: ExecutionContext): string[] {
    const permissions: string[] = [];
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    
    // Extract resource and action from controller and handler names
    const resource = this.extractResourceFromController(controllerName);
    const action = this.extractActionFromHandler(handlerName);
    
    if (!resource || !action) {
      this.logger.warn(`Could not map controller ${controllerName}.${handlerName} to permissions`);
      return [];
    }

    // Map each role to appropriate scope
    for (const role of requiredRoles) {
      const scope = this.mapRoleToScope(role);
      if (scope) {
        permissions.push(`${resource}.${action}.${scope}`);
      }
    }

    return permissions;
  }

  private extractResourceFromController(controllerName: string): string | null {
    const match = controllerName.match(/^(\w+)Controller$/);
    if (match) {
      return match[1].toLowerCase();
    }
    return null;
  }

  private extractActionFromHandler(handlerName: string): string | null {
    const actionMap: Record<string, string> = {
      'create': 'create',
      'findAll': 'read',
      'findOne': 'read',
      'update': 'update',
      'remove': 'delete',
      'delete': 'delete',
      'changeRole': 'change_role',
      'changeStatus': 'update',
      'changeDepartment': 'update',
      'restore': 'restore',
      'approve': 'approve',
      'reject': 'reject',
      'import': 'import',
      'export': 'export',
    };

    return actionMap[handlerName] || 'read';
  }

  private mapRoleToScope(role: Role): string | null {
    const scopeMap: Record<Role, string> = {
      [Role.PLATFORM_ADMIN]: 'platform',
      [Role.ORGANIZATION_OWNER]: 'organization',
      [Role.ORGANIZATION_ADMIN]: 'organization',
      [Role.PROPERTY_MANAGER]: 'property',
      [Role.DEPARTMENT_ADMIN]: 'department',
      [Role.STAFF]: 'own',
    };

    return scopeMap[role] || null;
  }
}