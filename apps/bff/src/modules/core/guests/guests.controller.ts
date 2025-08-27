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
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { Role } from '@prisma/client';
import { GuestsService } from './guests.service';
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from './dto';

@Controller('api/core/guests')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @RequirePermission('guest.create.property')
  create(@Body() createGuestDto: CreateGuestDto) {
    return this.guestsService.create(createGuestDto);
  }

  @Get()
  @RequirePermission('guest.read.property')
  findAll(@Query() filters: GuestFilterDto) {
    return this.guestsService.findAll(filters);
  }

  @Get('search')
  @RequirePermission('guest.read.property')
  searchGuests(
    @Query('q') query: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.guestsService.searchGuests(query, organizationId);
  }

  @Get(':id')
  @RequirePermission('guest.read.property')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Get(':id/history')
  @RequirePermission('guest.read.property')
  getGuestHistory(@Param('id') id: string) {
    return this.guestsService.getGuestHistory(id);
  }

  @Patch(':id')
  @RequirePermission('guest.update.property')
  update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto) {
    return this.guestsService.update(id, updateGuestDto);
  }

  @Delete(':id')
  @RequirePermission('guest.delete.property')
  remove(@Param('id') id: string) {
    return this.guestsService.remove(id);
  }
}