import { Logger } from '@nestjs/common';
import { TenantContextService, TenantFilters } from './tenant-context.service';
import { Role } from '@prisma/client';

/**
 * Utility class for automatically adding tenant filters to Prisma queries
 * Ensures all database operations are properly scoped to prevent cross-tenant data leakage
 */
export class TenantQueryHelper {
  private static readonly logger = new Logger(TenantQueryHelper.name);

  /**
   * Apply basic tenant filters to a Prisma query
   * This ensures all queries are scoped to the correct organization and property
   */
  static applyTenantFilters<T extends Record<string, any>>(
    query: T,
    tenantContext: TenantContextService,
    request: any
  ): T {
    const filters = tenantContext.getPropertyFilters(request);
    
    const enhancedQuery = {
      ...query,
      where: {
        ...query.where,
        organizationId: filters.organizationId,
        propertyId: filters.propertyId,
      },
    };

    this.logger.debug(`Applied tenant filters: org=${filters.organizationId}, property=${filters.propertyId}`);
    return enhancedQuery;
  }

  /**
   * Apply department-scoped tenant filters
   * Used for queries that should be limited to user's department
   */
  static applyDepartmentScopedFilters<T extends Record<string, any>>(
    query: T,
    tenantContext: TenantContextService,
    request: any
  ): T {
    const filters = tenantContext.getPropertyFilters(request);
    const departmentId = tenantContext.getDepartmentId(request);
    
    // Only add department filter if user belongs to a department and is department-scoped
    const whereClause: any = {
      ...query.where,
      organizationId: filters.organizationId,
      propertyId: filters.propertyId,
    };

    if (departmentId && tenantContext.isDepartmentScoped(request)) {
      whereClause.departmentId = departmentId;
      this.logger.debug(`Applied department-scoped filters: org=${filters.organizationId}, property=${filters.propertyId}, dept=${departmentId}`);
    } else {
      this.logger.debug(`Applied property-scoped filters: org=${filters.organizationId}, property=${filters.propertyId}`);
    }

    return {
      ...query,
      where: whereClause,
    };
  }

  /**
   * Apply organization-only filters (for organization-level resources)
   */
  static applyOrganizationFilters<T extends Record<string, any>>(
    query: T,
    tenantContext: TenantContextService,
    request: any
  ): T {
    const filters = tenantContext.getOrganizationFilters(request);
    
    const enhancedQuery = {
      ...query,
      where: {
        ...query.where,
        organizationId: filters.organizationId,
      },
    };

    this.logger.debug(`Applied organization filters: org=${filters.organizationId}`);
    return enhancedQuery;
  }

  /**
   * Apply user-scoped filters (for resources belonging to current user only)
   */
  static applyUserScopedFilters<T extends Record<string, any>>(
    query: T,
    tenantContext: TenantContextService,
    request: any
  ): T {
    const filters = tenantContext.getPropertyFilters(request);
    const userId = tenantContext.getUserId(request);
    
    const enhancedQuery = {
      ...query,
      where: {
        ...query.where,
        organizationId: filters.organizationId,
        propertyId: filters.propertyId,
        userId: userId,
      },
    };

    this.logger.debug(`Applied user-scoped filters: org=${filters.organizationId}, property=${filters.propertyId}, user=${userId}`);
    return enhancedQuery;
  }

  /**
   * Apply filters with role-based permissions
   * Automatically determines the appropriate scope based on user role
   */
  static applyRoleBasedFilters<T extends Record<string, any>>(
    query: T,
    tenantContext: TenantContextService,
    request: any,
    resourceType: 'user' | 'department' | 'document' | 'generic' = 'generic'
  ): T {
    const userRole = tenantContext.getUserRole(request);
    const filters = tenantContext.getPropertyFilters(request);

    let whereClause: any = {
      ...query.where,
      organizationId: filters.organizationId,
      propertyId: filters.propertyId,
    };

    // Apply additional filters based on role and resource type
    switch (userRole) {
      case Role.PLATFORM_ADMIN:
        // Platform admins can see everything, but still apply basic tenant filters for consistency
        break;

      case Role.ORGANIZATION_OWNER:
      case Role.ORGANIZATION_ADMIN:
      case Role.PROPERTY_MANAGER:
        // Property-level access, no additional filters needed
        break;

      case Role.DEPARTMENT_ADMIN:
        // Department admins are limited to their department
        const deptId = tenantContext.getDepartmentId(request);
        if (deptId) {
          if (resourceType === 'user') {
            whereClause.departmentId = deptId;
          } else if (resourceType === 'document' || resourceType === 'generic') {
            // For documents and other resources, apply department filter if the resource has departmentId
            whereClause.OR = [
              { departmentId: deptId },
              { departmentId: null }, // Include resources not assigned to specific departments
            ];
          }
        }
        break;

      case Role.STAFF:
        // Staff can only see their own resources in most cases
        const userId = tenantContext.getUserId(request);
        if (resourceType === 'user') {
          whereClause.id = userId; // For user resources, only show self
        } else {
          whereClause.userId = userId; // For other resources, filter by owner
        }
        break;
    }

    const enhancedQuery = {
      ...query,
      where: whereClause,
    };

    this.logger.debug(`Applied role-based filters for ${userRole}: ${JSON.stringify(whereClause)}`);
    return enhancedQuery;
  }

