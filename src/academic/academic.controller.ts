

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AcademicService } from './academic.service.js';
import { CreateClassDto } from './dto/create-class.dto.js';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// import { RolesGuard } from '../auth/roles.guard.js';
// import { Roles } from '../auth/roles.decorator.js';
// import { UserRole } from '../generated/prisma/enums.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { CreateSectionDto } from './dto/create-section.dto.js';

@ApiTags('Academic')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Post('classes')
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new class' })
  createClass(@Body() createClassDto: CreateClassDto) {
    return this.academicService.createClass(createClassDto);
  }

  @Get('classes')
@ApiOperation({ summary: 'Get all classes with sections' })
getAllClasses() {
  return this.academicService.getAllClasses();
}


  @Post('subjects')
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new subject under a class' })
  createSubject(@Body() createSubjectDto: CreateSubjectDto) {
    return this.academicService.createSubject(createSubjectDto);
  }

  @Get('classes/:classId/subjects')
  @ApiOperation({ summary: 'Get all subjects of a class' })
  getSubjectsByClass(@Param('classId') classId: string) {
    return this.academicService.getSubjectsByClass(classId);
  }

  @Post('sections')
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new section under a class' })
  createSection(@Body() createSectionDto: CreateSectionDto) {
    return this.academicService.createSection(createSectionDto);
  }
}


