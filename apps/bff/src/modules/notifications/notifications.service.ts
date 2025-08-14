import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { User, Notification, Role } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(
    userId: string,
    currentUser: User,
    limit = 10,
    offset = 0,
  ): Promise<PaginatedResponse<Notification>> {
    // Users can only access their own notifications
    if (currentUser.role === Role.STAFF && currentUser.id !== userId) {
      throw new ForbiddenException('Can only access your own notifications');
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return new PaginatedResponse(notifications, total, limit, offset);
  }

  async markAsRead(id: string, currentUser: User): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== currentUser.id) {
      throw new ForbiddenException('Can only mark your own notifications as read');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, currentUser: User): Promise<{ count: number }> {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('Can only mark your own notifications as read');
    }

    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    return { count: result.count };
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }
}