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
import { ParentsService } from './parents.service.js';
import { CreateParentDto } from './dto/create-parent.dto.js';
import { UpdateParentDto } from './dto/update-parent.dto.js';
import { AssignStudentDto } from './dto/assign-student.dto.js';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@ApiTags('Parents')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new parent / guardian' })
  createParent(@Body() createParentDto: CreateParentDto) {
    return this.parentsService.createParent(createParentDto);
  }

  @Get('my-children')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get parent profile and all their children (by email or token)' })
  @ApiQuery({ name: 'email', required: false, description: 'Parent email (for hassle-free testing)' })
  getMyChildren(@Query('email') email?: string, @Request() req?: any) {
    const targetEmail = email || req?.user?.email;
    return this.parentsService.getMyChildren(targetEmail);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parents (with optional search by name, phone, or email)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, phone, or email' })
  getAllParents(@Query('search') search?: string) {
    return this.parentsService.getAllParents(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single parent by ID' })
  @ApiParam({ name: 'id', description: 'Parent database ID' })
  getParentById(@Param('id') id: string) {
    return this.parentsService.getParentById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update parent details by ID' })
  @ApiParam({ name: 'id', description: 'Parent database ID' })
  updateParent(
    @Param('id') id: string,
    @Body() updateParentDto: UpdateParentDto,
  ) {
    return this.parentsService.updateParent(id, updateParentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a parent by ID' })
  @ApiParam({ name: 'id', description: 'Parent database ID' })
  deleteParent(@Param('id') id: string) {
    return this.parentsService.deleteParent(id);
  }

  @Post(':id/students')
  @ApiOperation({ summary: 'Link a student to a parent (FATHER, MOTHER, GUARDIAN, OTHER)' })
  @ApiParam({ name: 'id', description: 'Parent database ID' })
  assignStudent(
    @Param('id') parentId: string,
    @Body() assignStudentDto: AssignStudentDto,
  ) {
    return this.parentsService.assignStudent(parentId, assignStudentDto);
  }

  @Delete(':id/students/:studentId')
  @ApiOperation({ summary: 'Unlink a student from a parent' })
  @ApiParam({ name: 'id', description: 'Parent database ID' })
  @ApiParam({ name: 'studentId', description: 'Student database ID or studentId' })
  removeStudent(
    @Param('id') parentId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentsService.removeStudent(parentId, studentId);
  }
}
