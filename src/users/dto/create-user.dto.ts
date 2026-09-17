import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../generated/prisma/enums.js';

export class CreateUserDto {
  @ApiProperty({
    example: 'Rafiqul Islam',
    description: 'The full name of the user',
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'rafiqul@gmail.com',
    description: 'Unique email address',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'User login password',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    enum: UserRole,
    default: UserRole.PARENT,
    required: false,
    description: 'User role (ADMIN, TEACHER, PARENT)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
