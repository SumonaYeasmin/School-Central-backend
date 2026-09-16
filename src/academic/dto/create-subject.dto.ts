import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({
    example: 'Mathematics',
    description: 'Name of the subject',
  })
  @IsNotEmpty({ message: 'Subject name cannot be empty' })
  @IsString({ message: 'Subject name must be a string' })
  name: string;

  @ApiProperty({
    example: 'MATH101',
    required: false,
    description: 'Description (optional)',
  })
  @IsOptional()
  @IsString({ message: 'Subject code must be a string' })
  code?: string;

  @ApiProperty({
    example: 'class_id_here',
    description: 'ID of the SchoolClass this subject belongs to',
  })
  @IsNotEmpty({ message: 'classId is required' })
  @IsString({ message: 'classId must be a string' })
  classId: string;
}
