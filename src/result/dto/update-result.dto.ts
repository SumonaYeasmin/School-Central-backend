import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateResultDto {
  @ApiProperty({
    example: 92.5,
    required: false,
    description: 'Updated marks obtained by the student',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Marks must be a number' })
  @Min(0, { message: 'Marks cannot be less than 0' })
  marks?: number;

  @ApiProperty({
    example: 100,
    required: false,
    description: 'Updated total / full marks for the subject exam',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Full marks must be a number' })
  @Min(1, { message: 'Full marks must be at least 1' })
  fullMarks?: number;
}
