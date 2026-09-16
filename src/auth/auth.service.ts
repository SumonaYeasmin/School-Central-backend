

// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import prisma from '../shared/prisma.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // ১. ইমেইল দিয়ে ইউজার খোঁজা
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // ২. প্লেইন পাসওয়ার্ডের সাথে ডাটাবেজের হ্যাশ পাসওয়ার্ড মেলানো
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // ৩. পাসওয়ার্ড মিলে গেলে JWT Token তৈরি করা
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Login successful',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

