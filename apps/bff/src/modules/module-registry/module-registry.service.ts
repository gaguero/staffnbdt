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
   * Get module manifest by ID
   */
  async getModuleManifest(moduleId: string): Promise<ModuleManifest | null> {
    try {
      return await this.prisma.moduleManifest.findUnique({
        where: { 
          moduleId,
          isActive: true 
        }
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
      await this.prisma.moduleSubscription.upsert({
        where: {
          organizationId_moduleName: {
            organizationId,
            moduleName: moduleId,
          },
        },
        create: {
          organizationId,
          moduleName: moduleId,
          isEnabled: true,
          enabledAt: new Date(),
        },
        update: {
          isEnabled: true,
          enabledAt: new Date(),
          disabledAt: null,
        },
      });

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
      const subscription = await this.prisma.moduleSubscription.findUnique({
        where: {
          organizationId_moduleName: {
            organizationId,
            moduleName: moduleId,
          },
        },
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
        where: {
          organizationId_moduleName: {
            organizationId,
            moduleName: moduleId,
          },
        },
        data: {
          isEnabled: false,
          disabledAt: new Date(),
        },
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
}