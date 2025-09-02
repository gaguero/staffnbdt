import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { ModuleRegistryService } from '../module-registry/module-registry.service';

interface TemplateMetadata {
  usageCount?: number;
  rating?: number;
  ratingCount?: number;
  category?: string;
  tags?: string[];
  description?: string;
  author?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class TemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly moduleRegistry: ModuleRegistryService,
  ) {}

  /**
   * Get marketplace templates - public templates available for cloning
   */
  async getMarketplaceTemplates(req: any, filters?: { category?: string; minRating?: number; tags?: string[] }) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for template operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    const where: any = {
      isTemplate: true,
      isActive: true,
      // Include system templates and templates from the same organization
      OR: [
        { organizationId: 'system' }, // System-wide templates
        { organizationId: ctx.organizationId }, // Organization templates
      ],
    };

    // Apply filters with proper JSON path queries for PostgreSQL
    const additionalWhereConditions: any[] = [];
    
    if (filters?.category) {
      additionalWhereConditions.push({
        templateMetadata: {
          path: ['category'],
          equals: filters.category,
        },
      });
    }

    if (filters?.minRating && filters.minRating > 0) {
      additionalWhereConditions.push({
        templateMetadata: {
          path: ['rating'],
          gte: filters.minRating,
        },
      });
    }

    if (filters?.tags && filters.tags.length > 0) {
      additionalWhereConditions.push({
        templateMetadata: {
          path: ['tags'],
          array_contains: filters.tags,
        },
      });
    }

    if (additionalWhereConditions.length > 0) {
      where.AND = additionalWhereConditions;
    }

    const templates = await this.prisma.objectType.findMany({
      where,
      include: {
        children: {
          select: {
            id: true,
            name: true,
            templateMetadata: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' }, // Simplified ordering due to JSON field limitations
      ],
    });

    return templates.map(template => this.formatTemplateForMarketplace(template));
  }

  /**
   * Clone a template to create a new object type
   */
  async cloneTemplate(templateId: string, req: any, customizations?: {
    name?: string;
    fieldsSchema?: any;
    description?: string;
    category?: string;
  }) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for template operations');
    }
    if (!(await this.moduleRegistry.isModuleEnabledForProperty(ctx.organizationId, ctx.propertyId, 'concierge'))) {
      throw new ForbiddenException('Concierge module not enabled for this property');
    }

    // Find the template
    const template = await this.prisma.objectType.findFirst({
      where: {
        id: templateId,
        isTemplate: true,
        isActive: true,
        OR: [
          { organizationId: 'system' },
          { organizationId: ctx.organizationId },
        ],
      },
      include: {
        parent: true,
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found or not accessible');
    }

    // Validate name uniqueness in target property
    const cloneName = customizations?.name || `${template.name} Copy`;
    const existingType = await this.prisma.objectType.findFirst({
      where: {
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        name: cloneName,
      },
    });

    if (existingType) {
      throw new BadRequestException(`Object type with name '${cloneName}' already exists`);
    }

    // Smart cloning: inherit from parent and apply template customizations
    const inheritedSchema = await this.computeInheritedSchema(template);
    const finalSchema = this.mergeSchemas(inheritedSchema, customizations?.fieldsSchema);

    // Create the cloned object type
    const cloned = await this.prisma.$transaction(async (tx) => {
      const newObjectType = await tx.objectType.create({
        data: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          name: cloneName,
          fieldsSchema: finalSchema,
          validations: template.validations,
          uiHints: template.uiHints,
          isActive: true,
          isTemplate: false,
          parentId: templateId, // Track the source template
          templateMetadata: {
            clonedFrom: templateId,
            clonedAt: new Date().toISOString(),
            clonedBy: ctx.userId,
            description: customizations?.description,
            category: customizations?.category || (template.templateMetadata as any)?.category,
          },
        },
      });

      // Update template usage count
      if (template.templateMetadata) {
        const metadata = template.templateMetadata as any;
        const newUsageCount = (metadata.usageCount || 0) + 1;
        await tx.objectType.update({
          where: { id: templateId },
          data: {
            templateMetadata: {
              ...metadata,
              usageCount: newUsageCount,
            },
          },
        });
      }

      return newObjectType;
    });

    return cloned;
  }

  /**
   * Get template hierarchy (children) for a given object type
   */
  async getTemplateChildren(parentId: string, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for template operations');
    }

    const children = await this.prisma.objectType.findMany({
      where: {
        parentId,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        isActive: true,
      },
      include: {
        children: {
          select: {
            id: true,
            name: true,
            isTemplate: true,
            templateMetadata: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return children;
  }

  /**
   * Create a new template from an existing object type
   */
  async createTemplateFromObjectType(objectTypeId: string, req: any, templateData: {
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
  }) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for template operations');
    }

    const objectType = await this.prisma.objectType.findFirst({
      where: {
        id: objectTypeId,
        organizationId: ctx.organizationId,
        propertyId: ctx.propertyId,
        isActive: true,
      },
    });

    if (!objectType) {
      throw new NotFoundException('Object type not found');
    }

    if (objectType.isTemplate) {
      throw new BadRequestException('Object type is already a template');
    }

    // Create template
    const template = await this.prisma.objectType.create({
      data: {
        organizationId: templateData.isPublic ? 'system' : ctx.organizationId,
        propertyId: templateData.isPublic ? 'system' : ctx.propertyId,
        name: templateData.name,
        fieldsSchema: objectType.fieldsSchema,
        validations: objectType.validations,
        uiHints: objectType.uiHints,
        isActive: true,
        isTemplate: true,
        parentId: objectType.parentId, // Maintain hierarchy
        templateMetadata: {
          usageCount: 0,
          rating: 0,
          ratingCount: 0,
          category: templateData.category,
          tags: templateData.tags || [],
          description: templateData.description,
          author: ctx.userId,
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          basedOn: objectTypeId,
        },
      },
    });

    return template;
  }

  /**
   * Rate a template
   */
  async rateTemplate(templateId: string, rating: number, req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const template = await this.prisma.objectType.findFirst({
      where: {
        id: templateId,
        isTemplate: true,
        isActive: true,
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const metadata = (template.templateMetadata as any) || {};
    const currentRating = metadata.rating || 0;
    const currentRatingCount = metadata.ratingCount || 0;
    
    // Calculate new average rating
    const newRatingCount = currentRatingCount + 1;
    const newRating = ((currentRating * currentRatingCount) + rating) / newRatingCount;

    await this.prisma.objectType.update({
      where: { id: templateId },
      data: {
        templateMetadata: {
          ...metadata,
          rating: Math.round(newRating * 10) / 10, // Round to 1 decimal
          ratingCount: newRatingCount,
        },
      },
    });

    return { success: true, newRating, ratingCount: newRatingCount };
  }

  /**
   * Get template analytics
   */
  async getTemplateAnalytics(req: any) {
    const ctx = this.tenantContext.getTenantContext(req);
    if (!ctx.propertyId) {
      throw new BadRequestException('Property context required for template operations');
    }

    const [
      totalTemplates,
      myTemplates,
      totalClones,
      popularTemplates,
    ] = await Promise.all([
      // Total marketplace templates
      this.prisma.objectType.count({
        where: {
          isTemplate: true,
          isActive: true,
          OR: [
            { organizationId: 'system' },
            { organizationId: ctx.organizationId },
          ],
        },
      }),

      // Templates created by this property
      this.prisma.objectType.count({
        where: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          isTemplate: true,
          isActive: true,
        },
      }),

      // Total clones created by this property
      this.prisma.objectType.count({
        where: {
          organizationId: ctx.organizationId,
          propertyId: ctx.propertyId,
          isTemplate: false,
          parentId: { not: null },
          isActive: true,
        },
      }),

      // Most popular templates
      this.prisma.objectType.findMany({
        where: {
          isTemplate: true,
          isActive: true,
          OR: [
            { organizationId: 'system' },
            { organizationId: ctx.organizationId },
          ],
        },
        select: {
          id: true,
          name: true,
          templateMetadata: true,
        },
        orderBy: [
          { name: 'asc' }, // Simplified ordering
        ],
        take: 5,
      }),
    ]);

    return {
      totalTemplates,
      myTemplates,
      totalClones,
      popularTemplates: popularTemplates.map(t => ({
        id: t.id,
        name: t.name,
        usageCount: (t.templateMetadata as any)?.usageCount || 0,
        rating: (t.templateMetadata as any)?.rating || 0,
      })),
    };
  }

  /**
   * Validate template hierarchy to prevent circular references
   */
  private async validateHierarchy(parentId: string, childId: string): Promise<boolean> {
    if (parentId === childId) return false;

    let currentParent = parentId;
    while (currentParent) {
      if (currentParent === childId) return false;
      
      const parent = await this.prisma.objectType.findUnique({
        where: { id: currentParent },
        select: { parentId: true },
      });
      
      currentParent = parent?.parentId || null;
    }

    return true;
  }

  /**
   * Compute inherited schema from template hierarchy
   */
  private async computeInheritedSchema(template: any): Promise<any> {
    if (!template.parent) {
      return template.fieldsSchema;
    }

    // Recursively inherit from parent
    const parentSchema = await this.computeInheritedSchema(template.parent);
    return this.mergeSchemas(parentSchema, template.fieldsSchema);
  }

  /**
   * Merge field schemas with child taking precedence
   */
  private mergeSchemas(parentSchema: any, childSchema: any): any {
    if (!parentSchema) return childSchema;
    if (!childSchema) return parentSchema;

    const parentFields = parentSchema.fields || [];
    const childFields = childSchema.fields || [];

    // Create field map from parent
    const fieldMap = new Map();
    parentFields.forEach((field: any) => {
      fieldMap.set(field.key, field);
    });

    // Override with child fields
    childFields.forEach((field: any) => {
      fieldMap.set(field.key, field);
    });

    return {
      ...parentSchema,
      ...childSchema,
      fields: Array.from(fieldMap.values()),
    };
  }

  /**
   * Format template for marketplace display
   */
  private formatTemplateForMarketplace(template: any) {
    const metadata = (template.templateMetadata as any) || {};
    
    return {
      id: template.id,
      name: template.name,
      description: metadata.description || '',
      category: metadata.category || 'General',
      tags: metadata.tags || [],
      rating: metadata.rating || 0,
      ratingCount: metadata.ratingCount || 0,
      usageCount: metadata.usageCount || 0,
      author: metadata.author,
      version: metadata.version || '1.0.0',
      isSystem: template.organizationId === 'system',
      fieldCount: (template.fieldsSchema?.fields || []).length,
      hasChildren: template.children?.length > 0,
      parentId: template.parentId,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}