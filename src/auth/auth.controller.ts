import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
// import { JwtAuthGuard } from './jwt-auth.guard.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login (Admin, Teacher, Parent) - returns token & children for parents' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT access token and user info (with children if parent)' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile of logged-in user (with linked children if role is PARENT)' })
  @ApiQuery({ name: 'email', required: false, description: 'Email for hassle-free testing without token' })
  getProfile(@Request() req: any, @Query('email') email?: string) {
    const targetEmail = email || req?.user?.email;
    const targetUserId = req?.user?.userId || req?.user?.sub;
    return this.authService.getProfile(targetUserId, targetEmail);
  }
}
