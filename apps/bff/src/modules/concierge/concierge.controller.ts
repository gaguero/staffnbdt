import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConciergeService } from './concierge.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission, PermissionScope } from '../../shared/decorators/require-permission.decorator';
import { CreateConciergeObjectDto } from './dto/create-concierge-object.dto';
import { UpdateConciergeObjectDto } from './dto/update-concierge-object.dto';
import { ExecutePlaybookDto } from './dto/execute-playbook.dto';

@ApiTags('Concierge')
@ApiBearerAuth()
@Controller('concierge')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ConciergeController {
  constructor(private readonly conciergeService: ConciergeService) {}

  @Get('object-types')
  @RequirePermission('concierge.read.property')
  @PermissionScope('property')
  async getObjectTypes(@Request() req) {
    return this.conciergeService.getObjectTypes(req);
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
}


