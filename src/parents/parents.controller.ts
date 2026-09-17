import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParentsService } from './parents.service.js';
import { CreateParentDto } from './dto/create-parent.dto.js';

@ApiTags('Parents')
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new parent / guardian' })
  createParent(@Body() createParentDto: CreateParentDto) {
    return this.parentsService.createParent(createParentDto);
  }
}
