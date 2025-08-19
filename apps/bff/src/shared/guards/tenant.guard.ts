import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '../tenant/tenant-context.service';
import { TenantService } from '../tenant/tenant.service';

/**
 * Decorator to specify tenant access level required for an endpoint
 */
export const RequireTenantAccess = (
  level: 'organization' | 'property' | 'department',
  resourceIdParam?: string
) => SetMetadata('tenantAccess', { level, resourceIdParam });

/**
 * Decorator to allow cross-tenant access (only for platform admins)
 */
export const AllowCrossTenant = () => SetMetadata('allowCrossTenant', true);

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantService: TenantService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Skip validation if no user (should be handled by auth guards first)
    if (!request.user) {
      return true;
    }

    // Check if cross-tenant access is explicitly allowed (for platform admin endpoints)
    const allowCrossTenant = this.reflector.get<boolean>('allowCrossTenant', context.getHandler());
    if (allowCrossTenant) {
      this.logger.debug('Cross-tenant access allowed for this endpoint');
      return true;
    }

    // Get tenant access requirements from decorator
    const tenantAccess = this.reflector.get<{
      level: 'organization' | 'property' | 'department';
      resourceIdParam?: string;
    }>('tenantAccess', context.getHandler());

    // If no specific tenant access defined, apply default property-level validation
    if (!tenantAccess) {
      return this.validateDefaultAccess(request);
    }

    // Validate specific tenant access
    return this.validateTenantAccess(request, tenantAccess);
  }

  private async validateDefaultAccess(request: any): Promise<boolean> {
    try {
      const tenantContext = this.tenantContextService.getTenantContextSafe(request);
      
      if (!tenantContext) {
        this.logger.error('No tenant context available in guard validation');
        throw new ForbiddenException('Tenant context not available');
      }

      // Default validation ensures user context is properly set
      this.logger.debug(`Default tenant validation passed for user ${tenantContext.userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Default tenant validation failed: ${error.message}`);
      throw new ForbiddenException('Tenant access validation failed');
    }
  }

  private async validateTenantAccess(
    request: any,
    tenantAccess: {
      level: 'organization' | 'property' | 'department';
      resourceIdParam?: string;
    }
  ): Promise<boolean> {
    const { level, resourceIdParam } = tenantAccess;
    
    try {
      const tenantContext = this.tenantContextService.getTenantContext(request);
      const userId = tenantContext.userId;

      // Extract resource ID from request parameters if specified
      let resourceId: string | undefined;
      if (resourceIdParam) {
        resourceId = request.params[resourceIdParam] || request.query[resourceIdParam];
        
        if (!resourceId) {
          this.logger.warn(`Resource ID parameter '${resourceIdParam}' not found in request`);
          throw new ForbiddenException(`Resource ID required for tenant validation`);
        }
      }

      // Validate access based on level
      switch (level) {
        case 'organization':
          return this.validateOrganizationAccess(userId, resourceId);
        case 'property':
          return this.validatePropertyAccess(userId, resourceId);
        case 'department':
          return this.validateDepartmentAccess(userId, resourceId, request);
        default:
          this.logger.error(`Invalid tenant access level: ${level}`);
          throw new ForbiddenException('Invalid tenant access configuration');
      }
    } catch (error) {
      this.logger.error(`Tenant access validation failed: ${error.message}`);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Tenant access validation failed');
    }
  }

  private async validateOrganizationAccess(
    userId: string,
    organizationId?: string
  ): Promise<boolean> {
    // If no specific organization ID provided, user can access their own organization
    if (!organizationId) {
      return true;
    }

    const hasAccess = await this.tenantService.validateOrganizationAccess(userId, organizationId);
    
    if (!hasAccess) {
      this.logger.warn(`User ${userId} attempted to access organization ${organizationId} without permission`);
      throw new ForbiddenException('You do not have access to this organization');
    }

    this.logger.debug(`Organization access granted for user ${userId} to organization ${organizationId}`);
    return true;
  }

  private async validatePropertyAccess(
    userId: string,
    propertyId?: string
  ): Promise<boolean> {
    // If no specific property ID provided, user can access their own property
    if (!propertyId) {
      return true;
    }

    const hasAccess = await this.tenantService.validatePropertyAccess(userId, propertyId);
    
    if (!hasAccess) {
      this.logger.warn(`User ${userId} attempted to access property ${propertyId} without permission`);
      throw new ForbiddenException('You do not have access to this property');
    }

    this.logger.debug(`Property access granted for user ${userId} to property ${propertyId}`);
    return true;
  }

  private async validateDepartmentAccess(
    userId: string,
    departmentId?: string,
    request?: any
  ): Promise<boolean> {
    // If no specific department ID provided, use role-based access
    if (!departmentId) {
      const tenantContext = this.tenantContextService.getTenantContext(request);
      
      // Department admins and staff are limited to their own department
      if (this.tenantContextService.isDepartmentScoped(request)) {
        const userDeptId = this.tenantContextService.getDepartmentId(request);
        if (!userDeptId) {
          throw new ForbiddenException('User is not assigned to a department');
        }
      }
      
      return true;
    }

    const hasAccess = await this.tenantService.validateDepartmentAccess(userId, departmentId);
    
    if (!hasAccess) {
      this.logger.warn(`User ${userId} attempted to access department ${departmentId} without permission`);
      throw new ForbiddenException('You do not have access to this department');
    }

    this.logger.debug(`Department access granted for user ${userId} to department ${departmentId}`);
    return true;
  }
}

/**
 * Helper decorators for common tenant access patterns
 */

/**
 * Require access to organization (with optional organization ID parameter)
 */
export const RequireOrganizationAccess = (resourceIdParam?: string) => 
  RequireTenantAccess('organization', resourceIdParam);

/**
 * Require access to property (with optional property ID parameter)
 */
export const RequirePropertyAccess = (resourceIdParam?: string) => 
  RequireTenantAccess('property', resourceIdParam);

/**
 * Require access to department (with optional department ID parameter)
 */
export const RequireDepartmentAccess = (resourceIdParam?: string) => 
  RequireTenantAccess('department', resourceIdParam);

/**
 * Combined guard setup for common use cases
 */
export const UseTenantGuards = (...guards: any[]) => {
  // Always include TenantGuard as the last guard
  return SetMetadata('guards', [...guards, TenantGuard]);
};