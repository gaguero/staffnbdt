import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { PermissionService } from '../../shared/services/permission.service';
import { Organization, User, Role, Prisma } from '@prisma/client';
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationFilterDto, AssignUsersToOrganizationDto, RemoveUserFromOrganizationDto } from './dto';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Create a new organization (Platform Admin only)
   */
  async create(createOrganizationDto: CreateOrganizationDto, currentUser: User): Promise<Organization> {
    // Only Platform Admins can create organizations
    if (currentUser.role !== Role.PLATFORM_ADMIN) {
      throw new ForbiddenException('Only Platform Admins can create organizations');
    }

    const { slug, branding, settings, ...organizationData } = createOrganizationDto;

    // Generate slug if not provided
    const finalSlug = slug || this.generateSlug(createOrganizationDto.name);

    // Check if slug is unique
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: finalSlug }
    });

    if (existingOrg) {
      throw new BadRequestException(`Organization with slug '${finalSlug}' already exists`);
    }

    try {
      const organization = await this.prisma.organization.create({
        data: {
          ...organizationData,
          slug: finalSlug,
          settings: settings ? settings as any : {
            defaultLanguage: 'en',
            supportedLanguages: ['en'],
            theme: 'default'
          },
          branding: branding ? branding as any : {},
          isActive: createOrganizationDto.isActive ?? true,
        },
        include: {
          _count: {
            select: {
              properties: true,
              users: true
            }
          }
        }
      });

      this.logger.log(`Organization created: ${organization.name} (${organization.id}) by user ${currentUser.id}`);
      return organization;
    } catch (error) {
      this.logger.error(`Failed to create organization: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create organization');
    }
  }

  /**
   * Get all organizations with filtering and pagination
   */
  async findAll(filterDto: OrganizationFilterDto, currentUser: User) {
    // Check if user has permission to manage organizations
    const hasPermission = await this.permissionService.evaluatePermission(
      { resource: 'system', action: 'manage', scope: 'organizations' },
      { user: currentUser, organizationId: currentUser.organizationId, propertyId: currentUser.propertyId }
    );
    
    if (!hasPermission.granted) {
      throw new ForbiddenException('Access denied: Insufficient permissions to view organizations');
    }

    const {
      search,
      isActive,
      timezone,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = filterDto;

    const where: Prisma.OrganizationWhereInput = {};

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

    if (timezone) {
      where.timezone = timezone;
    }

    // Build order by clause
    const orderBy: Prisma.OrganizationOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    try {
      const [organizations, total] = await Promise.all([
        this.prisma.organization.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                properties: true,
                users: true
              }
            }
          }
        }),
        this.prisma.organization.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: organizations,
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
      this.logger.error(`Failed to fetch organizations: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch organizations');
    }
  }

  /**
   * Get organization by ID
   */
  async findOne(id: string, currentUser: User): Promise<Organization> {
    // Validate access
    await this.validateOrganizationAccess(id, currentUser);

    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            properties: true,
            users: true
          }
        }
      }
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Update organization
   */
  async update(id: string, updateOrganizationDto: UpdateOrganizationDto, currentUser: User): Promise<Organization> {
    // Validate access
    await this.validateOrganizationAccess(id, currentUser);

    // Only Platform Admins and Organization Owners can update organization
    const hasUpdateAccess = 
      currentUser.role === Role.PLATFORM_ADMIN || 
      (currentUser.role === Role.ORGANIZATION_OWNER && currentUser.organizationId === id);

    if (!hasUpdateAccess) {
      throw new ForbiddenException('Insufficient permissions to update organization');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id }
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Handle slug update
    const { slug, ...updateData } = updateOrganizationDto;
    let finalSlug = organization.slug;

    if (slug && slug !== organization.slug) {
      // Check if new slug is unique
      const existingOrg = await this.prisma.organization.findUnique({
        where: { slug }
      });

      if (existingOrg) {
        throw new BadRequestException(`Organization with slug '${slug}' already exists`);
      }

      finalSlug = slug;
    }

    try {
      const updatedOrganization = await this.prisma.organization.update({
        where: { id },
        data: {
          ...updateData,
          slug: finalSlug,
          settings: updateData.settings ? updateData.settings as any : undefined,
          branding: updateData.branding ? updateData.branding as any : undefined,
        },
        include: {
          _count: {
            select: {
              properties: true,
              users: true
            }
          }
        }
      });

      this.logger.log(`Organization updated: ${organization.name} (${id}) by user ${currentUser.id}`);
      return updatedOrganization;
    } catch (error) {
      this.logger.error(`Failed to update organization: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update organization');
    }
  }

  /**
   * Soft delete organization (Platform Admin only)
   */
  async remove(id: string, currentUser: User): Promise<void> {
    if (currentUser.role !== Role.PLATFORM_ADMIN) {
      throw new ForbiddenException('Only Platform Admins can delete organizations');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, properties: true }
        }
      }
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Prevent deletion if organization has active users or properties
    if (organization._count.users > 0 || organization._count.properties > 0) {
      throw new BadRequestException(
        'Cannot delete organization with existing users or properties. Please move or delete them first.'
      );
    }

    try {
      await this.prisma.organization.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });

      this.logger.log(`Organization soft deleted: ${organization.name} (${id}) by user ${currentUser.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete organization: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete organization');
    }
  }

  /**
   * Get properties in organization
   */
  async getProperties(id: string, currentUser: User) {
    // Validate access
    await this.validateOrganizationAccess(id, currentUser);

    const properties = await this.prisma.property.findMany({
      where: {
        organizationId: id,
        ...(currentUser.role !== Role.PLATFORM_ADMIN && { isActive: true })
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            departments: true
          }
        }
      }
    });

    return properties;
  }

  /**
   * Get users in organization
   */
  async getUsers(id: string, currentUser: User) {
    // Validate access
    await this.validateOrganizationAccess(id, currentUser);

    const users = await this.prisma.user.findMany({
      where: {
        organizationId: id,
        NOT: {
          deletedAt: { not: null }
        }
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
        propertyId: true,
        departmentId: true,
        createdAt: true,
        property: {
          select: {
            id: true,
            name: true
          }
        },
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
   * Assign users to organization
   */
  async assignUsers(id: string, assignUsersDto: AssignUsersToOrganizationDto, currentUser: User) {
    // Validate access
    await this.validateOrganizationAccess(id, currentUser);

    // Only Platform Admins and Organization Owners can assign users
    const hasAssignAccess = 
      currentUser.role === Role.PLATFORM_ADMIN || 
      (currentUser.role === Role.ORGANIZATION_OWNER && currentUser.organizationId === id);

    if (!hasAssignAccess) {
      throw new ForbiddenException('Insufficient permissions to assign users to organization');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id }
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const results = [];

    for (const assignment of assignUsersDto.assignments) {
      try {
        // Verify user exists
        const user = await this.prisma.user.findUnique({
          where: { id: assignment.userId }
        });

        if (!user) {
          results.push({
            userId: assignment.userId,
            success: false,
            error: 'User not found'
          });
          continue;
        }

        // Update user's organization and clear property/department assignments
        await this.prisma.user.update({
          where: { id: assignment.userId },
          data: {
            organizationId: id,
            propertyId: null, // Clear property assignment when changing organization
            departmentId: null, // Clear department assignment
            role: assignment.role || user.role, // Update role if provided
          }
        });

        results.push({
          userId: assignment.userId,
          success: true,
          message: `User assigned to ${organization.name}`
        });

        this.logger.log(`User ${assignment.userId} assigned to organization ${id} by user ${currentUser.id}`);
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
   * Remove user from organization
   */
  async removeUser(id: string, removeUserDto: RemoveUserFromOrganizationDto, currentUser: User) {
    // Validate access
    await this.validateOrganizationAccess(id, currentUser);

    // Only Platform Admins and Organization Owners can remove users
    const hasRemoveAccess = 
      currentUser.role === Role.PLATFORM_ADMIN || 
      (currentUser.role === Role.ORGANIZATION_OWNER && currentUser.organizationId === id);

    if (!hasRemoveAccess) {
      throw new ForbiddenException('Insufficient permissions to remove users from organization');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: removeUserDto.userId },
      select: { organizationId: true, email: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.organizationId !== id) {
      throw new BadRequestException('User is not in this organization');
    }

    // Prevent removing yourself
    if (removeUserDto.userId === currentUser.id) {
      throw new BadRequestException('Cannot remove yourself from organization');
    }

    let targetOrganizationId = removeUserDto.targetOrganizationId;

    // If no target organization specified, try to find a default one
    if (!targetOrganizationId) {
      const defaultOrg = await this.prisma.organization.findFirst({
        where: { slug: 'nayara-group' } // Your default organization
      });

      if (!defaultOrg) {
        throw new BadRequestException('No target organization specified and no default organization found');
      }

      targetOrganizationId = defaultOrg.id;
    }

    // Validate target organization exists
    const targetOrg = await this.prisma.organization.findUnique({
      where: { id: targetOrganizationId }
    });

    if (!targetOrg) {
      throw new NotFoundException('Target organization not found');
    }

    try {
      await this.prisma.user.update({
        where: { id: removeUserDto.userId },
        data: {
          organizationId: targetOrganizationId,
          propertyId: null, // Clear property assignment
          departmentId: null, // Clear department assignment
          role: Role.STAFF, // Reset to basic role
        }
      });

      this.logger.log(`User ${removeUserDto.userId} removed from organization ${id} and moved to ${targetOrganizationId} by user ${currentUser.id}`);

      return {
        success: true,
        message: `User moved to ${targetOrg.name}`
      };
    } catch (error) {
      this.logger.error(`Failed to remove user from organization: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to remove user from organization');
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