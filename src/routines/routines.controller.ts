import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RoutinesService } from './routines.service.js';
import { CreateRoutineDto } from './dto/create-routine.dto.js';
import { UpdateRoutineDto } from './dto/update-routine.dto.js';
import { DayOfWeek } from '../generated/prisma/enums.js';

@ApiTags('Routines')
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @ApiOperation({ summary: 'Create / Schedule a new class routine slot (with conflict checks)' })
  createRoutine(@Body() createRoutineDto: CreateRoutineDto) {
    return this.routinesService.createRoutine(createRoutineDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all class routines (Full week or specific day, with optional filters)',
    description:
      'If "day" is omitted, returns routines for the whole week. Admin can also filter by class, section, teacher, or subject.',
  })
  @ApiQuery({
    name: 'day',
    required: false,
    enum: DayOfWeek,
    description: 'Filter by specific day (leave empty to get full week)',
  })
  @ApiQuery({ name: 'classId', required: false, description: 'Filter by Class ID' })
  @ApiQuery({ name: 'sectionId', required: false, description: 'Filter by Section ID' })
  @ApiQuery({ name: 'teacherId', required: false, description: 'Filter by Teacher ID' })
  @ApiQuery({ name: 'subjectId', required: false, description: 'Filter by Subject ID' })
  getAllRoutines(
    @Query('day') day?: DayOfWeek,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.routinesService.getAllRoutines(
      day,
      classId,
      sectionId,
      teacherId,
      subjectId,
    );
  }

  @Get('timetable')
  @ApiOperation({
    summary: 'Get weekly timetable grid for a specific Class & Section',
    description:
      'Returns a day-wise structured schedule (Sunday to Saturday) or single day view for frontend display.',
  })
  @ApiQuery({ name: 'classId', required: true, description: 'Class database ID' })
  @ApiQuery({ name: 'sectionId', required: true, description: 'Section database ID' })
  @ApiQuery({
    name: 'day',
    required: false,
    enum: DayOfWeek,
    description: 'Specific day (optional, default: full week grid)',
  })
  getWeeklyTimetable(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('day') day?: DayOfWeek,
  ) {
    return this.routinesService.getWeeklyTimetable(classId, sectionId, day);
  }

  @Get('my-routine')
  @ApiOperation({
    summary: 'Get logged-in teacher personal class routine (Full week or specific day)',
    description:
      'Teacher can see all their assigned classes across the week or for a specific day.',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Teacher email (optional if using JWT authentication)',
  })
  @ApiQuery({
    name: 'day',
    required: false,
    enum: DayOfWeek,
    description: 'Filter by specific day (leave empty for full week)',
  })
  getMyRoutine(
    @Query('email') email?: string,
    @Query('day') day?: DayOfWeek,
    @Request() req?: any,
  ) {
    let targetEmail = email || req?.user?.email;
    if (!targetEmail && req?.headers?.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '').trim();
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          targetEmail = payload?.email || payload?.teacherId;
        }
      } catch (e) {}
    }
    return this.routinesService.getMyRoutine(targetEmail, day);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single routine slot by ID' })
  @ApiParam({ name: 'id', description: 'Class Routine database ID' })
  getRoutineById(@Param('id') id: string) {
    return this.routinesService.getRoutineById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing routine slot by ID (with conflict checks)' })
  @ApiParam({ name: 'id', description: 'Class Routine database ID' })
  updateRoutine(
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateRoutineDto,
  ) {
    return this.routinesService.updateRoutine(id, updateRoutineDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a routine slot by ID' })
  @ApiParam({ name: 'id', description: 'Class Routine database ID' })
  deleteRoutine(@Param('id') id: string) {
    return this.routinesService.deleteRoutine(id);
  }
}
