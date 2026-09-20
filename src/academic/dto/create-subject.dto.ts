import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({
    example: 'গণিত',
    description: 'Name of the subject',
  })
  @IsNotEmpty({ message: 'Subject name cannot be empty' })
  @IsString({ message: 'Subject name must be a string' })
  name: string;

  @ApiProperty({
    example: '109',
    required: false,
    description: 'SSC Subject Code',
  })
  @IsOptional()
  @IsString({ message: 'Subject code must be a string' })
  code?: string;

  @ApiProperty({
    example: 'class_id_here',
    required: false,
    description: 'ID of the SchoolClass this subject belongs to',
  })
  @IsOptional()
  @IsString({ message: 'classId must be a string' })
  classId?: string;

  @ApiProperty({
    example: ['class-id-1', 'class-id-2'],
    required: false,
    description: 'List of Class IDs where this subject is taught',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];
}
