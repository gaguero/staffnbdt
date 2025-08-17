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
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GuestsService } from './guests.service';
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from './dto';

@Controller('api/core/guests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  create(@Body() createGuestDto: CreateGuestDto) {
    return this.guestsService.create(createGuestDto);
  }

  @Get()
  findAll(@Query() filters: GuestFilterDto) {
    return this.guestsService.findAll(filters);
  }

  @Get('search')
  searchGuests(
    @Query('q') query: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.guestsService.searchGuests(query, organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Get(':id/history')
  getGuestHistory(@Param('id') id: string) {
    return this.guestsService.getGuestHistory(id);
  }

  @Patch(':id')
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.PROPERTY_MANAGER,
    Role.ORGANIZATION_ADMIN,
    Role.DEPARTMENT_ADMIN,
  )
  update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto) {
    return this.guestsService.update(id, updateGuestDto);
  }

  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.PROPERTY_MANAGER, Role.ORGANIZATION_ADMIN)
  remove(@Param('id') id: string) {
    return this.guestsService.remove(id);
  }
}