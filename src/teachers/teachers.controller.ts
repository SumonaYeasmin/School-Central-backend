import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TeachersService } from './teachers.service.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { AssignTeacherDto } from './dto/assign-teacher.dto.js';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// import { RolesGuard } from '../auth/roles.guard.js';
// import { Roles } from '../auth/roles.decorator.js';
// import { UserRole } from '../generated/prisma/enums.js';

@ApiTags('Teachers')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create / Register a new teacher' })
  createTeacher(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.createTeacher(createTeacherDto);
  }

  @Get()
  // @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all teachers (with optional search and department filter)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, ID, phone, email, or designation' })
  @ApiQuery({ name: 'department', required: false, description: 'Filter by department (e.g. Science, Mathematics)' })
  getAllTeachers(
    @Query('search') search?: string,
    @Query('department') department?: string,
  ) {
    return this.teachersService.getAllTeachers(search, department);
  }

  @Get(':id')
  // @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get a single teacher by ID or teacherId with their assigned subjects' })
  @ApiParam({ name: 'id', description: 'Teacher database ID or custom teacherId (e.g. TCH-2026-001)' })
  getTeacherById(@Param('id') id: string) {
    return this.teachersService.getTeacherById(id);
  }

  @Patch(':id')
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update teacher details by ID' })
  @ApiParam({ name: 'id', description: 'Teacher database ID or teacherId' })
  updateTeacher(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teachersService.updateTeacher(id, updateTeacherDto);
  }

  @Delete(':id')
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a teacher by ID' })
  @ApiParam({ name: 'id', description: 'Teacher database ID or teacherId' })
  deleteTeacher(@Param('id') id: string) {
    return this.teachersService.deleteTeacher(id);
  }

  @Post(':id/assignments')
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a teacher to a Class, Section, and Subject' })
  @ApiParam({ name: 'id', description: 'Teacher database ID or custom teacherId (e.g. TCH-2026-001)' })
  assignTeacher(
    @Param('id') teacherId: string,
    @Body() assignTeacherDto: AssignTeacherDto,
  ) {
    return this.teachersService.assignTeacher(teacherId, assignTeacherDto);
  }

  @Delete('assignments/:assignmentId')
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a teacher assignment' })
  @ApiParam({ name: 'assignmentId', description: 'Teacher Assignment database ID' })
  removeAssignment(@Param('assignmentId') assignmentId: string) {
    return this.teachersService.removeAssignment(assignmentId);
  }
}
