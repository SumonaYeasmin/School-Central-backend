import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ResultStatus } from '../../generated/prisma/enums.js';

export class CreateExamDto {
  @ApiProperty({
    example: 'Final Term Examination',
    description: 'Name of the examination',
  })
  @IsNotEmpty({ message: 'Exam name is required' })
  @IsString({ message: 'Exam name must be a string' })
  name: string;

  @ApiProperty({
    example: 2026,
    description: 'Academic year of the examination',
  })
  @IsNotEmpty({ message: 'Exam year is required' })
  @Type(() => Number)
  @IsInt({ message: 'Year must be an integer' })
  @Min(2000, { message: 'Year must be at least 2000' })
  @Max(2100, { message: 'Year must be at most 2100' })
  year: number;

  @ApiProperty({
    enum: ResultStatus,
    example: ResultStatus.DRAFT,
    required: false,
    default: ResultStatus.DRAFT,
    description: 'Status of the exam (DRAFT, PUBLISHED)',
  })
  @IsOptional()
  @IsEnum(ResultStatus, {
    message: 'Status must be one of: DRAFT, PUBLISHED',
  })
  status?: ResultStatus;
}
