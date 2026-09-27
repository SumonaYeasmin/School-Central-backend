import { Injectable } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { NotificationsGateway } from './notifications.gateway.js';

export interface CreatePersonalNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: NotificationsGateway) {}

  /**
   * 1. Create a personal targeted notification in DB and emit via private WebSocket room
   */
  async sendPersonalNotification(dto: CreatePersonalNotificationDto) {
    const notification = await prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'SYSTEM',
        link: dto.link || null,
        isRead: false,
      },
    });

    // Push real-time event to that user's private socket room
    this.gateway.sendToUser(dto.userId, 'personal_notification', notification);

    return notification;
  }

  /**
   * 2. Fetch notifications for a specific user
   */
  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * 3. Mark a notification as read
   */
  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  /**
   * 4. Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
