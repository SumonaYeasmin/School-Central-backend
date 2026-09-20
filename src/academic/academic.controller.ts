import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AcademicService } from './academic.service.js';
import { CreateClassDto } from './dto/create-class.dto.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';

@ApiTags('Academic')
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Post('classes')
  @ApiOperation({ summary: 'Create a new class' })
  createClass(@Body() createClassDto: CreateClassDto) {
    return this.academicService.createClass(createClassDto);
  }

  @Get('classes')
  @ApiOperation({ summary: 'Get all classes with sections' })
  getAllClasses() {
    return this.academicService.getAllClasses();
  }

  @Patch('classes/:id')
  @ApiOperation({ summary: 'Update a class by ID' })
  updateClass(
    @Param('id') id: string,
    @Body() updateClassDto: { name?: string; sections?: string[] },
  ) {
    return this.academicService.updateClass(id, updateClassDto);
  }

  @Delete('classes/:id')
  @ApiOperation({ summary: 'Delete a class by ID' })
  deleteClass(@Param('id') id: string) {
    return this.academicService.deleteClass(id);
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create a new subject under a class' })
  createSubject(@Body() createSubjectDto: CreateSubjectDto) {
    return this.academicService.createSubject(createSubjectDto);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Get all subjects with details' })
  getAllSubjects() {
    return this.academicService.getAllSubjects();
  }

  @Get('classes/:classId/subjects')
  @ApiOperation({ summary: 'Get all subjects of a class' })
  getSubjectsByClass(@Param('classId') classId: string) {
    return this.academicService.getSubjectsByClass(classId);
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: 'Update a subject by ID' })
  updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.academicService.updateSubject(id, updateSubjectDto);
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: 'Delete a subject by ID' })
  deleteSubject(@Param('id') id: string) {
    return this.academicService.deleteSubject(id);
  }

  @Post('sections')
  @ApiOperation({ summary: 'Create a new section under a class' })
  createSection(@Body() createSectionDto: CreateSectionDto) {
    return this.academicService.createSection(createSectionDto);
  }
}
