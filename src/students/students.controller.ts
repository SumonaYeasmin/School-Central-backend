

import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../generated/prisma/enums.js';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create / Admit a new student (Admin only)' })
  createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.createStudent(createStudentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all students (with optional class and section filter)' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filter by Class ID' })
  @ApiQuery({ name: 'sectionId', required: false, description: 'Filter by Section ID' })
  getAllStudents(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.studentsService.getAllStudents(classId, sectionId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get a single student by ID' })
  @ApiParam({ name: 'id', description: 'Student database ID' })
  getStudentById(@Param('id') id: string) {
    return this.studentsService.getStudentById(id);
  }
}


