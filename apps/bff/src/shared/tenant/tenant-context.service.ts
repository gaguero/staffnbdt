import { Injectable, Scope, Logger } from '@nestjs/common';
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
 * Request-scoped service that holds tenant context for the current request.
 * This ensures all database operations within a request are properly scoped to the tenant.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  private tenantContext: RequestTenantContext | null = null;

  /**
   * Set tenant context for the current request
   */
  async setTenantContext(context: RequestTenantContext): Promise<void> {
    this.tenantContext = context;
    this.logger.debug(`Tenant context set: org=${context.organizationId}, property=${context.propertyId}, user=${context.userId}`);
  }

  /**
   * Get current tenant context
   * @throws Error if no tenant context is set
   */
  getTenantContext(): RequestTenantContext {
    if (!this.tenantContext) {
      throw new Error('Tenant context not set. Ensure TenantInterceptor is properly configured.');
    }
    return this.tenantContext;
  }

  /**
   * Get tenant context safely (returns null if not set)
   */
  getTenantContextSafe(): RequestTenantContext | null {
    return this.tenantContext;
  }

  /**
   * Get organization ID for the current request
   */
  getOrganizationId(): string {
    return this.getTenantContext().organizationId;
  }

  /**
   * Get property ID for the current request
   */
  getPropertyId(): string {
    return this.getTenantContext().propertyId;
  }

  /**
   * Get department ID for the current request (if user is assigned to a department)
   */
  getDepartmentId(): string | undefined {
    return this.getTenantContext().departmentId;
  }

  /**
   * Get user ID for the current request
   */
  getUserId(): string {
    return this.getTenantContext().userId;
  }

  /**
   * Get user role for the current request
   */
  getUserRole(): Role {
    return this.getTenantContext().userRole;
  }

  /**
   * Get basic tenant filters that should be applied to all queries
   * This ensures data isolation between tenants
   */
  getBaseTenantFilters(): TenantFilters {
    const context = this.getTenantContext();
    return {
      organizationId: context.organizationId,
      propertyId: context.propertyId,
      departmentId: context.departmentId,
    };
  }

  /**
   * Get tenant filters for organization-level queries
   */
  getOrganizationFilters(): Pick<TenantFilters, 'organizationId'> {
    return {
      organizationId: this.getOrganizationId(),
    };
  }

  /**
   * Get tenant filters for property-level queries
   */
  getPropertyFilters(): Pick<TenantFilters, 'organizationId' | 'propertyId'> {
    const context = this.getTenantContext();
    return {
      organizationId: context.organizationId,
      propertyId: context.propertyId,
    };
  }

  /**
   * Get tenant filters for department-level queries
   * Only includes departmentId if the user belongs to a department
   */
  getDepartmentFilters(): TenantFilters {
    const context = this.getTenantContext();
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
  canAccessMultiProperty(): boolean {
    const role = this.getUserRole();
    return role === Role.PLATFORM_ADMIN || role === Role.ORGANIZATION_OWNER;
  }

  /**
   * Check if current user can access multi-department resources within their property
   * (Property managers and above can access multiple departments)
   */
  canAccessMultiDepartment(): boolean {
    const role = this.getUserRole();
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
  isDepartmentScoped(): boolean {
    const role = this.getUserRole();
    const departmentScopedRoles: Role[] = [Role.DEPARTMENT_ADMIN, Role.STAFF];
    return departmentScopedRoles.includes(role);
  }

  /**
   * Validate if user can access a specific organization
   */
  validateOrganizationAccess(organizationId: string): boolean {
    const currentOrgId = this.getOrganizationId();
    
    // Platform admins can access any organization
    if (this.getUserRole() === Role.PLATFORM_ADMIN) {
      return true;
    }

    // All other users can only access their organization
    return currentOrgId === organizationId;
  }

  /**
   * Validate if user can access a specific property
   */
  validatePropertyAccess(propertyId: string): boolean {
    const currentPropertyId = this.getPropertyId();
    
    // Platform admins can access any property
    if (this.getUserRole() === Role.PLATFORM_ADMIN) {
      return true;
    }

    // Organization owners/admins might access multiple properties (future feature)
    if (this.canAccessMultiProperty()) {
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
  validateDepartmentAccess(departmentId: string): boolean {
    // Users who can access multiple departments
    if (this.canAccessMultiDepartment()) {
      return true;
    }

    // Department-scoped users can only access their department
    const currentDepartmentId = this.getDepartmentId();
    return currentDepartmentId === departmentId;
  }

  /**
   * Log tenant context info for debugging
   */
  logContext(action: string): void {
    const context = this.getTenantContextSafe();
    if (context) {
      this.logger.debug(`${action} - User: ${context.userId}, Org: ${context.organizationId}, Property: ${context.propertyId}, Dept: ${context.departmentId || 'none'}, Role: ${context.userRole}`);
    } else {
      this.logger.warn(`${action} - No tenant context available`);
    }
  }
}