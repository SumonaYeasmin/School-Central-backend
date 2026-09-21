import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get all exams (with result counts)' })
  getAllExams() {
    return this.examService.getAllExams();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single exam details by ID' })
  @ApiParam({ name: 'id', description: 'Exam database ID' })
  getExamById(@Param('id') id: string) {
    return this.examService.getExamById(id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish exam results' })
  @ApiParam({ name: 'id', description: 'Exam database ID' })
  publishExamResult(@Param('id') id: string) {
    return this.examService.publishExamResult(id);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish exam results / Revert back to DRAFT' })
  @ApiParam({ name: 'id', description: 'Exam database ID' })
  unpublishExamResult(@Param('id') id: string) {
    return this.examService.unpublishExamResult(id);
  }
}
