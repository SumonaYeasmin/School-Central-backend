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
import { ParentsService } from './parents.service.js';
import { CreateParentDto } from './dto/create-parent.dto.js';
import { UpdateParentDto } from './dto/update-parent.dto.js';

@ApiTags('Parents')
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new parent / guardian' })
  createParent(@Body() createParentDto: CreateParentDto) {
    return this.parentsService.createParent(createParentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parents (with optional search by name or phone)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or phone number' })
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
}
