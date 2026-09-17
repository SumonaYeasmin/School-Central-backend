
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Gender, StudentStatus } from '../../generated/prisma/enums.js';

export class CreateStudentDto {

  @ApiProperty({ example: 'STU-2026-001', description: 'Unique Student ID' })
  @IsNotEmpty({ message: 'studentId cannot be empty' })
  @IsString()
  studentId: string;

  @ApiProperty({ example: 'Rahim Ahmed', description: 'Full name of the student' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2010-05-15', required: false, description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ enum: Gender, default: Gender.MALE, required: false, description: 'Gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false, description: 'Student Photo URL' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({ example: 'class_id_here', description: 'SchoolClass ID' })
  @IsNotEmpty({ message: 'classId is required' })
  @IsString()
  classId: string;

  @ApiProperty({ example: 'section_id_here', description: 'Section ID' })
  @IsNotEmpty({ message: 'sectionId is required' })
  @IsString()
  sectionId: string;

  @ApiProperty({ example: '01', description: 'Class Roll number' })
  @IsNotEmpty({ message: 'Roll number is required' })
  @IsString()
  roll: string;

  @ApiProperty({ example: '2026-01-10', required: false, description: 'Admission Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @ApiProperty({ enum: StudentStatus, default: StudentStatus.ACTIVE, required: false, description: 'Student status' })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
