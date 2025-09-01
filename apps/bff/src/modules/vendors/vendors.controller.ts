import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';

@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('links/:id/confirm')
  @RequirePermission('vendors.links.confirm.property')
  async confirmLink(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.vendorsService.confirmLink(id, dto, req.user);
  }

  // Public vendor portal token exchange could be placed in a separate controller without guards
  @Get('portal/:token')
  async getPortalSession(@Param('token') token: string) {
    return this.vendorsService.validatePortalToken(token);
  }

  @Post('links/:id/send-portal')
  @RequirePermission('vendors.manage.property')
  async sendPortalLink(@Param('id') id: string, @Body() dto: { vendorId: string; organizationId: string; propertyId: string }) {
    return this.vendorsService.createPortalLink(id, dto.vendorId, dto.organizationId, dto.propertyId);
  }
}


