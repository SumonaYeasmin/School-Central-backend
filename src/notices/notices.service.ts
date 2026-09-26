import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { InMemoryCache } from '../shared/cache.service.js';
import { CreateNoticeDto } from './dto/create-notice.dto.js';
import { UpdateNoticeDto } from './dto/update-notice.dto.js';
import { NoticeCategory, NoticeAudience } from '../generated/prisma/enums.js';

@Injectable()
export class NoticesService {
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
    return notice;
  }

  /**
   * 2. Get all notices with optional search, category, audience, and publish filters (Admin & Public)
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

  /**
   * 3. Get notices feed tailored for logged-in user role (Teacher / Parent / Student)
   */
  async getNoticesFeed(role?: string) {
    const normalizedRole = role?.toUpperCase() || 'ALL';
    const cacheKey = `notices:feed:${normalizedRole}`;
    const cached = InMemoryCache.get<any[]>(cacheKey);
    if (cached) return cached;

    const allowedAudiences: NoticeAudience[] = ['ALL'];
    if (normalizedRole === 'TEACHER') {
      allowedAudiences.push('TEACHERS');
    } else if (normalizedRole === 'PARENT') {
      allowedAudiences.push('PARENTS');
    }

    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        targetAudience: { in: allowedAudiences },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    InMemoryCache.set(cacheKey, notices, 180);
    return notices;
  }

  /**
   * 4. Get a single notice by ID
   */
  async getNoticeById(id: string) {
    const cacheKey = `notices:id:${id}`;
    const cached = InMemoryCache.get<any>(cacheKey);
    if (cached) return cached;

    const notice = await prisma.notice.findUnique({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException(`Notice with ID "${id}" not found`);
    }

    InMemoryCache.set(cacheKey, notice, 180);
    return notice;
  }

  /**
   * 5. Update notice details (Admin)
   */
  async updateNotice(id: string, updateNoticeDto: UpdateNoticeDto) {
    await this.getNoticeById(id);

    const updated = await prisma.notice.update({
      where: { id },
      data: {
        ...updateNoticeDto,
        title: updateNoticeDto.title ? updateNoticeDto.title.trim() : undefined,
        content: updateNoticeDto.content ? updateNoticeDto.content.trim() : undefined,
      },
    });

    InMemoryCache.invalidate('notices:*');
    return updated;
  }

  /**
   * 6. Delete a notice (Admin)
   */
  async deleteNotice(id: string) {
    await this.getNoticeById(id);

    const deleted = await prisma.notice.delete({
      where: { id },
    });

    InMemoryCache.invalidate('notices:*');
    return deleted;
  }
}
