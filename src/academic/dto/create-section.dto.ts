
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({
    example: 'A',
    description: 'Name of the section (e.g., A, B, Padma, Meghna)',
  })
  @IsNotEmpty({ message: 'Section name cannot be empty' })
  @IsString({ message: 'Section name must be a string' })
  name: string;

  @ApiProperty({
    example: 'class_id_here',
    description: 'ID of the SchoolClass this section belongs to',
  })
  @IsNotEmpty({ message: 'classId is required' })
  @IsString({ message: 'classId must be a string' })
  classId: string;
}
