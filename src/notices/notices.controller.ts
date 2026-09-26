import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NoticesService } from './notices.service.js';
import { CreateNoticeDto } from './dto/create-notice.dto.js';
import { NoticeCategory, NoticeAudience } from '../generated/prisma/enums.js';

@ApiTags('Notices')
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notice (Admin only)' })
  createNotice(@Body() createNoticeDto: CreateNoticeDto) {
    return this.noticesService.createNotice(createNoticeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notices with optional search and filters' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for title or content' })
  @ApiQuery({ name: 'category', required: false, enum: NoticeCategory, description: 'Filter by category' })
  @ApiQuery({ name: 'targetAudience', required: false, enum: NoticeAudience, description: 'Filter by audience' })
  @ApiQuery({ name: 'onlyPublished', required: false, type: Boolean, description: 'Filter only published notices' })
  getAllNotices(
    @Query('search') search?: string,
    @Query('category') category?: NoticeCategory,
    @Query('targetAudience') targetAudience?: NoticeAudience,
    @Query('onlyPublished') onlyPublished?: string,
  ) {
    const isPublishedFilter =
      onlyPublished === undefined ? true : onlyPublished === 'true';
    return this.noticesService.getAllNotices(
      search,
      category,
      targetAudience,
      isPublishedFilter,
    );
  }
}
