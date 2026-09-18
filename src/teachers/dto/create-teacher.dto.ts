import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({
    example: 'TCH-2026-001',
    description: 'Unique Teacher ID',
  })
  @IsNotEmpty({ message: 'Teacher ID cannot be empty' })
  @IsString()
  teacherId: string;

  @ApiProperty({
    example: 'Anisur Rahman',
    description: 'Full name of the teacher',
  })
  @IsNotEmpty({ message: 'Teacher name cannot be empty' })
  @IsString()
  name: string;

  @ApiProperty({
    example: '01711223344',
    description: 'Teacher contact phone number',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'anisur@school.com',
    required: false,
    description: 'Teacher email address (for login)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  email?: string;

  @ApiProperty({
    example: 'Senior Teacher',
    description: 'Teacher designation (e.g. Senior Teacher, Assistant Teacher, Headmaster)',
  })
  @IsNotEmpty({ message: 'Designation is required' })
  @IsString()
  designation: string;

  @ApiProperty({
    example: 'Science',
    required: false,
    description: 'Department name (e.g. Science, Mathematics, Humanities, Commerce)',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    example: '2026-01-01',
    required: false,
    description: 'Date of joining (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Joining date must be a valid ISO date string (YYYY-MM-DD)' })
  joiningDate?: string;
}
