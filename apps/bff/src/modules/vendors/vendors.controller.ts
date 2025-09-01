import { Controller, Post, Get, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission, PermissionScope } from '../../shared/decorators/require-permission.decorator';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateVendorLinkDto } from './dto/create-vendor-link.dto';
import { ConfirmLinkDto } from './dto/confirm-link.dto';
import { SendPortalNotificationDto } from './dto/send-portal-notification.dto';

@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @RequirePermission('vendors.read.property')
  @PermissionScope('property')
  async getVendors(
    @Request() req,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters = {
      ...(category && { category }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };
    return this.vendorsService.getVendors(req, filters);
  }

  @Get(':id')
  @RequirePermission('vendors.read.property')
  @PermissionScope('property')
  async getVendor(@Param('id') id: string, @Request() req) {
    return this.vendorsService.getVendor(id, req);
  }

  @Post()
  @RequirePermission('vendors.create.property')
  @PermissionScope('property')
  async createVendor(@Body() dto: CreateVendorDto, @Request() req) {
    return this.vendorsService.createVendor(dto, req);
  }

  @Put(':id')
  @RequirePermission('vendors.update.property')
  @PermissionScope('property')
  async updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto, @Request() req) {
    return this.vendorsService.updateVendor(id, dto, req);
  }

  @Post('links')
  @RequirePermission('vendors.links.create.property')
  @PermissionScope('property')
  async createVendorLink(@Body() dto: CreateVendorLinkDto, @Request() req) {
    return this.vendorsService.createVendorLink(dto, req);
  }

  @Post('links/:id/confirm')
  @RequirePermission('vendors.links.confirm.property')
  @PermissionScope('property')
  async confirmLink(@Param('id') id: string, @Body() dto: ConfirmLinkDto, @Request() req) {
    return this.vendorsService.confirmLink(id, dto, req);
  }

  @Post('links/:id/portal-token')
  @RequirePermission('vendors.portal.create.property')
  @PermissionScope('property')
  async createPortalToken(@Param('id') linkId: string, @Request() req) {
    return this.vendorsService.createPortalToken(linkId, req);
  }

  @Post('links/:id/send-notification')
  @RequirePermission('vendors.portal.send.property')
  @PermissionScope('property')
  async sendPortalNotification(
    @Param('id') linkId: string,
    @Body() dto: SendPortalNotificationDto,
    @Request() req
  ) {
    return this.vendorsService.sendPortalNotification(linkId, dto.channel, req);
  }

  // Public vendor portal endpoints (no authentication required)
  @Get('portal/:token')
  async getPortalSession(@Param('token') token: string) {
    return this.vendorsService.validatePortalToken(token);
  }

  // This endpoint is used by the vendor portal for confirmation (no auth guards)
  @Post('portal/links/:id/confirm')
  async confirmLinkFromPortal(@Param('id') id: string, @Body() dto: ConfirmLinkDto) {
    return this.vendorsService.confirmLink(id, dto);
  }
}