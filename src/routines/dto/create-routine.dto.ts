import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { DayOfWeek } from '../../generated/prisma/enums.js';

export class CreateRoutineDto {
  @ApiProperty({
    enum: DayOfWeek,
    example: DayOfWeek.SUNDAY,
    description: 'Day of the week (SATURDAY, SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY)',
  })
  @IsNotEmpty({ message: 'Day of the week is required' })
  @IsEnum(DayOfWeek, {
    message: 'Day must be one of: SATURDAY, SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY',
  })
  day: DayOfWeek;

  @ApiProperty({
    example: '09:00',
    description: 'Period start time in 24-hour format HH:mm (e.g. 09:00, 10:30, 14:00)',
  })
  @IsNotEmpty({ message: 'Start time is required' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be a valid 24-hour time format (HH:mm, e.g. 09:00 or 14:30)',
  })
  startTime: string;

  @ApiProperty({
    example: '09:45',
    description: 'Period end time in 24-hour format HH:mm (e.g. 09:45, 11:15, 14:45)',
  })
  @IsNotEmpty({ message: 'End time is required' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be a valid 24-hour time format (HH:mm, e.g. 09:45 or 15:15)',
  })
  endTime: string;

  @ApiProperty({
    example: 'Room 201',
    required: false,
    description: 'Classroom / Lab room number (optional)',
  })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiProperty({
    example: 'cm12345classid',
    description: 'Target School Class database ID',
  })
  @IsNotEmpty({ message: 'Class ID is required' })
  @IsString()
  classId: string;

  @ApiProperty({
    example: 'cm12345sectionid',
    description: 'Target Section database ID',
  })
  @IsNotEmpty({ message: 'Section ID is required' })
  @IsString()
  sectionId: string;

  @ApiProperty({
    example: 'cm12345subjectid',
    description: 'Subject database ID',
  })
  @IsNotEmpty({ message: 'Subject ID is required' })
  @IsString()
  subjectId: string;

  @ApiProperty({
    example: 'cm12345teacherid',
    description: 'Teacher database ID',
  })
  @IsNotEmpty({ message: 'Teacher ID is required' })
  @IsString()
  teacherId: string;
}
