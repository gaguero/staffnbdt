import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { GuestsService } from './guests.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from './dto';
import { User } from '@prisma/client';

@ApiTags('Guests')
@Controller('guests')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @RequirePermission('guest.create.property')
  @Audit({ action: 'CREATE', entity: 'Guest' })
  @ApiOperation({ summary: 'Create a new guest profile' })
  @ApiResponse({ status: 201, description: 'Guest created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Duplicate email or phone' })
  async create(
    @Body() createGuestDto: CreateGuestDto,
    @CurrentUser() currentUser: User,
  ) {
    const guest = await this.guestsService.create(createGuestDto, currentUser);
    return CustomApiResponse.success(guest, 'Guest created successfully');
  }

  @Get()
  @RequirePermission('guest.read.property')
  @ApiOperation({ summary: 'Get all guests with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Guests retrieved successfully' })
  async findAll(
    @Query() filterDto: GuestFilterDto,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.guestsService.findAll(filterDto, currentUser);
    return CustomApiResponse.success(result, 'Guests retrieved successfully');
  }

  @Get('stats')
  @RequirePermission('guest.read.property')
  @ApiOperation({ summary: 'Get guest statistics' })
  @ApiResponse({ status: 200, description: 'Guest statistics retrieved successfully' })
  async getStats(@CurrentUser() currentUser: User) {
    const stats = await this.guestsService.getGuestStats(currentUser);
    return CustomApiResponse.success(stats, 'Guest statistics retrieved successfully');
  }

  @Get(':id')
  @RequirePermission('guest.read.property')
  @Audit({ action: 'VIEW', entity: 'Guest' })
  @ApiOperation({ summary: 'Get guest by ID with reservation history' })
  @ApiResponse({ status: 200, description: 'Guest retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const guest = await this.guestsService.findOne(id, currentUser);
    return CustomApiResponse.success(guest, 'Guest retrieved successfully');
  }

  @Get(':id/history')
  @RequirePermission('guest.read.property')
  @ApiOperation({ summary: 'Get detailed guest history and loyalty info' })
  @ApiResponse({ status: 200, description: 'Guest history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  async getGuestHistory(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const history = await this.guestsService.getGuestHistory(id, currentUser);
    return CustomApiResponse.success(history, 'Guest history retrieved successfully');
  }

  @Patch(':id')
  @RequirePermission('guest.update.property')
  @Audit({ action: 'UPDATE', entity: 'Guest' })
  @ApiOperation({ summary: 'Update guest profile' })
  @ApiResponse({ status: 200, description: 'Guest updated successfully' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad request - Duplicate email or phone' })
  async update(
    @Param('id') id: string,
    @Body() updateGuestDto: UpdateGuestDto,
    @CurrentUser() currentUser: User,
  ) {
    const guest = await this.guestsService.update(id, updateGuestDto, currentUser);
    return CustomApiResponse.success(guest, 'Guest updated successfully');
  }

  @Post(':id/blacklist')
  @RequirePermission('guest.update.property')
  @Audit({ action: 'BLACKLIST', entity: 'Guest' })
  @ApiOperation({ summary: 'Add guest to blacklist' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Guest blacklisted successfully' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async blacklistGuest(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: User,
  ) {
    const guest = await this.guestsService.blacklistGuest(id, reason, currentUser);
    return CustomApiResponse.success(guest, 'Guest blacklisted successfully');
  }

  @Delete(':id/blacklist')
  @RequirePermission('guest.update.property')
  @Audit({ action: 'REMOVE_BLACKLIST', entity: 'Guest' })
  @ApiOperation({ summary: 'Remove guest from blacklist' })
  @ApiResponse({ status: 200, description: 'Guest removed from blacklist successfully' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async removeFromBlacklist(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const guest = await this.guestsService.removeFromBlacklist(id, currentUser);
    return CustomApiResponse.success(guest, 'Guest removed from blacklist successfully');
  }

  @Delete(':id')
  @RequirePermission('guest.delete.property')
  @Audit({ action: 'DELETE', entity: 'Guest' })
  @ApiOperation({ summary: 'Delete guest profile (soft delete)' })
  @ApiResponse({ status: 200, description: 'Guest deleted successfully' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot delete guest with active reservations' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.guestsService.remove(id, currentUser);
    return CustomApiResponse.success(null, 'Guest deleted successfully');
  }

  @Post(':id/restore')
  @RequirePermission('guest.update.property')
  @Audit({ action: 'RESTORE', entity: 'Guest' })
  @ApiOperation({ summary: 'Restore deleted guest profile' })
  @ApiResponse({ status: 200, description: 'Guest restored successfully' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const guest = await this.guestsService.restore(id, currentUser);
    return CustomApiResponse.success(guest, 'Guest restored successfully');
  }
}