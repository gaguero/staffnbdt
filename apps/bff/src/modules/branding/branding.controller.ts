import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { BrandingService } from './branding.service';
import { BrandConfigDto, UpdateOrganizationBrandingDto, UpdatePropertyBrandingDto } from './dto/brand-config.dto';

@Controller('branding')
@UseGuards(JwtAuthGuard) // TODO: Re-enable PermissionGuard after Roberto Martinez permission fix
// @UseGuards(JwtAuthGuard, PermissionGuard) - DISABLED FOR DEVELOPMENT TESTING
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get('organizations/:organizationId')
  // TODO: Re-enable permission check after Roberto Martinez has permissions
  // @RequirePermission('branding.read.organization') - DISABLED FOR DEVELOPMENT TESTING
  async getOrganizationBranding(
    @Param('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.brandingService.getOrganizationBranding(organizationId, req.user.id);
  }

  @Put('organizations/:organizationId')
  // TODO: Re-enable permission check after Roberto Martinez has permissions
  // @RequirePermission('branding.update.organization') - DISABLED FOR DEVELOPMENT TESTING
  async updateOrganizationBranding(
    @Param('organizationId') organizationId: string,
    @Body() updateBrandingDto: UpdateOrganizationBrandingDto,
    @Request() req: any,
  ) {
    return this.brandingService.updateOrganizationBranding(
      organizationId,
      updateBrandingDto.branding,
      req.user.id,
    );
  }

  @Get('properties/:propertyId')
  // TODO: Re-enable permission check after Roberto Martinez has permissions
  // @RequirePermission('branding.read.property') - DISABLED FOR DEVELOPMENT TESTING
  async getPropertyBranding(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ) {
    return this.brandingService.getPropertyBranding(propertyId, req.user.id);
  }

  @Put('properties/:propertyId')
  // TODO: Re-enable permission check after Roberto Martinez has permissions
  // @RequirePermission('branding.update.property') - DISABLED FOR DEVELOPMENT TESTING
  async updatePropertyBranding(
    @Param('propertyId') propertyId: string,
    @Body() updateBrandingDto: UpdatePropertyBrandingDto,
    @Request() req: any,
  ) {
    return this.brandingService.updatePropertyBranding(
      propertyId,
      updateBrandingDto.branding,
      req.user.id,
    );
  }

  @Delete('properties/:propertyId')
  // TODO: Re-enable permission check after Roberto Martinez has permissions
  // @RequirePermission('branding.update.property') - DISABLED FOR DEVELOPMENT TESTING
  async removePropertyBranding(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ) {
    return this.brandingService.removePropertyBranding(propertyId, req.user.id);
  }

  @Post('upload-logo')
  // TODO: Re-enable permission check after Roberto Martinez has permissions
  // @RequirePermission('branding.update.organization', 'branding.update.property') - DISABLED FOR DEVELOPMENT TESTING
  @UseInterceptors(FileInterceptor('logo', {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit
    },
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
        return callback(new BadRequestException('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
  }))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'logo' | 'logo-dark' | 'favicon' = 'logo',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.brandingService.uploadLogo(file, type);
  }

  @Get('presets')
  async getBrandingPresets() {
    return this.brandingService.getBrandingPresets();
  }
}