import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { TenantInterceptor } from '../../shared/tenant/tenant.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { ModuleRegistryService } from '../module-registry/module-registry.service';

interface ModuleUpdateDto {
  moduleId: string;
  isEnabled: boolean;
}

interface BulkUpdateDto {
  updates: ModuleUpdateDto[];
}

interface PropertyModuleResponse {
  organizationModules: Array<{
    id: string;
    organizationId: string;
    moduleId: string;
    isEnabled: boolean;
    enabledAt?: Date | null;
    disabledAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  propertyModules: Array<{
    id: string;
    organizationId: string;
    propertyId: string;
    moduleId: string;
    isEnabled: boolean;
    enabledAt?: Date | null;
    disabledAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  statusDetails: Array<{
    moduleId: string;
    organizationEnabled: boolean;
    propertyEnabled?: boolean;
    effectiveStatus: boolean;
    hasPrecedence: 'organization' | 'property' | 'none';
    organizationSubscription?: any;
    propertySubscription?: any;
  }>;
}

@ApiTags('Module Subscriptions')
@ApiBearerAuth()
@Controller('module-subscriptions')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(TenantInterceptor)
export class ModuleSubscriptionsController {
  constructor(private readonly moduleRegistryService: ModuleRegistryService) {}

  @Get('organization/:organizationId')
  @RequirePermission('module.read.organization')
  @ApiOperation({ summary: 'Get organization-level module subscriptions' })
  @ApiResponse({ status: 200, description: 'Organization module subscriptions' })
  async getOrganizationModules(@Param('organizationId') organizationId: string) {
    const status = await this.moduleRegistryService.getOrganizationModuleStatus(organizationId);
    return status.organizationModules;
  }

  @Get('property/:propertyId')
  @RequirePermission('module.read.property')
  @ApiOperation({ summary: 'Get property-level module subscriptions with organization context' })
  @ApiResponse({ status: 200, description: 'Property module subscriptions with organization context' })
  async getPropertyModules(
    @Param('propertyId') propertyId: string,
    @Query('organizationId') organizationId: string,
  ): Promise<PropertyModuleResponse> {
    if (!organizationId) {
      throw new BadRequestException('organizationId query parameter is required');
    }

    // Validate property access
    const hasAccess = await this.moduleRegistryService.validatePropertyAccess(organizationId, propertyId);
    if (!hasAccess) {
      throw new BadRequestException('Property not found or access denied');
    }

    // Get organization module status
    const orgStatus = await this.moduleRegistryService.getOrganizationModuleStatus(organizationId);
    
    // Get all available modules to check status for each
    const allModules = await this.moduleRegistryService.getAllModules();
    
    // Build status details for each module
    const statusDetails = [];
    for (const module of allModules) {
      const moduleStatus = await this.moduleRegistryService.getModuleStatusDetails(
        organizationId,
        propertyId,
        module.moduleId
      );
      
      statusDetails.push({
        moduleId: module.moduleId,
        organizationEnabled: moduleStatus.orgLevelEnabled,
        propertyEnabled: moduleStatus.propertyLevelOverride,
        effectiveStatus: moduleStatus.effectiveStatus,
        hasPrecedence: moduleStatus.precedenceSource,
        organizationSubscription: orgStatus.organizationModules.find(
          om => om.moduleId === module.moduleId
        ),
        propertySubscription: orgStatus.propertyOverrides.find(
          po => po.moduleId === module.moduleId && po.propertyId === propertyId
        ),
      });
    }

    return {
      organizationModules: orgStatus.organizationModules.map(om => ({
        id: `org-${organizationId}-${om.moduleId}`,
        organizationId,
        moduleId: om.moduleId,
        isEnabled: om.isEnabled,
        enabledAt: om.enabledAt,
        disabledAt: om.disabledAt,
        createdAt: new Date(), // We don't have this in the service response
        updatedAt: new Date(),
      })),
      propertyModules: orgStatus.propertyOverrides
        .filter(po => po.propertyId === propertyId)
        .map(po => ({
          id: `prop-${propertyId}-${po.moduleId}`,
          organizationId,
          propertyId,
          moduleId: po.moduleId,
          isEnabled: po.isEnabled,
          enabledAt: po.enabledAt,
          disabledAt: po.disabledAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      statusDetails,
    };
  }

  @Post('property/:propertyId/enable/:moduleId')
  @RequirePermission('module.manage.property')
  @ApiOperation({ summary: 'Enable a module for a specific property (creates property-level override)' })
  @ApiResponse({ status: 200, description: 'Module enabled for property successfully' })
  async enableModuleForProperty(
    @Param('propertyId') propertyId: string,
    @Param('moduleId') moduleId: string,
    @Body('organizationId') organizationId: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required in request body');
    }

    await this.moduleRegistryService.enableModuleForProperty(organizationId, propertyId, moduleId);
    
    return {
      id: `prop-${propertyId}-${moduleId}`,
      organizationId,
      propertyId,
      moduleId,
      isEnabled: true,
      enabledAt: new Date(),
      disabledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @Post('property/:propertyId/disable/:moduleId')
  @RequirePermission('module.manage.property')
  @ApiOperation({ summary: 'Disable a module for a specific property (creates property-level override)' })
  @ApiResponse({ status: 200, description: 'Module disabled for property successfully' })
  async disableModuleForProperty(
    @Param('propertyId') propertyId: string,
    @Param('moduleId') moduleId: string,
    @Body('organizationId') organizationId: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required in request body');
    }

    await this.moduleRegistryService.disableModuleForProperty(organizationId, propertyId, moduleId);
    
    return {
      id: `prop-${propertyId}-${moduleId}`,
      organizationId,
      propertyId,
      moduleId,
      isEnabled: false,
      enabledAt: null,
      disabledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @Delete('property/:propertyId/override/:moduleId')
  @RequirePermission('module.manage.property')
  @ApiOperation({ summary: 'Remove property-level override (revert to organization-level setting)' })
  @ApiResponse({ status: 204, description: 'Property override removed successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePropertyOverride(
    @Param('propertyId') propertyId: string,
    @Param('moduleId') moduleId: string,
    @Query('organizationId') organizationId: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId query parameter is required');
    }

    await this.moduleRegistryService.removePropertyOverride(organizationId, propertyId, moduleId);
  }

  @Get('status/:moduleId')
  @RequirePermission('module.read.property')
  @ApiOperation({ summary: 'Get detailed status for a specific module across organization and property levels' })
  @ApiResponse({ status: 200, description: 'Module status details' })
  async getModuleStatusDetails(
    @Param('moduleId') moduleId: string,
    @Query('organizationId') organizationId: string,
    @Query('propertyId') propertyId: string,
  ) {
    if (!organizationId || !propertyId) {
      throw new BadRequestException('organizationId and propertyId query parameters are required');
    }

    const status = await this.moduleRegistryService.getModuleStatusDetails(
      organizationId,
      propertyId,
      moduleId
    );

    return {
      moduleId,
      organizationEnabled: status.orgLevelEnabled,
      propertyEnabled: status.propertyLevelOverride,
      effectiveStatus: status.effectiveStatus,
      hasPrecedence: status.precedenceSource,
    };
  }

  @Put('organization/:organizationId/bulk')
  @RequirePermission('module.manage.organization')
  @ApiOperation({ summary: 'Bulk enable/disable modules for organization' })
  @ApiResponse({ status: 200, description: 'Modules updated successfully' })
  async bulkUpdateOrganizationModules(
    @Param('organizationId') organizationId: string,
    @Body() bulkUpdateDto: BulkUpdateDto,
  ) {
    const results = [];

    for (const update of bulkUpdateDto.updates) {
      try {
        if (update.isEnabled) {
          await this.moduleRegistryService.enableModule(organizationId, update.moduleId);
        } else {
          await this.moduleRegistryService.disableModule(organizationId, update.moduleId);
        }
        
        results.push({
          id: `org-${organizationId}-${update.moduleId}`,
          organizationId,
          moduleId: update.moduleId,
          isEnabled: update.isEnabled,
          enabledAt: update.isEnabled ? new Date() : null,
          disabledAt: update.isEnabled ? null : new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        // Log error but continue with other updates
        console.error(`Failed to update module ${update.moduleId}:`, error);
      }
    }

    return results;
  }

  @Put('property/:propertyId/bulk')
  @RequirePermission('module.manage.property')
  @ApiOperation({ summary: 'Bulk enable/disable modules for property' })
  @ApiResponse({ status: 200, description: 'Property modules updated successfully' })
  async bulkUpdatePropertyModules(
    @Param('propertyId') propertyId: string,
    @Body() bulkUpdateDto: BulkUpdateDto & { organizationId: string },
  ) {
    const { organizationId } = bulkUpdateDto;
    
    if (!organizationId) {
      throw new BadRequestException('organizationId is required in request body');
    }

    const results = [];

    for (const update of bulkUpdateDto.updates) {
      try {
        if (update.isEnabled) {
          await this.moduleRegistryService.enableModuleForProperty(organizationId, propertyId, update.moduleId);
        } else {
          await this.moduleRegistryService.disableModuleForProperty(organizationId, propertyId, update.moduleId);
        }
        
        results.push({
          id: `prop-${propertyId}-${update.moduleId}`,
          organizationId,
          propertyId,
          moduleId: update.moduleId,
          isEnabled: update.isEnabled,
          enabledAt: update.isEnabled ? new Date() : null,
          disabledAt: update.isEnabled ? null : new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        // Log error but continue with other updates
        console.error(`Failed to update property module ${update.moduleId}:`, error);
      }
    }

    return results;
  }

  @Get('history')
  @RequirePermission('module.read.organization')
  @ApiOperation({ summary: 'Get module enablement history for audit purposes' })
  @ApiResponse({ status: 200, description: 'Module history' })
  async getModuleHistory(
    @Query('organizationId') organizationId: string,
    @Query('propertyId') propertyId?: string,
    @Query('moduleId') moduleId?: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId query parameter is required');
    }

    // For now, return empty array as we don't have audit history in the service
    // This could be implemented by querying the audit_logs table
    return [];
  }
}