import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my-notifications')
  @ApiOperation({ summary: 'Get current user personal notifications' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID (or parsed from token)' })
  async getMyNotifications(@Query('userId') userId?: string, @Request() req?: any) {
    const targetUserId = userId || req?.user?.id || 'demo_user';
    return this.notificationsService.getUserNotifications(targetUserId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification database ID' })
  async markAsRead(
    @Param('id') id: string,
    @Query('userId') userId?: string,
    @Request() req?: any,
  ) {
    const targetUserId = userId || req?.user?.id || 'demo_user';
    return this.notificationsService.markAsRead(id, targetUserId);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID' })
  async markAllAsRead(@Query('userId') userId?: string, @Request() req?: any) {
    const targetUserId = userId || req?.user?.id || 'demo_user';
    return this.notificationsService.markAllAsRead(targetUserId);
  }
}
