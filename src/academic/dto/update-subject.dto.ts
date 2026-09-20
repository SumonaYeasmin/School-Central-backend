import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSubjectDto {
  @ApiProperty({
    example: 'গণিত',
    required: false,
    description: 'Name of the subject',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '109',
    required: false,
    description: 'SSC Subject Code',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    example: ['class-id-1', 'class-id-2'],
    required: false,
    description: 'List of Class IDs where this subject is taught',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];

  @ApiProperty({
    example: 'group-id-here',
    required: false,
    description: 'Academic Group ID (Science, Humanities, etc.)',
  })
  @IsOptional()
  @IsString()
  groupId?: string | null;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Is compulsory subject',
  })
  @IsOptional()
  @IsBoolean()
  isCompulsory?: boolean;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Is optional subject',
  })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}
