import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ParentRelation } from '../../generated/prisma/enums.js';

export class AssignStudentDto {
  @ApiProperty({ example: 'student_database_id_or_cuid', description: 'Student Database ID' })
  @IsNotEmpty({ message: 'Student ID cannot be empty' })
  @IsString()
  studentId: string;

  @ApiProperty({
    enum: ParentRelation,
    default: ParentRelation.FATHER,
    description: 'Relationship with the student (FATHER, MOTHER, GUARDIAN, OTHER)',
  })
  @IsNotEmpty({ message: 'Relation is required' })
  @IsEnum(ParentRelation)
  relation: ParentRelation;

  @ApiProperty({
    example: true,
    required: false,
    default: false,
    description: 'Whether this parent is the primary contact',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
