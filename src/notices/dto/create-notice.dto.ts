import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoticeCategory, NoticeAudience } from '../../generated/prisma/enums.js';

export class CreateNoticeDto {
  @ApiProperty({
    example: 'Annual Sports Competition 2026',
    description: 'Title of the notice',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'The annual sports competition will take place on the school grounds...',
    description: 'Detailed content of the notice',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    enum: NoticeCategory,
    default: NoticeCategory.GENERAL,
    description: 'Category of the notice (ACADEMIC, EXAM, HOLIDAY, EVENT, GENERAL, EMERGENCY)',
  })
  @IsEnum(NoticeCategory)
  @IsOptional()
  category?: NoticeCategory;

  @ApiPropertyOptional({
    enum: NoticeAudience,
    default: NoticeAudience.ALL,
    description: 'Target audience who can see this notice (ALL, TEACHERS, PARENTS)',
  })
  @IsEnum(NoticeAudience)
  @IsOptional()
  targetAudience?: NoticeAudience;

  @ApiPropertyOptional({
    example: 'https://example.com/sports-routine.pdf',
    description: 'Optional attachment file or image URL',
  })
  @IsString()
  @IsOptional()
  attachment?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Whether the notice is published immediately',
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
