import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResultService } from './result.service.js';
import { CreateResultDto } from './dto/create-result.dto.js';

@ApiTags('Results')
@Controller('results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post()
  @ApiOperation({ summary: 'Create / Submit a student exam result' })
  createResult(@Body() createResultDto: CreateResultDto) {
    return this.resultService.createResult(createResultDto);
  }
}
