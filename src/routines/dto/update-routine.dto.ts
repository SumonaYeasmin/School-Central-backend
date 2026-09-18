import { PartialType } from '@nestjs/swagger';
import { CreateRoutineDto } from './create-routine.dto.js';

export class UpdateRoutineDto extends PartialType(CreateRoutineDto) {}
