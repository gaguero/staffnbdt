import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { Property, User, Role, Prisma } from '@prisma/client';
import { CreatePropertyDto, UpdatePropertyDto, PropertyFilterDto, AssignUsersToPropertyDto, RemoveUserFromPropertyDto } from './dto';

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Create a new property
   */
  async create(createPropertyDto: CreatePropertyDto, currentUser: User): Promise<Property> {
    const { organizationId, slug, branding, settings, address, contactPhone, contactEmail, ...propertyData } = createPropertyDto;

    // Validate organization access
    await this.validateOrganizationAccess(organizationId, currentUser);

    // Only Platform Admins and Organization Admins+ can create properties
    const hasCreateAccess = 
      currentUser.role === Role.PLATFORM_ADMIN || 
      (currentUser.organizationId === organizationId && 
       ([Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN] as Role[]).includes(currentUser.role));

    if (!hasCreateAccess) {
      throw new ForbiddenException('Insufficient permissions to create properties in this organization');
    }

    // Verify organization exists and is active (findFirst because findUnique only supports unique fields)
    const organization = await this.prisma.organization.findFirst({
      where: { id: organizationId, isActive: true }
    });

    if (!organization) {
      throw new NotFoundException('Organization not found or inactive');
    }

    // Generate slug if not provided
    const finalSlug = slug || this.generateSlug(createPropertyDto.name);

    // Check if slug is unique within the organization
    const existingProperty = await this.prisma.property.findFirst({
      where: { 
        organizationId,
        slug: finalSlug 
      }
    });

    if (existingProperty) {
      throw new BadRequestException(`Property with slug '${finalSlug}' already exists in this organization`);
    }

    try {
      const property = await this.prisma.property.create({
        data: {
          ...propertyData,
          organizationId,
          slug: finalSlug,
          // Map DTO fields to database fields
          phoneNumber: contactPhone,
          email: contactEmail,
          address: address ? address as any : {},
          settings: settings ? settings as any : {
            modules: ['HR', 'DOCUMENTS'],
            defaultDepartments: ['Administration']
          },
          branding: branding ? branding as any : { inherit: true },
          isActive: createPropertyDto.isActive ?? true,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              users: true,
              departments: true
            }
          }
        }
      });

      // Create default departments if specified
      if (settings?.defaultDepartments?.length) {
        await this.createDefaultDepartments(property.id, settings.defaultDepartments);
      }

      this.logger.log(`Property created: ${property.name} (${property.id}) in org ${organizationId} by user ${currentUser.id}`);
      return property;
    } catch (error) {
      this.logger.error(`Failed to create property: ${error.message}`, error.stack);
      // Expose specific Prisma errors for better debugging
      if (error.code === 'P2002') {
        throw new BadRequestException('A property with this information already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid organization reference');
      }
      // Log the actual error but provide a generic message for security
      throw new BadRequestException(`Failed to create property: ${error.message}`);
    }
  }

  /**
   * Get user's accessible properties with filtering and pagination
   */
  async findAll(filterDto: PropertyFilterDto, currentUser: User) {
    const {
      search,
      organizationId,
      isActive,
      propertyType,
      timezone,
      country,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = filterDto;

    const where: Prisma.PropertyWhereInput = {};

    // Apply tenant-based filtering
    if (currentUser.role === Role.PLATFORM_ADMIN) {
      // Platform admins can see all properties
      if (organizationId) {
        where.organizationId = organizationId;
      }
    } else {
      // All other users can only see properties in their organization
      where.organizationId = currentUser.organizationId!;
    }

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (propertyType) {
      where.propertyType = propertyType as any;
    }

    if (timezone) {
      where.timezone = timezone;
    }

    if (country) {
      where.address = {
        path: ['country'],
        equals: country
      };
    }

    // Build order by clause safely
    const validSortFields = new Set(['name', 'propertyType', 'createdAt', 'updatedAt']);
    const safeSortField = validSortFields.has((sortBy as any)) ? sortBy : 'name';
    const safeSortOrder: 'asc' | 'desc' = sortOrder === 'desc' ? 'desc' : 'asc';
    const orderBy: Prisma.PropertyOrderByWithRelationInput = { [safeSortField]: safeSortOrder } as any;

    // Calculate pagination
    const skip = (page - 1) * limit;

    try {
      const [properties, total] = await Promise.all([
        this.prisma.property.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            _count: {
              select: {
                users: true,
                departments: true
              }
            }
          }
        }),
        this.prisma.property.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: properties,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      this.logger.error(`Failed to fetch properties: ${error?.message}`, (error as any)?.stack);
      // Re-throw as BadRequest to avoid generic 500s and expose a clearer message to the client
      throw new BadRequestException(error?.message || 'Failed to fetch properties');
    }
  }

  /**
   * Get property by ID
   */
  async findOne(id: string, currentUser: User): Promise<Property> {
    // Validate access
    await this.validatePropertyAccess(id, currentUser);

    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            users: true,
            departments: true
          }
        }
      }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  /**
   * Update property
   */
  async update(id: string, updatePropertyDto: UpdatePropertyDto, currentUser: User): Promise<Property> {
    // Validate access
    await this.validatePropertyAccess(id, currentUser);

    const property = await this.prisma.property.findUnique({
      where: { id },
      select: {
        organizationId: true,
        slug: true,
        name: true
      }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Validate update permissions
    const hasUpdateAccess = 
      currentUser.role === Role.PLATFORM_ADMIN || 
      (currentUser.organizationId === property.organizationId && 
       ([Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN, Role.PROPERTY_MANAGER] as Role[]).includes(currentUser.role));

    if (!hasUpdateAccess) {
      throw new ForbiddenException('Insufficient permissions to update this property');
    }

    // Handle slug update and field mapping
    const { slug, contactPhone, contactEmail, ...updateData } = updatePropertyDto;
    let finalSlug = property.slug;

    if (slug && slug !== property.slug) {
      // Check if new slug is unique within the organization
      const existingProperty = await this.prisma.property.findFirst({
        where: { 
          organizationId: property.organizationId,
          slug,
          NOT: { id }
        }
      });

      if (existingProperty) {
        throw new BadRequestException(`Property with slug '${slug}' already exists in this organization`);
      }

      finalSlug = slug;
    }

    try {
      const updatedProperty = await this.prisma.property.update({
        where: { id },
        data: {
          ...updateData,
          slug: finalSlug,
          // Map DTO fields to database fields
          ...(contactPhone !== undefined && { phoneNumber: contactPhone }),
          ...(contactEmail !== undefined && { email: contactEmail }),
          address: updateData.address ? updateData.address as any : undefined,
          settings: updateData.settings ? updateData.settings as any : undefined,
          branding: updateData.branding ? updateData.branding as any : undefined,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              users: true,
              departments: true
            }
          }
        }
      });

      this.logger.log(`Property updated: ${property.name} (${id}) by user ${currentUser.id}`);
      return updatedProperty;
    } catch (error) {
      this.logger.error(`Failed to update property: ${error.message}`, error.stack);
      // Expose specific Prisma errors for better debugging
      if (error.code === 'P2002') {
        throw new BadRequestException('A property with this information already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Property not found');
      }
      // Log the actual error but provide a more specific message for debugging
      throw new BadRequestException(`Failed to update property: ${error.message}`);
    }
  }

  /**
   * Soft delete property
   */
  async remove(id: string, currentUser: User): Promise<void> {
    // Validate access
    await this.validatePropertyAccess(id, currentUser);

    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, departments: true }
        }
      }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Only Platform Admins and Organization Owners can delete properties
    const hasDeleteAccess = 
      currentUser.role === Role.PLATFORM_ADMIN || 
      (currentUser.organizationId === property.organizationId && 
       currentUser.role === Role.ORGANIZATION_OWNER);

    if (!hasDeleteAccess) {
      throw new ForbiddenException('Insufficient permissions to delete this property');
    }

    // Prevent deletion if property has active users or departments
    if (property._count.users > 0 || property._count.departments > 0) {
      throw new BadRequestException(
        'Cannot delete property with existing users or departments. Please move or delete them first.'
      );
    }

    try {
      await this.prisma.property.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });

      this.logger.log(`Property soft deleted: ${property.name} (${id}) by user ${currentUser.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete property: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete property');
    }
  }

  /**
   * Get users in property
   */
  async getUsers(id: string, currentUser: User) {
    // Validate access
    await this.validatePropertyAccess(id, currentUser);

    const users = await this.prisma.user.findMany({
      where: {
        propertyId: id
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        departmentId: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return users;
  }

  /**
   * Get departments in property
   */
  async getDepartments(id: string, currentUser: User) {
    // Validate access
    await this.validatePropertyAccess(id, currentUser);

    const departments = await this.prisma.department.findMany({
      where: {
        propertyId: id
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return departments;
  }

  /**
   * Assign users to property
   */
  async assignUsers(id: string, assignUsersDto: AssignUsersToPropertyDto, currentUser: User) {
    // Validate access
    await this.validatePropertyAccess(id, currentUser);

    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { organizationId: true, name: true }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Validate assignment permissions
    const hasAssignAccess = 
      currentUser.role === Role.PLATFORM_ADMIN || 
      (currentUser.organizationId === property.organizationId && 
       ([Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN, Role.PROPERTY_MANAGER] as Role[]).includes(currentUser.role));

    if (!hasAssignAccess) {
      throw new ForbiddenException('Insufficient permissions to assign users to property');
    }

    const results = [];

    for (const assignment of assignUsersDto.assignments) {
      try {
        // Verify user exists and belongs to same organization
        const user = await this.prisma.user.findUnique({
          where: { id: assignment.userId },
          select: { organizationId: true, email: true }
        });

        if (!user) {
          results.push({
            userId: assignment.userId,
            success: false,
            error: 'User not found'
          });
          continue;
        }

        if (user.organizationId !== property.organizationId) {
          results.push({
            userId: assignment.userId,
            success: false,
            error: 'User must belong to the same organization as the property'
          });
          continue;
        }

        // Validate department if provided
        if (assignment.departmentId) {
          const department = await this.prisma.department.findUnique({
            where: { id: assignment.departmentId },
            select: { propertyId: true }
          });

          if (!department || department.propertyId !== id) {
            results.push({
              userId: assignment.userId,
              success: false,
              error: 'Department not found in this property'
            });
            continue;
          }
        }

        // Update user's property assignment
        await this.prisma.user.update({
          where: { id: assignment.userId },
          data: {
            propertyId: id,
            departmentId: assignment.departmentId || null,
            role: assignment.role || undefined, // Update role if provided
          }
        });

        results.push({
          userId: assignment.userId,
          success: true,
          message: `User assigned to ${property.name}`
        });

        this.logger.log(`User ${assignment.userId} assigned to property ${id} by user ${currentUser.id}`);
      } catch (error) {
        results.push({
          userId: assignment.userId,
          success: false,
          error: error.message
        });
      }
    }

    return { results };
  }

  /**
   * Remove user from property
   */
  async removeUser(id: string, removeUserDto: RemoveUserFromPropertyDto, currentUser: User) {
    // Validate access
    await this.validatePropertyAccess(id, currentUser);

    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { organizationId: true, name: true }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Validate removal permissions
    const hasRemoveAccess = 
      currentUser.role === Role.PLATFORM_ADMIN || 
      (currentUser.organizationId === property.organizationId && 
       ([Role.ORGANIZATION_OWNER, Role.ORGANIZATION_ADMIN, Role.PROPERTY_MANAGER] as Role[]).includes(currentUser.role));

    if (!hasRemoveAccess) {
      throw new ForbiddenException('Insufficient permissions to remove users from property');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: removeUserDto.userId },
      select: { propertyId: true, organizationId: true, email: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.propertyId !== id) {
      throw new BadRequestException('User is not assigned to this property');
    }

    // Prevent removing yourself
    if (removeUserDto.userId === currentUser.id) {
      throw new BadRequestException('Cannot remove yourself from property');
    }

    let targetPropertyId = removeUserDto.targetPropertyId;

    // If target property specified, validate it
    if (targetPropertyId) {
      const targetProperty = await this.prisma.property.findUnique({
        where: { id: targetPropertyId },
        select: { organizationId: true }
      });

      if (!targetProperty) {
        throw new NotFoundException('Target property not found');
      }

      if (targetProperty.organizationId !== user.organizationId) {
        throw new BadRequestException('Target property must be in the same organization');
      }
    }

    try {
      await this.prisma.user.update({
        where: { id: removeUserDto.userId },
        data: {
          propertyId: targetPropertyId || null,
          departmentId: null, // Clear department assignment
        }
      });

      this.logger.log(`User ${removeUserDto.userId} removed from property ${id} by user ${currentUser.id}`);

      const message = targetPropertyId 
        ? `User moved to target property`
        : `User removed from ${property.name}`;

      return {
        success: true,
        message
      };
    } catch (error) {
      this.logger.error(`Failed to remove user from property: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to remove user from property');
    }
  }

  /**
   * Validate if current user can access organization
   */
  private async validateOrganizationAccess(organizationId: string, currentUser: User): Promise<void> {
    // Platform Admins can access any organization
    if (currentUser.role === Role.PLATFORM_ADMIN) {
      return;
    }

    // All other users can only access their own organization
    if (currentUser.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this organization');
    }
  }

  /**
   * Validate if current user can access property
   */
  private async validatePropertyAccess(propertyId: string, currentUser: User): Promise<void> {
    // Platform Admins can access any property
    if (currentUser.role === Role.PLATFORM_ADMIN) {
      return;
    }

    // Get property to check organization
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { organizationId: true }
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Property must belong to user's organization
    if (property.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException('Access denied to this property');
    }
  }

  /**
   * Create default departments for a new property
   */
  private async createDefaultDepartments(propertyId: string, departmentNames: string[]): Promise<void> {
    const departments = departmentNames.map(name => ({
      propertyId,
      name,
      description: `Default ${name} department`,
      isActive: true
    }));

    try {
      await this.prisma.department.createMany({
        data: departments,
        skipDuplicates: true
      });

      this.logger.log(`Created ${departments.length} default departments for property ${propertyId}`);
    } catch (error) {
      this.logger.warn(`Failed to create some default departments: ${error.message}`);
    }
  }

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}