  /**
   * Validate that a query result belongs to the current tenant
   * Use this after queries to ensure no cross-tenant data leaks
   */
  static validateTenantOwnership(
    result: any,
    tenantContext: TenantContextService,
    request: any,
    resourceName: string = 'resource'
  ): boolean {
    if (!result) {
      return true; // No result to validate
    }

    const expectedOrgId = tenantContext.getOrganizationId(request);
    const expectedPropertyId = tenantContext.getPropertyId(request);

    // Handle arrays
    if (Array.isArray(result)) {
      for (const item of result) {
        if (!this.validateSingleItem(item, expectedOrgId, expectedPropertyId, resourceName)) {
          return false;
        }
      }
      return true;
    }

    // Handle single item
    return this.validateSingleItem(result, expectedOrgId, expectedPropertyId, resourceName);
  }

  private static validateSingleItem(
    item: any,
    expectedOrgId: string,
    expectedPropertyId: string,
    resourceName: string
  ): boolean {
    // Check organization
    if (item.organizationId && item.organizationId !== expectedOrgId) {
      this.logger.error(`SECURITY VIOLATION: ${resourceName} belongs to different organization. Expected: ${expectedOrgId}, Got: ${item.organizationId}`);
      return false;
    }

    // Check property
    if (item.propertyId && item.propertyId !== expectedPropertyId) {
      this.logger.error(`SECURITY VIOLATION: ${resourceName} belongs to different property. Expected: ${expectedPropertyId}, Got: ${item.propertyId}`);
      return false;
    }

    return true;
  }

  /**
   * Create a safe query builder that automatically applies tenant filters
   * This is the recommended way to build queries throughout the application
   */
  static createSafeQuery<T extends Record<string, any>>(
    baseQuery: T,
    tenantContext: TenantContextService,
    request: any,
    options: {
      scope?: 'organization' | 'property' | 'department' | 'user';
      resourceType?: 'user' | 'department' | 'document' | 'generic';
      skipTenantFilters?: boolean; // Only use for platform admin queries that need cross-tenant access
    } = {}
  ): T {
    const { scope = 'property', resourceType = 'generic', skipTenantFilters = false } = options;

    // Only skip tenant filters for platform admins and when explicitly requested
    if (skipTenantFilters && tenantContext.getUserRole(request) === Role.PLATFORM_ADMIN) {
      this.logger.warn('Skipping tenant filters for platform admin query');
      return baseQuery;
    }

    // Apply appropriate filters based on scope
    switch (scope) {
      case 'organization':
        return this.applyOrganizationFilters(baseQuery, tenantContext, request);
      case 'department':
        return this.applyDepartmentScopedFilters(baseQuery, tenantContext, request);
      case 'user':
        return this.applyUserScopedFilters(baseQuery, tenantContext, request);
      case 'property':
      default:
        return this.applyRoleBasedFilters(baseQuery, tenantContext, request, resourceType);
    }
  }

  /**
   * Helper to extract tenant info from existing data for validation
   */
  static extractTenantInfo(data: any): { organizationId?: string; propertyId?: string; departmentId?: string } {
    return {
      organizationId: data?.organizationId,
      propertyId: data?.propertyId,
      departmentId: data?.departmentId,
    };
  }

  /**
   * Ensure create/update operations include proper tenant context
   */
  static ensureTenantContext<T extends Record<string, any>>(
    data: T,
    tenantContext: TenantContextService,
    request: any,
    options: {
      scope?: 'organization' | 'property' | 'department' | 'user';
      includeUserId?: boolean;
    } = {}
  ): T {
    const { scope = 'property', includeUserId = false } = options;

    const enhancedData = { ...data } as any;

    // Always include organization and property
    const filters = tenantContext.getPropertyFilters(request);
    enhancedData.organizationId = filters.organizationId;
    enhancedData.propertyId = filters.propertyId;

    // Include department if appropriate
    if (scope === 'department') {
      const deptId = tenantContext.getDepartmentId(request);
      if (deptId) {
        enhancedData.departmentId = deptId;
      }
    }

    // Include user ID if requested
    if (includeUserId) {
      enhancedData.userId = tenantContext.getUserId(request);
    }

    this.logger.debug(`Enhanced data with tenant context: org=${filters.organizationId}, property=${filters.propertyId}`);
    return enhancedData;
  }

  /**
   * Create a WHERE clause for soft-delete compatible queries with tenant filtering
   */
  static createTenantAwareWhereClause(
    baseWhere: any,
    tenantContext: TenantContextService,
    request: any,
    options: {
      includeDeleted?: boolean;
      scope?: 'organization' | 'property' | 'department' | 'user';
    } = {}
  ): any {
    const { includeDeleted = false, scope = 'property' } = options;

    // Start with base where clause
    let whereClause = { ...baseWhere };

    // Apply tenant filters
    const tempQuery = { where: whereClause };
    const filteredQuery = this.createSafeQuery(tempQuery, tenantContext, request, { scope });
    whereClause = filteredQuery.where;

    // Apply soft delete filter if not including deleted
    if (!includeDeleted) {
      whereClause.deletedAt = null;
    }

    return whereClause;
  }
}