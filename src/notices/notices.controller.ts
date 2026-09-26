import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NoticesService } from './notices.service.js';
import { CreateNoticeDto } from './dto/create-notice.dto.js';
import { UpdateNoticeDto } from './dto/update-notice.dto.js';
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

  @Get('feed')
  @ApiOperation({ summary: 'Get role-tailored notices feed (for Teacher or Parent dashboard)' })
  @ApiQuery({ name: 'role', required: false, description: 'Role of user (TEACHER, PARENT, or ALL)' })
  getNoticesFeed(@Query('role') role?: string) {
    return this.noticesService.getNoticesFeed(role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notices with optional search and filters (Public & Admin)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for title or content' })
  @ApiQuery({ name: 'category', required: false, enum: NoticeCategory, description: 'Filter by notice category' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a single notice by ID' })
  @ApiParam({ name: 'id', description: 'Notice database ID' })
  getNoticeById(@Param('id') id: string) {
    return this.noticesService.getNoticeById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notice by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Notice database ID' })
  updateNotice(
    @Param('id') id: string,
    @Body() updateNoticeDto: UpdateNoticeDto,
  ) {
    return this.noticesService.updateNotice(id, updateNoticeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notice by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Notice database ID' })
  deleteNotice(@Param('id') id: string) {
    return this.noticesService.deleteNotice(id);
  }
}
