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
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { PermissionGuard, RequirePermissions } from '../../permissions/guards/permission.guard';
import { Role } from '@prisma/client';
import { GuestsService } from './guests.service';
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from './dto';

@Controller('api/core/guests')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @RequirePermissions('guest.create.property')
  create(@Body() createGuestDto: CreateGuestDto) {
    return this.guestsService.create(createGuestDto);
  }

  @Get()
  @RequirePermissions('guest.read.property')
  findAll(@Query() filters: GuestFilterDto) {
    return this.guestsService.findAll(filters);
  }

  @Get('search')
  @RequirePermissions('guest.read.property')
  searchGuests(
    @Query('q') query: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.guestsService.searchGuests(query, organizationId);
  }

  @Get(':id')
  @RequirePermissions('guest.read.property')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Get(':id/history')
  @RequirePermissions('guest.read.property')
  getGuestHistory(@Param('id') id: string) {
    return this.guestsService.getGuestHistory(id);
  }

  @Patch(':id')
  @RequirePermissions('guest.update.property')
  update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto) {
    return this.guestsService.update(id, updateGuestDto);
  }

  @Delete(':id')
  @RequirePermissions('guest.delete.property')
  remove(@Param('id') id: string) {
    return this.guestsService.remove(id);
  }
}