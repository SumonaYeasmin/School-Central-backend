import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/enums.js';

export class CreateUserDto {
  @ApiProperty({
    example: 'sumona yeasmin',
    description: 'The full name of the user',
  })
  name: string;

  @ApiProperty({
    example: 'sumona@gmail.com',
    description: 'Unique email address',
  })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'User login password',
  })
  password: string;


}
