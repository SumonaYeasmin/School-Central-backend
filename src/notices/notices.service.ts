import { Injectable } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { InMemoryCache } from '../shared/cache.service.js';
import { CreateNoticeDto } from './dto/create-notice.dto.js';
import { NoticeCategory, NoticeAudience } from '../generated/prisma/enums.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';

@Injectable()
export class NoticesService {
  constructor(
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * 1. Create a new notice (Admin)
   */
  async createNotice(createNoticeDto: CreateNoticeDto) {
    const { title, content, category, targetAudience, attachment, isPublished } =
      createNoticeDto;

    const notice = await prisma.notice.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category || 'GENERAL',
        targetAudience: targetAudience || 'ALL',
        attachment: attachment || undefined,
        isPublished: isPublished !== undefined ? isPublished : true,
      },
    });

    InMemoryCache.invalidate('notices:*');

    // ২. রিয়েল-টাইম সকেট ইভেন্ট পাঠানো ⚡
    if (notice.isPublished) {
      if (notice.targetAudience === 'TEACHERS') {
        this.notificationsGateway.sendToRole('TEACHER', 'new_notice', notice);
      } else if (notice.targetAudience === 'PARENTS') {
        this.notificationsGateway.sendToRole('PARENT', 'new_notice', notice);
      } else {
        this.notificationsGateway.sendToAll('new_notice', notice);
      }
    }

    return notice;
  }

  /**
   * 2. Get all notices (Admin & Public)
   */
  async getAllNotices(
    search?: string,
    category?: NoticeCategory,
    targetAudience?: NoticeAudience,
    onlyPublished: boolean = true,
  ) {
    const cacheKey = `notices:all:${search || ''}:${category || ''}:${targetAudience || ''}:${onlyPublished}`;
    const cached = InMemoryCache.get<any[]>(cacheKey);
    if (cached) return cached;

    const notices = await prisma.notice.findMany({
      where: {
        isPublished: onlyPublished ? true : undefined,
        category: category || undefined,
        targetAudience: targetAudience || undefined,
        OR: search
          ? [
              { title: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    InMemoryCache.set(cacheKey, notices, 180);
    return notices;
  }
}
