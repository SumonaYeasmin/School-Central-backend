
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'teacher@gmail.com',
    description: 'User email address or Teacher ID (e.g. TCH-2026-001)',
  })
  @IsNotEmpty({ message: 'Email or Teacher ID cannot be empty' })
  @IsString({ message: 'Email or Teacher ID must be a string' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'User password',
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
