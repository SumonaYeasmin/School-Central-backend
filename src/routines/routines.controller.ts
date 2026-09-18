import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoutinesService } from './routines.service.js';
import { CreateRoutineDto } from './dto/create-routine.dto.js';

@ApiTags('Routines')
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @ApiOperation({ summary: 'Create / Schedule a new class routine slot (with conflict checks)' })
  createRoutine(@Body() createRoutineDto: CreateRoutineDto) {
    return this.routinesService.createRoutine(createRoutineDto);
  }
}
