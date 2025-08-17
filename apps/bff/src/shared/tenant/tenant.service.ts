import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Organization, Property } from '@prisma/client';

export interface TenantContext {
  organization: Organization;
  property: Property;
}

@Injectable()
export class TenantService {
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
}