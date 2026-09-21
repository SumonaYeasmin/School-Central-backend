import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExamService } from './exam.service.js';
import { CreateExamDto } from './dto/creat-exam.dto.js';

@ApiTags('Exams')
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new exam' })
  createExam(@Body() createExamDto: CreateExamDto) {
    return this.examService.createExam(createExamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all exams' })
  getAllExams() {
    return this.examService.getAllExams();
  }
}
