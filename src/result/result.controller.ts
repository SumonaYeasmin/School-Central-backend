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
import { ResultService } from './result.service.js';
import { CreateResultDto } from './dto/create-result.dto.js';
import { UpdateResultDto } from './dto/update-result.dto.js';

@ApiTags('Results')
@Controller('results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post()
  @ApiOperation({ summary: 'Create / Submit a student exam result' })
  createResult(@Body() createResultDto: CreateResultDto) {
    return this.resultService.createResult(createResultDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all results (with optional filters: exam, student, subject, class, section)',
  })
  @ApiQuery({ name: 'examId', required: false, description: 'Filter by Exam ID' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Filter by Student ID / Code (e.g. S01)' })
  @ApiQuery({ name: 'subjectId', required: false, description: 'Filter by Subject ID / Code / Name' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filter by Class ID' })
  @ApiQuery({ name: 'sectionId', required: false, description: 'Filter by Section ID' })
  getAllResults(
    @Query('examId') examId?: string,
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.resultService.getAllResults({
      examId,
      studentId,
      subjectId,
      classId,
      sectionId,
    });
  }

  @Get('student/:studentId/exam/:examId')
  @ApiOperation({
    summary: 'Get complete student marksheet & GPA report card for an exam',
  })
  @ApiParam({ name: 'studentId', description: 'Student Database ID or Code (e.g. S01)' })
  @ApiParam({ name: 'examId', description: 'Exam Database ID' })
  getStudentExamResult(
    @Param('studentId') studentId: string,
    @Param('examId') examId: string,
  ) {
    return this.resultService.getStudentExamResult(studentId, examId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single result details by ID' })
  @ApiParam({ name: 'id', description: 'Result database ID' })
  getResultById(@Param('id') id: string) {
    return this.resultService.getResultById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update marks or fullMarks for an existing result' })
  @ApiParam({ name: 'id', description: 'Result database ID' })
  updateResult(
    @Param('id') id: string,
    @Body() updateResultDto: UpdateResultDto,
  ) {
    return this.resultService.updateResult(id, updateResultDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a result by ID' })
  @ApiParam({ name: 'id', description: 'Result database ID' })
  deleteResult(@Param('id') id: string) {
    return this.resultService.deleteResult(id);
  }
}
