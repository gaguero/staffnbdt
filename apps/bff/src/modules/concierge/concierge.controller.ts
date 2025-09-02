import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConciergeService } from './concierge.service';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission, PermissionScope } from '../../shared/decorators/require-permission.decorator';
import { CreateConciergeObjectDto } from './dto/create-concierge-object.dto';
import { UpdateConciergeObjectDto } from './dto/update-concierge-object.dto';
import { ExecutePlaybookDto } from './dto/execute-playbook.dto';
import { CloneTemplateDto, CreateTemplateDto, RateTemplateDto, TemplateFiltersDto } from './dto/template.dto';
import { CreateObjectTypeDto, UpdateObjectTypeDto } from './dto/object-type.dto';

@ApiTags('Concierge')
@ApiBearerAuth()
@Controller('concierge')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ConciergeController {
  constructor(
    private readonly conciergeService: ConciergeService,
    private readonly templateService: TemplateService,
  ) {}

  @Get('object-types')
  @RequirePermission('concierge.read.property')
  @PermissionScope('property')
  async getObjectTypes(
    @Request() req,
    @Query('includeTemplates') includeTemplates?: string,
  ) {
    return this.conciergeService.getObjectTypes(req, includeTemplates === 'true');
  }

  @Get('object-types/:id')
  @RequirePermission('concierge.read.property')
  @PermissionScope('property')
  async getObjectTypeById(@Param('id') id: string, @Request() req) {
    return this.conciergeService.getObjectTypeById(req, id);
  }

  @Post('object-types')
  @RequirePermission('concierge.object-types.create.property')
  @PermissionScope('property')
  async createObjectType(@Body() dto: CreateObjectTypeDto, @Request() req) {
    return this.conciergeService.createObjectType(req, dto);
  }

  @Put('object-types/:id')
  @RequirePermission('concierge.object-types.update.property')
  @PermissionScope('property')
  async updateObjectType(
    @Param('id') id: string,
    @Body() dto: UpdateObjectTypeDto,
    @Request() req,
  ) {
    return this.conciergeService.updateObjectType(req, id, dto);
  }

  @Delete('object-types/:id')
  @RequirePermission('concierge.object-types.delete.property')
  @PermissionScope('property')
  async deleteObjectType(@Param('id') id: string, @Request() req) {
    return this.conciergeService.deleteObjectType(req, id);
  }

  @Get('objects')
  @RequirePermission('concierge.read.property')
  @PermissionScope('property')
  async getConciergeObjects(
    @Request() req,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('reservationId') reservationId?: string,
    @Query('guestId') guestId?: string,
  ) {
    const filters = {
      ...(type && { type }),
      ...(status && { status }),
      ...(reservationId && { reservationId }),
      ...(guestId && { guestId }),
    };
    return this.conciergeService.getConciergeObjects(req, filters);
  }

  @Get('objects/:id')
  @RequirePermission('concierge.read.property')
  @PermissionScope('property')
  async getConciergeObject(@Param('id') id: string, @Request() req) {
    return this.conciergeService.getConciergeObject(id, req);
  }

  @Post('objects')
  @RequirePermission('concierge.create.property')
  @PermissionScope('property')
  async createObject(@Body() dto: CreateConciergeObjectDto, @Request() req) {
    return this.conciergeService.createObject(dto, req);
  }

  @Put('objects/:id')
  @RequirePermission('concierge.update.property')
  @PermissionScope('property')
  async updateObject(@Param('id') id: string, @Body() dto: UpdateConciergeObjectDto, @Request() req) {
    return this.conciergeService.updateObject(id, dto, req);
  }

  @Post('objects/:id/complete')
  @RequirePermission('concierge.complete.property')
  @PermissionScope('property')
  async completeObject(@Param('id') id: string, @Request() req) {
    return this.conciergeService.completeObject(id, req);
  }

  @Post('playbooks/execute')
  @RequirePermission('concierge.execute.property')
  @PermissionScope('property')
  async executePlaybook(@Body() dto: ExecutePlaybookDto, @Request() req) {
    return this.conciergeService.executePlaybook(dto, req);
  }

  @Get('stats')
  @RequirePermission('concierge.read.property')
  @PermissionScope('property')
  async getStats(@Request() req) {
    return this.conciergeService.getStats(req);
  }

  // Template endpoints
  @Get('templates')
  @RequirePermission('concierge.templates.read.property')
  @PermissionScope('property')
  async getMarketplaceTemplates(
    @Request() req,
    @Query('category') category?: string,
    @Query('minRating') minRating?: number,
    @Query('tags') tags?: string,
  ) {
    const filters: TemplateFiltersDto = {};
    if (category) filters.category = category;
    if (minRating) filters.minRating = minRating;
    if (tags) filters.tags = tags.split(',');
    
    return this.templateService.getMarketplaceTemplates(req, filters);
  }

  @Post('templates/:id/clone')
  @RequirePermission('concierge.templates.create.property')
  @PermissionScope('property')
  async cloneTemplate(
    @Param('id') templateId: string,
    @Body() dto: CloneTemplateDto,
    @Request() req,
  ) {
    return this.templateService.cloneTemplate(templateId, req, dto);
  }

  @Get('object-types/:id/children')
  @RequirePermission('concierge.read.property')
  @PermissionScope('property')
  async getObjectTypeChildren(@Param('id') parentId: string, @Request() req) {
    return this.templateService.getTemplateChildren(parentId, req);
  }

  @Post('object-types/:id/create-template')
  @RequirePermission('concierge.templates.create.property')
  @PermissionScope('property')
  async createTemplateFromObjectType(
    @Param('id') objectTypeId: string,
    @Body() dto: CreateTemplateDto,
    @Request() req,
  ) {
    return this.templateService.createTemplateFromObjectType(objectTypeId, req, dto);
  }

  @Post('templates/:id/rate')
  @RequirePermission('concierge.templates.rate.property')
  @PermissionScope('property')
  async rateTemplate(
    @Param('id') templateId: string,
    @Body() dto: RateTemplateDto,
    @Request() req,
  ) {
    return this.templateService.rateTemplate(templateId, dto.rating, req);
  }

  @Get('templates/analytics')
  @RequirePermission('concierge.templates.read.property')
  @PermissionScope('property')
  async getTemplateAnalytics(@Request() req) {
    return this.templateService.getTemplateAnalytics(req);
  }
}


