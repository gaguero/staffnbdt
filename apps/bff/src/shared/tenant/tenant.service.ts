import { Injectable, Logger, NotFoundException, ForbiddenException, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Organization, Property, User, Role } from '@prisma/client';

export interface TenantContext {
  organization: Organization;
  property: Property;
}

interface CachedTenantContext {
  tenantContext: TenantContext | null;
  timestamp: number;
}

const TENANT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1000; // 1 second

@Injectable()
export class TenantService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantService.name);
  private readonly tenantCache = new Map<string, CachedTenantContext>();
  private cacheCleanupInterval: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {
    // Start periodic cache cleanup
    this.startCacheCleanup();
  }

  /**
   * Start periodic cache cleanup to prevent memory leaks
   */
  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredCacheEntries();
    }, TENANT_CACHE_TTL); // Clean up every TTL period
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCacheEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, cached] of this.tenantCache.entries()) {
      if ((now - cached.timestamp) >= TENANT_CACHE_TTL) {
        this.tenantCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Cleanup resources when service is destroyed
   */
  onModuleDestroy(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.clearAllTenantCache();
  }

  async getDefaultTenant(): Promise<TenantContext> {
    // Try to find existing default organization and property
    const org = await this.prisma.organization.findFirst({
      where: { slug: 'nayara-group' }
    });
    
    const property = await this.prisma.property.findFirst({
      where: { slug: 'nayara-gardens' }
    });
    
    if (org && property) {
      return { organization: org, property };
    }

    // If not found, create default tenant
    return this.createDefaultTenant();
  }

  private async createDefaultTenant(): Promise<TenantContext> {
    this.logger.log('Creating default organization and property...');

    // Create default organization
    const organization = await this.prisma.organization.create({
      data: {
        name: 'Nayara Group',
        slug: 'nayara-group',
        description: 'Default organization for Hotel Operations Hub',
        timezone: 'America/Costa_Rica',
        settings: {
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'es'],
          theme: 'nayara'
        },
        branding: {
          primaryColor: '#AA8E67',
          secondaryColor: '#F5EBD7',
          accentColor: '#4A4A4A',
          logoUrl: null
        },
        isActive: true
      }
    });

    // Create default property
    const property = await this.prisma.property.create({
      data: {
        organizationId: organization.id,
        name: 'Nayara Gardens',
        slug: 'nayara-gardens',
        description: 'Default property for Hotel Operations Hub',
        propertyType: 'RESORT',
        timezone: 'America/Costa_Rica',
        settings: {
          modules: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS'],
          defaultDepartments: ['Front Desk', 'Housekeeping', 'Food & Beverage', 'Administration']
        },
        branding: {
          inherit: true // Inherit from organization
        },
        isActive: true
      }
    });

    // Create default module subscriptions
    const modules = [
      'HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS', 
      'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'INVENTORY'
    ];

    for (const moduleName of modules) {
      try {
        await this.prisma.moduleSubscription.create({
          data: {
            organizationId: organization.id,
            moduleName,
            isEnabled: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS'].includes(moduleName),
            enabledAt: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS'].includes(moduleName) ? new Date() : null,
            settings: {}
          }
        });
      } catch (error) {
        // Ignore if module subscription already exists
        this.logger.warn(`Module ${moduleName} subscription may already exist:`, error.message);
      }
    }

    this.logger.log(`Created default tenant: ${organization.name} -> ${property.name}`);
    return { organization, property };
  }

  /**
   * Get tenant context from a user with caching and retry logic
   */
  async getTenantFromUser(userId: string): Promise<TenantContext | null> {
    if (!userId) {
      this.logger.warn('getTenantFromUser called with empty userId');
      return null;
    }

    // Check memory cache first
    const cacheKey = `tenant_${userId}`;
    const cachedResult = this.tenantCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < TENANT_CACHE_TTL) {
      this.logger.debug(`Using cached tenant context for user ${userId}`);
      return cachedResult.tenantContext;
    }

    // Attempt database lookup with retries
    let tenantContext: TenantContext | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        this.logger.debug(`Attempting to fetch tenant context for user ${userId} (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`);
        
        // Check database connectivity before making query
        await this.checkDatabaseConnectivity();
        
        tenantContext = await this.fetchUserTenantContext(userId);
        
        // Cache the result (even if null)
        this.tenantCache.set(cacheKey, {
          tenantContext,
          timestamp: Date.now()
        });
        
        if (tenantContext) {
          this.logger.debug(`Successfully retrieved tenant context for user ${userId}`);
        } else {
          this.logger.warn(`No tenant context found for user ${userId}`);
        }
        
        return tenantContext;
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt} failed for user ${userId}: ${error.message}`);
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.debug(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    this.logger.error(`Failed to get tenant context for user ${userId} after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message}`, lastError?.stack);
    
    // Cache the failure to prevent repeated attempts for a short period
    this.tenantCache.set(cacheKey, {
      tenantContext: null,
      timestamp: Date.now()
    });
    
    return null;
  }

  /**
   * Actual database query logic separated for better testing and error handling
   */
  private async fetchUserTenantContext(userId: string): Promise<TenantContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { 
        id: userId,
        deletedAt: null  // Important: only fetch active users
      },
      include: {
        organization: true,
        property: true
      }
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found in database`);
      return null;
    }

    if (!user.organization) {
      this.logger.warn(`User ${userId} (${user.email}) has no organization assignment`);
      return null;
    }

    // If user has no property, use the first property of their organization
    let property = user.property;
    if (!property) {
      this.logger.warn(`User ${userId} (${user.email}) has no property assignment, finding first property in organization`);
      
      property = await this.prisma.property.findFirst({
        where: { 
          organizationId: user.organizationId!,
          isActive: true
        },
        orderBy: { createdAt: 'asc' }
      });
      
      if (!property) {
        this.logger.warn(`No active properties found for organization ${user.organizationId}`);
        return null;
      }
    }

    return {
      organization: user.organization,
      property
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseConnectivity(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
    } catch (error) {
      this.logger.error('Database connectivity check failed', error.stack);
      throw new Error(`Database connectivity issue: ${error.message}`);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear tenant cache for a specific user
   */
  clearTenantCache(userId: string): void {
    const cacheKey = `tenant_${userId}`;
    this.tenantCache.delete(cacheKey);
    this.logger.debug(`Cleared tenant cache for user ${userId}`);
  }

  /**
   * Clear all tenant cache entries
   */
  clearAllTenantCache(): void {
    const size = this.tenantCache.size;
    this.tenantCache.clear();
    this.logger.debug(`Cleared entire tenant cache (${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.tenantCache.size,
      entries: Array.from(this.tenantCache.keys())
    };
  }

  /**
   * Validate if a user can access a specific organization
   */
  async validateOrganizationAccess(
    userId: string,
    targetOrganizationId: string
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true }
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found during organization access validation`);
      return false;
    }

    // Platform admins can access any organization
    if (user.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    // All other users can only access their organization
    return user.organizationId === targetOrganizationId;
  }

  /**
   * Validate if a user can access a specific property
   */
  async validatePropertyAccess(
    userId: string,
    targetPropertyId: string
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { propertyId: true, organizationId: true, role: true }
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found during property access validation`);
      return false;
    }

    // Platform admins can access any property
    if (user.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    // Check if the property belongs to user's organization
    const property = await this.prisma.property.findUnique({
      where: { id: targetPropertyId },
      select: { organizationId: true }
    });

    if (!property) {
      this.logger.warn(`Property ${targetPropertyId} not found during access validation`);
      return false;
    }

    // Must belong to same organization
    if (property.organizationId !== user.organizationId) {
      return false;
    }

    // Organization owners/admins might access multiple properties (future feature)
    if (user.role === Role.ORGANIZATION_OWNER || user.role === Role.ORGANIZATION_ADMIN) {
      // For now, still restrict to current property
      // TODO: Implement multi-property access validation based on user assignments
      return user.propertyId === targetPropertyId;
    }

    // All other users can only access their property
    return user.propertyId === targetPropertyId;
  }

  /**
   * Validate if a user can access a specific department
   */
  async validateDepartmentAccess(
    userId: string,
    targetDepartmentId: string
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        propertyId: true,
        organizationId: true,
        role: true
      }
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found during department access validation`);
      return false;
    }

    // Get the department to validate it exists and belongs to user's property
    const department = await this.prisma.department.findUnique({
      where: { id: targetDepartmentId },
      select: { propertyId: true }
    });

    if (!department) {
      this.logger.warn(`Department ${targetDepartmentId} not found during access validation`);
      return false;
    }

    // Department must belong to user's property
    if (department.propertyId !== user.propertyId) {
      return false;
    }

    // Platform admins can access any department within valid property
    if (user.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    // Property managers and above can access all departments in their property
    const multiDepartmentRoles: Role[] = [
      Role.ORGANIZATION_OWNER,
      Role.ORGANIZATION_ADMIN,
      Role.PROPERTY_MANAGER
    ];
    if (multiDepartmentRoles.includes(user.role)) {
      return true;
    }

    // Department admins and staff can only access their own department
    return user.departmentId === targetDepartmentId;
  }

  /**
   * Get available properties for a user (for property switching)
   */
  async getUserAvailableProperties(userId: string): Promise<Property[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        propertyId: true,
        role: true
      }
    });

    if (!user?.organizationId) {
      return [];
    }

    // Platform admins can access all properties
    if (user.role === Role.PLATFORM_ADMIN) {
      return this.prisma.property.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });
    }

    // Organization owners/admins can access all properties in their organization
    if (user.role === Role.ORGANIZATION_OWNER || user.role === Role.ORGANIZATION_ADMIN) {
      return this.prisma.property.findMany({
        where: {
          organizationId: user.organizationId,
          isActive: true
        },
        orderBy: { name: 'asc' }
      });
    }

    // All other users can only access their assigned property
    if (user.propertyId) {
      const property = await this.prisma.property.findUnique({
        where: {
          id: user.propertyId,
          isActive: true
        }
      });
      return property ? [property] : [];
    }

    return [];
  }

  /**
   * Switch user to a different property (if allowed)
   */
  async switchUserProperty(
    userId: string,
    newPropertyId: string
  ): Promise<{ success: boolean; message: string }> {
    // Validate user can access the target property
    const canAccess = await this.validatePropertyAccess(userId, newPropertyId);
    
    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this property');
    }

    // Get the property to validate it exists and is active
    const property = await this.prisma.property.findUnique({
      where: {
        id: newPropertyId,
        isActive: true
      }
    });

    if (!property) {
      throw new NotFoundException('Property not found or inactive');
    }

    // Update user's property assignment
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        propertyId: newPropertyId,
        // Clear department assignment when switching properties
        departmentId: null
      }
    });

    this.logger.log(`User ${userId} switched to property ${property.name} (${newPropertyId})`);
    
    return {
      success: true,
      message: `Successfully switched to ${property.name}`
    };
  }

  /**
   * Ensure user has valid tenant assignment
   * This should be called during user login/JWT refresh
   */
  async ensureUserTenantAssignment(userId: string): Promise<{ organizationId: string; propertyId: string }> {
    if (!userId) {
      this.logger.error('ensureUserTenantAssignment called with empty userId');
      throw new NotFoundException('User ID is required');
    }

    this.logger.debug(`Ensuring tenant assignment for user ${userId}`);
    
    let user: any;
    let lastError: Error | null = null;
    
    // Retry logic for database lookup
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        this.logger.debug(`Fetching user ${userId} for tenant assignment (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`);
        
        // Check database connectivity
        await this.checkDatabaseConnectivity();
        
        user = await this.prisma.user.findUnique({
          where: { 
            id: userId,
            deletedAt: null // Only active users
          },
          select: {
            id: true,
            email: true,
            organizationId: true,
            propertyId: true,
            role: true
          }
        });
        
        break; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`Database lookup attempt ${attempt} failed for user ${userId}: ${error.message}`);
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
          this.logger.debug(`Retrying user lookup in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    if (!user) {
      const errorMessage = lastError 
        ? `User ${userId} not found after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError.message}`
        : `User ${userId} not found or has been deleted`;
      
      this.logger.error(errorMessage, lastError?.stack);
      throw new NotFoundException(errorMessage);
    }
    
    this.logger.debug(`Found user ${userId} (${user.email}) for tenant assignment validation`);

    let { organizationId, propertyId } = user;

    // If user has no organization, assign to default
    if (!organizationId) {
      this.logger.warn(`User ${userId} (${user.email}) has no organization assignment, assigning to default tenant`);
      
      try {
        const defaultTenant = await this.getDefaultTenant();
        organizationId = defaultTenant.organization.id;
        
        this.logger.log(`User ${userId} assigned to default organization: ${organizationId}`);
      } catch (error) {
        this.logger.error(`Failed to get default tenant for user ${userId}: ${error.message}`, error.stack);
        throw new Error(`Unable to assign default tenant: ${error.message}`);
      }
    }

    // If user has no property, assign to first available property in their organization
    if (!propertyId) {
      this.logger.warn(`User ${userId} (${user.email}) has no property assignment, finding first property in organization ${organizationId}`);
      
      try {
        const firstProperty = await this.prisma.property.findFirst({
          where: {
            organizationId,
            isActive: true
          },
          orderBy: { createdAt: 'asc' }
        });

        if (!firstProperty) {
          this.logger.warn(`No active properties found for organization ${organizationId}, using default tenant`);
          
          // If no properties exist, create default tenant
          const defaultTenant = await this.getDefaultTenant();
          organizationId = defaultTenant.organization.id;
          propertyId = defaultTenant.property.id;
          
          this.logger.log(`User ${userId} assigned to default tenant: org=${organizationId}, property=${propertyId}`);
        } else {
          propertyId = firstProperty.id;
          this.logger.log(`User ${userId} assigned to first available property: ${propertyId} (${firstProperty.name})`);
        }
      } catch (error) {
        this.logger.error(`Failed to find property for user ${userId}: ${error.message}`, error.stack);
        throw new Error(`Unable to assign property: ${error.message}`);
      }
    }

    // Update user if assignments were changed
    if (user.organizationId !== organizationId || user.propertyId !== propertyId) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            organizationId,
            propertyId
          }
        });
        
        // Clear cache since user data changed
        const cacheKey = `tenant_${userId}`;
        this.tenantCache.delete(cacheKey);
        
        this.logger.log(`Updated user ${userId} (${user.email}) tenant assignments: org=${organizationId}, property=${propertyId}`);
      } catch (error) {
        this.logger.error(`Failed to update tenant assignments for user ${userId}: ${error.message}`, error.stack);
        throw new Error(`Unable to update user tenant assignments: ${error.message}`);
      }
    } else {
      this.logger.debug(`User ${userId} already has correct tenant assignments`);
    }

    return { organizationId, propertyId };
  }
}