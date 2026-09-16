
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    example: 'Class 6',
    description: 'Name of the class (must be unique)',
  })
  @IsNotEmpty({ message: 'Class name cannot be empty' })
  @IsString({ message: 'Class name must be a string' })
  name: string;
}
