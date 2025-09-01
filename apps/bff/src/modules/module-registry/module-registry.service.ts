import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { 
  ModuleManifest, 
  Permission, 
  UserType, 
  Prisma 
} from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';

interface ModulePermission {
  resource: string;
  action: string;
  scope: string;
  name: string;
  description?: string;
  category?: string;
}

interface ModuleNavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  requiredPermissions: string[];
  children?: ModuleNavigationItem[];
}

export interface RegisterModuleDto {
  moduleId: string;
  name: string;
  version: string;
  category: string;
  description?: string;
  internalPermissions: ModulePermission[];
  externalPermissions: ModulePermission[];
  internalNavigation: ModuleNavigationItem[];
  externalNavigation: ModuleNavigationItem[];
  dependencies?: string[];
  isSystemModule?: boolean;
}

@Injectable()
export class ModuleRegistryService {
  private readonly logger = new Logger(ModuleRegistryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Register a new module or update existing one
   */
  async registerModule(manifest: RegisterModuleDto): Promise<ModuleManifest> {
    this.logger.log(`Registering module: ${manifest.moduleId}`);

    try {
      // Validate dependencies first
      if (manifest.dependencies && manifest.dependencies.length > 0) {
        const isValid = await this.validateModuleDependencies(manifest.moduleId, manifest.dependencies);
        if (!isValid) {
          throw new BadRequestException(`Module ${manifest.moduleId} has unmet dependencies`);
        }
      }

      // Convert permissions to the format expected by the database
      const internalPermissions = await this.processModulePermissions(manifest.internalPermissions);
      const externalPermissions = await this.processModulePermissions(manifest.externalPermissions);

      // Create or update module manifest
      const moduleManifest = await this.prisma.moduleManifest.upsert({
        where: { moduleId: manifest.moduleId },
        create: {
          moduleId: manifest.moduleId,
          name: manifest.name,
          version: manifest.version,
          category: manifest.category,
          description: manifest.description,
          internalPermissions: internalPermissions,
          externalPermissions: externalPermissions,
          internalNavigation: manifest.internalNavigation as any,
          externalNavigation: manifest.externalNavigation as any,
          dependencies: manifest.dependencies || [],
          isSystemModule: manifest.isSystemModule || false,
          isActive: true,
        },
        update: {
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          internalPermissions: internalPermissions,
          externalPermissions: externalPermissions,
          internalNavigation: manifest.internalNavigation as any,
          externalNavigation: manifest.externalNavigation as any,
          dependencies: manifest.dependencies || [],
        },
      });

      // Create individual permission records if they don't exist
      await this.ensureModulePermissions(manifest.internalPermissions);
      await this.ensureModulePermissions(manifest.externalPermissions);

      this.logger.log(`Module ${manifest.moduleId} registered successfully`);
      return moduleManifest;

    } catch (error) {
      this.logger.error(`Error registering module ${manifest.moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a module
   */
  async unregisterModule(moduleId: string): Promise<void> {
    this.logger.log(`Unregistering module: ${moduleId}`);

    try {
      const manifest = await this.prisma.moduleManifest.findUnique({
        where: { moduleId }
      });

      if (!manifest) {
        throw new NotFoundException(`Module ${moduleId} not found`);
      }

      if (manifest.isSystemModule) {
        throw new BadRequestException(`Cannot unregister system module: ${moduleId}`);
      }

      // Check if any organizations are using this module
      const activeSubscriptions = await this.prisma.moduleSubscription.count({
        where: {
          moduleName: moduleId,
          isEnabled: true,
        },
      });

      if (activeSubscriptions > 0) {
        throw new ConflictException(
          `Cannot unregister module ${moduleId} - it has ${activeSubscriptions} active subscriptions`
        );
      }

      // Soft delete by marking as inactive
      await this.prisma.moduleManifest.update({
        where: { moduleId },
        data: { isActive: false }
      });

      this.logger.log(`Module ${moduleId} unregistered successfully`);

    } catch (error) {
      this.logger.error(`Error unregistering module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get enabled modules for an organization
   */
  async getEnabledModules(organizationId: string, userType?: UserType): Promise<ModuleManifest[]> {
    try {
      // Get enabled module subscriptions for the organization
      const subscriptions = await this.prisma.moduleSubscription.findMany({
        where: {
          organizationId,
          isEnabled: true,
        },
        select: { moduleName: true }
      });

      if (subscriptions.length === 0) {
        return [];
      }

      const moduleIds = subscriptions.map(sub => sub.moduleName);

      // Get module manifests
      const manifests = await this.prisma.moduleManifest.findMany({
        where: {
          moduleId: { in: moduleIds },
          isActive: true,
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      this.logger.debug(`Retrieved ${manifests.length} enabled modules for org ${organizationId}, userType: ${userType}`);
      return manifests;

    } catch (error) {
      this.logger.error(`Error getting enabled modules for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Property-aware effective enablement check with precedence:
   * 1) property-level (org, module, property) if exists
   * 2) fallback to org-level (org, module, NULL)
   */
  async isModuleEnabledForProperty(
    organizationId: string,
    propertyId: string | null,
    moduleId: string
  ): Promise<boolean> {
    // Check property-level override first
    if (propertyId) {
      const propertyLevel = await this.prisma.moduleSubscription.findFirst({
        where: { organizationId, moduleName: moduleId, propertyId, },
        select: { isEnabled: true },
      });
      if (propertyLevel) {
        return !!propertyLevel.isEnabled;
      }
    }

    // Fall back to org-level (propertyId null)
    const orgLevel = await this.prisma.moduleSubscription.findFirst({
      where: { organizationId, moduleName: moduleId, propertyId: null },
      select: { isEnabled: true },
    });
    return !!orgLevel?.isEnabled;
  }

  /**
   * Get enabled modules effective for a property (applies precedence rules)
   */
  async getEnabledModulesForProperty(
    organizationId: string,
    propertyId: string
  ): Promise<ModuleManifest[]> {
    // Fetch both property-level enabled and org-level enabled
    const subs = await this.prisma.moduleSubscription.findMany({
      where: {
        organizationId,
        isEnabled: true,
        OR: [
          { propertyId },
          { propertyId: null },
        ],
      },
      select: { moduleName: true, propertyId: true },
    });

    // Apply precedence: property-level wins
    const effective = new Map<string, boolean>();
    for (const s of subs) {
      const key = s.moduleName;
      if (s.propertyId === propertyId) {
        effective.set(key, true);
      } else if (!effective.has(key) && s.propertyId === null) {
        effective.set(key, true);
      }
    }

    const moduleIds = Array.from(effective.keys());
    if (moduleIds.length === 0) return [];

    return this.prisma.moduleManifest.findMany({
      where: { moduleId: { in: moduleIds }, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get module manifest by ID
   */
  async getModuleManifest(moduleId: string): Promise<ModuleManifest | null> {
    try {
      return await this.prisma.moduleManifest.findFirst({
        where: { moduleId, isActive: true }
      });
    } catch (error) {
      this.logger.error(`Error getting module manifest for ${moduleId}:`, error);
      return null;
    }
  }

  /**
   * Enable a module for an organization
   */
  async enableModule(organizationId: string, moduleId: string): Promise<void> {
    this.logger.log(`Enabling module ${moduleId} for organization ${organizationId}`);

    try {
      // Verify module exists and is active
      const manifest = await this.getModuleManifest(moduleId);
      if (!manifest) {
        throw new NotFoundException(`Module ${moduleId} not found or inactive`);
      }

      // Validate dependencies
      const isValid = await this.validateModuleDependencies(moduleId);
      if (!isValid) {
        throw new BadRequestException(`Module ${moduleId} has unmet dependencies`);
      }

      // Enable the module subscription
      // Use findFirst + create/update to avoid relying on a non-representable partial-unique in Prisma
      const existing = await this.prisma.moduleSubscription.findFirst({
        where: { organizationId, moduleName: moduleId, propertyId: null },
      });
      if (existing) {
        await this.prisma.moduleSubscription.update({
          where: { id: existing.id },
          data: { isEnabled: true, enabledAt: new Date(), disabledAt: null },
        });
      } else {
        await this.prisma.moduleSubscription.create({
          data: {
            organizationId,
            moduleName: moduleId,
            propertyId: null,
            isEnabled: true,
            enabledAt: new Date(),
          },
        });
      }

      // Log the action
      await this.auditService.logCreate(
        'system', // TODO: Pass actual user ID
        'ModuleSubscription',
        `${organizationId}:${moduleId}`,
        {
          organizationId,
          moduleId,
          action: 'enable',
        }
      );

      this.logger.log(`Module ${moduleId} enabled for organization ${organizationId}`);

    } catch (error) {
      this.logger.error(`Error enabling module ${moduleId} for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Disable a module for an organization
   */
  async disableModule(organizationId: string, moduleId: string): Promise<void> {
    this.logger.log(`Disabling module ${moduleId} for organization ${organizationId}`);

    try {
      const subscription = await this.prisma.moduleSubscription.findFirst({
        where: { organizationId, moduleName: moduleId, propertyId: null },
      });

      if (!subscription) {
        throw new NotFoundException(`Module subscription not found`);
      }

      // Check if module is a system module that cannot be disabled
      const manifest = await this.getModuleManifest(moduleId);
      if (manifest?.isSystemModule) {
        throw new BadRequestException(`Cannot disable system module: ${moduleId}`);
      }

      // Disable the module subscription
      await this.prisma.moduleSubscription.update({
        where: { id: subscription.id },
        data: { isEnabled: false, disabledAt: new Date() },
      });

      // Log the action
      await this.auditService.logUpdate(
        'system', // TODO: Pass actual user ID
        'ModuleSubscription',
        subscription.id,
        subscription,
        { isEnabled: false, disabledAt: new Date() }
      );

      this.logger.log(`Module ${moduleId} disabled for organization ${organizationId}`);

    } catch (error) {
      this.logger.error(`Error disabling module ${moduleId} for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Get permissions for a module
   */
  async getModulePermissions(moduleId: string, userType: UserType): Promise<Permission[]> {
    try {
      const manifest = await this.getModuleManifest(moduleId);
      if (!manifest) {
        this.logger.warn(`Module manifest not found for moduleId: ${moduleId}`);
        return [];
      }

      const permissionsData = userType === UserType.INTERNAL
        ? manifest.internalPermissions
        : manifest.externalPermissions;

      // Convert stored permissions to Permission objects
      if (Array.isArray(permissionsData)) {
        return permissionsData as unknown as Permission[];
      }

      return [];
    } catch (error) {
      this.logger.error(`Error getting permissions for module ${moduleId}, userType ${userType}:`, error);
      return [];
    }
  }

  /**
   * Validate module dependencies
   */
  async validateModuleDependencies(moduleId: string, dependencies?: string[]): Promise<boolean> {
    try {
      let deps = dependencies;
      
      if (!deps) {
        // Get dependencies from manifest
        const manifest = await this.getModuleManifest(moduleId);
        if (!manifest) return true; // No dependencies if module doesn't exist
        
        deps = Array.isArray(manifest.dependencies) ? manifest.dependencies as string[] : [];
      }

      if (!deps || deps.length === 0) {
        return true; // No dependencies to validate
      }

      // Check if all dependencies are registered and active
      const availableDependencies = await this.prisma.moduleManifest.findMany({
        where: {
          moduleId: { in: deps },
          isActive: true,
        },
        select: { moduleId: true }
      });

      const availableModuleIds = availableDependencies.map(d => d.moduleId);
      const missingDependencies = deps.filter(dep => !availableModuleIds.includes(dep));

      if (missingDependencies.length > 0) {
        this.logger.warn(`Module ${moduleId} has missing dependencies: ${missingDependencies.join(', ')}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating dependencies for module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Get all available modules
   */
  async getAllModules(): Promise<ModuleManifest[]> {
    try {
      return await this.prisma.moduleManifest.findMany({
        where: { isActive: true },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });
    } catch (error) {
      this.logger.error('Error getting all modules:', error);
      return [];
    }
  }

  /**
   * Process module permissions and ensure they exist in the Permission table
   */
  private async processModulePermissions(permissions: ModulePermission[]): Promise<any> {
    const processedPermissions = [];

    for (const perm of permissions) {
      // Create the permission object that will be stored in the database
      const permissionData = {
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope,
        name: perm.name,
        description: perm.description,
        category: perm.category,
        isSystem: false, // Module permissions are not system permissions
      };

      processedPermissions.push(permissionData);
    }

    return processedPermissions;
  }

  /**
   * Ensure module permissions exist in the Permission table
   */
  private async ensureModulePermissions(permissions: ModulePermission[]): Promise<void> {
    for (const perm of permissions) {
      try {
        await this.prisma.permission.upsert({
          where: {
            resource_action_scope: {
              resource: perm.resource,
              action: perm.action,
              scope: perm.scope,
            },
          },
          create: {
            resource: perm.resource,
            action: perm.action,
            scope: perm.scope,
            name: perm.name,
            description: perm.description,
            category: perm.category,
            isSystem: false,
          },
          update: {
            name: perm.name,
            description: perm.description,
            category: perm.category,
          },
        });
      } catch (error) {
        this.logger.error(`Error ensuring permission ${perm.resource}.${perm.action}.${perm.scope}:`, error);
        // Continue with other permissions even if one fails
      }
    }
  }

  /**
   * Enable a module for a specific property (creates property-level override)
   */
  async enableModuleForProperty(
    organizationId: string,
    propertyId: string,
    moduleId: string
  ): Promise<void> {
    this.logger.log(`Enabling module ${moduleId} for property ${propertyId} in org ${organizationId}`);

    try {
      // Verify module exists and is active
      const manifest = await this.getModuleManifest(moduleId);
      if (!manifest) {
        throw new NotFoundException(`Module ${moduleId} not found or inactive`);
      }

      // Validate dependencies
      const isValid = await this.validateModuleDependencies(moduleId);
      if (!isValid) {
        throw new BadRequestException(`Module ${moduleId} has unmet dependencies`);
      }

      // Create property-level subscription (overrides organization setting)
      const existing = await this.prisma.moduleSubscription.findFirst({
        where: { organizationId, moduleName: moduleId, propertyId },
      });
      
      if (existing) {
        await this.prisma.moduleSubscription.update({
          where: { id: existing.id },
          data: { 
            isEnabled: true, 
            enabledAt: new Date(), 
            disabledAt: null,
            settings: existing.settings // Preserve existing settings
          },
        });
      } else {
        await this.prisma.moduleSubscription.create({
          data: {
            organizationId,
            propertyId,
            moduleName: moduleId,
            isEnabled: true,
            enabledAt: new Date(),
          },
        });
      }

      // Log the action
      await this.auditService.logCreate(
        'system',
        'ModuleSubscription',
        `${organizationId}:${propertyId}:${moduleId}`,
        {
          organizationId,
          propertyId,
          moduleId,
          action: 'enable_property_override',
        }
      );

      this.logger.log(`Module ${moduleId} enabled for property ${propertyId}`);

    } catch (error) {
      this.logger.error(`Error enabling module ${moduleId} for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Disable a module for a specific property (creates property-level override)
   */
  async disableModuleForProperty(
    organizationId: string,
    propertyId: string,
    moduleId: string
  ): Promise<void> {
    this.logger.log(`Disabling module ${moduleId} for property ${propertyId} in org ${organizationId}`);

    try {
      // Check if module is a system module that cannot be disabled
      const manifest = await this.getModuleManifest(moduleId);
      if (manifest?.isSystemModule) {
        throw new BadRequestException(`Cannot disable system module: ${moduleId}`);
      }

      // Create property-level subscription with disabled status (overrides organization setting)
      const existing = await this.prisma.moduleSubscription.findFirst({
        where: { organizationId, moduleName: moduleId, propertyId },
      });
      
      if (existing) {
        await this.prisma.moduleSubscription.update({
          where: { id: existing.id },
          data: { 
            isEnabled: false, 
            disabledAt: new Date(),
            settings: existing.settings // Preserve existing settings
          },
        });
      } else {
        // Create a property-level disabled override
        await this.prisma.moduleSubscription.create({
          data: {
            organizationId,
            propertyId,
            moduleName: moduleId,
            isEnabled: false,
            disabledAt: new Date(),
          },
        });
      }

      // Log the action
      await this.auditService.logUpdate(
        'system',
        'ModuleSubscription',
        `${organizationId}:${propertyId}:${moduleId}`,
        { isEnabled: true },
        { isEnabled: false, disabledAt: new Date() }
      );

      this.logger.log(`Module ${moduleId} disabled for property ${propertyId}`);

    } catch (error) {
      this.logger.error(`Error disabling module ${moduleId} for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Remove property-level override (fall back to organization setting)
   */
  async removePropertyOverride(
    organizationId: string,
    propertyId: string,
    moduleId: string
  ): Promise<void> {
    this.logger.log(`Removing property override for module ${moduleId} in property ${propertyId}`);

    try {
      const propertySubscription = await this.prisma.moduleSubscription.findFirst({
        where: { organizationId, moduleName: moduleId, propertyId },
      });

      if (!propertySubscription) {
        throw new NotFoundException(`Property-level override not found`);
      }

      // Delete the property-level subscription
      await this.prisma.moduleSubscription.delete({
        where: { id: propertySubscription.id },
      });

      // Log the action
      await this.auditService.logDelete(
        'system',
        'ModuleSubscription',
        propertySubscription.id,
        propertySubscription
      );

      this.logger.log(`Property override removed for module ${moduleId} in property ${propertyId}`);

    } catch (error) {
      this.logger.error(`Error removing property override for module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed module status for a property with precedence information
   */
  async getModuleStatusDetails(
    organizationId: string,
    propertyId: string,
    moduleId: string
  ): Promise<{
    orgLevelEnabled: boolean;
    propertyLevelOverride: boolean | null;
    effectiveStatus: boolean;
    precedenceSource: 'property' | 'organization' | 'none';
  }> {
    try {
      // Check organization-level subscription
      const orgSubscription = await this.prisma.moduleSubscription.findFirst({
        where: { organizationId, moduleName: moduleId, propertyId: null },
        select: { isEnabled: true },
      });

      // Check property-level subscription
      const propertySubscription = await this.prisma.moduleSubscription.findFirst({
        where: { organizationId, moduleName: moduleId, propertyId },
        select: { isEnabled: true },
      });

      const orgLevelEnabled = !!orgSubscription?.isEnabled;
      const propertyLevelOverride = propertySubscription ? propertySubscription.isEnabled : null;
      
      let effectiveStatus: boolean;
      let precedenceSource: 'property' | 'organization' | 'none';

      if (propertySubscription) {
        effectiveStatus = propertySubscription.isEnabled;
        precedenceSource = 'property';
      } else if (orgSubscription) {
        effectiveStatus = orgSubscription.isEnabled;
        precedenceSource = 'organization';
      } else {
        effectiveStatus = false;
        precedenceSource = 'none';
      }

      return {
        orgLevelEnabled,
        propertyLevelOverride,
        effectiveStatus,
        precedenceSource,
      };

    } catch (error) {
      this.logger.error(`Error getting module status details for ${moduleId}:`, error);
      return {
        orgLevelEnabled: false,
        propertyLevelOverride: null,
        effectiveStatus: false,
        precedenceSource: 'none',
      };
    }
  }

  /**
   * Get comprehensive organization module status with property overrides
   */
  async getOrganizationModuleStatus(organizationId: string): Promise<{
    organizationModules: Array<{
      moduleId: string;
      isEnabled: boolean;
      enabledAt?: Date | null;
      disabledAt?: Date | null;
      settings?: any;
    }>;
    propertyOverrides: Array<{
      propertyId: string;
      moduleId: string;
      isEnabled: boolean;
      enabledAt?: Date | null;
      disabledAt?: Date | null;
      settings?: any;
    }>;
    availableModules: Array<{
      moduleId: string;
      name: string;
      category: string;
      description?: string;
      isSystemModule: boolean;
    }>;
  }> {
    try {
      // Get organization-level subscriptions
      const orgSubscriptions = await this.prisma.moduleSubscription.findMany({
        where: {
          organizationId,
          propertyId: null,
        },
        select: {
          moduleName: true,
          isEnabled: true,
          enabledAt: true,
          disabledAt: true,
          settings: true,
        },
        orderBy: { moduleName: 'asc' },
      });

      // Get property-level overrides
      const propertyOverrides = await this.prisma.moduleSubscription.findMany({
        where: {
          organizationId,
          propertyId: { not: null },
        },
        select: {
          propertyId: true,
          moduleName: true,
          isEnabled: true,
          enabledAt: true,
          disabledAt: true,
          settings: true,
        },
        orderBy: [{ propertyId: 'asc' }, { moduleName: 'asc' }],
      });

      // Get all available modules
      const availableModules = await this.prisma.moduleManifest.findMany({
        where: { isActive: true },
        select: {
          moduleId: true,
          name: true,
          category: true,
          description: true,
          isSystemModule: true,
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      return {
        organizationModules: orgSubscriptions.map(sub => ({
          moduleId: sub.moduleName,
          isEnabled: sub.isEnabled,
          enabledAt: sub.enabledAt,
          disabledAt: sub.disabledAt,
          settings: sub.settings,
        })),
        propertyOverrides: propertyOverrides.map(sub => ({
          propertyId: sub.propertyId!,
          moduleId: sub.moduleName,
          isEnabled: sub.isEnabled,
          enabledAt: sub.enabledAt,
          disabledAt: sub.disabledAt,
          settings: sub.settings,
        })),
        availableModules: availableModules.map(mod => ({
          moduleId: mod.moduleId,
          name: mod.name,
          category: mod.category,
          description: mod.description,
          isSystemModule: mod.isSystemModule,
        })),
      };

    } catch (error) {
      this.logger.error(`Error getting organization module status for ${organizationId}:`, error);
      return {
        organizationModules: [],
        propertyOverrides: [],
        availableModules: [],
      };
    }
  }

  /**
   * Get modules with caching for performance
   */
  async getCachedModules(cacheKey: string, fetchFn: () => Promise<any>): Promise<any> {
    // For now, return direct fetch - can add Redis caching later
    return fetchFn();
  }

  /**
   * Validate property exists and user has access
   */
  async validatePropertyAccess(organizationId: string, propertyId: string): Promise<boolean> {
    try {
      const property = await this.prisma.property.findFirst({
        where: {
          id: propertyId,
          organizationId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });
      
      return !!property;
    } catch (error) {
      this.logger.error(`Error validating property access:`, error);
      return false;
    }
  }
}