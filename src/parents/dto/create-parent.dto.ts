import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateParentDto {
  @ApiProperty({ example: 'Rafiqul Islam', description: 'Full name of the parent / guardian' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString()
  name: string;

  @ApiProperty({ example: '01712345678', description: 'Contact phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'rafiqul@example.com', required: false, description: 'Email address (for login)' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @ApiProperty({ example: 'House 12, Road 4, Dhanmondi, Dhaka', required: false, description: 'Residential Address' })
  @IsOptional()
  @IsString()
  address?: string;
}
