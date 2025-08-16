import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseDecorator, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto, AcceptInvitationDto, InvitationFilterDto } from './dto';
import { InvitationWithRelations, InvitationStats } from './interfaces';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { ApiResponse } from '../../shared/dto/response.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { Audit } from '../../shared/decorators/audit.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { User, Role } from '@prisma/client';

@ApiTags('Invitations')
@Controller('api/invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @Audit({ action: 'CREATE', entity: 'Invitation' })
  @ApiOperation({ summary: 'Create and send an invitation' })
  @ApiResponseDecorator({
    status: 201,
    description: 'Invitation created and sent successfully',
    type: ApiResponse<InvitationWithRelations>,
  })
  @ApiResponseDecorator({ status: 400, description: 'Bad request' })
  @ApiResponseDecorator({ status: 403, description: 'Forbidden' })
  @ApiResponseDecorator({ status: 409, description: 'Conflict - user or invitation already exists' })
  async create(
    @Body() createInvitationDto: CreateInvitationDto,
    @CurrentUser() currentUser: User,
  ): Promise<ApiResponse<InvitationWithRelations>> {
    const invitation = await this.invitationsService.create(createInvitationDto, currentUser);
    
    return ApiResponse.success(
      invitation,
      'Invitation created and sent successfully',
    );
  }

  @Get()
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @ApiOperation({ summary: 'Get all invitations with filtering and pagination' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Invitations retrieved successfully',
    type: ApiResponse<PaginatedResponse<InvitationWithRelations>>,
  })
  @ApiResponseDecorator({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query() filterDto: InvitationFilterDto,
    @CurrentUser() currentUser: User,
  ): Promise<ApiResponse<PaginatedResponse<InvitationWithRelations>>> {
    const invitations = await this.invitationsService.findAll(filterDto, currentUser);
    
    return ApiResponse.success(
      invitations,
      'Invitations retrieved successfully',
    );
  }

  @Get('stats')
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @ApiOperation({ summary: 'Get invitation statistics' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Invitation statistics retrieved successfully',
    type: ApiResponse<InvitationStats>,
  })
  @ApiResponseDecorator({ status: 403, description: 'Forbidden' })
  async getStats(
    @CurrentUser() currentUser: User,
  ): Promise<ApiResponse<InvitationStats>> {
    const stats = await this.invitationsService.getInvitationStats(currentUser);
    
    return ApiResponse.success(
      stats,
      'Invitation statistics retrieved successfully',
    );
  }

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Validate invitation token and get invitation details' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Invitation details retrieved successfully',
    type: ApiResponse<InvitationWithRelations>,
  })
  @ApiResponseDecorator({ status: 400, description: 'Invalid or expired token' })
  @ApiResponseDecorator({ status: 404, description: 'Invitation not found' })
  async findByToken(
    @Param('token') token: string,
  ): Promise<ApiResponse<InvitationWithRelations>> {
    const invitation = await this.invitationsService.findByToken(token);
    
    return ApiResponse.success(
      invitation,
      'Invitation details retrieved successfully',
    );
  }

  @Post(':token/accept')
  @Public()
  @Audit({ action: 'ACCEPT', entity: 'Invitation' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation and create user account' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Invitation accepted and user created successfully',
    type: ApiResponse<{ user: User; invitation: InvitationWithRelations }>,
  })
  @ApiResponseDecorator({ status: 400, description: 'Invalid or expired token' })
  @ApiResponseDecorator({ status: 404, description: 'Invitation not found' })
  @ApiResponseDecorator({ status: 409, description: 'User already exists' })
  async acceptInvitation(
    @Param('token') token: string,
    @Body() acceptDto: AcceptInvitationDto,
  ): Promise<ApiResponse<{ user: User; invitation: InvitationWithRelations }>> {
    const result = await this.invitationsService.acceptInvitation(token, acceptDto);
    
    return ApiResponse.success(
      result,
      'Invitation accepted and user created successfully',
    );
  }

  @Post(':id/resend')
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @Audit({ action: 'RESEND', entity: 'Invitation' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend invitation email' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Invitation resent successfully',
    type: ApiResponse<InvitationWithRelations>,
  })
  @ApiResponseDecorator({ status: 400, description: 'Cannot resend non-pending invitation' })
  @ApiResponseDecorator({ status: 403, description: 'Forbidden' })
  @ApiResponseDecorator({ status: 404, description: 'Invitation not found' })
  async resendInvitation(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<ApiResponse<InvitationWithRelations>> {
    const invitation = await this.invitationsService.resendInvitation(id, currentUser);
    
    return ApiResponse.success(
      invitation,
      'Invitation resent successfully',
    );
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.DEPARTMENT_ADMIN)
  @Audit({ action: 'CANCEL', entity: 'Invitation' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel invitation' })
  @ApiResponseDecorator({ status: 204, description: 'Invitation cancelled successfully' })
  @ApiResponseDecorator({ status: 400, description: 'Cannot cancel non-pending invitation' })
  @ApiResponseDecorator({ status: 403, description: 'Forbidden' })
  @ApiResponseDecorator({ status: 404, description: 'Invitation not found' })
  async cancelInvitation(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.invitationsService.cancelInvitation(id, currentUser);
  }

  @Post('cleanup-expired')
  @Roles(Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cleanup expired invitations (admin only)',
    description: 'Marks all expired pending invitations as expired. This endpoint is typically called by cron jobs.',
  })
  @ApiResponseDecorator({
    status: 200,
    description: 'Expired invitations cleaned up successfully',
    type: ApiResponse<{ cleanedCount: number }>,
  })
  @ApiResponseDecorator({ status: 403, description: 'Forbidden - Superadmin only' })
  async cleanupExpiredInvitations(): Promise<ApiResponse<{ cleanedCount: number }>> {
    const cleanedCount = await this.invitationsService.cleanupExpiredInvitations();
    
    return ApiResponse.success(
      { cleanedCount },
      `${cleanedCount} expired invitations cleaned up successfully`,
    );
  }
}