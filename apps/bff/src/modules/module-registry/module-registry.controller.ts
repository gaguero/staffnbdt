import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModuleRegistryService, RegisterModuleDto } from './module-registry.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { UserType } from '@prisma/client';
import {
  ModuleStatusDetailDto,
  OrganizationModuleStatusDto,
  EnableModuleDto,
  DisableModuleDto,
  ModuleDependencyValidationDto
} from './dto';

@ApiTags('Module Registry')
@ApiBearerAuth()
@Controller('module-registry')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ModuleRegistryController {
  constructor(private readonly moduleRegistryService: ModuleRegistryService) {}

  @Post('register')
  @RequirePermission('module.create.platform')
  @ApiOperation({ summary: 'Register a new module' })
  @ApiResponse({ status: 201, description: 'Module registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid module data or unmet dependencies' })
  @ApiResponse({ status: 409, description: 'Module already exists' })
  async registerModule(@Body() registerModuleDto: RegisterModuleDto) {
    return this.moduleRegistryService.registerModule(registerModuleDto);
  }

  @Post('register/seed-defaults')
  @RequirePermission('module.create.platform')
  @ApiOperation({ summary: 'Seed default module manifests for Concierge and Vendors' })
  async seedDefaults() {
    const concierge = await this.moduleRegistryService.registerModule({
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

    const vendors = await this.moduleRegistryService.registerModule({
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

    return { concierge, vendors };
  }

  @Delete(':moduleId')
  @RequirePermission('module.delete.platform')
  @ApiOperation({ summary: 'Unregister a module' })
  @ApiResponse({ status: 204, description: 'Module unregistered successfully' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @ApiResponse({ status: 400, description: 'Cannot unregister system module' })
  @ApiResponse({ status: 409, description: 'Module has active subscriptions' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterModule(@Param('moduleId') moduleId: string) {
    await this.moduleRegistryService.unregisterModule(moduleId);
  }

  @Get()
  @RequirePermission('module.read.organization')
  @ApiOperation({ summary: 'Get all available modules' })
  @ApiResponse({ status: 200, description: 'List of all available modules' })
  async getAllModules() {
    return this.moduleRegistryService.getAllModules();
  }

  @Get('organization/:organizationId')
  @RequirePermission('module.read.organization')
  @ApiOperation({ summary: 'Get enabled modules for an organization' })
  @ApiResponse({ status: 200, description: 'List of enabled modules for the organization' })
  async getEnabledModules(
    @Param('organizationId') organizationId: string,
    @Query('userType') userType?: UserType,
  ) {
    return this.moduleRegistryService.getEnabledModules(organizationId, userType);
  }

  @Get(':moduleId')
  @RequirePermission('module.read.organization')
  @ApiOperation({ summary: 'Get module manifest by ID' })
  @ApiResponse({ status: 200, description: 'Module manifest' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async getModuleManifest(@Param('moduleId') moduleId: string) {
    return this.moduleRegistryService.getModuleManifest(moduleId);
  }

  @Post('organization/:organizationId/enable/:moduleId')
  @RequirePermission('module.manage.organization')
  @ApiOperation({ summary: 'Enable a module for an organization' })
  @ApiResponse({ status: 200, description: 'Module enabled successfully' })
  @ApiResponse({ status: 404, description: 'Module or organization not found' })
  @ApiResponse({ status: 400, description: 'Module has unmet dependencies' })
  async enableModule(
    @Param('organizationId') organizationId: string,
    @Param('moduleId') moduleId: string,
  ) {
    await this.moduleRegistryService.enableModule(organizationId, moduleId);
    return { message: 'Module enabled successfully' };
  }

  @Post('organization/:organizationId/disable/:moduleId')
  @RequirePermission('module.manage.organization')
  @ApiOperation({ summary: 'Disable a module for an organization' })
  @ApiResponse({ status: 200, description: 'Module disabled successfully' })
  @ApiResponse({ status: 404, description: 'Module subscription not found' })
  @ApiResponse({ status: 400, description: 'Cannot disable system module' })
  async disableModule(
    @Param('organizationId') organizationId: string,
    @Param('moduleId') moduleId: string,
  ) {
    await this.moduleRegistryService.disableModule(organizationId, moduleId);
    return { message: 'Module disabled successfully' };
  }

  @Get(':moduleId/permissions')
  @RequirePermission('permission.read.organization')
  @ApiOperation({ summary: 'Get permissions for a module' })
  @ApiResponse({ status: 200, description: 'List of module permissions' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async getModulePermissions(
    @Param('moduleId') moduleId: string,
    @Query('userType') userType: UserType = UserType.INTERNAL,
  ) {
    return this.moduleRegistryService.getModulePermissions(moduleId, userType);
  }

  @Get(':moduleId/dependencies/validate')
  @RequirePermission('module.read.organization')
  @ApiOperation({ summary: 'Validate module dependencies' })
  @ApiResponse({ status: 200, description: 'Dependencies validation result' })
  async validateDependencies(@Param('moduleId') moduleId: string) {
    const isValid = await this.moduleRegistryService.validateModuleDependencies(moduleId);
    return { 
      moduleId, 
      isValid, 
      message: isValid ? 'All dependencies are met' : 'Some dependencies are missing' 
    };
  }

  // Property-level module management endpoints

  @Get('property/:propertyId')
  @RequirePermission('module.read.property')
  @ApiOperation({ summary: 'Get enabled modules for a property with precedence rules' })
  @ApiResponse({ status: 200, description: 'List of enabled modules for the property' })
  async getEnabledModulesForProperty(
    @Param('propertyId') propertyId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.moduleRegistryService.getEnabledModulesForProperty(organizationId, propertyId);
  }

  @Post('property/:propertyId/enable/:moduleId')
  @RequirePermission('module.manage.property')
  @ApiOperation({ summary: 'Enable a module for a property (overrides organization setting)' })
  @ApiResponse({ status: 200, description: 'Module enabled for property successfully' })
  @ApiResponse({ status: 404, description: 'Module or property not found' })
  @ApiResponse({ status: 400, description: 'Module has unmet dependencies' })
  async enableModuleForProperty(
    @Param('propertyId') propertyId: string,
    @Param('moduleId') moduleId: string,
    @Query('organizationId') organizationId: string,
  ) {
    await this.moduleRegistryService.enableModuleForProperty(organizationId, propertyId, moduleId);
    return { message: 'Module enabled for property successfully' };
  }

  @Post('property/:propertyId/disable/:moduleId')
  @RequirePermission('module.manage.property')
  @ApiOperation({ summary: 'Disable a module for a property (overrides organization setting)' })
  @ApiResponse({ status: 200, description: 'Module disabled for property successfully' })
  @ApiResponse({ status: 404, description: 'Module subscription not found' })
  @ApiResponse({ status: 400, description: 'Cannot disable system module' })
  async disableModuleForProperty(
    @Param('propertyId') propertyId: string,
    @Param('moduleId') moduleId: string,
    @Query('organizationId') organizationId: string,
  ) {
    await this.moduleRegistryService.disableModuleForProperty(organizationId, propertyId, moduleId);
    return { message: 'Module disabled for property successfully' };
  }

  @Get('property/:propertyId/module/:moduleId/status')
  @RequirePermission('module.read.property')
  @ApiOperation({ summary: 'Check if a module is enabled for a property with precedence info' })
  @ApiResponse({ status: 200, description: 'Module enablement status with precedence details' })
  async getModuleStatusForProperty(
    @Param('propertyId') propertyId: string,
    @Param('moduleId') moduleId: string,
    @Query('organizationId') organizationId: string,
  ) {
    const isEnabled = await this.moduleRegistryService.isModuleEnabledForProperty(
      organizationId,
      propertyId,
      moduleId
    );
    const status = await this.moduleRegistryService.getModuleStatusDetails(
      organizationId,
      propertyId,
      moduleId
    );
    return { 
      moduleId,
      propertyId,
      organizationId,
      isEnabled,
      ...status
    };
  }

  @Get('organization/:organizationId/modules')
  @RequirePermission('module.read.organization')
  @ApiOperation({ summary: 'Get all module subscriptions for an organization (org-level and property-level)' })
  @ApiResponse({ status: 200, description: 'Organization module subscriptions with property overrides' })
  async getOrganizationModuleStatus(
    @Param('organizationId') organizationId: string,
  ) {
    return this.moduleRegistryService.getOrganizationModuleStatus(organizationId);
  }

  @Delete('property/:propertyId/module/:moduleId/override')
  @RequirePermission('module.manage.property')
  @ApiOperation({ summary: 'Remove property-level override (fall back to organization setting)' })
  @ApiResponse({ status: 200, description: 'Property-level override removed successfully' })
  @ApiResponse({ status: 404, description: 'Property-level override not found' })
  async removePropertyOverride(
    @Param('propertyId') propertyId: string,
    @Param('moduleId') moduleId: string,
    @Query('organizationId') organizationId: string,
  ) {
    await this.moduleRegistryService.removePropertyOverride(organizationId, propertyId, moduleId);
    return { message: 'Property-level override removed successfully' };
  }
}