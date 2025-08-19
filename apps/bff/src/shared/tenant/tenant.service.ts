import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Organization, Property, User, Role } from '@prisma/client';

export interface TenantContext {
  organization: Organization;
  property: Property;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    console.log('Creating default organization and property...');

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
        console.log(`Module ${moduleName} subscription may already exist:`, error.message);
      }
    }

    console.log(`✅ Created default tenant: ${organization.name} -> ${property.name}`);
    return { organization, property };
  }

  /**
   * Get tenant context from a user
   */
  async getTenantFromUser(userId: string): Promise<TenantContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        property: true
      }
    });

    if (!user?.organization) {
      return null;
    }

    // If user has no property, use the first property of their organization
    let property = user.property;
    if (!property) {
      property = await this.prisma.property.findFirst({
        where: { organizationId: user.organizationId! }
      });
    }

    if (!property) {
      return null;
    }

    return {
      organization: user.organization,
      property
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        propertyId: true,
        role: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let { organizationId, propertyId } = user;

    // If user has no organization, assign to default
    if (!organizationId) {
      const defaultTenant = await this.getDefaultTenant();
      organizationId = defaultTenant.organization.id;
      
      this.logger.warn(`User ${userId} had no organization, assigned to default: ${organizationId}`);
    }

    // If user has no property, assign to first available property in their organization
    if (!propertyId) {
      const firstProperty = await this.prisma.property.findFirst({
        where: {
          organizationId,
          isActive: true
        }
      });

      if (!firstProperty) {
        // If no properties exist, create default tenant
        const defaultTenant = await this.getDefaultTenant();
        organizationId = defaultTenant.organization.id;
        propertyId = defaultTenant.property.id;
        
        this.logger.warn(`No properties found for organization, using default tenant`);
      } else {
        propertyId = firstProperty.id;
        this.logger.warn(`User ${userId} had no property, assigned to: ${propertyId}`);
      }
    }

    // Update user if assignments were changed
    if (user.organizationId !== organizationId || user.propertyId !== propertyId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          organizationId,
          propertyId
        }
      });
      
      this.logger.log(`Updated user ${userId} tenant assignments: org=${organizationId}, property=${propertyId}`);
    }

    return { organizationId, propertyId };
  }
}