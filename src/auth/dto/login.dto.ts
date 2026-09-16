
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@school.com',
    description: 'User email address',
  })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'admin123',
    description: 'User password',
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
