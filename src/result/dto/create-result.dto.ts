import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateResultDto {
  @ApiProperty({
    example: 'cm123student_id',
    description: 'Student database ID',
  })
  @IsNotEmpty({ message: 'Student ID is required' })
  @IsString({ message: 'Student ID must be a string' })
  studentId: string;

  @ApiProperty({
    example: 'cm123exam_id',
    description: 'Exam database ID',
  })
  @IsNotEmpty({ message: 'Exam ID is required' })
  @IsString({ message: 'Exam ID must be a string' })
  examId: string;

  @ApiProperty({
    example: 'cm123subject_id',
    description: 'Subject database ID',
  })
  @IsNotEmpty({ message: 'Subject ID is required' })
  @IsString({ message: 'Subject ID must be a string' })
  subjectId: string;

  @ApiProperty({
    example: 85.5,
    description: 'Marks obtained by the student',
  })
  @IsNotEmpty({ message: 'Marks are required' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Marks must be a number' })
  @Min(0, { message: 'Marks cannot be less than 0' })
  @Max(100, { message: 'Marks cannot be greater than 100' })
  marks: number;
}
