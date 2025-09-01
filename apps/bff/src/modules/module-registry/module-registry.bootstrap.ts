import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRegistryService } from './module-registry.service';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class ModuleRegistryBootstrap implements OnModuleInit {
  private readonly logger = new Logger(ModuleRegistryBootstrap.name);

  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Seed manifests if missing (idempotent)
      await this.moduleRegistry.registerModule({
        moduleId: 'concierge',
        name: 'Concierge',
        version: '1.0.0',
        category: 'operations',
        description: 'Guest experience orchestration',
        internalPermissions: [
          { resource: 'concierge.object-types', action: 'read', scope: 'property', name: 'Read Concierge Object Types' },
          { resource: 'concierge.objects', action: 'create', scope: 'property', name: 'Create Concierge Objects' },
          { resource: 'concierge.objects', action: 'read', scope: 'property', name: 'Read Concierge Objects' },
          { resource: 'concierge.objects', action: 'update', scope: 'property', name: 'Update Concierge Objects' },
          { resource: 'concierge.objects', action: 'complete', scope: 'property', name: 'Complete Concierge Objects' },
          { resource: 'concierge.playbooks', action: 'manage', scope: 'property', name: 'Manage Concierge Playbooks' },
          { resource: 'concierge.playbooks', action: 'execute', scope: 'property', name: 'Execute Concierge Playbooks' },
        ],
        externalPermissions: [],
        internalNavigation: [
          { id: 'concierge-root', label: 'Concierge', path: '/concierge', icon: 'concierge', requiredPermissions: ['concierge.objects.read.property'] },
          { id: 'concierge-today', label: 'Today Board', path: '/concierge/today', icon: 'board', requiredPermissions: ['concierge.objects.read.property'] },
        ],
        externalNavigation: [],
        dependencies: [],
        isSystemModule: false,
      });

      await this.moduleRegistry.registerModule({
        moduleId: 'vendors',
        name: 'Vendors',
        version: '1.0.0',
        category: 'operations',
        description: 'Vendor orchestration and portal',
        internalPermissions: [
          { resource: 'vendors', action: 'manage', scope: 'property', name: 'Manage Vendors' },
          { resource: 'vendors.links', action: 'confirm', scope: 'property', name: 'Confirm Vendor Links' },
        ],
        externalPermissions: [],
        internalNavigation: [
          { id: 'vendors-root', label: 'Vendors', path: '/vendors', icon: 'vendors', requiredPermissions: ['vendors.manage.property'] },
        ],
        externalNavigation: [],
        dependencies: [],
        isSystemModule: false,
      });

      // Enable modules at org-level for all organizations (dev bootstrap)
      const orgs = await this.prisma.organization.findMany({ select: { id: true, slug: true } });
      for (const org of orgs) {
        await this.prisma.moduleSubscription.upsert({
          where: { organizationId_moduleName: { organizationId: org.id, moduleName: 'concierge' } },
          create: { organizationId: org.id, moduleName: 'concierge', isEnabled: true, enabledAt: new Date(), propertyId: null },
          update: { isEnabled: true, enabledAt: new Date(), disabledAt: null },
        } as any);

        await this.prisma.moduleSubscription.upsert({
          where: { organizationId_moduleName: { organizationId: org.id, moduleName: 'vendors' } },
          create: { organizationId: org.id, moduleName: 'vendors', isEnabled: true, enabledAt: new Date(), propertyId: null },
          update: { isEnabled: true, enabledAt: new Date(), disabledAt: null },
        } as any);
      }
      this.logger.log(`Seeded and enabled modules for ${orgs.length} organizations`);
    } catch (error) {
      this.logger.error('Module registry bootstrap failed', error as any);
    }
  }
}


