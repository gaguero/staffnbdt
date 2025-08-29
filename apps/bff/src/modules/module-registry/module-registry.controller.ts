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
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { UserType } from '@prisma/client';

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
    const manifest = await this.moduleRegistryService.getModuleManifest(moduleId);
    if (!manifest) {
      throw new Error('Module not found');
    }
    return manifest;
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
}