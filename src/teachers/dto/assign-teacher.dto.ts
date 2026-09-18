import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignTeacherDto {
  @ApiProperty({ example: 'class_id_here', description: 'Class ID (e.g. Class 6)' })
  @IsNotEmpty({ message: 'classId is required' })
  @IsString()
  classId: string;

  @ApiProperty({ example: 'section_id_here', description: 'Section ID (e.g. Section A)' })
  @IsNotEmpty({ message: 'sectionId is required' })
  @IsString()
  sectionId: string;

  @ApiProperty({ example: 'subject_id_here', description: 'Subject ID (e.g. Mathematics)' })
  @IsNotEmpty({ message: 'subjectId is required' })
  @IsString()
  subjectId: string;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
    description: 'Whether this teacher is the Class Teacher for this section',
  })
  @IsOptional()
  @IsBoolean()
  isClassTeacher?: boolean;
}
