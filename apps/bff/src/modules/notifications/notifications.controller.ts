import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { User } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user notifications' })
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.notificationsService.getUserNotifications(
      userId,
      currentUser,
      limit,
      offset,
    );
    return CustomApiResponse.success(result, 'Notifications retrieved successfully');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const notification = await this.notificationsService.markAsRead(id, currentUser);
    return CustomApiResponse.success(notification, 'Notification marked as read');
  }

  @Patch('users/:userId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.notificationsService.markAllAsRead(userId, currentUser);
    return CustomApiResponse.success(result, 'All notifications marked as read');
  }
}