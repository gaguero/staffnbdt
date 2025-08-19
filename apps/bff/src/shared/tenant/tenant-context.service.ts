import { Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface RequestTenantContext {
  userId: string;
  organizationId: string;
  propertyId: string;
  departmentId?: string;
  userRole: Role;
}

export interface TenantFilters {
  organizationId: string;
  propertyId: string;
  departmentId?: string;
}

/**
 * Singleton service that stores tenant context in request objects.
 * This ensures all database operations within a request are properly scoped to the tenant.
 * Note: This is now a regular singleton service that works with global interceptors.
 */
@Injectable()
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);

  /**
   * Set tenant context directly on the request object
   */
  async setTenantContext(context: RequestTenantContext, request?: any): Promise<void> {
    // Store context on request object if provided, otherwise this is just for validation
    if (request) {
      request.tenantContext = context;
    }
    this.logger.debug(`Tenant context set: org=${context.organizationId}, property=${context.propertyId}, user=${context.userId}`);
  }

  /**
   * Get tenant context from request object
   * @throws Error if no tenant context is set
   */
  getTenantContext(request: any): RequestTenantContext {
    const context = request?.tenantContext;
    if (!context) {
      throw new Error('Tenant context not set. Ensure TenantInterceptor is properly configured.');
    }
    return context;
  }

  /**
   * Get tenant context safely (returns null if not set)
   */
  getTenantContextSafe(request: any): RequestTenantContext | null {
    return request?.tenantContext || null;
  }

  /**
   * Get organization ID for the current request
   */
  getOrganizationId(request: any): string {
    return this.getTenantContext(request).organizationId;
  }

  /**
   * Get property ID for the current request
   */
  getPropertyId(request: any): string {
    return this.getTenantContext(request).propertyId;
  }

  /**
   * Get department ID for the current request (if user is assigned to a department)
   */
  getDepartmentId(request: any): string | undefined {
    return this.getTenantContext(request).departmentId;
  }

  /**
   * Get user ID for the current request
   */
  getUserId(request: any): string {
    return this.getTenantContext(request).userId;
  }

  /**
   * Get user role for the current request
   */
  getUserRole(request: any): Role {
    return this.getTenantContext(request).userRole;
  }

  /**
   * Get basic tenant filters that should be applied to all queries
   * This ensures data isolation between tenants
   */
  getBaseTenantFilters(request: any): TenantFilters {
    const context = this.getTenantContext(request);
    return {
      organizationId: context.organizationId,
      propertyId: context.propertyId,
      departmentId: context.departmentId,
    };
  }

  /**
   * Get tenant filters for organization-level queries
   */
  getOrganizationFilters(request: any): Pick<TenantFilters, 'organizationId'> {
    return {
      organizationId: this.getOrganizationId(request),
    };
  }

  /**
   * Get tenant filters for property-level queries
   */
  getPropertyFilters(request: any): Pick<TenantFilters, 'organizationId' | 'propertyId'> {
    const context = this.getTenantContext(request);
    return {
      organizationId: context.organizationId,
      propertyId: context.propertyId,
    };
  }

  /**
   * Get tenant filters for department-level queries
   * Only includes departmentId if the user belongs to a department
   */
  getDepartmentFilters(request: any): TenantFilters {
    const context = this.getTenantContext(request);
    const filters: TenantFilters = {
      organizationId: context.organizationId,
      propertyId: context.propertyId,
    };

    // Only add department filter if user has a department
    if (context.departmentId) {
      filters.departmentId = context.departmentId;
    }

    return filters;
  }

  /**
   * Check if current user can access multi-property resources
   * (Platform admins and organization owners can access multiple properties)
   */
  canAccessMultiProperty(request: any): boolean {
    const role = this.getUserRole(request);
    return role === Role.PLATFORM_ADMIN || role === Role.ORGANIZATION_OWNER;
  }

  /**
   * Check if current user can access multi-department resources within their property
   * (Property managers and above can access multiple departments)
   */
  canAccessMultiDepartment(request: any): boolean {
    const role = this.getUserRole(request);
    const multiDepartmentRoles: Role[] = [
      Role.PLATFORM_ADMIN,
      Role.ORGANIZATION_OWNER,
      Role.ORGANIZATION_ADMIN,
      Role.PROPERTY_MANAGER,
    ];
    return multiDepartmentRoles.includes(role);
  }

  /**
   * Check if current user is scoped to a specific department
   * (Department admins and staff are department-scoped)
   */
  isDepartmentScoped(request: any): boolean {
    const role = this.getUserRole(request);
    const departmentScopedRoles: Role[] = [Role.DEPARTMENT_ADMIN, Role.STAFF];
    return departmentScopedRoles.includes(role);
  }

  /**
   * Validate if user can access a specific organization
   */
  validateOrganizationAccess(organizationId: string, request: any): boolean {
    const currentOrgId = this.getOrganizationId(request);
    
    // Platform admins can access any organization
    if (this.getUserRole(request) === Role.PLATFORM_ADMIN) {
      return true;
    }

    // All other users can only access their organization
    return currentOrgId === organizationId;
  }

  /**
   * Validate if user can access a specific property
   */
  validatePropertyAccess(propertyId: string, request: any): boolean {
    const currentPropertyId = this.getPropertyId(request);
    
    // Platform admins can access any property
    if (this.getUserRole(request) === Role.PLATFORM_ADMIN) {
      return true;
    }

    // Organization owners/admins might access multiple properties (future feature)
    if (this.canAccessMultiProperty(request)) {
      // For now, still restrict to current property
      // TODO: Implement multi-property access validation
      return currentPropertyId === propertyId;
    }

    // All other users can only access their property
    return currentPropertyId === propertyId;
  }

  /**
   * Validate if user can access a specific department
   */
  validateDepartmentAccess(departmentId: string, request: any): boolean {
    // Users who can access multiple departments
    if (this.canAccessMultiDepartment(request)) {
      return true;
    }

    // Department-scoped users can only access their department
    const currentDepartmentId = this.getDepartmentId(request);
    return currentDepartmentId === departmentId;
  }

  /**
   * Log tenant context info for debugging
   */
  logContext(action: string, request: any): void {
    const context = this.getTenantContextSafe(request);
    if (context) {
      this.logger.debug(`${action} - User: ${context.userId}, Org: ${context.organizationId}, Property: ${context.propertyId}, Dept: ${context.departmentId || 'none'}, Role: ${context.userRole}`);
    } else {
      this.logger.warn(`${action} - No tenant context available`);
    }
  }
}