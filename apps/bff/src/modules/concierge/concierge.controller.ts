import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConciergeService } from './concierge.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { PermissionScope } from '../../shared/decorators/permission-scope.decorator';
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
  @RequirePermission('concierge.object-types.read.property')
  @PermissionScope('property')
  async getObjectTypes(@Request() req) {
    return this.conciergeService.getObjectTypes(req.user);
  }

  @Post('objects')
  @RequirePermission('concierge.objects.create.property')
  @PermissionScope('property')
  async createObject(@Body() dto: CreateConciergeObjectDto, @Request() req) {
    return this.conciergeService.createObject(dto, req.user);
  }

  @Put('objects/:id')
  @RequirePermission('concierge.objects.update.property')
  @PermissionScope('property')
  async updateObject(@Param('id') id: string, @Body() dto: UpdateConciergeObjectDto, @Request() req) {
    return this.conciergeService.updateObject(id, dto, req.user);
  }

  @Post('objects/:id/complete')
  @RequirePermission('concierge.objects.complete.property')
  @PermissionScope('property')
  async completeObject(@Param('id') id: string, @Request() req) {
    return this.conciergeService.completeObject(id, req.user);
  }

  @Post('playbooks/execute')
  @RequirePermission('concierge.playbooks.execute.property')
  @PermissionScope('property')
  async executePlaybook(@Body() dto: ExecutePlaybookDto, @Request() req) {
    return this.conciergeService.executePlaybook(dto, req.user);
  }
}


